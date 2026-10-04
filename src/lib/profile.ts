import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

/** Read the signed-in user's profile. Uses the RLS-bound client. */
export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  return data ?? null;
}

/** Profile fields the user may change themselves. */
export const EDITABLE_PROFILE_FIELDS = [
  "full_name",
  "class_level",
  "board",
  "subjects",
  "learning_level",
  "exam_target",
  "avatar_url",
] as const;

export type EditableProfile = Pick<
  Profile,
  (typeof EDITABLE_PROFILE_FIELDS)[number]
>;

/**
 * Update the caller's own profile. The RLS policy restricts this to their row,
 * and we whitelist columns so `role`, `xp`, `level` and streak fields can never
 * be set from a request body.
 */
export async function updateProfile(
  userId: string,
  patch: Partial<EditableProfile> & { onboarded?: boolean },
) {
  const allowed: Record<string, unknown> = {};
  for (const key of EDITABLE_PROFILE_FIELDS) {
    if (key in patch) allowed[key] = patch[key as keyof EditableProfile];
  }
  if (typeof patch.onboarded === "boolean") allowed.onboarded = patch.onboarded;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .update(allowed as unknown as Partial<Profile>)
    .eq("id", userId)
    .select("*")
    .single();

  if (error) throw new Error("profile_update_failed");
  return data;
}

/** Server-side profile fetch that bypasses RLS (for admin/aggregate paths). */
export async function getProfileAdmin(userId: string): Promise<Profile | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  return data ?? null;
}

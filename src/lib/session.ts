import "server-only";

import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getProfileAdmin } from "@/lib/profile";
import { getUserSubscription, type SubscriptionState } from "@/lib/billing/subscriptions";
import { getUsageSnapshot, type UsageSnapshot } from "@/lib/usage/limits";
import { isSupabaseConfigured } from "@/lib/env";
import type { StudentContext } from "@/lib/ai/prompts";
import type { Profile } from "@/types/database";

/**
 * One server-side session read for the whole request.
 *
 * Every protected API route starts here. It authenticates the caller, then
 * loads their profile, subscription and today's usage exactly once — so plan
 * enforcement and the AI context always agree, and we never make the client
 * supply any of it.
 */

export interface Session {
  user: User;
  profile: Profile;
  subscription: SubscriptionState;
  usage: UsageSnapshot;
}

/** Authenticated session, or null when not signed in. */
export async function getSession(): Promise<Session | null> {
  // Public pages call this to personalise themselves (for example, to show the
  // current plan on the pricing page). When Supabase is not configured they
  // should still render, so treat "not configured" as "not signed in".
  if (!isSupabaseConfigured) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [profile, subscription] = await Promise.all([
    getProfileAdmin(user.id),
    getUserSubscription(user.id),
  ]);

  // A profile should always exist via the signup trigger; fall back to a
  // minimal in-memory shape rather than failing the request outright.
  const resolvedProfile: Profile =
    profile ??
    ({
      id: user.id,
      email: user.email ?? null,
      full_name: (user.user_metadata?.full_name as string) ?? null,
      avatar_url: (user.user_metadata?.avatar_url as string) ?? null,
      class_level: null,
      board: null,
      subjects: [],
      learning_level: null,
      exam_target: null,
      onboarded: false,
      role: "student",
      xp: 0,
      level: 1,
      current_streak: 0,
      longest_streak: 0,
      last_active_date: null,
      study_minutes: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } satisfies Profile);

  const usage = await getUsageSnapshot(user.id, subscription.plan);

  return { user, profile: resolvedProfile, subscription, usage };
}

/** Map a profile to the tutor's student context. */
export function toStudentContext(profile: Profile): StudentContext {
  return {
    fullName: profile.full_name,
    classLevel: profile.class_level,
    board: profile.board,
    subjects: profile.subjects,
    learningLevel: profile.learning_level,
    examTarget: profile.exam_target,
  };
}

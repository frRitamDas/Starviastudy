import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";
import { requireSupabaseEnv } from "@/lib/env";

/**
 * Server Supabase client bound to the request cookies.
 * Still the anon key — RLS applies. Use `createAdminClient()` only for
 * privileged server work that must bypass RLS (webhooks, admin stats).
 */
export async function createClient() {
  // Read cookies first: this marks the calling route as dynamic, so pages that
  // use the session are never prerendered (which would otherwise fail when
  // environment variables are absent at build time).
  const cookieStore = await cookies();
  const { url, anonKey } = requireSupabaseEnv();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Called from a Server Component render — middleware refreshes the
          // session instead, so this can be safely ignored.
        }
      },
    },
  });
}

/**
 * Current authenticated user (verified against the Supabase auth server), or null.
 * Always prefer `getUser()` over `getSession()` on the server — it validates the JWT.
 */
export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** Authenticated user or redirect target marker for callers to handle. */
export async function requireUser() {
  const user = await getCurrentUser();
  return user;
}

import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { publicEnv, serverEnv } from "@/lib/env";

/**
 * Service-role Supabase client. Bypasses Row Level Security.
 *
 * Only use inside trusted server code: webhook handlers, admin aggregates,
 * background writes. Never return this client (or its results wholesale) to a
 * client component, and never import this module from client code.
 */
export function createAdminClient() {
  if (!publicEnv.supabaseUrl || !serverEnv.serviceRoleKey) {
    throw new Error(
      "Supabase admin client unavailable: set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }
  return createSupabaseClient<Database>(publicEnv.supabaseUrl, serverEnv.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/** True when privileged operations are possible. */
export const hasAdminClient = Boolean(publicEnv.supabaseUrl && serverEnv.serviceRoleKey);

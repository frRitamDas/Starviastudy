"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

/**
 * Browser Supabase client. Uses the anon key only — every read/write is
 * constrained by Row Level Security, so this client can never see another
 * user's rows. The service-role key is never referenced here.
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }
  return createBrowserClient<Database>(url, key);
}

let cached: ReturnType<typeof createClient> | null = null;

/** Shared browser client instance. */
export function getBrowserClient() {
  if (!cached) cached = createClient();
  return cached;
}

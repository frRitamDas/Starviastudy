import "server-only";

import { createHash } from "node:crypto";
import { createAdminClient, hasAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/types/database";

/** Bump a cache entry's hit counter without blocking the response. */
async function bumpHits(key: string): Promise<void> {
  if (!hasAdminClient) return;
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("content_cache")
      .select("hits")
      .eq("cache_key", key)
      .maybeSingle();
    if (data) {
      await supabase
        .from("content_cache")
        .update({ hits: (data.hits ?? 0) + 1 })
        .eq("cache_key", key);
    }
  } catch {
    /* no-op */
  }
}

/**
 * Shared content cache for generated educational material.
 *
 * Tutorials, quizzes and flashcard decks for the same (board, class, subject,
 * topic, difficulty) are identical work regardless of which student asked, so
 * we generate once and reuse. This is the single biggest AI cost saving and it
 * makes repeat requests instant.
 *
 * The cache holds no personal data — only academic content.
 */

export function cacheKey(parts: (string | number | null | undefined)[]): string {
  const normalised = parts
    .map((p) => (p ?? "").toString().trim().toLowerCase().replace(/\s+/g, " "))
    .join("|");
  return createHash("sha256").update(normalised).digest("hex").slice(0, 40);
}

export async function readCache<T>(kind: string, key: string): Promise<T | null> {
  if (!hasAdminClient) return null;
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("content_cache")
      .select("payload")
      .eq("kind", kind)
      .eq("cache_key", key)
      .maybeSingle();
    if (error || !data) return null;

    // Best-effort hit counter; failures are irrelevant to the caller.
    void bumpHits(key);

    return data.payload as T;
  } catch {
    return null;
  }
}

export async function writeCache(kind: string, key: string, payload: unknown): Promise<void> {
  if (!hasAdminClient) return;
  try {
    const supabase = createAdminClient();
    await supabase
      .from("content_cache")
      .upsert(
        { kind, cache_key: key, payload: payload as Json },
        { onConflict: "cache_key", ignoreDuplicates: true },
      );
  } catch {
    // Caching is an optimisation; never fail the request because of it.
  }
}

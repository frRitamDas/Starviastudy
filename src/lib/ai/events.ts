import "server-only";

import { createAdminClient, hasAdminClient } from "@/lib/supabase/admin";

export interface AiEventInput {
  userId?: string | null;
  feature: string;
  model?: string | null;
  status: "ok" | "error" | "blocked" | "cached";
  latencyMs?: number | null;
  tokens?: number | null;
  cached?: boolean;
  error?: string | null;
}

/**
 * Record an AI call for observability and the admin dashboard.
 * Fire-and-forget: telemetry must never break a user's request.
 */
export async function logAiEvent(event: AiEventInput): Promise<void> {
  if (!hasAdminClient) return;
  try {
    const supabase = createAdminClient();
    await supabase.from("ai_events").insert({
      user_id: event.userId ?? null,
      feature: event.feature,
      model: event.model ?? null,
      status: event.status,
      latency_ms: event.latencyMs ?? null,
      tokens: event.tokens ?? null,
      cached: event.cached ?? false,
      error: event.error ? event.error.slice(0, 500) : null,
    });
  } catch {
    /* no-op */
  }
}

/** Wrap a timed AI call so latency is always recorded, success or failure. */
export async function timed<T>(
  fn: () => Promise<T>,
): Promise<{ value: T; latencyMs: number }> {
  const start = Date.now();
  const value = await fn();
  return { value, latencyMs: Date.now() - start };
}

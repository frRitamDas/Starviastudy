import "server-only";

import { serverEnv } from "@/lib/env";

/**
 * Rate limiting.
 *
 * Uses Upstash Redis when configured (correct across serverless instances).
 * Falls back to a per-process in-memory limiter otherwise, which is enough to
 * blunt obvious abuse in development or on a single instance.
 *
 * This is a second line of defence — the database-backed usage counter is what
 * actually enforces plan limits.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const memory = new Map<string, Bucket>();

function memoryLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const bucket = memory.get(key);
  if (!bucket || bucket.resetAt < now) {
    memory.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
  }
  bucket.count += 1;
  const allowed = bucket.count <= limit;
  return { allowed, remaining: Math.max(limit - bucket.count, 0), resetAt: bucket.resetAt };
}

async function upstashLimit(key: string, limit: number, windowMs: number) {
  const url = serverEnv.upstashUrl.replace(/\/$/, "");
  const token = serverEnv.upstashToken;
  const seconds = Math.max(Math.ceil(windowMs / 1000), 1);

  // INCR then EXPIRE only on the first hit — a small, dependency-free fixed window.
  const incr = await fetch(`${url}/incr/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!incr.ok) throw new Error("upstash_incr_failed");
  const count = Number(await incr.text());

  if (count === 1) {
    await fetch(`${url}/expire/${encodeURIComponent(key)}/${seconds}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
  }

  return {
    allowed: count <= limit,
    remaining: Math.max(limit - count, 0),
    resetAt: Date.now() + windowMs,
  };
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export async function rateLimit(
  identifier: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const key = `starvia:rl:${identifier}`;
  if (serverEnv.upstashUrl && serverEnv.upstashToken) {
    try {
      return await upstashLimit(key, limit, windowMs);
    } catch {
      // If Redis is down, fall open to the in-memory limiter rather than
      // blocking all traffic.
      return memoryLimit(key, limit, windowMs);
    }
  }
  return memoryLimit(key, limit, windowMs);
}

/** Extract a best-effort client identifier from proxy headers. */
export function clientKey(request: Request, scope: string) {
  const headers = request.headers;
  const ip =
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "unknown";
  return `${scope}:${ip}`;
}

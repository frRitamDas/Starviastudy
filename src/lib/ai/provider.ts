import "server-only";

import { GoogleGenAI } from "@google/genai";
import { serverEnv } from "@/lib/env";

/**
 * Provider layer for Gemini.
 *
 * Every AI call in Starvia goes through this module. Swapping to a paid Gemini
 * key, a different model, or a different provider entirely is a change here
 * plus `src/lib/ai/index.ts` — nothing else in the app calls the SDK directly.
 */

export type AiModelKind = "text" | "vision";

/** Resolve which model to use for a given task. */
export function modelFor(kind: AiModelKind = "text"): string {
  return kind === "vision" ? serverEnv.geminiVisionModel : serverEnv.geminiTextModel;
}

let client: GoogleGenAI | null = null;

/** Lazily construct the shared Gemini client. */
export function getGemini(): GoogleGenAI {
  if (!serverEnv.geminiApiKey) {
    throw new AiConfigError(
      "GEMINI_API_KEY is not set. Add it in Vercel → Settings → Environment Variables.",
    );
  }
  if (!client) {
    client = new GoogleGenAI({ apiKey: serverEnv.geminiApiKey });
  }
  return client;
}

/** Raised when the provider is not configured — surfaced as a 503, never a stack trace. */
export class AiConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiConfigError";
  }
}

/** Raised when the provider is reachable but the call failed. */
export class AiProviderError extends Error {
  readonly retryable: boolean;
  constructor(message: string, retryable = true) {
    super(message);
    this.name = "AiProviderError";
    this.retryable = retryable;
  }
}

/**
 * Classify an unknown thrown value from the SDK into a safe, user-facing error.
 * Raw provider messages never reach the browser.
 */
export function toProviderError(error: unknown): AiProviderError {
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();

  if (lower.includes("429") || lower.includes("quota") || lower.includes("resource_exhausted")) {
    return new AiProviderError("AI is temporarily unavailable. Please try again in a moment.", true);
  }
  if (lower.includes("api key") || lower.includes("permission") || lower.includes("401") || lower.includes("403")) {
    return new AiProviderError("AI is temporarily unavailable. Please try again.", false);
  }
  if (lower.includes("safety") || lower.includes("blocked")) {
    return new AiProviderError(
      "That request could not be answered. Try rephrasing your question.",
      false,
    );
  }
  return new AiProviderError("AI is temporarily unavailable. Please try again.", true);
}

/** Sleep helper for retry backoff. */
export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Run an AI operation with a single bounded retry on transient failures.
 * Keeps latency predictable and avoids hammering a rate-limited free tier.
 */
export async function withRetry<T>(fn: () => Promise<T>, retries = 1): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const classified = toProviderError(error);
      if (!classified.retryable || attempt === retries) throw classified;
      await sleep(400 * (attempt + 1));
    }
  }
  throw toProviderError(lastError);
}

import "server-only";

import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AiConfigError, AiProviderError } from "@/lib/ai/provider";
import { LimitReachedError } from "@/lib/usage/limits";

/**
 * Uniform API envelope. Every route returns one of these shapes so the client
 * can handle errors generically. Raw errors and stack traces never leave here.
 */

export type ApiErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "BAD_REQUEST"
  | "VALIDATION_ERROR"
  | "LIMIT_REACHED"
  | "PAYMENT_REQUIRED"
  | "RATE_LIMITED"
  | "AI_UNAVAILABLE"
  | "NOT_CONFIGURED"
  | "INTERNAL";

const STATUS: Record<ApiErrorCode, number> = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  BAD_REQUEST: 400,
  VALIDATION_ERROR: 422,
  LIMIT_REACHED: 429,
  PAYMENT_REQUIRED: 402,
  RATE_LIMITED: 429,
  AI_UNAVAILABLE: 503,
  NOT_CONFIGURED: 503,
  INTERNAL: 500,
};

export interface ApiErrorBody {
  ok: false;
  error: { code: ApiErrorCode; message: string; details?: unknown };
}

export interface ApiSuccessBody<T> {
  ok: true;
  data: T;
}

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json<ApiSuccessBody<T>>({ ok: true, data }, init);
}

export function fail(code: ApiErrorCode, message: string, details?: unknown) {
  return NextResponse.json<ApiErrorBody>(
    { ok: false, error: { code, message, ...(details ? { details } : {}) } },
    { status: STATUS[code] },
  );
}

/** Turn any thrown value into a safe, user-facing API error. */
export function handleApiError(error: unknown) {
  if (error instanceof LimitReachedError) {
    return NextResponse.json<ApiErrorBody>(
      {
        ok: false,
        error: {
          code: "LIMIT_REACHED",
          message: error.userMessage,
          details: { feature: error.feature, plan: error.plan, limit: error.limit, used: error.used },
        },
      },
      { status: 429 },
    );
  }

  if (error instanceof AiConfigError) {
    return fail(
      "NOT_CONFIGURED",
      "AI is not configured yet. Add GEMINI_API_KEY in your environment settings.",
    );
  }

  if (error instanceof AiProviderError) {
    return fail("AI_UNAVAILABLE", error.message);
  }

  if (error instanceof ZodError) {
    return fail("VALIDATION_ERROR", "Some of the details you entered are not valid.", error.issues);
  }

  if (error instanceof Error && error.message === "usage_tracking_failed") {
    return fail("INTERNAL", "Something went wrong. Please try again.");
  }

  // Never leak internals.
  console.error("[api] unhandled error:", error);
  return fail("INTERNAL", "Something went wrong. Please try again.");
}

/** Common messages so copy stays consistent across the app. */
export const MESSAGES = {
  unauthorized: "Please sign in to continue.",
  forbidden: "You don't have access to this.",
  notFound: "We couldn't find what you were looking for.",
  aiUnavailable: "AI is temporarily unavailable. Please try again.",
  limitReached: "You've reached today's AI limit. Upgrade to continue learning.",
  network: "Something went wrong. Please try again.",
  paymentFailed: "Payment could not be completed.",
} as const;

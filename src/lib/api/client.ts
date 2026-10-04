"use client";

/**
 * Browser-side API client.
 *
 * Every route returns the same envelope: `{ ok: true, data }` or
 * `{ ok: false, error }`. This wrapper unwraps it and throws a typed
 * `ApiClientError` so callers handle one shape. It never sees secrets.
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
  | "INTERNAL"
  | "NETWORK";

export interface LimitDetails {
  feature: string;
  plan: string;
  limit: number;
  used: number;
}

export class ApiClientError extends Error {
  readonly code: ApiErrorCode;
  readonly details?: LimitDetails;

  constructor(code: ApiErrorCode, message: string, details?: LimitDetails) {
    super(message);
    this.name = "ApiClientError";
    this.code = code;
    this.details = details;
  }

  get isLimitReached() {
    return this.code === "LIMIT_REACHED" || this.code === "PAYMENT_REQUIRED";
  }
}

interface Envelope<T> {
  ok: boolean;
  data?: T;
  error?: { code: ApiErrorCode; message: string; details?: LimitDetails };
}

export async function apiFetch<T>(
  input: string,
  init?: RequestInit & { json?: unknown },
): Promise<T> {
  const { json, ...rest } = init ?? {};

  let response: Response;
  try {
    response = await fetch(input, {
      ...rest,
      headers: {
        ...(json !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(rest.headers ?? {}),
      },
      body: json !== undefined ? JSON.stringify(json) : rest.body,
    });
  } catch {
    throw new ApiClientError("NETWORK", "Something went wrong. Please try again.");
  }

  let body: Envelope<T> | null = null;
  try {
    body = (await response.json()) as Envelope<T>;
  } catch {
    /* non-JSON response */
  }

  if (!response.ok || !body?.ok) {
    throw new ApiClientError(
      body?.error?.code ?? "INTERNAL",
      body?.error?.message ?? "Something went wrong. Please try again.",
      body?.error?.details,
    );
  }

  return body.data as T;
}

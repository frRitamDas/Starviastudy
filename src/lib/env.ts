/**
 * Server-only environment access.
 *
 * Public values are safe to ship to the browser. Secret values are only read
 * here and are never imported into a Client Component. Importing this module
 * from client code would break the build on purpose.
 */

const required = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
} as const;

/** Public config — usable in the browser. */
export const publicEnv = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  appUrl:
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "http://localhost:3000",
  razorpayKeyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "",
} as const;

/** True when Supabase is configured. Lets the UI degrade gracefully instead of crashing. */
export const isSupabaseConfigured = Boolean(
  publicEnv.supabaseUrl && publicEnv.supabaseAnonKey,
);

/** Assert Supabase public config exists; throws a clear message otherwise. */
export function requireSupabaseEnv() {
  const missing = Object.entries(required)
    .filter(([, value]) => !value)
    .map(([key]) => key);
  if (missing.length) {
    throw new Error(
      `Missing Supabase environment variables: ${missing.join(", ")}. ` +
        "Add them in Vercel → Settings → Environment Variables (see .env.example).",
    );
  }
  return { url: required.NEXT_PUBLIC_SUPABASE_URL!, anonKey: required.NEXT_PUBLIC_SUPABASE_ANON_KEY! };
}

/** Server-only secrets. Never import from a Client Component. */
export const serverEnv = {
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
  geminiTextModel: process.env.GEMINI_TEXT_MODEL || "gemini-2.0-flash",
  geminiVisionModel: process.env.GEMINI_VISION_MODEL || "gemini-2.0-flash",
  razorpayKeyId: process.env.RAZORPAY_KEY_ID ?? "",
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET ?? "",
  razorpayWebhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET ?? "",
  adminEmails: (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean),
  upstashUrl: process.env.UPSTASH_REDIS_REST_URL ?? "",
  upstashToken: process.env.UPSTASH_REDIS_REST_TOKEN ?? "",
} as const;

/** Gemini is configured and AI features can run for real. */
export const isAiConfigured = Boolean(serverEnv.geminiApiKey);

/** Razorpay live credentials exist. When false we run clearly-labelled mock mode. */
export const isRazorpayConfigured = Boolean(
  serverEnv.razorpayKeyId && serverEnv.razorpayKeySecret,
);

/**
 * Whether the development/mock payment path is permitted.
 *
 * Mock checkout can activate a plan without money changing hands, so it must be
 * impossible in production. It is enabled automatically outside production, and
 * can be forced on with ALLOW_MOCK_PAYMENTS=true (e.g. a staging deploy) — but
 * never in a production build unless that flag is explicitly set.
 */
export const allowMockPayments =
  process.env.ALLOW_MOCK_PAYMENTS === "true" ||
  (process.env.NODE_ENV !== "production" && process.env.ALLOW_MOCK_PAYMENTS !== "false");

export function isAdminEmail(email: string | null | undefined) {
  if (!email) return false;
  return serverEnv.adminEmails.includes(email.toLowerCase());
}

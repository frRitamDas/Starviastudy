import { NextResponse } from "next/server";
import { isSupabaseConfigured, isAiConfigured, isRazorpayConfigured, publicEnv } from "@/lib/env";
import { hasAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Deployment health check. Reports only booleans — never secret values — so it
 * is safe to leave public. Useful for confirming a Vercel deploy is wired up.
 */
export async function GET() {
  const checks = {
    supabase: isSupabaseConfigured,
    supabaseAdmin: hasAdminClient,
    ai: isAiConfigured,
    razorpay: isRazorpayConfigured,
    appUrlConfigured: Boolean(publicEnv.appUrl),
  };

  const configured = Object.values(checks).every(Boolean);

  return NextResponse.json(
    {
      ok: true,
      service: "starvia",
      version: "1.0",
      configured,
      checks,
      timestamp: new Date().toISOString(),
    },
    { status: 200 },
  );
}

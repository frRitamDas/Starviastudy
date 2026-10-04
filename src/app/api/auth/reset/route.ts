import { createClient } from "@/lib/supabase/server";
import { fail, ok, handleApiError } from "@/lib/api/response";
import { rateLimit, clientKey } from "@/lib/api/rate-limit";
import { resetRequestSchema } from "@/lib/validations";
import { publicEnv } from "@/lib/env";

export const runtime = "nodejs";

/** Request a password reset email. */
export async function POST(request: Request) {
  try {
    const limit = await rateLimit(clientKey(request, "reset"), 5, 60_000);
    if (!limit.allowed) {
      return fail("RATE_LIMITED", "Too many requests. Please wait a minute and try again.");
    }

    const body = await request.json();
    const parsed = resetRequestSchema.safeParse(body);
    if (!parsed.success) {
      return fail("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Enter a valid email.");
    }

    const supabase = await createClient();
    // Always report success so this endpoint cannot be used to enumerate accounts.
    await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: `${publicEnv.appUrl}/auth/callback?next=/reset-password`,
    });

    return ok({ sent: true });
  } catch (error) {
    return handleApiError(error);
  }
}

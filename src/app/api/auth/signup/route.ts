import { createClient } from "@/lib/supabase/server";
import { fail, ok, handleApiError } from "@/lib/api/response";
import { rateLimit, clientKey } from "@/lib/api/rate-limit";
import { signUpSchema } from "@/lib/validations";
import { publicEnv } from "@/lib/env";

export const runtime = "nodejs";

/** Create an account with email + password. */
export async function POST(request: Request) {
  try {
    const limit = await rateLimit(clientKey(request, "signup"), 8, 60_000);
    if (!limit.allowed) {
      return fail("RATE_LIMITED", "Too many attempts. Please wait a minute and try again.");
    }

    const body = await request.json();
    const parsed = signUpSchema.safeParse(body);
    if (!parsed.success) {
      return fail("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Check your details.");
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        data: { full_name: parsed.data.fullName },
        emailRedirectTo: `${publicEnv.appUrl}/auth/callback`,
      },
    });

    if (error) {
      // Supabase returns a generic message for existing users; keep it friendly.
      const message = /already/i.test(error.message)
        ? "An account with this email already exists. Try signing in instead."
        : "We couldn't create your account. Please try again.";
      return fail("BAD_REQUEST", message);
    }

    // With email confirmation enabled Supabase returns a user but no session.
    // Tell the client so it shows the "check your inbox" state instead of
    // attempting an immediate password sign-in that would fail.
    const needsConfirmation = !data.session;

    return ok({ created: true, needsConfirmation });
  } catch (error) {
    return handleApiError(error);
  }
}

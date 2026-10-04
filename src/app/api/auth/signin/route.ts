import { createClient } from "@/lib/supabase/server";
import { fail, ok, handleApiError } from "@/lib/api/response";
import { rateLimit, clientKey } from "@/lib/api/rate-limit";
import { signInSchema } from "@/lib/validations";

export const runtime = "nodejs";

/** Sign in with email + password. */
export async function POST(request: Request) {
  try {
    const limit = await rateLimit(clientKey(request, "signin"), 12, 60_000);
    if (!limit.allowed) {
      return fail("RATE_LIMITED", "Too many attempts. Please wait a minute and try again.");
    }

    const body = await request.json();
    const parsed = signInSchema.safeParse(body);
    if (!parsed.success) {
      return fail("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Check your details.");
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });

    if (error) {
      // Deliberately generic — never reveal whether an email is registered.
      return fail("UNAUTHORIZED", "Incorrect email or password.");
    }

    return ok({ signedIn: true });
  } catch (error) {
    return handleApiError(error);
  }
}

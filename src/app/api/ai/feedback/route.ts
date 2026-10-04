import { getSession } from "@/lib/session";
import { fail, ok, handleApiError } from "@/lib/api/response";
import { rateLimit, clientKey } from "@/lib/api/rate-limit";
import { feedbackSchema } from "@/lib/validations";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Helpful / not helpful feedback on a tutor answer, plus general feedback.
 * Stored for quality review in the admin panel.
 */
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return fail("UNAUTHORIZED", "Please sign in to continue.");

    const limit = await rateLimit(clientKey(request, `feedback:${session.user.id}`), 30, 60_000);
    if (!limit.allowed) return fail("RATE_LIMITED", "Too many submissions. Please slow down.");

    const body = await request.json();
    const parsed = feedbackSchema.safeParse(body);
    if (!parsed.success) {
      return fail("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Check your feedback.");
    }

    const supabase = createAdminClient();

    // Confirm the message belongs to this user before attaching feedback.
    if (parsed.data.messageId) {
      const { data: message } = await supabase
        .from("messages")
        .select("id, user_id")
        .eq("id", parsed.data.messageId)
        .maybeSingle();
      if (!message || message.user_id !== session.user.id) {
        return fail("NOT_FOUND", "We couldn't find that answer.");
      }
      if (parsed.data.rating) {
        await supabase
          .from("messages")
          .update({ feedback: parsed.data.rating })
          .eq("id", parsed.data.messageId)
          .eq("user_id", session.user.id);
      }
    }

    await supabase.from("feedback").insert({
      user_id: session.user.id,
      message_id: parsed.data.messageId ?? null,
      rating: parsed.data.rating ?? null,
      comment: parsed.data.comment ?? null,
      context: parsed.data.context ?? null,
    });

    return ok({ recorded: true });
  } catch (error) {
    return handleApiError(error);
  }
}

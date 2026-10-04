import { getSession, toStudentContext } from "@/lib/session";
import { fail, ok, handleApiError } from "@/lib/api/response";
import { rateLimit, clientKey } from "@/lib/api/rate-limit";
import { tutorialRequestSchema } from "@/lib/validations";
import { reserveUsage, refundUsage } from "@/lib/usage/limits";
import { generateTutorial } from "@/lib/ai";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Generate a structured tutorial and save it for the student. */
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return fail("UNAUTHORIZED", "Please sign in to continue.");

    const limit = await rateLimit(clientKey(request, `tutorial:${session.user.id}`), 10, 60_000);
    if (!limit.allowed) return fail("RATE_LIMITED", "Too many requests. Please slow down.");

    const body = await request.json();
    const parsed = tutorialRequestSchema.safeParse(body);
    if (!parsed.success) {
      return fail("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Check your details.");
    }

    const input = parsed.data;
    await reserveUsage(session.user.id, session.subscription.plan, "tutorial");

    try {
      const result = await generateTutorial({
        userId: session.user.id,
        classLevel: input.classLevel,
        board: input.board,
        subject: input.subject,
        chapter: input.chapter,
        topic: input.topic,
        difficulty: input.difficulty,
        ctx: toStudentContext(session.profile),
      });

      const supabase = createAdminClient();

      // Reuse an existing saved copy for this student instead of duplicating rows.
      const { data: existing } = await supabase
        .from("tutorials")
        .select("id")
        .eq("user_id", session.user.id)
        .eq("cache_key", result.cacheKey)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("tutorials")
          .update({ content: result.content, title: result.content.title })
          .eq("id", existing.id);
        return ok({ id: existing.id, cached: true });
      }

      const { data: tutorial, error } = await supabase
        .from("tutorials")
        .insert({
          user_id: session.user.id,
          title: result.content.title,
          class_level: input.classLevel,
          board: input.board,
          subject: input.subject,
          chapter: input.chapter ?? null,
          topic: input.topic,
          difficulty: input.difficulty,
          content: result.content,
          cache_key: result.cacheKey,
        })
        .select("id")
        .single();

      if (error) throw new Error("tutorial_save_failed");

      return ok({ id: tutorial.id, cached: result.cached });
    } catch (error) {
      await refundUsage(session.user.id, "tutorial");
      throw error;
    }
  } catch (error) {
    return handleApiError(error);
  }
}

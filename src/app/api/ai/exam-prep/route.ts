import { getSession, toStudentContext } from "@/lib/session";
import { fail, ok, handleApiError } from "@/lib/api/response";
import { rateLimit, clientKey } from "@/lib/api/rate-limit";
import { examPrepRequestSchema } from "@/lib/validations";
import { reserveUsage, refundUsage } from "@/lib/usage/limits";
import { generateExamPrep } from "@/lib/ai";
import { createAdminClient } from "@/lib/supabase/admin";
import { awardProgress } from "@/lib/gamification";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Build an exam preparation plan. */
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return fail("UNAUTHORIZED", "Please sign in to continue.");

    const limit = await rateLimit(clientKey(request, `exam:${session.user.id}`), 8, 60_000);
    if (!limit.allowed) return fail("RATE_LIMITED", "Too many requests. Please slow down.");

    const body = await request.json();
    const parsed = examPrepRequestSchema.safeParse(body);
    if (!parsed.success) {
      return fail("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Check your details.");
    }

    const input = parsed.data;
    await reserveUsage(session.user.id, session.subscription.plan, "exam_prep");

    try {
      const result = await generateExamPrep({
        userId: session.user.id,
        classLevel: input.classLevel,
        board: input.board,
        subject: input.subject,
        chapter: input.chapter,
        examType: input.examType,
        days: input.days,
        ctx: toStudentContext(session.profile),
      });

      // Seed topic-tracking rows so the student can mark progress immediately.
      const supabase = createAdminClient();
      if (result.content.importantTopics.length) {
        await supabase.from("study_progress").upsert(
          result.content.importantTopics.map((t) => ({
            user_id: session.user.id,
            subject: input.subject,
            chapter: input.chapter || input.examType,
            topic: t.topic,
            status: "not_started",
          })),
          { onConflict: "user_id,subject,chapter,topic", ignoreDuplicates: true },
        );
      }

      const reward = await awardProgress({ userId: session.user.id, action: "exam_prep" });

      return ok({ plan: result.content, cached: result.cached, xp: reward.xp });
    } catch (error) {
      await refundUsage(session.user.id, "exam_prep");
      throw error;
    }
  } catch (error) {
    return handleApiError(error);
  }
}

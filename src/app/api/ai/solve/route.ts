import { getSession, toStudentContext } from "@/lib/session";
import { fail, ok, handleApiError } from "@/lib/api/response";
import { rateLimit, clientKey } from "@/lib/api/rate-limit";
import { solveRequestSchema } from "@/lib/validations";
import { reserveUsage, refundUsage } from "@/lib/usage/limits";
import { solveQuestion } from "@/lib/ai";
import { awardProgress } from "@/lib/gamification";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Question solver — typed question or image.
 *
 * Image questions are metered under `image_solve`, text questions under `solve`,
 * because image calls cost more.
 */
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return fail("UNAUTHORIZED", "Please sign in to continue.");

    const limit = await rateLimit(clientKey(request, `solve:${session.user.id}`), 15, 60_000);
    if (!limit.allowed) return fail("RATE_LIMITED", "Too many requests. Please slow down.");

    const body = await request.json();
    const parsed = solveRequestSchema.safeParse(body);
    if (!parsed.success) {
      return fail("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Check your question.");
    }

    const input = parsed.data;
    const hasImage = Boolean(input.imageBase64);
    const feature = hasImage ? "image_solve" : "solve";

    await reserveUsage(session.user.id, session.subscription.plan, feature);

    try {
      const result = await solveQuestion({
        userId: session.user.id,
        question: input.question,
        image:
          hasImage && input.imageBase64 && input.imageMimeType
            ? { mimeType: input.imageMimeType, base64: input.imageBase64 }
            : undefined,
        subject: input.subject,
        ctx: toStudentContext(session.profile),
      });

      const reward = await awardProgress({
        userId: session.user.id,
        action: "solve_question",
      });

      return ok({ answer: result.text, cached: result.cached, xp: reward.xp });
    } catch (error) {
      await refundUsage(session.user.id, feature);
      throw error;
    }
  } catch (error) {
    return handleApiError(error);
  }
}

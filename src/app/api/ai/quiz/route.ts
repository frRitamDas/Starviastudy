import { getSession, toStudentContext } from "@/lib/session";
import { fail, ok, handleApiError } from "@/lib/api/response";
import { rateLimit, clientKey } from "@/lib/api/rate-limit";
import { quizRequestSchema } from "@/lib/validations";
import { reserveUsage, refundUsage } from "@/lib/usage/limits";
import { generateQuiz } from "@/lib/ai";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Generate a quiz.
 *
 * Correct answers are stored server-side only. The response returns the quiz id
 * and the questions WITHOUT answers, so nothing can be read from the network
 * tab before the student submits.
 */
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return fail("UNAUTHORIZED", "Please sign in to continue.");

    const limit = await rateLimit(clientKey(request, `quiz:${session.user.id}`), 12, 60_000);
    if (!limit.allowed) return fail("RATE_LIMITED", "Too many requests. Please slow down.");

    const body = await request.json();
    const parsed = quizRequestSchema.safeParse(body);
    if (!parsed.success) {
      return fail("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Check your details.");
    }

    const input = parsed.data;
    await reserveUsage(session.user.id, session.subscription.plan, "quiz");

    try {
      const result = await generateQuiz({
        userId: session.user.id,
        classLevel: input.classLevel,
        board: input.board,
        subject: input.subject,
        chapter: input.chapter,
        topic: input.topic,
        difficulty: input.difficulty,
        count: input.count,
        types: input.types,
        ctx: toStudentContext(session.profile),
      });

      const supabase = createAdminClient();

      const { data: quiz, error } = await supabase
        .from("quizzes")
        .insert({
          user_id: session.user.id,
          title: result.content.title,
          class_level: input.classLevel,
          board: input.board,
          subject: input.subject,
          chapter: input.chapter ?? null,
          topic: input.topic ?? null,
          difficulty: input.difficulty,
          question_count: result.content.questions.length,
        })
        .select("id")
        .single();

      if (error) throw new Error("quiz_save_failed");

      const { data: questions, error: questionsError } = await supabase
        .from("quiz_questions")
        .insert(
          result.content.questions.map((q, index) => ({
            quiz_id: quiz.id,
            user_id: session.user.id,
            order_index: index,
            type: q.type,
            question: q.question,
            options: q.options ?? null,
            correct_answer: q.correctAnswer,
            explanation: q.explanation,
            topic: input.topic ?? null,
          })),
        )
        .select("id, order_index, type, question, options");

      if (questionsError) throw new Error("quiz_save_failed");

      // Strip answers from the payload the browser receives.
      const safeQuestions = (questions ?? [])
        .sort((a, b) => a.order_index - b.order_index)
        .map((q) => ({
          id: q.id,
          type: q.type,
          question: q.question,
          options: q.options,
        }));

      return ok({ quizId: quiz.id, title: result.content.title, questions: safeQuestions });
    } catch (error) {
      await refundUsage(session.user.id, "quiz");
      throw error;
    }
  } catch (error) {
    return handleApiError(error);
  }
}

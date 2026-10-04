import { getSession } from "@/lib/session";
import { fail, ok, handleApiError } from "@/lib/api/response";
import { quizSubmitSchema } from "@/lib/validations";
import { createAdminClient } from "@/lib/supabase/admin";
import { awardProgress } from "@/lib/gamification";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Fetch a quiz for the student.
 *
 * Correct answers and explanations are stripped here — they are only returned
 * by the submit endpoint after grading, so the browser never holds the key.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return fail("UNAUTHORIZED", "Please sign in to continue.");

    const { id: quizId } = await params;
    const supabase = createAdminClient();

    const { data: quiz } = await supabase
      .from("quizzes")
      .select("id, title, subject, topic, chapter, difficulty, question_count, created_at")
      .eq("id", quizId)
      .eq("user_id", session.user.id)
      .maybeSingle();
    if (!quiz) return fail("NOT_FOUND", "We couldn't find that quiz.");

    const { data: questions } = await supabase
      .from("quiz_questions")
      .select("id, type, question, options, topic, order_index")
      .eq("quiz_id", quizId)
      .eq("user_id", session.user.id)
      .order("order_index", { ascending: true });

    return ok({ quiz, questions: questions ?? [] });
  } catch (error) {
    return handleApiError(error);
  }
}

/** Normalise an answer for comparison — tolerant of case and spacing. */
function normalise(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Grade a quiz submission.
 *
 * Answers are checked here against the stored correct answers — the client
 * never receives them beforehand. Weak topics are derived from the questions
 * the student got wrong.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();
    if (!session) return fail("UNAUTHORIZED", "Please sign in to continue.");

    const { id: quizId } = await params;
    const body = await request.json();
    const parsed = quizSubmitSchema.safeParse({ ...body, quizId });
    if (!parsed.success) {
      return fail("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Check your answers.");
    }

    const supabase = createAdminClient();

    // Confirm the quiz belongs to this student.
    const { data: quiz } = await supabase
      .from("quizzes")
      .select("*")
      .eq("id", quizId)
      .eq("user_id", session.user.id)
      .maybeSingle();
    if (!quiz) return fail("NOT_FOUND", "We couldn't find that quiz.");

    const { data: questions } = await supabase
      .from("quiz_questions")
      .select("*")
      .eq("quiz_id", quizId)
      .eq("user_id", session.user.id)
      .order("order_index", { ascending: true });

    if (!questions?.length) return fail("NOT_FOUND", "This quiz has no questions.");

    const answerMap = new Map(parsed.data.answers.map((a) => [a.questionId, a.answer]));

    const results = questions.map((q) => {
      const given = answerMap.get(q.id) ?? "";
      const correct = normalise(given) === normalise(q.correct_answer);
      return {
        questionId: q.id,
        question: q.question,
        type: q.type,
        options: q.options,
        given,
        correctAnswer: q.correct_answer,
        explanation: q.explanation,
        isCorrect: correct,
      };
    });

    const score = results.filter((r) => r.isCorrect).length;
    const total = results.length;

    // Weak topics come from the topic labels of questions the student missed.
    const weakTopics = Array.from(
      new Set(
        results
          .filter((r) => !r.isCorrect)
          .map(() => quiz.topic || quiz.chapter || quiz.subject)
          .filter(Boolean) as string[],
      ),
    );

    await supabase.from("quiz_attempts").insert({
      quiz_id: quizId,
      user_id: session.user.id,
      score,
      total,
      answers: results.map((r) => ({
        questionId: r.questionId,
        given: r.given,
        isCorrect: r.isCorrect,
      })),
      weak_topics: weakTopics,
      duration_seconds: parsed.data.durationSeconds ?? null,
    });

    const reward = await awardProgress({
      userId: session.user.id,
      action: "quiz_complete",
      bonusXp: score === total && total > 0 ? 25 : 0,
    });

    return ok({
      score,
      total,
      percentage: total ? Math.round((score / total) * 100) : 0,
      results,
      weakTopics,
      xp: reward.xp,
      unlocked: reward.unlocked.map((a) => ({ key: a.key, title: a.title })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

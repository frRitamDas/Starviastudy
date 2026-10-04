import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getSession } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageContainer, PageHeader } from "@/components/shared/page";
import { QuizRunner } from "@/components/quiz/quiz-runner";
import type { QuestionType } from "@/types/content";

export const dynamic = "force-dynamic";

async function getQuiz(userId: string, id: string) {
  const supabase = createAdminClient();
  const [{ data: quiz }, { data: questions }] = await Promise.all([
    supabase
      .from("quizzes")
      .select("id, title, subject, topic, chapter, difficulty, question_count")
      .eq("id", id)
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("quiz_questions")
      .select("id, type, question, options, topic, order_index")
      .eq("quiz_id", id)
      .eq("user_id", userId)
      .order("order_index", { ascending: true }),
  ]);
  return { quiz, questions: questions ?? [] };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const session = await getSession();
  if (!session) return { title: "Quiz" };
  const { id } = await params;
  const { quiz } = await getQuiz(session.user.id, id);
  return { title: quiz?.title ?? "Quiz" };
}

export default async function QuizRunPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return null;

  const { id } = await params;
  const { quiz, questions } = await getQuiz(session.user.id, id);
  if (!quiz || !questions.length) notFound();

  return (
    <PageContainer width="default">
      <PageHeader
        title={quiz.title}
        description={`${quiz.subject}${quiz.topic ? ` · ${quiz.topic}` : ""} · ${questions.length} questions`}
      />
      <QuizRunner
        quizId={quiz.id}
        questions={questions.map((q) => ({
          id: q.id,
          type: q.type as QuestionType,
          question: q.question,
          options: (q.options as string[] | null) ?? null,
          topic: q.topic,
        }))}
      />
    </PageContainer>
  );
}

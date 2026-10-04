import type { Metadata } from "next";
import { getSession } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageContainer, PageHeader } from "@/components/shared/page";
import { QuizBuilder } from "@/components/quiz/quiz-builder";
import { QuizHistory } from "@/components/quiz/quiz-history";
import type { QuizAttemptRow } from "@/types/rows";

export const metadata: Metadata = { title: "AI Quiz" };
export const dynamic = "force-dynamic";

/** Quiz generator plus past attempts. */
export default async function QuizPage() {
  const session = await getSession();
  if (!session) return null;

  const supabase = createAdminClient();
  const { data: attempts } = await supabase
    .from("quiz_attempts")
    .select("id, score, total, created_at, quiz_id, quizzes(title, subject)")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false })
    .limit(30);

  return (
    <PageContainer width="wide">
      <PageHeader
        title="AI Quiz"
        description="Test yourself on any topic. You'll only see the answers once you submit."
      />
      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <QuizBuilder
          subjects={session.profile.subjects ?? []}
          defaults={{
            classLevel: session.profile.class_level ?? "Class 9",
            board: session.profile.board ?? "CBSE",
          }}
        />
        <QuizHistory attempts={(attempts ?? []) as unknown as QuizAttemptRow[]} />
      </div>
    </PageContainer>
  );
}

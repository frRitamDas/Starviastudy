import type { Metadata } from "next";
import { getSession } from "@/lib/session";
import { PageContainer, PageHeader } from "@/components/shared/page";
import { QuestionSolver } from "@/components/solve/question-solver";

export const metadata: Metadata = { title: "Question Solver" };
export const dynamic = "force-dynamic";

/** Solve a typed, pasted or photographed question with a full explanation. */
export default async function SolvePage() {
  const session = await getSession();
  if (!session) return null;

  return (
    <PageContainer width="default">
      <PageHeader
        title="Question Solver"
        description="Type, paste or photograph a question. You'll get the concept, the working and a similar question to try."
      />
      <QuestionSolver
        subjects={session.profile.subjects ?? []}
        classLevel={session.profile.class_level}
        board={session.profile.board}
      />
    </PageContainer>
  );
}

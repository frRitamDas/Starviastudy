import type { Metadata } from "next";
import { getSession } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageContainer, PageHeader } from "@/components/shared/page";
import { ExamPrepPlanner } from "@/components/exam/exam-prep-planner";
import { TopicTracker } from "@/components/progress/topic-tracker";
import type { StudyTopicRow } from "@/types/rows";

export const metadata: Metadata = { title: "Exam Preparation" };
export const dynamic = "force-dynamic";

/** Exam preparation: generate a plan, then track topic mastery. */
export default async function ExamPrepPage() {
  const session = await getSession();
  if (!session) return null;

  const supabase = createAdminClient();
  const { data: topics } = await supabase
    .from("study_progress")
    .select("subject, chapter, topic, status, mastery, updated_at")
    .eq("user_id", session.user.id)
    .order("updated_at", { ascending: false });

  return (
    <PageContainer width="wide">
      <PageHeader
        title="Exam Preparation"
        description="A focused revision plan built around your board, class and exam date."
      />
      <div className="space-y-6">
        <ExamPrepPlanner
          subjects={session.profile.subjects ?? []}
          defaults={{
            classLevel: session.profile.class_level ?? "Class 10",
            board: session.profile.board ?? "CBSE",
            examTarget: session.profile.exam_target ?? "",
          }}
        />
        <TopicTracker topics={(topics ?? []) as StudyTopicRow[]} />
      </div>
    </PageContainer>
  );
}

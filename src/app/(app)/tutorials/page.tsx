import type { Metadata } from "next";
import { getSession } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageContainer, PageHeader } from "@/components/shared/page";
import { TutorialGenerator } from "@/components/tutorial/tutorial-generator";
import { TutorialList } from "@/components/tutorial/tutorial-list";

export const metadata: Metadata = { title: "AI Tutorials" };
export const dynamic = "force-dynamic";

/** AI tutorial generator plus the student's saved library. */
export default async function TutorialsPage() {
  const session = await getSession();
  if (!session) return null;

  const supabase = createAdminClient();
  const { data: tutorials } = await supabase
    .from("tutorials")
    .select("id, title, subject, topic, difficulty, is_complete, created_at")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <PageContainer width="wide">
      <PageHeader
        title="AI Tutorials"
        description="Generate a complete, structured lesson for any chapter — written for your class and board."
      />
      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <TutorialGenerator
          subjects={session.profile.subjects ?? []}
          defaults={{
            classLevel: session.profile.class_level ?? "Class 9",
            board: session.profile.board ?? "CBSE",
          }}
        />
        <TutorialList tutorials={tutorials ?? []} />
      </div>
    </PageContainer>
  );
}

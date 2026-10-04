import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getSession } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageContainer } from "@/components/shared/page";
import { TutorialViewer } from "@/components/tutorial/tutorial-viewer";
import type { TutorialContent } from "@/types/content";

export const dynamic = "force-dynamic";

async function getTutorial(userId: string, id: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("tutorials")
    .select("id, title, content, is_complete")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();
  return data;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const session = await getSession();
  if (!session) return { title: "Tutorial" };
  const { id } = await params;
  const tutorial = await getTutorial(session.user.id, id);
  return { title: tutorial?.title ?? "Tutorial" };
}

export default async function TutorialPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return null;

  const { id } = await params;
  const tutorial = await getTutorial(session.user.id, id);
  if (!tutorial) notFound();

  return (
    <PageContainer width="wide">
      <TutorialViewer
        id={tutorial.id}
        content={tutorial.content as unknown as TutorialContent}
        initialComplete={tutorial.is_complete}
      />
    </PageContainer>
  );
}

import type { Metadata } from "next";
import { getSession } from "@/lib/session";
import { listConversations } from "@/lib/conversations";
import { TutorShell } from "@/components/tutor/tutor-shell";

export const metadata: Metadata = { title: "AI Tutor" };
export const dynamic = "force-dynamic";

/** AI tutor. Conversations are loaded on the server so history is instant. */
export default async function TutorPage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string; subject?: string; conversation?: string }>;
}) {
  const session = await getSession();
  if (!session) return null;

  const params = await searchParams;
  const conversations = await listConversations(session.user.id);

  return (
    <TutorShell
      conversations={conversations}
      initialConversationId={params.conversation ?? null}
      subjects={session.profile.subjects ?? []}
      context={{
        classLevel: session.profile.class_level,
        board: session.profile.board,
        learningLevel: session.profile.learning_level,
      }}
      seedTopic={params.topic ?? null}
      seedSubject={params.subject ?? null}
    />
  );
}

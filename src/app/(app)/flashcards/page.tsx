import type { Metadata } from "next";
import { getSession } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageContainer, PageHeader } from "@/components/shared/page";
import { FlashcardStudio } from "@/components/flashcards/flashcard-studio";
import type { FlashcardWithProgress } from "@/types/content";

export const metadata: Metadata = { title: "Flashcards" };
export const dynamic = "force-dynamic";

/** Flashcard studio — create, generate, and revise. */
export default async function FlashcardsPage() {
  const session = await getSession();
  if (!session) return null;

  const supabase = createAdminClient();
  const [{ data: cards }, { data: progress }] = await Promise.all([
    supabase
      .from("flashcards")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false }),
    supabase.from("flashcard_progress").select("*").eq("user_id", session.user.id),
  ]);

  const progressMap = new Map((progress ?? []).map((p) => [p.flashcard_id, p]));
  const merged: FlashcardWithProgress[] = (cards ?? []).map((c) => ({
    id: c.id,
    deck_name: c.deck_name,
    subject: c.subject,
    topic: c.topic,
    front: c.front,
    back: c.back,
    source: c.source,
    status: (progressMap.get(c.id)?.status as FlashcardWithProgress["status"]) ?? "unseen",
    reviewCount: progressMap.get(c.id)?.review_count ?? 0,
    created_at: c.created_at,
  }));

  return (
    <PageContainer width="wide">
      <PageHeader
        title="Flashcards"
        description="Turn any topic into a deck, then revise with a simple known / unknown loop."
      />
      <FlashcardStudio
        initialCards={merged}
        subjects={session.profile.subjects ?? []}
        defaults={{
          classLevel: session.profile.class_level ?? "Class 9",
          board: session.profile.board ?? "CBSE",
        }}
      />
    </PageContainer>
  );
}

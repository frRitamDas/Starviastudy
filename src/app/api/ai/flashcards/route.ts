import { getSession, toStudentContext } from "@/lib/session";
import { fail, ok, handleApiError } from "@/lib/api/response";
import { rateLimit, clientKey } from "@/lib/api/rate-limit";
import { flashcardGenerateSchema, flashcardManualSchema, flashcardReviewSchema } from "@/lib/validations";
import { reserveUsage, refundUsage } from "@/lib/usage/limits";
import { generateFlashcards } from "@/lib/ai";
import { createAdminClient } from "@/lib/supabase/admin";
import { awardProgress } from "@/lib/gamification";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** List the student's flashcards and their review progress. */
export async function GET() {
  try {
    const session = await getSession();
    if (!session) return fail("UNAUTHORIZED", "Please sign in to continue.");

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
    const merged = (cards ?? []).map((c) => ({
      ...c,
      status: progressMap.get(c.id)?.status ?? "unseen",
      reviewCount: progressMap.get(c.id)?.review_count ?? 0,
    }));

    return ok({ flashcards: merged });
  } catch (error) {
    return handleApiError(error);
  }
}

/** Generate a deck with AI. */
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return fail("UNAUTHORIZED", "Please sign in to continue.");

    const limit = await rateLimit(clientKey(request, `flashcards:${session.user.id}`), 10, 60_000);
    if (!limit.allowed) return fail("RATE_LIMITED", "Too many requests. Please slow down.");

    const body = await request.json();
    const parsed = flashcardGenerateSchema.safeParse(body);
    if (!parsed.success) {
      return fail("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Check your details.");
    }

    const input = parsed.data;
    await reserveUsage(session.user.id, session.subscription.plan, "flashcards");

    try {
      const result = await generateFlashcards({
        userId: session.user.id,
        classLevel: input.classLevel,
        board: input.board,
        subject: input.subject,
        topic: input.topic,
        count: input.count,
        ctx: toStudentContext(session.profile),
      });

      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from("flashcards")
        .insert(
          result.content.cards.map((card) => ({
            user_id: session.user.id,
            deck_name: result.content.deckName,
            subject: input.subject,
            topic: input.topic,
            front: card.front,
            back: card.back,
            source: "ai",
          })),
        )
        .select("*");

      if (error) throw new Error("flashcards_save_failed");
      return ok({ flashcards: data, deckName: result.content.deckName, cached: result.cached });
    } catch (error) {
      await refundUsage(session.user.id, "flashcards");
      throw error;
    }
  } catch (error) {
    return handleApiError(error);
  }
}

/** Create a single card manually. */
export async function PUT(request: Request) {
  try {
    const session = await getSession();
    if (!session) return fail("UNAUTHORIZED", "Please sign in to continue.");

    const body = await request.json();
    const parsed = flashcardManualSchema.safeParse(body);
    if (!parsed.success) {
      return fail("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Check your card.");
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("flashcards")
      .insert({
        user_id: session.user.id,
        deck_name: parsed.data.deckName,
        subject: parsed.data.subject ?? null,
        topic: parsed.data.topic ?? null,
        front: parsed.data.front,
        back: parsed.data.back,
        source: "manual",
      })
      .select("*")
      .single();

    if (error) throw new Error("flashcard_save_failed");
    return ok({ flashcard: data });
  } catch (error) {
    return handleApiError(error);
  }
}

/** Record a known / unknown review. */
export async function PATCH(request: Request) {
  try {
    const session = await getSession();
    if (!session) return fail("UNAUTHORIZED", "Please sign in to continue.");

    const body = await request.json();
    const parsed = flashcardReviewSchema.safeParse(body);
    if (!parsed.success) return fail("VALIDATION_ERROR", "Check your review.");

    const supabase = createAdminClient();

    // Verify ownership before writing progress.
    const { data: card } = await supabase
      .from("flashcards")
      .select("id")
      .eq("id", parsed.data.flashcardId)
      .eq("user_id", session.user.id)
      .maybeSingle();
    if (!card) return fail("NOT_FOUND", "We couldn't find that card.");

    const { data: existing } = await supabase
      .from("flashcard_progress")
      .select("*")
      .eq("flashcard_id", parsed.data.flashcardId)
      .eq("user_id", session.user.id)
      .maybeSingle();

    await supabase.from("flashcard_progress").upsert(
      {
        flashcard_id: parsed.data.flashcardId,
        user_id: session.user.id,
        status: parsed.data.status,
        review_count: (existing?.review_count ?? 0) + 1,
        last_reviewed_at: new Date().toISOString(),
      },
      { onConflict: "flashcard_id,user_id" },
    );

    await awardProgress({ userId: session.user.id, action: "flashcard_review", countsAsActivity: false });

    return ok({ recorded: true });
  } catch (error) {
    return handleApiError(error);
  }
}

/** Delete a card. */
export async function DELETE(request: Request) {
  try {
    const session = await getSession();
    if (!session) return fail("UNAUTHORIZED", "Please sign in to continue.");

    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (!id) return fail("BAD_REQUEST", "Missing card id.");

    const supabase = createAdminClient();
    await supabase.from("flashcards").delete().eq("id", id).eq("user_id", session.user.id);
    return ok({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}

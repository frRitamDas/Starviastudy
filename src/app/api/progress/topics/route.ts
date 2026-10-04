import { getSession } from "@/lib/session";
import { fail, ok, handleApiError } from "@/lib/api/response";
import { topicStatusSchema } from "@/lib/validations";
import { createAdminClient } from "@/lib/supabase/admin";
import { awardProgress } from "@/lib/gamification";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MASTERY: Record<string, number> = {
  not_started: 0,
  learning: 35,
  practiced: 70,
  mastered: 100,
};

/** Update a topic's study status. */
export async function PATCH(request: Request) {
  try {
    const session = await getSession();
    if (!session) return fail("UNAUTHORIZED", "Please sign in to continue.");

    const body = await request.json();
    const parsed = topicStatusSchema.safeParse(body);
    if (!parsed.success) {
      return fail("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Check your update.");
    }

    const { subject, chapter, topic, status } = parsed.data;
    const supabase = createAdminClient();

    const { data: existing } = await supabase
      .from("study_progress")
      .select("*")
      .eq("user_id", session.user.id)
      .eq("subject", subject)
      .eq("chapter", chapter)
      .eq("topic", topic)
      .maybeSingle();

    await supabase.from("study_progress").upsert(
      {
        user_id: session.user.id,
        subject,
        chapter,
        topic,
        status,
        mastery: MASTERY[status] ?? 0,
      },
      { onConflict: "user_id,subject,chapter,topic" },
    );

    // Award XP the first time a topic reaches mastered.
    let xp: number | null = null;
    if (status === "mastered" && existing?.status !== "mastered") {
      const reward = await awardProgress({ userId: session.user.id, action: "topic_mastered" });
      xp = reward.xp;
    }

    return ok({ updated: true, xp });
  } catch (error) {
    return handleApiError(error);
  }
}

/** List tracked topics for the caller. */
export async function GET() {
  try {
    const session = await getSession();
    if (!session) return fail("UNAUTHORIZED", "Please sign in to continue.");

    const supabase = createAdminClient();
    const { data } = await supabase
      .from("study_progress")
      .select("*")
      .eq("user_id", session.user.id)
      .order("updated_at", { ascending: false });

    return ok({ topics: data ?? [] });
  } catch (error) {
    return handleApiError(error);
  }
}

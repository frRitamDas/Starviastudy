import { getSession, toStudentContext } from "@/lib/session";
import { fail, ok, handleApiError } from "@/lib/api/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The signed-in student's live usage snapshot.
 * The dashboard and every AI screen read limits from here — the client never
 * invents a limit of its own.
 */
export async function GET() {
  try {
    const session = await getSession();
    if (!session) return fail("UNAUTHORIZED", "Please sign in to continue.");

    return ok({
      plan: session.subscription.plan,
      status: session.subscription.status,
      currentPeriodEnd: session.subscription.currentPeriodEnd,
      cancelAtPeriodEnd: session.subscription.cancelAtPeriodEnd,
      date: session.usage.date,
      limits: session.usage.limits,
      used: session.usage.used,
      remaining: session.usage.remaining,
      profile: {
        fullName: session.profile.full_name,
        classLevel: session.profile.class_level,
        board: session.profile.board,
        subjects: session.profile.subjects,
        learningLevel: session.profile.learning_level,
        examTarget: session.profile.exam_target,
        onboarded: session.profile.onboarded,
        xp: session.profile.xp,
        level: session.profile.level,
        currentStreak: session.profile.current_streak,
        longestStreak: session.profile.longest_streak,
      },
      context: toStudentContext(session.profile),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

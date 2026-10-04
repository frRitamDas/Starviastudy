import { getSession } from "@/lib/session";
import { fail, ok, handleApiError } from "@/lib/api/response";
import { cancelAtPeriodEnd } from "@/lib/billing/subscriptions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Cancel the current plan at the end of the paid period.
 * The student keeps access until `currentPeriodEnd`, then reverts to free.
 */
export async function POST() {
  try {
    const session = await getSession();
    if (!session) return fail("UNAUTHORIZED", "Please sign in to continue.");

    if (session.subscription.plan === "free") {
      return fail("BAD_REQUEST", "You're already on the free plan.");
    }

    const state = await cancelAtPeriodEnd(session.user.id);
    return ok({
      cancelled: true,
      cancelAtPeriodEnd: state.cancelAtPeriodEnd,
      currentPeriodEnd: state.currentPeriodEnd,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

import { getSession } from "@/lib/session";
import { fail, ok, handleApiError } from "@/lib/api/response";
import { checkoutVerifySchema } from "@/lib/validations";
import { verifyPaymentSignature, paymentMode } from "@/lib/billing/razorpay";
import { isRazorpayConfigured } from "@/lib/env";
import { findPaymentByOrder, markPaymentPaid } from "@/lib/billing/payments";
import { activatePlan } from "@/lib/billing/subscriptions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Confirm a checkout server-side.
 *
 * This is the only place a plan is activated from a browser-initiated flow, and
 * it never trusts the browser's claim of success:
 *
 *  - live mode: the Razorpay signature is verified with the key secret here on
 *    the server. A forged or replayed signature fails.
 *  - mock mode: accepted only when Razorpay is genuinely unconfigured AND the
 *    order was issued by our own server and is still pending. This path is
 *    unreachable in production because `isRazorpayConfigured` is true there.
 */
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return fail("UNAUTHORIZED", "Please sign in to continue.");

    const body = await request.json();
    const parsed = checkoutVerifySchema.safeParse(body);
    if (!parsed.success) {
      return fail("VALIDATION_ERROR", "Payment details are incomplete.");
    }

    const { plan, orderId, paymentId, signature } = parsed.data;

    // The order must exist, belong to this user, and still be pending.
    const payment = await findPaymentByOrder(orderId);
    if (!payment || payment.user_id !== session.user.id) {
      return fail("NOT_FOUND", "We couldn't find that payment.");
    }
    if (payment.status === "paid") {
      // Idempotent: already activated, just report success.
      const state = await activatePlan({ userId: session.user.id, plan });
      return ok({ activated: true, plan: state.plan });
    }
    if (payment.status !== "created") {
      return fail("BAD_REQUEST", "This payment can no longer be completed.");
    }

    if (isRazorpayConfigured) {
      const valid = verifyPaymentSignature({ orderId, paymentId, signature });
      if (!valid) {
        return fail("FORBIDDEN", "Payment could not be verified.");
      }
    } else if (paymentMode() === "mock") {
      // Development only: the order id must match the one we issued. This whole
      // branch is unreachable in production because createOrder refuses to issue
      // a mock order when mock payments are disabled.
      if (!orderId.startsWith("mock_order_")) {
        return fail("FORBIDDEN", "Payment could not be verified.");
      }
    } else {
      return fail("INTERNAL", "Payment could not be completed.");
    }

    await markPaymentPaid({ orderId, paymentId, signature });
    const state = await activatePlan({
      userId: session.user.id,
      plan,
      providerOrderId: orderId,
    });

    return ok({
      activated: true,
      plan: state.plan,
      currentPeriodEnd: state.currentPeriodEnd,
      mode: paymentMode(),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

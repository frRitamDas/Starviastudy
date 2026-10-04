import { getSession } from "@/lib/session";
import { fail, ok, handleApiError } from "@/lib/api/response";
import { rateLimit, clientKey } from "@/lib/api/rate-limit";
import { checkoutSchema } from "@/lib/validations";
import { createOrder, paymentMode } from "@/lib/billing/razorpay";
import { recordPayment } from "@/lib/billing/payments";
import { getPlan } from "@/lib/plans";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Start a checkout.
 *
 * The amount comes from the server-side plan definition, never from the request.
 * Only the plan id is accepted from the client, so the price cannot be tampered
 * with. The order is recorded before the student pays, which is what lets the
 * verify step and the webhook find it later.
 */
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return fail("UNAUTHORIZED", "Please sign in to continue.");

    const limit = await rateLimit(clientKey(request, `checkout:${session.user.id}`), 10, 60_000);
    if (!limit.allowed) return fail("RATE_LIMITED", "Too many attempts. Please wait a moment.");

    const body = await request.json();
    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) {
      return fail("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Choose a plan.");
    }

    const plan = parsed.data.plan;
    const definition = getPlan(plan);

    const order = await createOrder(plan, `starvia_${session.user.id.slice(0, 8)}_${Date.now()}`);

    await recordPayment({
      userId: session.user.id,
      plan,
      amount: definition.priceMonthly,
      mode: order.mode,
      providerOrderId: order.orderId,
      status: "created",
    });

    return ok({
      orderId: order.orderId,
      amount: order.amount,
      currency: order.currency,
      plan,
      mode: order.mode,
      // The publishable key id is safe to expose; the secret never is.
      keyId: order.keyId,
      planName: definition.name,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "plan_not_purchasable") {
      return fail("BAD_REQUEST", "That plan is free and does not need payment.");
    }
    if (error instanceof Error && error.message === "payments_unavailable") {
      return fail("INTERNAL", "Payment could not be completed. Please try again later.");
    }
    if (error instanceof Error && error.message === "razorpay_order_failed") {
      return fail("INTERNAL", "Payment could not be completed. Please try again.");
    }
    return handleApiError(error);
  }
}

/** Report the current payment mode so the UI can label mock checkouts clearly. */
export async function GET() {
  try {
    const session = await getSession();
    if (!session) return fail("UNAUTHORIZED", "Please sign in to continue.");
    return ok({ mode: paymentMode(), plan: session.subscription.plan });
  } catch (error) {
    return handleApiError(error);
  }
}

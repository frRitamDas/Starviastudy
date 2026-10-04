import { NextResponse } from "next/server";
import { verifyWebhookSignature, mapWebhookEventToStatus } from "@/lib/billing/razorpay";
import {
  findPaymentByOrder,
  isPaymentIdProcessed,
  markPaymentPaid,
  markPaymentStatus,
} from "@/lib/billing/payments";
import { activatePlan, revertToFree } from "@/lib/billing/subscriptions";
import { createAdminClient } from "@/lib/supabase/admin";
import { isPlanId } from "@/lib/plans";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Razorpay webhook.
 *
 * This is the authoritative confirmation path — it can activate a plan even if
 * the student closed the tab before the browser verify step ran.
 *
 * Security:
 *  - the raw body is read as text and the HMAC signature is verified with the
 *    webhook secret before anything is parsed or trusted,
 *  - already-processed payment ids are ignored, so replays cannot extend a plan,
 *  - the plan is taken from our own payment record, never from the payload.
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature");

  if (!verifyWebhookSignature(rawBody, signature)) {
    // Do not reveal whether the secret is missing or the signature was wrong.
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let payload: {
    event?: string;
    payload?: {
      payment?: { entity?: { id?: string; order_id?: string } };
      subscription?: { entity?: { id?: string } };
    };
  };

  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const event = payload.event ?? "";
  const status = mapWebhookEventToStatus(event);
  const paymentEntity = payload.payload?.payment?.entity;
  const orderId = paymentEntity?.order_id ?? null;
  const paymentId = paymentEntity?.id ?? null;

  try {
    if (status === "paid" && orderId && paymentId) {
      if (await isPaymentIdProcessed(paymentId)) {
        return NextResponse.json({ ok: true, duplicate: true });
      }

      const payment = await findPaymentByOrder(orderId);
      if (payment && isPlanId(payment.plan)) {
        await markPaymentPaid({ orderId, paymentId });
        await activatePlan({
          userId: payment.user_id,
          plan: payment.plan,
          providerOrderId: orderId,
        });
      }
    } else if (status === "failed" && orderId) {
      await markPaymentStatus(orderId, "failed");
    } else if (status === "cancelled") {
      // A cancelled subscription reverts the student to free at once.
      const subscriptionId = payload.payload?.subscription?.entity?.id;
      if (subscriptionId) {
        const supabase = createAdminClient();
        const { data: sub } = await supabase
          .from("subscriptions")
          .select("user_id")
          .eq("provider_subscription_id", subscriptionId)
          .maybeSingle();
        if (sub?.user_id) await revertToFree(sub.user_id, "cancelled");
      }
    }

    return NextResponse.json({ ok: true });
  } catch {
    // Returning 500 asks Razorpay to retry, which is what we want on a
    // transient failure.
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

import "server-only";

import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { serverEnv, isRazorpayConfigured, allowMockPayments } from "@/lib/env";
import { getPlan, type PlanId } from "@/lib/plans";

/**
 * Razorpay integration.
 *
 * All secrets stay server-side. Payments are only ever marked successful after
 * a signature that we verify here — never because the browser said so.
 *
 * When Razorpay credentials are absent we run a clearly separated mock mode so
 * the subscription flow can be developed and tested end to end. Mock mode can
 * never activate a plan in production because it is gated on `isRazorpayConfigured`
 * being false.
 */

export type PaymentMode = "live" | "mock";

export function paymentMode(): PaymentMode {
  return isRazorpayConfigured ? "live" : "mock";
}

export interface CreatedOrder {
  orderId: string;
  amount: number;
  currency: string;
  plan: PlanId;
  mode: PaymentMode;
  keyId: string | null;
}

/** Create a Razorpay order for a plan, or a mock order in development. */
export async function createOrder(plan: PlanId, receipt: string): Promise<CreatedOrder> {
  const definition = getPlan(plan);
  if (definition.priceMonthly <= 0) {
    throw new Error("plan_not_purchasable");
  }

  if (!isRazorpayConfigured) {
    if (!allowMockPayments) {
      // Production safety: never hand out an order we would later activate
      // without payment. Callers surface this as a payment failure.
      throw new Error("payments_unavailable");
    }
    // Mock mode: an order the server issued and the server will later confirm.
    return {
      orderId: `mock_order_${randomUUID()}`,
      amount: definition.priceMonthly,
      currency: "INR",
      plan,
      mode: "mock",
      keyId: null,
    };
  }

  const auth = Buffer.from(
    `${serverEnv.razorpayKeyId}:${serverEnv.razorpayKeySecret}`,
  ).toString("base64");

  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: definition.priceMonthly,
      currency: "INR",
      receipt,
      notes: { plan, product: "starvia" },
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("razorpay_order_failed");
  }

  const order = (await response.json()) as { id: string; amount: number; currency: string };

  return {
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    plan,
    mode: "live",
    keyId: serverEnv.razorpayKeyId,
  };
}

function safeEqual(a: string, b: string) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/**
 * Verify the checkout callback signature.
 * Razorpay signs `${order_id}|${payment_id}` with the key secret.
 */
export function verifyPaymentSignature(params: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  if (!isRazorpayConfigured) return false;
  const expected = createHmac("sha256", serverEnv.razorpayKeySecret)
    .update(`${params.orderId}|${params.paymentId}`)
    .digest("hex");
  return safeEqual(expected, params.signature);
}

/** Verify an inbound webhook using the webhook secret. */
export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  if (!serverEnv.razorpayWebhookSecret) return false;
  if (!signature) return false;
  const expected = createHmac("sha256", serverEnv.razorpayWebhookSecret)
    .update(rawBody)
    .digest("hex");
  return safeEqual(expected, signature);
}

/** Human-readable status mapped from Razorpay's event names. */
export function mapWebhookEventToStatus(event: string): "paid" | "failed" | "cancelled" | "unknown" {
  switch (event) {
    case "payment.captured":
    case "order.paid":
    case "subscription.charged":
    case "subscription.activated":
      return "paid";
    case "payment.failed":
      return "failed";
    case "subscription.cancelled":
    case "subscription.halted":
      return "cancelled";
    default:
      return "unknown";
  }
}

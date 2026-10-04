import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { PlanId } from "@/lib/plans";

/** Payment audit-trail helpers. Writes happen only from verified server flows. */

export async function recordPayment(params: {
  userId: string;
  plan: PlanId;
  amount: number;
  mode: "live" | "mock";
  providerOrderId: string;
  status?: string;
}) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("payments")
    .insert({
      user_id: params.userId,
      plan: params.plan,
      amount: params.amount,
      currency: "INR",
      status: params.status ?? "created",
      mode: params.mode,
      provider: "razorpay",
      provider_order_id: params.providerOrderId,
    })
    .select("*")
    .single();
  if (error) throw new Error("payment_record_failed");
  return data;
}

export async function findPaymentByOrder(orderId: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("payments")
    .select("*")
    .eq("provider_order_id", orderId)
    .maybeSingle();
  return data;
}

export async function markPaymentPaid(params: {
  orderId: string;
  paymentId: string;
  signature?: string | null;
}) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("payments")
    .update({
      status: "paid",
      provider_payment_id: params.paymentId,
      provider_signature: params.signature ?? null,
    })
    .eq("provider_order_id", params.orderId)
    .select("*")
    .single();
  if (error) throw new Error("payment_update_failed");
  return data;
}

export async function markPaymentStatus(orderId: string, status: string) {
  const supabase = createAdminClient();
  await supabase.from("payments").update({ status }).eq("provider_order_id", orderId);
}

/** Has this provider payment id already been processed? Guards webhook replays. */
export async function isPaymentIdProcessed(paymentId: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("payments")
    .select("id, status")
    .eq("provider_payment_id", paymentId)
    .eq("status", "paid")
    .maybeSingle();
  return Boolean(data);
}

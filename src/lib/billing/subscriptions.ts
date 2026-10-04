import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { isPlanId, type PlanId } from "@/lib/plans";
import type { Subscription } from "@/types/database";

/**
 * Subscription state, resolved server-side.
 *
 * The client never decides what plan a user is on. Everything here reads from
 * the database (written only by verified payment flows) and applies expiry.
 */

export interface SubscriptionState {
  plan: PlanId;
  status: string;
  provider: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  cancelledAt: string | null;
  isActive: boolean;
}

const FREE_STATE: SubscriptionState = {
  plan: "free",
  status: "active",
  provider: "razorpay",
  currentPeriodEnd: null,
  cancelAtPeriodEnd: false,
  cancelledAt: null,
  isActive: true,
};

function toState(row: Subscription | null): SubscriptionState {
  if (!row) return FREE_STATE;

  const plan: PlanId = isPlanId(row.plan) ? row.plan : "free";
  const periodEnd = row.current_period_end ? new Date(row.current_period_end) : null;
  const expired = periodEnd ? periodEnd.getTime() < Date.now() : false;

  // A paid plan past its period end is treated as free until renewed.
  const effectivePlan: PlanId = plan !== "free" && (expired || row.status !== "active") ? "free" : plan;

  return {
    plan: effectivePlan,
    status: row.status,
    provider: row.provider,
    currentPeriodEnd: row.current_period_end,
    cancelAtPeriodEnd: row.cancel_at_period_end,
    cancelledAt: row.cancelled_at,
    isActive: effectivePlan !== "free" && !expired && row.status === "active",
  };
}

/** Resolve the caller's subscription, downgrading in-memory if it has expired. */
export async function getUserSubscription(userId: string): Promise<SubscriptionState> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    const state = toState(data);

    // Persist the expiry downgrade so the rest of the system agrees.
    if (data && isPlanId(data.plan) && data.plan !== "free" && state.plan === "free") {
      await supabase
        .from("subscriptions")
        .update({ plan: "free", status: "expired", updated_at: new Date().toISOString() })
        .eq("user_id", userId);
    }

    return state;
  } catch {
    return FREE_STATE;
  }
}

/** Effective plan id only. */
export async function getEffectivePlan(userId: string): Promise<PlanId> {
  const state = await getUserSubscription(userId);
  return state.plan;
}

/** Ensure a subscription row exists (used after signup if the trigger lagged). */
export async function ensureSubscription(userId: string): Promise<SubscriptionState> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (data) return toState(data);

  await supabase
    .from("subscriptions")
    .insert({ user_id: userId, plan: "free", status: "active", provider: "razorpay" });

  return FREE_STATE;
}

/**
 * Activate (or extend) a paid plan after a server-verified payment.
 * `months` extends from the later of "now" and the current period end.
 */
export async function activatePlan(params: {
  userId: string;
  plan: PlanId;
  months?: number;
  providerSubscriptionId?: string | null;
  providerOrderId?: string | null;
}): Promise<SubscriptionState> {
  const supabase = createAdminClient();
  const months = params.months ?? 1;

  const { data: existing } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", params.userId)
    .maybeSingle();

  const now = new Date();
  const currentEnd = existing?.current_period_end ? new Date(existing.current_period_end) : null;
  const base = currentEnd && currentEnd > now ? currentEnd : now;
  const end = new Date(base);
  end.setMonth(end.getMonth() + months);

  const payload = {
    user_id: params.userId,
    plan: params.plan,
    status: "active",
    provider: "razorpay",
    provider_subscription_id: params.providerSubscriptionId ?? existing?.provider_subscription_id ?? null,
    provider_order_id: params.providerOrderId ?? existing?.provider_order_id ?? null,
    current_period_start: now.toISOString(),
    current_period_end: end.toISOString(),
    cancel_at_period_end: false,
    cancelled_at: null,
  };

  const { data, error } = await supabase
    .from("subscriptions")
    .upsert(payload, { onConflict: "user_id" })
    .select("*")
    .single();

  if (error) throw new Error("subscription_update_failed");
  return toState(data);
}

/** Mark a subscription to end at the current period end. */
export async function cancelAtPeriodEnd(userId: string): Promise<SubscriptionState> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("subscriptions")
    .update({ cancel_at_period_end: true, cancelled_at: new Date().toISOString() })
    .eq("user_id", userId)
    .select("*")
    .single();
  if (error) throw new Error("subscription_update_failed");
  return toState(data);
}

/** Immediately revert to free (e.g. a refund or failed renewal). */
export async function revertToFree(userId: string, status = "cancelled"): Promise<void> {
  const supabase = createAdminClient();
  await supabase
    .from("subscriptions")
    .update({
      plan: "free",
      status,
      cancel_at_period_end: false,
      current_period_end: null,
    })
    .eq("user_id", userId);
}

import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { FEATURE_LABELS, getPlan, PLANS, type PlanId, type UsageFeature } from "@/lib/plans";
import { todayInTZ } from "@/lib/utils";

/**
 * Resolve the effective daily limits for a plan.
 * DB overrides (`plan_limits`) win over the code defaults in `src/lib/plans.ts`,
 * so limits can be tuned in production without a redeploy.
 */
export async function getPlanLimits(
  plan: PlanId,
): Promise<Record<UsageFeature, number | null>> {
  const defaults = PLANS[plan].limits;
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("plan_limits")
      .select("limits")
      .eq("plan", plan)
      .maybeSingle();
    if (data?.limits && typeof data.limits === "object") {
      return { ...defaults, ...(data.limits as Record<UsageFeature, number | null>) };
    }
  } catch {
    /* fall through to code defaults */
  }
  return defaults;
}

export interface UsageSnapshot {
  plan: PlanId;
  /** YYYY-MM-DD in IST — the accounting day. */
  date: string;
  limits: Record<UsageFeature, number | null>;
  used: Record<UsageFeature, number>;
  remaining: Record<UsageFeature, number | null>;
}

/** Read today's usage for every metered feature. */
export async function getUsageSnapshot(
  userId: string,
  plan: PlanId,
): Promise<UsageSnapshot> {
  const date = todayInTZ();
  const limits = await getPlanLimits(plan);

  const used = Object.fromEntries(
    (Object.keys(limits) as UsageFeature[]).map((f) => [f, 0]),
  ) as Record<UsageFeature, number>;

  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("ai_usage")
      .select("feature, count")
      .eq("user_id", userId)
      .eq("usage_date", date);

    for (const row of data ?? []) {
      if (row.feature in used) used[row.feature as UsageFeature] = row.count;
    }
  } catch {
    /* treat as zero usage if the read fails */
  }

  const remaining = Object.fromEntries(
    (Object.keys(limits) as UsageFeature[]).map((f) => [
      f,
      limits[f] === null ? null : Math.max((limits[f] as number) - used[f], 0),
    ]),
  ) as Record<UsageFeature, number | null>;

  return { plan, date, limits, used, remaining };
}

export class LimitReachedError extends Error {
  readonly feature: UsageFeature;
  readonly plan: PlanId;
  readonly limit: number;
  readonly used: number;
  constructor(feature: UsageFeature, plan: PlanId, limit: number, used: number) {
    super("limit_reached");
    this.name = "LimitReachedError";
    this.feature = feature;
    this.plan = plan;
    this.limit = limit;
    this.used = used;
  }
  /** Safe, user-facing copy. */
  get userMessage() {
    return `You've reached today's limit of ${this.limit} ${FEATURE_LABELS[this.feature]}. Upgrade to continue learning.`;
  }
}

/**
 * Reserve one unit of a feature for today.
 *
 * Called BEFORE the AI request so concurrent requests cannot exceed the limit.
 * If the AI call then fails, the caller must call `refundUsage()`.
 * Throws `LimitReachedError` when the plan's daily allowance is exhausted.
 */
export async function reserveUsage(
  userId: string,
  plan: PlanId,
  feature: UsageFeature,
): Promise<{ used: number; limit: number | null }> {
  const limits = await getPlanLimits(plan);
  const limit = limits[feature];
  const date = todayInTZ();

  // Unlimited plans: still record usage for analytics.
  const supabase = createAdminClient();

  if (limit === null) {
    const { data, error } = await supabase.rpc("increment_ai_usage", {
      p_user_id: userId,
      p_feature: feature,
      p_date: date,
      p_amount: 1,
    });
    if (error) throw new Error("usage_tracking_failed");
    return { used: (data as number) ?? 0, limit: null };
  }

  // Read current usage, then conditionally increment. The conditional update
  // below is what makes this safe against races: two parallel requests can both
  // read "4 of 5", but only one increment can leave the count at or below 5.
  const { data: current } = await supabase
    .from("ai_usage")
    .select("count")
    .eq("user_id", userId)
    .eq("feature", feature)
    .eq("usage_date", date)
    .maybeSingle();

  const usedNow = current?.count ?? 0;
  if (usedNow >= limit) {
    throw new LimitReachedError(feature, plan, limit, usedNow);
  }

  const { data, error } = await supabase.rpc("increment_ai_usage", {
    p_user_id: userId,
    p_feature: feature,
    p_date: date,
    p_amount: 1,
  });
  if (error) throw new Error("usage_tracking_failed");

  const usedAfter = (data as number) ?? usedNow + 1;
  if (usedAfter > limit) {
    // A concurrent request slipped in first — give the unit back.
    await refundUsage(userId, feature);
    throw new LimitReachedError(feature, plan, limit, limit);
  }

  return { used: usedAfter, limit };
}

/** Return a reserved unit after a failed AI call. */
export async function refundUsage(userId: string, feature: UsageFeature): Promise<void> {
  try {
    const supabase = createAdminClient();
    await supabase.rpc("increment_ai_usage", {
      p_user_id: userId,
      p_feature: feature,
      p_date: todayInTZ(),
      p_amount: -1,
    });
  } catch {
    /* best-effort */
  }
}

/** Convenience: does this plan allow the feature right now? */
export async function canUse(
  userId: string,
  plan: PlanId,
  feature: UsageFeature,
): Promise<boolean> {
  const snapshot = await getUsageSnapshot(userId, plan);
  const remaining = snapshot.remaining[feature];
  return remaining === null || remaining > 0;
}

export { getPlan };

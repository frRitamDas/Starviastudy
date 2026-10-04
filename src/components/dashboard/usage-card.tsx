import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PlanBadge } from "@/components/billing/plan-badge";
import { FEATURE_LABELS, getPlan, type PlanId, type UsageFeature } from "@/lib/plans";

/** Per-feature daily allowance shown on the dashboard. */
export function UsageCard({
  plan,
  limits,
  used,
}: {
  plan: PlanId;
  limits: Record<UsageFeature, number | null>;
  used: Record<string, number>;
}) {
  const features: UsageFeature[] = ["tutor", "tutorial", "quiz", "image_solve"];
  const definition = getPlan(plan);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>AI usage today</CardTitle>
        <PlanBadge plan={plan} />
      </CardHeader>
      <CardContent className="space-y-4">
        {features.map((feature) => {
          const limit = limits[feature];
          const usedCount = used[feature] ?? 0;
          const percent = limit ? Math.min((usedCount / limit) * 100, 100) : 0;
          return (
            <div key={feature}>
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{FEATURE_LABELS[feature]}</span>
                <span className="tabular-nums">
                  {limit === null ? "Unlimited" : `${usedCount} / ${limit}`}
                </span>
              </div>
              <Progress value={percent} className="h-1.5" />
            </div>
          );
        })}

        {plan === "free" ? (
          <div className="rounded-xl border border-border bg-muted/40 p-3">
            <p className="text-xs text-muted-foreground text-pretty">
              You&apos;re on the {definition.name} plan. Upgrade for more daily AI and advanced exam
              tools.
            </p>
            <Link
              href="/pricing"
              className="mt-2 inline-block text-xs font-medium underline underline-offset-4"
            >
              See plans
            </Link>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

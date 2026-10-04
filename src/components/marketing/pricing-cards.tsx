import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { PLANS, PLAN_ORDER, type PlanId } from "@/lib/plans";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Plan cards.
 *
 * Prices and limits are read from the single server-side plan definition, so
 * marketing copy can never drift from what the API actually enforces.
 */
export function PricingCards({
  currentPlan,
  compact = false,
  showCta = true,
}: {
  currentPlan?: PlanId | null;
  compact?: boolean;
  showCta?: boolean;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {PLAN_ORDER.map((planId) => {
        const plan = PLANS[planId];
        const isCurrent = currentPlan === planId;
        return (
          <div
            key={planId}
            className={cn(
              "relative flex flex-col rounded-3xl border bg-card p-6",
              plan.highlighted ? "border-foreground/30 shadow-lg" : "border-border",
            )}
          >
            {plan.badge ? (
              <span className="absolute -top-3 left-6 rounded-full border border-border bg-background px-2.5 py-0.5 text-xs font-medium">
                {plan.badge}
              </span>
            ) : null}

            <div className="flex items-baseline justify-between">
              <h3 className="text-base font-semibold">{plan.name}</h3>
              {isCurrent ? (
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  Current
                </span>
              ) : null}
            </div>

            <div className="mt-4 flex items-baseline gap-1.5">
              <span className="text-3xl font-semibold tracking-tight">{plan.priceLabel}</span>
              <span className="text-sm text-muted-foreground">
                {plan.priceMonthly === 0 ? "forever" : "/month"}
              </span>
            </div>

            <p className="mt-2 text-sm text-muted-foreground text-pretty">{plan.description}</p>

            {!compact ? (
              <ul className="mt-6 flex flex-1 flex-col gap-2.5">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-2.5 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="text-pretty">{feature}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex-1" />
            )}

            {showCta ? (
              <div className="mt-6">
                {isCurrent ? (
                  <Button variant="outline" className="w-full" disabled>
                    Your current plan
                  </Button>
                ) : planId === "free" ? (
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/signup">Start free</Link>
                  </Button>
                ) : (
                  <Button
                    variant={plan.highlighted ? "default" : "outline"}
                    className="w-full"
                    asChild
                  >
                    <Link href={currentPlan ? `/checkout?plan=${planId}` : "/signup"}>
                      Choose {plan.name}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                )}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

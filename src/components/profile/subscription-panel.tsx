import Link from "next/link";
import { CalendarClock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlanBadge } from "@/components/billing/plan-badge";
import { getPlan, type PlanId } from "@/lib/plans";
import { formatDate } from "@/lib/utils";

/** Current subscription with the option to change or cancel. */
export function SubscriptionPanel({
  plan,
  status,
  currentPeriodEnd,
  cancelAtPeriodEnd,
}: {
  plan: PlanId;
  status: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}) {
  const definition = getPlan(plan);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Subscription</CardTitle>
        <PlanBadge plan={plan} />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <span className="text-muted-foreground">
            Plan: <span className="text-foreground">{definition.name}</span>
          </span>
          <span className="text-muted-foreground">
            Status:{" "}
            <span className="capitalize text-foreground">{status.replace(/_/g, " ")}</span>
          </span>
          {currentPeriodEnd ? (
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <CalendarClock className="h-3.5 w-3.5" />
              {cancelAtPeriodEnd ? "Ends" : "Renews"} {formatDate(currentPeriodEnd)}
            </span>
          ) : null}
        </div>

        {cancelAtPeriodEnd ? (
          <p className="rounded-xl border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
            Your plan is set to end at the close of this billing period. You keep full access until
            then.
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {plan === "free" ? (
            <Button asChild>
              <Link href="/pricing">Upgrade plan</Link>
            </Button>
          ) : (
            <Button variant="outline" asChild>
              <Link href="/pricing">Manage plan</Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

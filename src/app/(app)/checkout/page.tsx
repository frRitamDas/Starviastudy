import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Check } from "lucide-react";
import { getSession } from "@/lib/session";
import { isRazorpayConfigured, publicEnv } from "@/lib/env";
import { getPlan, isPlanId, type PlanId } from "@/lib/plans";
import { PageContainer, PageHeader } from "@/components/shared/page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckoutButton } from "@/components/billing/checkout-button";

export const metadata: Metadata = { title: "Checkout" };
export const dynamic = "force-dynamic";

/**
 * Checkout page.
 *
 * The plan comes from the URL, but the price shown is read from the server-side
 * plan definition — the same object the payment API uses to create the order.
 * Nothing about the amount is taken from the query string.
 */
export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login?next=/pricing");

  const { plan: planParam } = await searchParams;
  if (!isPlanId(planParam) || planParam === "free") {
    redirect("/pricing");
  }
  const planId = planParam as PlanId;
  const plan = getPlan(planId);

  if (session.subscription.plan === planId) {
    return (
      <PageContainer width="default">
        <PageHeader title="You're already on this plan" />
        <Card>
          <CardContent className="flex flex-col items-start gap-4 pt-6">
            <p className="text-sm text-muted-foreground">
              Your account is currently on the {plan.name} plan.
            </p>
            <Button variant="outline" asChild>
              <Link href="/profile">Manage subscription</Link>
            </Button>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer width="default">
      <PageHeader
        title={`Upgrade to ${plan.name}`}
        description="Your plan activates as soon as the payment is verified — no waiting."
      />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Order summary</CardTitle>
            {!isRazorpayConfigured ? <Badge variant="warning">Test mode</Badge> : null}
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-muted-foreground">{plan.name} plan</span>
              <span className="text-sm">{plan.priceLabel} / month</span>
            </div>
            <div className="flex items-baseline justify-between border-t border-border pt-4">
              <span className="text-sm font-medium">Total due today</span>
              <span className="text-lg font-semibold">{plan.priceLabel}</span>
            </div>

            <ul className="flex flex-col gap-2.5 border-t border-border pt-5">
              {plan.features.map((feature) => (
                <li key={feature} className="flex gap-2.5 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="text-pretty">{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isRazorpayConfigured ? (
              <p className="rounded-xl border border-warning/30 bg-warning/10 p-3 text-xs text-pretty">
                Razorpay keys are not configured on this deployment, so checkout runs in a clearly
                labelled test mode. No money moves and no card details are collected. Add
                RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET and RAZORPAY_WEBHOOK_SECRET in your
                environment to enable live payments.
              </p>
            ) : null}

            <p className="text-sm text-muted-foreground text-pretty">
              Payments are processed securely by Razorpay. Starvia never sees or stores your card
              details, and your plan is activated only after we verify the payment on our server.
            </p>

            <CheckoutButton
              plan={planId}
              planName={plan.name}
              amountLabel={plan.priceLabel}
              keyId={publicEnv.razorpayKeyId}
              live={isRazorpayConfigured}
            />

            <p className="text-xs text-muted-foreground text-pretty">
              By upgrading you agree to our{" "}
              <Link href="/terms" className="underline underline-offset-4">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="underline underline-offset-4">
                Privacy Policy
              </Link>
              . You can cancel any time from your profile.
            </p>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}

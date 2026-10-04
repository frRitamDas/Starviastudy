import type { Metadata } from "next";
import Link from "next/link";
import { Check, X } from "lucide-react";
import { getSession } from "@/lib/session";
import { FEATURE_LABELS, PLANS, PLAN_ORDER, type UsageFeature } from "@/lib/plans";
import { SectionHeading } from "@/components/shared/section-heading";
import { PricingCards } from "@/components/marketing/pricing-cards";
import { FaqList } from "@/components/marketing/faq-list";
import { Reveal } from "@/components/marketing/reveal";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Starvia pricing: start free, upgrade to Pro at ₹99/month or Ultra at ₹249/month for more daily AI, advanced exam preparation and flashcard generation.",
  alternates: { canonical: "/pricing" },
};

export const dynamic = "force-dynamic";

const FEATURE_ORDER: UsageFeature[] = [
  "tutor",
  "tutorial",
  "quiz",
  "image_solve",
  "solve",
  "flashcards",
  "exam_prep",
];

const PRICING_FAQS = [
  {
    question: "What happens when I hit my daily limit?",
    answer:
      "You'll see a clear message and an upgrade option. Your allowance resets at midnight IST, so you can always come back the next day on the free plan.",
  },
  {
    question: "Can I switch plans later?",
    answer:
      "Yes. You can upgrade at any time from the pricing page, and you can cancel from your profile. Upgrades take effect immediately; a cancelled plan runs to the end of the period you paid for.",
  },
  {
    question: "Is there a yearly plan?",
    answer:
      "Not yet — Starvia currently bills monthly in Indian rupees through Razorpay. Yearly plans are on the roadmap.",
  },
  {
    question: "Do you offer student discounts?",
    answer:
      "Our prices are already set for Indian school students. If cost is a barrier for you, write to us and we will do our best to help.",
  },
];

export default async function PricingPage() {
  const session = await getSession();

  return (
    <>
      <section className="border-b border-border bg-grid">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <Reveal>
            <SectionHeading
              eyebrow="Pricing"
              title="Fair pricing for serious study"
              description="Every plan includes the full study toolkit. The difference is how much AI you can use each day."
            />
          </Reveal>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <Reveal>
            <PricingCards currentPlan={session?.subscription.plan ?? null} />
          </Reveal>

          {/* Comparison table */}
          <Reveal className="mt-16" delay={60}>
            <h2 className="mb-6 text-lg font-semibold tracking-tight">Daily limits by plan</h2>
            <div className="overflow-x-auto rounded-2xl border border-border">
              <table className="w-full min-w-[560px] border-collapse text-sm">
                <caption className="sr-only">Daily AI limits for each Starvia plan</caption>
                <thead className="bg-muted/50">
                  <tr>
                    <th scope="col" className="border-b border-border px-4 py-3 text-left font-medium">
                      Feature
                    </th>
                    {PLAN_ORDER.map((planId) => (
                      <th
                        key={planId}
                        scope="col"
                        className="border-b border-border px-4 py-3 text-left font-medium"
                      >
                        {PLANS[planId].name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {FEATURE_ORDER.map((feature) => (
                    <tr key={feature}>
                      <th
                        scope="row"
                        className="border-b border-border px-4 py-3 text-left font-normal text-muted-foreground"
                      >
                        {FEATURE_LABELS[feature]}
                      </th>
                      {PLAN_ORDER.map((planId) => {
                        const value = PLANS[planId].limits[feature];
                        return (
                          <td key={planId} className="border-b border-border px-4 py-3 tabular-nums">
                            {value === null ? "Unlimited" : `${value} / day`}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  <tr>
                    <th
                      scope="row"
                      className="px-4 py-3 text-left font-normal text-muted-foreground"
                    >
                      Advanced exam preparation
                    </th>
                    {PLAN_ORDER.map((planId) => (
                      <td key={planId} className="px-4 py-3">
                        {planId === "free" ? (
                          <X className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <th
                      scope="row"
                      className="px-4 py-3 text-left font-normal text-muted-foreground"
                    >
                      Advanced progress analytics
                    </th>
                    {PLAN_ORDER.map((planId) => (
                      <td key={planId} className="px-4 py-3">
                        {planId === "free" ? (
                          <X className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </Reveal>

          {!session ? (
            <Reveal className="mt-10 text-center" delay={80}>
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link href="/login" className="font-medium underline underline-offset-4">
                  Log in to upgrade
                </Link>
              </p>
            </Reveal>
          ) : null}

          <Reveal className="mt-16" delay={100}>
            <h2 className="mb-6 text-lg font-semibold tracking-tight">Pricing questions</h2>
            <FaqList items={PRICING_FAQS} />
          </Reveal>

          <div className="mt-10 flex justify-center">
            <Button variant="outline" asChild>
              <Link href="/faq">See all questions</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}

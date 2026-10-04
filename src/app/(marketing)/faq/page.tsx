import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/shared/section-heading";
import { FaqList } from "@/components/marketing/faq-list";
import { Reveal } from "@/components/marketing/reveal";
import { FAQS } from "@/lib/faq";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Answers to common questions about Starvia — boards and classes supported, daily AI limits, pricing, payments, privacy and data security.",
  alternates: { canonical: "/faq" },
};

export default function FaqPage() {
  return (
    <>
      <section className="border-b border-border bg-grid">
        <div className="mx-auto w-full max-w-4xl px-4 py-16 sm:px-6 sm:py-20">
          <Reveal>
            <SectionHeading
              eyebrow="Help centre"
              title="Frequently asked questions"
              description="Everything students and parents usually ask before getting started. If your question isn't here, write to us."
            />
          </Reveal>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto w-full max-w-3xl px-4 sm:px-6">
          <Reveal>
            <FaqList items={FAQS as unknown as { question: string; answer: string }[]} />
          </Reveal>

          <Reveal className="mt-12 text-center" delay={60}>
            <h2 className="text-lg font-semibold">Still have a question?</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground text-pretty">
              Send us a message and we&apos;ll get back to you, usually within 1–2 working days.
            </p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild>
                <Link href="/contact">
                  Contact us
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/pricing">See pricing</Link>
              </Button>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}

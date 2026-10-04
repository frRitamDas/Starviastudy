import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Heart, ShieldCheck, Sparkles, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SectionHeading } from "@/components/shared/section-heading";
import { Reveal } from "@/components/marketing/reveal";
import { siteConfig } from "@/lib/site";
import { BOARDS, CLASS_LEVELS } from "@/lib/education";

export const metadata: Metadata = {
  title: "About",
  description:
    "Starvia is an AI study companion for Indian school students, built to help learners understand concepts rather than collect answers.",
  alternates: { canonical: "/about" },
};

const PRINCIPLES = [
  {
    icon: Target,
    title: "Teach, don't just answer",
    body: "Every explanation starts with the concept and builds up. A final answer on its own does not help you in an exam — understanding the method does.",
  },
  {
    icon: BookOpen,
    title: "Pitched at your level",
    body: "A Class 9 student should not receive a university-level answer. Starvia is told your class and board, and keeps the depth appropriate.",
  },
  {
    icon: ShieldCheck,
    title: "Honest about uncertainty",
    body: "When Starvia is unsure, it says so. Making something up confidently is worse than admitting a gap — especially when you are revising for boards.",
  },
  {
    icon: Heart,
    title: "Built for Indian students",
    body: "ICSE, CBSE and State Boards, Indian exam patterns and a price point that works for families in India. Not an imported product with a rupee sign.",
  },
];

export default function AboutPage() {
  return (
    <>
      <section className="border-b border-border bg-grid">
        <div className="mx-auto w-full max-w-4xl px-4 py-16 sm:px-6 sm:py-24">
          <Reveal>
            <SectionHeading
              eyebrow="About Starvia"
              title="Built to fix how students actually revise"
              description="Most students do not struggle because they lack information. They struggle because nothing explains it at their level, tests them honestly, and then tells them what to fix next. Starvia is built around that gap."
            />
          </Reveal>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto w-full max-w-4xl px-4 sm:px-6">
          <Reveal>
            <div className="space-y-5 text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
              <p>
                Starvia began with a simple observation: AI is genuinely good at explaining things,
                but a general-purpose chatbot is not a study tool. It does not know which class you
                are in, it does not test you, it does not remember what you got wrong last week, and
                it has no idea what your board exam actually asks.
              </p>
              <p>
                So we built the parts that were missing. A tutor engine that is told your class,
                board, subject and learning level before it answers. A quiz generator that hides the
                answers until you have committed to your own. An exam planner that works backwards
                from the days you have left. A progress view that surfaces weak topics instead of
                burying them in a dashboard.
              </p>
              <p>
                And we built it to be affordable. Every AI call is metered on the server, identical
                tutorials are cached rather than regenerated, and prompts are kept lean. Those
                engineering choices are what let us keep Starvia within reach of a student in India
                rather than pricing it like enterprise software.
              </p>
              <p>
                Starvia supports {BOARDS.join(", ")} across {CLASS_LEVELS[0]} to{" "}
                {CLASS_LEVELS[CLASS_LEVELS.length - 1]}. It is designed mobile-first, because most
                students study on a phone. And it is designed to be honest — when the AI is unsure,
                it will tell you, and it will always encourage you to understand rather than to copy.
              </p>
            </div>
          </Reveal>

          <div className="mt-14 grid gap-4 sm:grid-cols-2">
            {PRINCIPLES.map((principle, index) => (
              <Reveal key={principle.title} delay={index * 40}>
                <Card className="h-full">
                  <CardContent className="pt-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-muted/50">
                      <principle.icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 text-sm font-semibold">{principle.title}</h3>
                    <p className="mt-1.5 text-sm text-muted-foreground text-pretty">
                      {principle.body}
                    </p>
                  </CardContent>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-muted/20 py-16 sm:py-20">
        <div className="mx-auto w-full max-w-3xl px-4 text-center sm:px-6">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5" />
              Meet the founder
            </span>
            <h2 className="mt-6 text-2xl font-semibold tracking-tight sm:text-3xl">
              {siteConfig.founder}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-pretty text-sm text-muted-foreground sm:text-base">
              Starvia is built and maintained by {siteConfig.founder}. If you have feedback, find a
              bug, or want a feature that would help your studies, reach out — student feedback is
              what shapes the roadmap.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild>
                <a href={siteConfig.instagramUrl} target="_blank" rel="noopener noreferrer">
                  {siteConfig.instagram}
                </a>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/contact">
                  Get in touch
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}

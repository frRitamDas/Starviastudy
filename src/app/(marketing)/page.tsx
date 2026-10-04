import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  GraduationCap,
  Layers,
  ListChecks,
  MessagesSquare,
  ScanSearch,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SectionHeading } from "@/components/shared/section-heading";
import { TutorDemo } from "@/components/marketing/tutor-demo";
import { PricingCards } from "@/components/marketing/pricing-cards";
import { FaqList } from "@/components/marketing/faq-list";
import { Reveal } from "@/components/marketing/reveal";
import { FAQS } from "@/lib/faq";
import { BOARDS, CLASS_LEVELS } from "@/lib/education";
import { siteConfig } from "@/lib/site";

export const metadata = {};

const FEATURES = [
  {
    icon: MessagesSquare,
    title: "AI Tutor",
    description:
      "A patient tutor that explains concepts at your class level, works through problems step by step, and never just hands over an answer.",
    href: "/tutor",
  },
  {
    icon: BookOpen,
    title: "AI Tutorials",
    description:
      "Turn any chapter into a structured lesson: objectives, sections, worked examples, key terms, exam tips and practice questions.",
    href: "/tutorials",
  },
  {
    icon: ListChecks,
    title: "AI Quiz",
    description:
      "Generate MCQs, true/false and short-answer tests on any topic. Answers stay hidden until you submit, then every mistake is explained.",
    href: "/quiz",
  },
  {
    icon: ScanSearch,
    title: "Question Solver",
    description:
      "Type, paste or photograph a question. Get the concept, the working, the final answer and a similar question to practise.",
    href: "/solve",
  },
  {
    icon: GraduationCap,
    title: "Exam Preparation",
    description:
      "A day-by-day revision plan for your board and class, with important topics, mock tests and weak-area recommendations.",
    href: "/exam-prep",
  },
  {
    icon: TrendingUp,
    title: "Progress Tracking",
    description:
      "See tutorials completed, quiz scores, topics mastered and study streaks — so you always know what to revise next.",
    href: "/progress",
  },
  {
    icon: Layers,
    title: "Flashcards",
    description:
      "Generate a deck for any topic, then revise with a simple known / unknown loop that focuses on what you haven't learnt yet.",
    href: "/flashcards",
  },
  {
    icon: Target,
    title: "Streaks and XP",
    description:
      "Lightweight motivation that respects you: a daily streak, XP and levels, and achievement badges for real milestones.",
    href: "/progress",
  },
];

export default function HomePage() {
  return (
    <>
      {/* ---------------------------------------------------------------- Hero */}
      <section className="relative overflow-hidden bg-grid">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background via-background/60 to-background"
        />
        <div className="relative mx-auto grid w-full max-w-6xl gap-12 px-4 pb-16 pt-16 sm:px-6 sm:pb-24 sm:pt-24 lg:grid-cols-2 lg:items-center lg:gap-16">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background/80 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" />
              Built for ICSE, CBSE and State Board students
            </span>

            <h1 className="mt-6 text-balance text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              Your AI-powered study companion.
            </h1>

            <p className="mt-5 max-w-xl text-pretty text-base text-muted-foreground sm:text-lg">
              Learn concepts, solve questions, practise smarter and prepare for exams with an AI
              tutor built for students — not a generic chatbot.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" asChild>
                <Link href="/signup">
                  Start Learning
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/features">Explore Features</Link>
              </Button>
            </div>

            <dl className="mt-10 grid max-w-md grid-cols-3 gap-4 border-t border-border pt-6">
              <div>
                <dt className="text-xs text-muted-foreground">Boards</dt>
                <dd className="mt-1 text-sm font-medium">{BOARDS.join(" · ")}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Classes</dt>
                <dd className="mt-1 text-sm font-medium">
                  {CLASS_LEVELS[0].replace("Class ", "")}–{CLASS_LEVELS[CLASS_LEVELS.length - 1].replace("Class ", "")}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Free plan</dt>
                <dd className="mt-1 text-sm font-medium">No card needed</dd>
              </div>
            </dl>
          </div>

          <Reveal className="lg:pl-4">
            <TutorDemo />
          </Reveal>
        </div>
      </section>

      {/* ------------------------------------------------------------ Features */}
      <section className="border-t border-border py-16 sm:py-24" id="features">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <Reveal>
            <SectionHeading
              eyebrow="Everything in one place"
              title="Study tools that actually teach"
              description="Each tool is designed around one goal: helping you understand the topic well enough to answer it yourself in an exam."
            />
          </Reveal>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((feature, index) => (
              <Reveal key={feature.title} delay={index * 40}>
                <Link href={feature.href} className="block h-full">
                  <Card className="card-hover h-full">
                    <CardContent className="pt-6">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-muted/50">
                        <feature.icon className="h-5 w-5" />
                      </div>
                      <h3 className="mt-4 text-sm font-semibold">{feature.title}</h3>
                      <p className="mt-1.5 text-sm text-muted-foreground text-pretty">
                        {feature.description}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- How it works */}
      <section className="border-t border-border bg-muted/20 py-16 sm:py-24">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <Reveal>
            <SectionHeading
              eyebrow="How it works"
              title="Set up once. Study every day."
              description="Starvia learns your class, board and subjects during a short setup, then adapts every answer to that context."
            />
          </Reveal>

          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "Tell us about you",
                body: "Pick your class, board and subjects. It takes under a minute, and you can change it any time.",
              },
              {
                step: "02",
                title: "Learn with your tutor",
                body: "Ask questions, generate tutorials, solve problems and take quizzes — all pitched at your level.",
              },
              {
                step: "03",
                title: "Track and revise",
                body: "Starvia tracks weak topics, keeps your streak alive and builds a revision plan before exams.",
              },
            ].map((item, index) => (
              <Reveal key={item.step} delay={index * 60}>
                <div className="rounded-3xl border border-border bg-card p-6">
                  <span className="font-mono text-xs text-muted-foreground">{item.step}</span>
                  <h3 className="mt-3 text-base font-semibold">{item.title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground text-pretty">{item.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------- Pricing */}
      <section className="border-t border-border py-16 sm:py-24" id="pricing">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <Reveal>
            <SectionHeading
              eyebrow="Simple pricing"
              title="Start free. Upgrade when you need more."
              description="Daily AI limits reset every midnight IST. Cancel any time — you keep access until the end of the period you paid for."
            />
          </Reveal>
          <Reveal className="mt-12" delay={80}>
            <PricingCards />
          </Reveal>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            Prices in Indian rupees, billed monthly via Razorpay.{" "}
            <Link href="/pricing" className="underline underline-offset-4">
              Compare plans in detail
            </Link>
          </p>
        </div>
      </section>

      {/* ------------------------------------------------------------------ FAQ */}
      <section className="border-t border-border bg-muted/20 py-16 sm:py-24">
        <div className="mx-auto w-full max-w-3xl px-4 sm:px-6">
          <Reveal>
            <SectionHeading eyebrow="Questions" title="Frequently asked" />
          </Reveal>
          <Reveal className="mt-10" delay={60}>
            <FaqList items={FAQS.slice(0, 6)} />
          </Reveal>
          <div className="mt-8 text-center">
            <Link href="/faq" className="text-sm underline underline-offset-4">
              Read all questions
            </Link>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------- CTA */}
      <section className="border-t border-border py-16 sm:py-24">
        <div className="mx-auto w-full max-w-3xl px-4 text-center sm:px-6">
          <Reveal>
            <h2 className="text-balance text-2xl font-semibold tracking-tight sm:text-4xl">
              Start learning smarter today.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-pretty text-sm text-muted-foreground sm:text-base">
              Join students across India who use Starvia to understand concepts, not just collect
              answers.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button size="lg" asChild>
                <Link href="/signup">
                  Start Learning
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/pricing">See pricing</Link>
              </Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Free to start · No card required · {siteConfig.founder} · {siteConfig.instagram}
            </p>
          </Reveal>
        </div>
      </section>
    </>
  );
}

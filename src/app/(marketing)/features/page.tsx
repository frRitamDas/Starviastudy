import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Check,
  GraduationCap,
  Layers,
  ListChecks,
  MessagesSquare,
  ScanSearch,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/shared/section-heading";
import { Reveal } from "@/components/marketing/reveal";

export const metadata: Metadata = {
  title: "Features",
  description:
    "AI tutor, tutorials, quizzes, question solver, exam preparation, flashcards and progress tracking — built for ICSE, CBSE and State Board students.",
  alternates: { canonical: "/features" },
};

const SECTIONS = [
  {
    icon: MessagesSquare,
    title: "AI Tutor that teaches",
    body: "Ask anything from your syllabus and get an explanation pitched at your class. Starvia starts with the concept, then the reasoning, then an example — and flags the mistakes students usually make on that topic.",
    points: [
      "Adapts to your class, board, subject and learning level",
      "Markdown, mathematical notation and code blocks",
      "Conversation history you can revisit, rename or delete",
      "Regenerate any answer and rate it helpful or not",
    ],
    href: "/tutor",
  },
  {
    icon: BookOpen,
    title: "AI Tutorials for any chapter",
    body: "Give a chapter or topic and get a complete lesson: learning objectives, structured sections, worked examples, important terms, exam tips, common mistakes, practice questions and a summary.",
    points: [
      "Structured content — never an unformatted wall of text",
      "Reading progress and one-tap mark as complete",
      "Saved to your library so you never regenerate the same lesson",
      "Written for your board's syllabus and exam style",
    ],
    href: "/tutorials",
  },
  {
    icon: ListChecks,
    title: "AI Quiz with real feedback",
    body: "Generate MCQs, true/false and short-answer questions on any topic. Answers and explanations stay hidden until you submit — so it is an actual test, not a reading exercise.",
    points: [
      "Choose subject, chapter, topic, difficulty and question count",
      "Score, correct answers and explanations after submission",
      "Weak areas identified from the questions you missed",
      "Attempts saved so you can see improvement over time",
    ],
    href: "/quiz",
  },
  {
    icon: ScanSearch,
    title: "Question Solver, including photos",
    body: "Type or paste a question, or attach a photo of it. Starvia identifies the subject, explains the concept, works through it step by step, gives the final answer and then sets you a similar question.",
    points: [
      "Image questions supported for typed homework and textbook pages",
      "Never just the final answer — always the working",
      "A similar practice question so the method sticks",
      "Metered separately from text questions to keep it affordable",
    ],
    href: "/solve",
  },
  {
    icon: GraduationCap,
    title: "Exam preparation that plans ahead",
    body: "Choose your board, class, subject, chapter and exam type, and get a day-by-day revision plan with important topics, practice questions, MCQs and a mock test.",
    points: [
      "Revision plan built around the days you actually have",
      "Important topics with weightage and why they matter",
      "Mock test and weak-area recommendations",
      "Track each topic: not started, learning, practiced, mastered",
    ],
    href: "/exam-prep",
  },
  {
    icon: TrendingUp,
    title: "Progress you can act on",
    body: "Every tutorial, quiz, question and review feeds a single progress view — so you always know what is strong and what needs another pass before the exam.",
    points: [
      "Tutorials completed, quizzes taken and questions asked",
      "Quiz score trend and subject-by-subject mastery",
      "Weak topics surfaced automatically after each quiz",
      "Daily streak, XP, levels and achievement badges",
    ],
    href: "/progress",
  },
  {
    icon: Layers,
    title: "Flashcards for quick revision",
    body: "Generate a deck for any topic or write your own cards, then revise with a simple known / unknown loop that keeps the difficult cards coming back.",
    points: [
      "AI-generated decks or manual cards",
      "Flip-to-reveal study mode",
      "Known / unknown tracking per card",
      "Review counts stored so revision is honest",
    ],
    href: "/flashcards",
  },
  {
    icon: Sparkles,
    title: "Built to be affordable",
    body: "Starvia caches generated tutorials and reuses them, keeps prompts short, and enforces every limit on the server. That is how we keep the price low for Indian students.",
    points: [
      "Database-backed daily limits, never trusted from the browser",
      "Identical tutorials are served from cache, not regenerated",
      "Per-plan allowances you can see at any time",
      "Structured JSON responses instead of wasteful free text",
    ],
    href: "/pricing",
  },
];

export default function FeaturesPage() {
  return (
    <>
      <section className="border-b border-border bg-grid">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <Reveal>
            <SectionHeading
              eyebrow="Features"
              title="A complete study system, not a chat box"
              description="Starvia combines an AI tutor, structured lessons, testing, revision planning and progress tracking into one place — designed for how Indian school students actually study."
            />
          </Reveal>
          <Reveal className="mt-10 flex justify-center" delay={60}>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild>
                <Link href="/signup">
                  Start Learning
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

      <section className="py-16 sm:py-24">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-16 px-4 sm:px-6">
          {SECTIONS.map((section, index) => (
            <Reveal key={section.title} delay={index * 20}>
              <div className="grid gap-6 md:grid-cols-[auto_1fr] md:gap-10">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-muted/50">
                  <section.icon className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
                    {section.title}
                  </h2>
                  <p className="mt-3 text-pretty text-sm text-muted-foreground sm:text-base">
                    {section.body}
                  </p>
                  <ul className="mt-5 grid gap-2.5 sm:grid-cols-2">
                    {section.points.map((point) => (
                      <li key={point} className="flex gap-2.5 text-sm">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="text-pretty">{point}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={section.href}
                    className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium underline underline-offset-4"
                  >
                    Open {section.title.split(" ").slice(0, 2).join(" ")}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="border-t border-border py-16 text-center sm:py-24">
        <div className="mx-auto w-full max-w-3xl px-4 sm:px-6">
          <Reveal>
            <h2 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
              Try everything on the free plan
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-pretty text-sm text-muted-foreground">
              Every feature is available on the free plan with daily limits. Upgrade only when you
              need more.
            </p>
            <Button size="lg" className="mt-8" asChild>
              <Link href="/signup">
                Create your account
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </Reveal>
        </div>
      </section>
    </>
  );
}

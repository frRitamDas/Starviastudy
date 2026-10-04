"use client";

import * as React from "react";
import {
  AlertTriangle,
  BookMarked,
  Check,
  ChevronDown,
  Lightbulb,
  ListChecks,
  Target,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Markdown } from "@/components/shared/markdown";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api/client";
import type { TutorialContent } from "@/types/content";

/**
 * Tutorial reader.
 *
 * A progress bar tracks how far down the lesson the student has scrolled, and
 * completion is saved server-side so it survives a refresh. Sections collapse
 * so a long lesson stays navigable on a phone.
 */
export function TutorialViewer({
  id,
  content,
  initialComplete,
}: {
  id: string;
  content: TutorialContent;
  initialComplete: boolean;
}) {
  const [complete, setComplete] = React.useState(initialComplete);
  const [progress, setProgress] = React.useState(0);
  const [saving, setSaving] = React.useState(false);
  const [openSections, setOpenSections] = React.useState<number[]>(
    content.sections.map((_, index) => index),
  );

  React.useEffect(() => {
    function onScroll() {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(scrollable > 0 ? Math.min((window.scrollY / scrollable) * 100, 100) : 0);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function toggleSection(index: number) {
    setOpenSections((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index],
    );
  }

  async function markComplete() {
    setSaving(true);
    try {
      await apiFetch(`/api/ai/tutorial/${id}`, {
        method: "PATCH",
        json: { isComplete: true },
      });
      setComplete(true);
      toast.success("Marked as complete. Nice work.");
    } catch {
      toast.error("We couldn't save your progress. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      {/* Reading progress */}
      <div className="sticky top-14 z-20 -mx-4 mb-6 border-b border-border bg-background/95 px-4 py-2 backdrop-blur sm:top-16 sm:-mx-6 sm:px-6">
        <div className="flex items-center gap-3">
          <Progress value={progress} className="h-1 flex-1" />
          <span className="w-9 text-right text-xs tabular-nums text-muted-foreground">
            {Math.round(progress)}%
          </span>
        </div>
      </div>

      <article className="mx-auto max-w-3xl">
        <header className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
            {content.title}
          </h1>
          {complete ? (
            <Badge variant="success" className="mt-3">
              <Check className="mr-1 h-3 w-3" />
              Completed
            </Badge>
          ) : null}
        </header>

        {content.learningObjectives?.length ? (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Target className="h-4 w-4" />
                What you&apos;ll learn
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="flex flex-col gap-2">
                {content.learningObjectives.map((objective, index) => (
                  <li key={index} className="flex gap-2.5 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="text-pretty">{objective}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ) : null}

        {content.introduction ? (
          <section className="mb-8">
            <Markdown>{content.introduction}</Markdown>
          </section>
        ) : null}

        {content.sections?.length ? (
          <section className="mb-8 flex flex-col gap-3">
            {content.sections.map((section, index) => {
              const open = openSections.includes(index);
              return (
                <div key={index} className="overflow-hidden rounded-2xl border border-border bg-card">
                  <button
                    type="button"
                    onClick={() => toggleSection(index)}
                    aria-expanded={open}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted/40"
                  >
                    <span className="text-sm font-semibold">
                      {index + 1}. {section.heading}
                    </span>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                        open && "rotate-180",
                      )}
                    />
                  </button>
                  {open ? (
                    <div className="border-t border-border px-4 py-4">
                      <Markdown>{section.content}</Markdown>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </section>
        ) : null}

        {content.examples?.length ? (
          <section className="mb-8">
            <h2 className="mb-3 text-base font-semibold">Worked examples</h2>
            <div className="flex flex-col gap-3">
              {content.examples.map((example, index) => (
                <Card key={index}>
                  <CardContent className="pt-5">
                    <p className="text-sm font-medium text-pretty">{example.question}</p>
                    {example.solution ? (
                      <div className="mt-3 rounded-xl border border-border bg-muted/40 p-3">
                        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Solution
                        </p>
                        <Markdown>{example.solution}</Markdown>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        ) : null}

        {content.importantTerms?.length ? (
          <section className="mb-8">
            <h2 className="mb-3 flex items-center gap-2 text-base font-semibold">
              <BookMarked className="h-4 w-4" />
              Important terms
            </h2>
            <dl className="divide-y divide-border overflow-hidden rounded-2xl border border-border">
              {content.importantTerms.map((item, index) => (
                <div key={index} className="grid gap-1 p-4 sm:grid-cols-[10rem_1fr] sm:gap-4">
                  <dt className="text-sm font-medium">{item.term}</dt>
                  <dd className="text-sm text-muted-foreground text-pretty">{item.definition}</dd>
                </div>
              ))}
            </dl>
          </section>
        ) : null}

        <div className="mb-8 grid gap-4 sm:grid-cols-2">
          {content.examTips?.length ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Lightbulb className="h-4 w-4" />
                  Exam tips
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="flex flex-col gap-2">
                  {content.examTips.map((tip, index) => (
                    <li key={index} className="flex gap-2 text-sm">
                      <span className="text-muted-foreground">•</span>
                      <span className="text-pretty">{tip}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : null}

          {content.commonMistakes?.length ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <AlertTriangle className="h-4 w-4" />
                  Common mistakes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="flex flex-col gap-2">
                  {content.commonMistakes.map((mistake, index) => (
                    <li key={index} className="flex gap-2 text-sm">
                      <span className="text-muted-foreground">•</span>
                      <span className="text-pretty">{mistake}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : null}
        </div>

        {content.practiceQuestions?.length ? (
          <section className="mb-8">
            <h2 className="mb-3 flex items-center gap-2 text-base font-semibold">
              <ListChecks className="h-4 w-4" />
              Practice
            </h2>
            <div className="flex flex-col gap-3">
              {content.practiceQuestions.map((question, index) => (
                <PracticeCard key={index} index={index} question={question} />
              ))}
            </div>
          </section>
        ) : null}

        {content.summary ? (
          <section className="mb-8 rounded-2xl border border-border bg-muted/30 p-5">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Summary
            </h2>
            <Markdown>{content.summary}</Markdown>
          </section>
        ) : null}

        <div className="flex flex-col items-center gap-3 border-t border-border pt-8 pb-4">
          {complete ? (
            <p className="text-sm text-muted-foreground">You&apos;ve completed this tutorial.</p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">Finished reading?</p>
              <Button onClick={markComplete} loading={saving} size="lg">
                <Check className="h-4 w-4" />
                Mark as complete
              </Button>
            </>
          )}
        </div>
      </article>
    </div>
  );
}

function PracticeCard({
  index,
  question,
}: {
  index: number;
  question: { question: string; answer?: string; hint?: string };
}) {
  const [revealed, setRevealed] = React.useState(false);

  return (
    <Card>
      <CardContent className="pt-5">
        <p className="text-sm font-medium text-pretty">
          <span className="mr-2 text-muted-foreground">Q{index + 1}.</span>
          {question.question}
        </p>
        {question.hint ? (
          <p className="mt-2 text-xs text-muted-foreground">Hint: {question.hint}</p>
        ) : null}
        {question.answer ? (
          revealed ? (
            <div className="mt-3 rounded-xl border border-border bg-muted/40 p-3">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Answer
              </p>
              <Markdown>{question.answer}</Markdown>
            </div>
          ) : (
            <Button variant="outline" size="sm" className="mt-3" onClick={() => setRevealed(true)}>
              Show answer
            </Button>
          )
        ) : null}
      </CardContent>
    </Card>
  );
}

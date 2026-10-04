"use client";

import * as React from "react";
import Link from "next/link";
import { Check, RotateCcw, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Markdown } from "@/components/shared/markdown";
import { cn } from "@/lib/utils";
import { apiFetch, ApiClientError } from "@/lib/api/client";
import { useApp } from "@/components/providers/app-provider";
import type { PublicQuizQuestion } from "@/types/content";

interface GradedQuestion {
  questionId: string;
  question: string;
  type: string;
  options: string[] | null;
  given: string;
  correctAnswer: string;
  explanation: string;
  isCorrect: boolean;
}

interface QuizResult {
  score: number;
  total: number;
  percentage: number;
  results: GradedQuestion[];
  weakTopics: string[];
  xp: number;
  unlocked: { key: string; title: string }[];
}

/**
 * Quiz runner.
 *
 * Questions are answered one at a time with a progress bar, then graded by the
 * server. Explanations are only shown after submission — nothing is revealed
 * early, so the quiz is actually a test.
 */
export function QuizRunner({
  quizId,
  questions,
}: {
  quizId: string;
  questions: PublicQuizQuestion[];
}) {
  const { refresh, applyLocalUsage } = useApp();
  const [index, setIndex] = React.useState(0);
  const [answers, setAnswers] = React.useState<Record<string, string>>({});
  const [result, setResult] = React.useState<QuizResult | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const startedAt = React.useRef(Date.now());

  const question = questions[index];
  const isLast = index === questions.length - 1;
  const answeredCount = Object.values(answers).filter((a) => a.trim()).length;

  function setAnswer(value: string) {
    setAnswers((prev) => ({ ...prev, [question.id]: value }));
  }

  async function submit() {
    if (answeredCount < questions.length) {
      toast.error("Answer every question before submitting.");
      return;
    }
    setSubmitting(true);
    try {
      const data = await apiFetch<QuizResult>(`/api/ai/quiz/${quizId}`, {
        method: "POST",
        json: {
          answers: questions.map((q) => ({ questionId: q.id, answer: answers[q.id] ?? "" })),
          durationSeconds: Math.round((Date.now() - startedAt.current) / 1000),
        },
      });
      setResult(data);
      applyLocalUsage("quiz", 0); // generation already counted; grading is free
      void refresh();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      toast.error(
        error instanceof ApiClientError ? error.message : "Something went wrong. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return <QuizResults result={result} onRetake={() => {
      setResult(null);
      setAnswers({});
      setIndex(0);
      startedAt.current = Date.now();
    }} />;
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Progress value={((index + 1) / questions.length) * 100} className="h-1 flex-1" />
        <span className="text-xs tabular-nums text-muted-foreground">
          {index + 1} / {questions.length}
        </span>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="mb-4 flex items-center gap-2">
            <Badge variant="muted">
              {question.type === "mcq"
                ? "Multiple choice"
                : question.type === "true_false"
                  ? "True or false"
                  : "Short answer"}
            </Badge>
            {question.topic ? <Badge variant="muted">{question.topic}</Badge> : null}
          </div>

          <p className="text-base font-medium text-pretty">{question.question}</p>

          <div className="mt-5 space-y-2">
            {question.options?.length ? (
              question.options.map((option, i) => {
                const selected = answers[question.id] === option;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setAnswer(option)}
                    aria-pressed={selected}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl border p-3.5 text-left text-sm transition-colors",
                      selected ? "border-foreground bg-muted/60" : "border-border hover:bg-muted/40",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs",
                        selected ? "border-foreground bg-foreground text-background" : "border-border",
                      )}
                    >
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="text-pretty">{option}</span>
                  </button>
                );
              })
            ) : (
              <Input
                value={answers[question.id] ?? ""}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Type your answer"
                aria-label="Your answer"
                maxLength={400}
              />
            )}
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 flex items-center justify-between gap-3">
        <Button
          variant="ghost"
          onClick={() => setIndex((i) => Math.max(i - 1, 0))}
          disabled={index === 0}
        >
          Previous
        </Button>

        {isLast ? (
          <Button onClick={submit} loading={submitting}>
            {submitting ? "Checking…" : "Submit quiz"}
          </Button>
        ) : (
          <Button onClick={() => setIndex((i) => Math.min(i + 1, questions.length - 1))}>
            Next
          </Button>
        )}
      </div>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        {answeredCount} of {questions.length} answered
      </p>
    </div>
  );
}

function QuizResults({
  result,
  onRetake,
}: {
  result: QuizResult;
  onRetake: () => void;
}) {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-col items-center gap-4 pt-8 pb-8 text-center">
          <div className="relative flex h-28 w-28 items-center justify-center">
            <svg viewBox="0 0 120 120" className="h-28 w-28 -rotate-90">
              <circle cx="60" cy="60" r="52" className="fill-none stroke-muted" strokeWidth="8" />
              <circle
                cx="60"
                cy="60"
                r="52"
                className="fill-none stroke-foreground transition-[stroke-dashoffset] duration-700"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 52}
                strokeDashoffset={2 * Math.PI * 52 * (1 - result.percentage / 100)}
              />
            </svg>
            <span className="absolute text-2xl font-semibold tabular-nums">
              {result.percentage}%
            </span>
          </div>
          <div>
            <h2 className="text-lg font-semibold">
              {result.score} out of {result.total} correct
            </h2>
            <p className="mt-1 text-sm text-muted-foreground text-pretty">
              {result.percentage >= 80
                ? "Excellent — you've got this topic down."
                : result.percentage >= 50
                  ? "Good effort. Review the explanations below to close the gaps."
                  : "Worth another pass. Read the explanations, then try again."}
            </p>
          </div>
          {result.xp > 0 ? (
            <Badge variant="success">+{result.xp} XP earned</Badge>
          ) : null}
          <div className="flex flex-wrap justify-center gap-2 pt-1">
            <Button variant="outline" onClick={onRetake}>
              <RotateCcw className="h-4 w-4" />
              Try again
            </Button>
            <Button asChild>
              <Link href="/tutor">Ask the tutor about mistakes</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {result.unlocked.length ? (
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm font-medium">New achievements</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {result.unlocked.map((a) => (
                <Badge key={a.key} variant="success">
                  {a.title}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {result.weakTopics.length ? (
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm font-medium">Revise these next</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {result.weakTopics.map((topic) => (
                <Link
                  key={topic}
                  href={`/tutor?topic=${encodeURIComponent(topic)}`}
                  className="rounded-full border border-border px-3 py-1 text-xs transition-colors hover:bg-muted"
                >
                  {topic}
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div>
        <h2 className="mb-3 text-sm font-semibold">Answer review</h2>
        <div className="flex flex-col gap-3">
          {result.results.map((item, i) => (
            <Card key={item.questionId}>
              <CardContent className="pt-5">
                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                      item.isCorrect
                        ? "bg-success/15 text-success"
                        : "bg-destructive/10 text-destructive",
                    )}
                  >
                    {item.isCorrect ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-pretty">
                      <span className="mr-2 text-muted-foreground">Q{i + 1}.</span>
                      {item.question}
                    </p>

                    <div className="mt-3 space-y-1.5 text-sm">
                      <p className={cn(item.isCorrect ? "text-success" : "text-destructive")}>
                        Your answer: {item.given || "—"}
                      </p>
                      {!item.isCorrect ? (
                        <p className="text-success">Correct answer: {item.correctAnswer}</p>
                      ) : null}
                    </div>

                    {item.explanation ? (
                      <div className="mt-3 rounded-xl border border-border bg-muted/40 p-3">
                        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Why
                        </p>
                        <Markdown>{item.explanation}</Markdown>
                      </div>
                    ) : null}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="flex justify-center pb-4">
        <Button variant="outline" asChild>
          <Link href="/quiz">
            <RotateCcw className="h-4 w-4" />
            Create another quiz
          </Link>
        </Button>
      </div>
    </div>
  );
}

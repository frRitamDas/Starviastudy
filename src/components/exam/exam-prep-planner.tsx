"use client";

import * as React from "react";
import Link from "next/link";
import { CalendarDays, GraduationCap, Target } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Markdown } from "@/components/shared/markdown";
import { apiFetch, ApiClientError } from "@/lib/api/client";
import { useApp } from "@/components/providers/app-provider";
import { LimitDialog } from "@/components/billing/limit-dialog";
import { BOARDS, CLASS_LEVELS, EXAM_TYPES } from "@/lib/education";
import type { ExamPlanContent } from "@/types/content";

/** Exam plan generator and renderer. */
export function ExamPrepPlanner({
  subjects,
  defaults,
}: {
  subjects: string[];
  defaults: { classLevel: string; board: string; examTarget: string };
}) {
  const { refresh, applyLocalUsage, usage } = useApp();
  const [classLevel, setClassLevel] = React.useState(defaults.classLevel);
  const [board, setBoard] = React.useState(defaults.board);
  const [subject, setSubject] = React.useState(subjects[0] ?? "Mathematics");
  const [chapter, setChapter] = React.useState("");
  const [examType, setExamType] = React.useState(defaults.examTarget || EXAM_TYPES[3]);
  const [days, setDays] = React.useState(14);
  const [plan, setPlan] = React.useState<ExamPlanContent | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [limit, setLimit] = React.useState<number | null>(null);

  const remaining = usage?.remaining.exam_prep;
  const exhausted = remaining !== null && remaining !== undefined && remaining <= 0;

  async function generate(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      const data = await apiFetch<{ plan: ExamPlanContent }>("/api/ai/exam-prep", {
        method: "POST",
        json: {
          classLevel,
          board,
          subject,
          chapter: chapter.trim() || null,
          examType,
          days,
        },
      });
      setPlan(data.plan);
      applyLocalUsage("exam_prep", 1);
      void refresh();
      toast.success("Your revision plan is ready.");
    } catch (error) {
      if (error instanceof ApiClientError && error.isLimitReached) {
        setLimit(error.details?.limit ?? 2);
      } else {
        toast.error(
          error instanceof ApiClientError ? error.message : "Something went wrong. Please try again.",
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Build a revision plan</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={generate} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="ep-class">Class</Label>
                <select
                  id="ep-class"
                  value={classLevel}
                  onChange={(e) => setClassLevel(e.target.value)}
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
                >
                  {CLASS_LEVELS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ep-board">Board</Label>
                <select
                  id="ep-board"
                  value={board}
                  onChange={(e) => setBoard(e.target.value)}
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
                >
                  {BOARDS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ep-subject">Subject</Label>
                <select
                  id="ep-subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
                >
                  {(subjects.length ? subjects : ["Mathematics", "Science", "English"]).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ep-exam">Exam type</Label>
                <select
                  id="ep-exam"
                  value={examType}
                  onChange={(e) => setExamType(e.target.value)}
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
                >
                  {EXAM_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ep-days">Days available</Label>
                <Input
                  id="ep-days"
                  type="number"
                  min={1}
                  max={60}
                  value={days}
                  onChange={(e) => setDays(Number(e.target.value))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ep-chapter">
                  Chapter <span className="text-muted-foreground">(optional)</span>
                </Label>
                <Input
                  id="ep-chapter"
                  value={chapter}
                  onChange={(e) => setChapter(e.target.value)}
                  placeholder="Whole subject if left blank"
                  maxLength={160}
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                {remaining === null || remaining === undefined
                  ? "Unlimited plans"
                  : `${remaining} plan${remaining === 1 ? "" : "s"} left today`}
              </p>
              <Button type="submit" loading={loading} disabled={exhausted}>
                <GraduationCap className="h-4 w-4" />
                {loading ? "Planning…" : "Generate plan"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {loading ? (
        <Card>
          <CardContent className="space-y-3 pt-6">
            <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
            <div className="h-20 w-full animate-pulse rounded bg-muted" />
            <div className="h-20 w-full animate-pulse rounded bg-muted" />
          </CardContent>
        </Card>
      ) : null}

      {plan ? <ExamPlanView plan={plan} subject={subject} /> : null}

      <LimitDialog
        open={limit !== null}
        onOpenChange={(open) => !open && setLimit(null)}
        featureLabel="exam plans"
        limit={limit ?? 2}
      />
    </div>
  );
}

function ExamPlanView({ plan, subject }: { plan: ExamPlanContent; subject: string }) {
  const priorityVariant = { high: "destructive", medium: "warning", low: "muted" } as const;

  return (
    <div className="space-y-6 animate-fade-up">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            {subject} revision plan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {plan.overview ? <Markdown>{plan.overview}</Markdown> : null}

          {plan.importantTopics?.length ? (
            <div>
              <h3 className="mb-2 text-sm font-semibold">Important topics</h3>
              <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border">
                {plan.importantTopics.map((topic, i) => (
                  <li key={i} className="flex items-start justify-between gap-3 p-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{topic.topic}</p>
                      {topic.why ? (
                        <p className="mt-0.5 text-xs text-muted-foreground text-pretty">
                          {topic.why}
                        </p>
                      ) : null}
                    </div>
                    <Badge variant={priorityVariant[topic.priority] ?? "muted"}>
                      {topic.priority}
                    </Badge>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {plan.revisionPlan?.length ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              Day-by-day plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="relative flex flex-col gap-4 border-l border-border pl-5">
              {plan.revisionPlan.map((day, i) => (
                <li key={i} className="relative">
                  <span className="absolute -left-[1.6rem] top-1 flex h-3 w-3 rounded-full border-2 border-background bg-foreground" />
                  <p className="text-sm font-medium">
                    Day {day.day} · {day.focus}
                  </p>
                  {day.tasks?.length ? (
                    <ul className="mt-1.5 flex flex-col gap-1">
                      {day.tasks.map((task, j) => (
                        <li key={j} className="flex gap-2 text-sm text-muted-foreground">
                          <span>•</span>
                          <span className="text-pretty">{task}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {plan.practiceQuestions?.length ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Practice questions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {plan.practiceQuestions.map((q, i) => (
                <details key={i} className="rounded-xl border border-border p-3">
                  <summary className="cursor-pointer text-sm font-medium">
                    Q{i + 1}. {q.question}
                  </summary>
                  <div className="mt-2 text-sm text-muted-foreground">
                    <Markdown>{q.answer}</Markdown>
                  </div>
                </details>
              ))}
            </CardContent>
          </Card>
        ) : null}

        {plan.mcqs?.length ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Quick MCQs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {plan.mcqs.map((q, i) => (
                <details key={i} className="rounded-xl border border-border p-3">
                  <summary className="cursor-pointer text-sm font-medium">
                    Q{i + 1}. {q.question}
                  </summary>
                  <ul className="mt-2 flex flex-col gap-1 text-sm">
                    {q.options?.map((option, j) => (
                      <li
                        key={j}
                        className={
                          option === q.correctAnswer ? "font-medium text-success" : "text-muted-foreground"
                        }
                      >
                        {String.fromCharCode(65 + j)}. {option}
                      </li>
                    ))}
                  </ul>
                  {q.explanation ? (
                    <p className="mt-2 text-xs text-muted-foreground text-pretty">{q.explanation}</p>
                  ) : null}
                </details>
              ))}
            </CardContent>
          </Card>
        ) : null}
      </div>

      {plan.weakAreaRecommendations?.length ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Where to focus</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-2">
              {plan.weakAreaRecommendations.map((item, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <span className="text-muted-foreground">•</span>
                  <span className="text-pretty">{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      {plan.examTips?.length ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Exam tips</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-2">
              {plan.examTips.map((tip, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <span className="text-muted-foreground">•</span>
                  <span className="text-pretty">{tip}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      <div className="flex justify-center">
        <Button variant="outline" asChild>
          <Link href="/quiz">
            <GraduationCap className="h-4 w-4" />
            Test yourself on this
          </Link>
        </Button>
      </div>
    </div>
  );
}

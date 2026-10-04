"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiFetch, ApiClientError } from "@/lib/api/client";
import { useApp } from "@/components/providers/app-provider";
import { LimitDialog } from "@/components/billing/limit-dialog";
import { BOARDS, CLASS_LEVELS, DIFFICULTIES } from "@/lib/education";

/** Tutorial request form. Validates locally, enforces limits on the server. */
export function TutorialGenerator({
  subjects,
  defaults,
}: {
  subjects: string[];
  defaults: { classLevel: string; board: string };
}) {
  const router = useRouter();
  const { refresh, applyLocalUsage, usage } = useApp();

  const [classLevel, setClassLevel] = React.useState(defaults.classLevel);
  const [board, setBoard] = React.useState(defaults.board);
  const [subject, setSubject] = React.useState(subjects[0] ?? "Science");
  const [chapter, setChapter] = React.useState("");
  const [topic, setTopic] = React.useState("");
  const [difficulty, setDifficulty] = React.useState("medium");
  const [loading, setLoading] = React.useState(false);
  const [limit, setLimit] = React.useState<number | null>(null);

  const remaining = usage?.remaining.tutorial;
  const exhausted = remaining !== null && remaining !== undefined && remaining <= 0;

  async function generate(event: React.FormEvent) {
    event.preventDefault();
    if (topic.trim().length < 2) {
      toast.error("Describe the topic you want to learn.");
      return;
    }
    setLoading(true);
    try {
      const data = await apiFetch<{ id: string }>("/api/ai/tutorial", {
        method: "POST",
        json: {
          classLevel,
          board,
          subject,
          chapter: chapter.trim() || null,
          topic: topic.trim(),
          difficulty,
        },
      });
      applyLocalUsage("tutorial", 1);
      void refresh();
      toast.success("Tutorial ready.");
      router.push(`/tutorials/${data.id}`);
    } catch (error) {
      if (error instanceof ApiClientError && error.isLimitReached) {
        setLimit(error.details?.limit ?? usage?.limits.tutorial ?? 2);
      } else {
        toast.error(
          error instanceof ApiClientError ? error.message : "Something went wrong. Please try again.",
        );
      }
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate a tutorial</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={generate} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="classLevel">Class</Label>
              <Select value={classLevel} onValueChange={setClassLevel}>
                <SelectTrigger id="classLevel">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CLASS_LEVELS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="board">Board</Label>
              <Select value={board} onValueChange={setBoard}>
                <SelectTrigger id="board">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BOARDS.map((b) => (
                    <SelectItem key={b} value={b}>
                      {b}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger id="subject">
                  <SelectValue placeholder="Choose a subject" />
                </SelectTrigger>
                <SelectContent>
                  {(subjects.length ? subjects : ["Science", "Mathematics", "English"]).map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty</Label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger id="difficulty">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DIFFICULTIES.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d[0].toUpperCase() + d.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="chapter">
              Chapter <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="chapter"
              value={chapter}
              onChange={(e) => setChapter(e.target.value)}
              placeholder="e.g. Chapter 6 — Life Processes"
              maxLength={160}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="topic">Topic</Label>
            <Input
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Photosynthesis"
              maxLength={200}
              required
            />
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            <p className="text-xs text-muted-foreground">
              {remaining === null || remaining === undefined
                ? "Unlimited tutorials"
                : `${remaining} tutorial${remaining === 1 ? "" : "s"} left today`}
            </p>
            <Button type="submit" loading={loading} disabled={exhausted}>
              <Sparkles className="h-4 w-4" />
              {loading ? "Generating…" : "Generate Tutorial"}
            </Button>
          </div>
        </form>
      </CardContent>

      <LimitDialog
        open={limit !== null}
        onOpenChange={(open) => !open && setLimit(null)}
        featureLabel="AI tutorials"
        limit={limit ?? 2}
      />
    </Card>
  );
}

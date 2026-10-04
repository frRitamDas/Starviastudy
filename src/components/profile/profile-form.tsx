"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch, ApiClientError } from "@/lib/api/client";
import { useApp } from "@/components/providers/app-provider";
import {
  BOARDS,
  CLASS_LEVELS,
  EXAM_TYPES,
  LEARNING_LEVELS,
  subjectsForBoard,
} from "@/lib/education";
import { cn } from "@/lib/utils";

/** Edit the student's academic profile. */
export function ProfileForm({
  initial,
}: {
  initial: {
    fullName: string;
    classLevel: string;
    board: string;
    subjects: string[];
    learningLevel: string;
    examTarget: string;
  };
}) {
  const { refresh } = useApp();
  const [draft, setDraft] = React.useState(initial);
  const [saving, setSaving] = React.useState(false);

  const subjects = draft.board ? subjectsForBoard(draft.board) : [];

  function update<K extends keyof typeof draft>(key: K, value: (typeof draft)[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  function toggleSubject(subject: string) {
    setDraft((prev) => ({
      ...prev,
      subjects: prev.subjects.includes(subject)
        ? prev.subjects.filter((s) => s !== subject)
        : [...prev.subjects, subject],
    }));
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!draft.fullName.trim()) {
      toast.error("Please add your name.");
      return;
    }
    if (!draft.subjects.length) {
      toast.error("Pick at least one subject.");
      return;
    }
    setSaving(true);
    try {
      await apiFetch("/api/profile", {
        method: "PATCH",
        json: {
          fullName: draft.fullName.trim(),
          classLevel: draft.classLevel,
          board: draft.board,
          subjects: draft.subjects,
          learningLevel: draft.learningLevel,
          examTarget: draft.examTarget.trim() || null,
        },
      });
      await refresh();
      toast.success("Profile updated.");
    } catch (error) {
      toast.error(
        error instanceof ApiClientError ? error.message : "Something went wrong. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your details</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={save} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="p-name">Full name</Label>
              <Input
                id="p-name"
                value={draft.fullName}
                onChange={(e) => update("fullName", e.target.value)}
                maxLength={120}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-exam">Exam goal (optional)</Label>
              <Input
                id="p-exam"
                value={draft.examTarget}
                onChange={(e) => update("examTarget", e.target.value)}
                placeholder="e.g. Board Exam 2027"
                maxLength={80}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Board</Label>
            <div className="flex flex-wrap gap-2">
              {BOARDS.map((board) => (
                <button
                  key={board}
                  type="button"
                  onClick={() => {
                    update("board", board);
                    update("subjects", []);
                  }}
                  className={cn(
                    "rounded-full border px-3.5 py-1.5 text-sm transition-colors",
                    draft.board === board
                      ? "border-foreground bg-foreground text-background"
                      : "border-border hover:bg-muted",
                  )}
                >
                  {board}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Class</Label>
            <div className="flex flex-wrap gap-2">
              {CLASS_LEVELS.map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => update("classLevel", level)}
                  className={cn(
                    "rounded-full border px-3.5 py-1.5 text-sm transition-colors",
                    draft.classLevel === level
                      ? "border-foreground bg-foreground text-background"
                      : "border-border hover:bg-muted",
                  )}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Subjects</Label>
            <div className="flex flex-wrap gap-2">
              {subjects.map((subject) => {
                const selected = draft.subjects.includes(subject);
                return (
                  <button
                    key={subject}
                    type="button"
                    onClick={() => toggleSubject(subject)}
                    aria-pressed={selected}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm transition-colors",
                      selected
                        ? "border-foreground bg-foreground text-background"
                        : "border-border hover:bg-muted",
                    )}
                  >
                    {selected ? <Check className="h-3.5 w-3.5" /> : null}
                    {subject}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Learning level</Label>
            <div className="grid gap-2 sm:grid-cols-3">
              {LEARNING_LEVELS.map((level) => (
                <button
                  key={level.value}
                  type="button"
                  onClick={() => update("learningLevel", level.value)}
                  className={cn(
                    "rounded-xl border p-3 text-left transition-colors",
                    draft.learningLevel === level.value
                      ? "border-foreground bg-muted/60"
                      : "border-border hover:bg-muted/40",
                  )}
                >
                  <span className="block text-sm font-medium">{level.label}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">{level.hint}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Exam you&apos;re preparing for (optional)</Label>
            <div className="flex flex-wrap gap-2">
              {EXAM_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => update("examTarget", draft.examTarget === type ? "" : type)}
                  className={cn(
                    "rounded-full border px-3.5 py-1.5 text-xs transition-colors",
                    draft.examTarget === type
                      ? "border-foreground bg-foreground text-background"
                      : "border-border hover:bg-muted",
                  )}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" loading={saving}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

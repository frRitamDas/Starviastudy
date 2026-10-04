"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, GraduationCap, Sparkles, Target, User } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Logo } from "@/components/brand/logo";
import { apiFetch, ApiClientError } from "@/lib/api/client";
import {
  BOARDS,
  CLASS_LEVELS,
  EXAM_TYPES,
  LEARNING_LEVELS,
  subjectsForBoard,
} from "@/lib/education";
import { cn } from "@/lib/utils";

interface Draft {
  fullName: string;
  classLevel: string;
  board: string;
  subjects: string[];
  learningLevel: string;
  examTarget: string;
}

const STEPS = [
  { id: "name", title: "Your name", icon: User },
  { id: "class", title: "Class & board", icon: GraduationCap },
  { id: "subjects", title: "Subjects", icon: Sparkles },
  { id: "level", title: "Learning level", icon: Target },
] as const;

/**
 * Onboarding wizard.
 *
 * Built for Indian school students: board first, then the subjects that board
 * actually offers, then how much depth they want. Everything is saved in one
 * call at the end so a half-finished flow never writes a partial profile.
 */
export function OnboardingWizard({ initial }: { initial: Draft }) {
  const router = useRouter();
  const [step, setStep] = React.useState(0);
  const [draft, setDraft] = React.useState<Draft>(initial);
  const [saving, setSaving] = React.useState(false);

  const subjects = draft.board ? subjectsForBoard(draft.board) : [];

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
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

  const canContinue = [
    draft.fullName.trim().length > 0,
    Boolean(draft.classLevel && draft.board),
    draft.subjects.length > 0,
    Boolean(draft.learningLevel),
  ][step];

  async function finish() {
    setSaving(true);
    try {
      await apiFetch("/api/profile", {
        method: "PATCH",
        json: {
          mode: "onboarding",
          fullName: draft.fullName.trim(),
          classLevel: draft.classLevel,
          board: draft.board,
          subjects: draft.subjects,
          learningLevel: draft.learningLevel,
          examTarget: draft.examTarget.trim() || null,
        },
      });
      toast.success("You're all set. Let's start learning.");
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      const message =
        error instanceof ApiClientError ? error.message : "Something went wrong. Please try again.";
      toast.error(message);
      setSaving(false);
    }
  }

  const StepIcon = STEPS[step].icon;

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-2xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <span className="text-xs text-muted-foreground">
            Step {step + 1} of {STEPS.length}
          </span>
        </div>
      </header>

      <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <Progress value={((step + 1) / STEPS.length) * 100} className="mb-8 h-1" />

        <div className="animate-fade-up" key={step}>
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-muted/60">
              <StepIcon className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight sm:text-xl">
                {step === 0 && "What should we call you?"}
                {step === 1 && "Which class and board are you in?"}
                {step === 2 && "Which subjects do you want help with?"}
                {step === 3 && "How should the AI teach you?"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {step === 0 && "We'll use this to personalise your tutor."}
                {step === 1 && "This sets the syllabus and exam style Starvia follows."}
                {step === 2 && "Pick everything you're studying right now."}
                {step === 3 && "You can change all of this later in your profile."}
              </p>
            </div>
          </div>

          {step === 0 ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full name</Label>
                <Input
                  id="fullName"
                  autoFocus
                  value={draft.fullName}
                  onChange={(e) => update("fullName", e.target.value)}
                  placeholder="e.g. Ananya Sharma"
                  maxLength={120}
                  autoComplete="name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="examTarget">
                  Exam goal <span className="text-muted-foreground">(optional)</span>
                </Label>
                <Input
                  id="examTarget"
                  value={draft.examTarget}
                  onChange={(e) => update("examTarget", e.target.value)}
                  placeholder="e.g. Class 10 Board Exam 2027"
                  maxLength={80}
                />
              </div>
            </div>
          ) : null}

          {step === 1 ? (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>Board</Label>
                <div className="grid grid-cols-3 gap-2">
                  {BOARDS.map((board) => (
                    <button
                      key={board}
                      type="button"
                      onClick={() => {
                        update("board", board);
                        update("subjects", []);
                      }}
                      className={cn(
                        "rounded-xl border px-3 py-3 text-sm font-medium transition-colors",
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
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {CLASS_LEVELS.map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => update("classLevel", level)}
                      className={cn(
                        "rounded-xl border px-3 py-2.5 text-sm transition-colors",
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
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-3">
              {!draft.board ? (
                <p className="text-sm text-muted-foreground">
                  Go back and pick your board to see its subjects.
                </p>
              ) : (
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
                          "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm transition-colors",
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
              )}
              <p className="pt-2 text-xs text-muted-foreground">
                {draft.subjects.length} selected
              </p>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-4">
              <div className="grid gap-2">
                {LEARNING_LEVELS.map((level) => (
                  <button
                    key={level.value}
                    type="button"
                    onClick={() => update("learningLevel", level.value)}
                    className={cn(
                      "flex items-start gap-3 rounded-xl border p-4 text-left transition-colors",
                      draft.learningLevel === level.value
                        ? "border-foreground bg-muted/60"
                        : "border-border hover:bg-muted/40",
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                        draft.learningLevel === level.value
                          ? "border-foreground bg-foreground"
                          : "border-border",
                      )}
                    >
                      {draft.learningLevel === level.value ? (
                        <Check className="h-2.5 w-2.5 text-background" />
                      ) : null}
                    </span>
                    <span>
                      <span className="block text-sm font-medium">{level.label}</span>
                      <span className="block text-sm text-muted-foreground">{level.hint}</span>
                    </span>
                  </button>
                ))}
              </div>

              <div className="space-y-2 pt-2">
                <Label htmlFor="examType">Exam you&apos;re preparing for (optional)</Label>
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
            </div>
          ) : null}
        </div>
      </div>

      <footer className="sticky bottom-0 border-t border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <Button
            variant="ghost"
            onClick={() => setStep((s) => Math.max(s - 1, 0))}
            disabled={step === 0 || saving}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep((s) => s + 1)} disabled={!canContinue}>
              Continue
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={finish} disabled={!canContinue || saving} loading={saving}>
              {saving ? "Saving…" : "Finish setup"}
            </Button>
          )}
        </div>
      </footer>
    </div>
  );
}

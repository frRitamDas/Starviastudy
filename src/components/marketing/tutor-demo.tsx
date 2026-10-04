"use client";

import * as React from "react";
import { RotateCcw, Send, Sparkles } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

/**
 * Hero demonstration.
 *
 * A scripted, self-contained animation that shows what a Starvia answer looks
 * like — no API call, no fake network request. It types a student question and
 * then reveals a structured answer, then loops. Respects reduced motion.
 */

const SCRIPT = [
  {
    question: "Why does ice float on water?",
    answer: [
      { type: "h", text: "Short answer" },
      {
        type: "p",
        text: "Ice is less dense than liquid water, so it floats. Most substances get denser when they freeze — water is unusual.",
      },
      { type: "h", text: "Why it happens" },
      { type: "li", text: "Water molecules form a hexagonal lattice when they freeze." },
      { type: "li", text: "The lattice holds molecules slightly further apart than in liquid water." },
      { type: "li", text: "More space for the same mass means lower density." },
      { type: "tip", text: "Exam tip: link density, not weight, to floating." },
    ],
  },
  {
    question: "Solve: 2x + 5 = 17",
    answer: [
      { type: "h", text: "Step by step" },
      { type: "li", text: "Subtract 5 from both sides: 2x = 12" },
      { type: "li", text: "Divide both sides by 2: x = 6" },
      { type: "h", text: "Check" },
      { type: "p", text: "2(6) + 5 = 17 ✓ — always substitute back to confirm." },
      { type: "tip", text: "Practice: solve 3x − 4 = 20 the same way." },
    ],
  },
];

const TYPE_SPEED = 42;
const REVEAL_SPEED = 320;
const HOLD_AFTER = 5200;

export function TutorDemo({ className }: { className?: string }) {
  const [scriptIndex, setScriptIndex] = React.useState(0);
  const [typed, setTyped] = React.useState("");
  const [revealed, setRevealed] = React.useState(0);
  const [phase, setPhase] = React.useState<"typing" | "revealing" | "holding">("typing");
  const reduced = usePrefersReducedMotion();

  const script = SCRIPT[scriptIndex];

  React.useEffect(() => {
    if (reduced) {
      setTyped(script.question);
      setRevealed(script.answer.length);
      setPhase("holding");
      return;
    }

    if (phase === "typing") {
      if (typed.length < script.question.length) {
        const timer = setTimeout(
          () => setTyped(script.question.slice(0, typed.length + 1)),
          TYPE_SPEED,
        );
        return () => clearTimeout(timer);
      }
      const timer = setTimeout(() => setPhase("revealing"), 500);
      return () => clearTimeout(timer);
    }

    if (phase === "revealing") {
      if (revealed < script.answer.length) {
        const timer = setTimeout(() => setRevealed((r) => r + 1), REVEAL_SPEED);
        return () => clearTimeout(timer);
      }
      const timer = setTimeout(() => setPhase("holding"), 300);
      return () => clearTimeout(timer);
    }

    const timer = setTimeout(() => {
      setScriptIndex((i) => (i + 1) % SCRIPT.length);
      setTyped("");
      setRevealed(0);
      setPhase("typing");
    }, HOLD_AFTER);
    return () => clearTimeout(timer);
  }, [phase, typed, revealed, script, reduced]);

  return (
    <div className={cn("w-full", className)}>
      <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-2xl shadow-black/5">
        {/* Window chrome */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <Logo variant="mark" href={null} />
            <span className="text-xs font-medium">AI Tutor</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-muted" />
            <span className="h-2 w-2 rounded-full bg-muted" />
            <span className="h-2 w-2 rounded-full bg-muted" />
          </div>
        </div>

        <div className="space-y-4 p-4 sm:p-5">
          {/* Student message */}
          <div className="flex justify-end">
            <div className="max-w-[85%] rounded-2xl rounded-br-md border border-border bg-muted/60 px-4 py-2.5 text-sm">
              {typed}
              {phase === "typing" ? (
                <span className="ml-0.5 inline-block h-4 w-1.5 animate-blink bg-foreground align-middle" />
              ) : null}
            </div>
          </div>

          {/* Tutor answer */}
          {phase !== "typing" ? (
            <div className="rounded-2xl rounded-bl-md border border-border bg-background px-4 py-3.5">
              <div className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5" />
                Class 9 · CBSE · adapted to your level
              </div>
              <div className="space-y-2.5 text-sm">
                {script.answer.slice(0, revealed).map((block, index) => (
                  <DemoBlock key={index} block={block} />
                ))}
                {phase === "revealing" && revealed < script.answer.length ? (
                  <span className="inline-block h-4 w-1.5 animate-blink bg-foreground align-middle" />
                ) : null}
              </div>
            </div>
          ) : null}

          {/* Composer */}
          <div className="flex items-center gap-2 rounded-2xl border border-border bg-background p-2">
            <span className="flex-1 px-2 text-sm text-muted-foreground">
              Ask your tutor anything…
            </span>
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Send className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>
      </div>

      {!reduced ? (
        <div className="mt-3 flex justify-center">
          <button
            type="button"
            onClick={() => {
              setTyped("");
              setRevealed(0);
              setPhase("typing");
            }}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <RotateCcw className="h-3 w-3" />
            Replay demo
          </button>
        </div>
      ) : null}
    </div>
  );
}

function DemoBlock({ block }: { block: { type: string; text: string } }) {
  if (block.type === "h") {
    return (
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {block.text}
      </p>
    );
  }
  if (block.type === "li") {
    return (
      <p className="flex gap-2">
        <span className="text-muted-foreground">•</span>
        <span>{block.text}</span>
      </p>
    );
  }
  if (block.type === "tip") {
    return (
      <p className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs">{block.text}</p>
    );
  }
  return <p className="text-muted-foreground">{block.text}</p>;
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = React.useState(false);
  React.useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(query.matches);
    const handler = (event: MediaQueryListEvent) => setReduced(event.matches);
    query.addEventListener("change", handler);
    return () => query.removeEventListener("change", handler);
  }, []);
  return reduced;
}

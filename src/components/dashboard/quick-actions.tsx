"use client";

import Link from "next/link";
import { BookOpen, GraduationCap, Layers, ListChecks, MessagesSquare, ScanSearch } from "lucide-react";
import { cn } from "@/lib/utils";

const ACTIONS = [
  { label: "Ask AI", href: "/tutor", icon: MessagesSquare },
  { label: "Create Tutorial", href: "/tutorials", icon: BookOpen },
  { label: "Generate Quiz", href: "/quiz", icon: ListChecks },
  { label: "Solve Question", href: "/solve", icon: ScanSearch },
  { label: "Exam Prep", href: "/exam-prep", icon: GraduationCap },
  { label: "Flashcards", href: "/flashcards", icon: Layers },
] as const;

/** Primary entry points from the dashboard, optimised for thumb reach. */
export function QuickActions({ className }: { className?: string }) {
  return (
    <div className={cn("grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6", className)}>
      {ACTIONS.map(({ label, href, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className="group flex flex-col items-start gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:bg-muted/40"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-background transition-colors group-hover:border-foreground/20">
            <Icon className="h-4 w-4" />
          </span>
          <span className="text-sm font-medium leading-tight">{label}</span>
        </Link>
      ))}
    </div>
  );
}

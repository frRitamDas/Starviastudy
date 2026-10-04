"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Menu, X } from "lucide-react";
import {
  BookOpen,
  GraduationCap,
  LayoutDashboard,
  Layers,
  ListChecks,
  MessagesSquare,
  ScanSearch,
  TrendingUp,
  User,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/layout/sidebar";
import { dashboardNav } from "@/lib/site";
import { cn } from "@/lib/utils";
import { useApp } from "@/components/providers/app-provider";
import { PlanBadge } from "@/components/billing/plan-badge";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  MessagesSquare,
  BookOpen,
  ListChecks,
  ScanSearch,
  GraduationCap,
  Layers,
  TrendingUp,
  User,
};

/** Sticky top bar for the authenticated app (mobile + desktop). */
export function Topbar() {
  const pathname = usePathname();
  const { usage } = useApp();
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => setOpen(false), [pathname]);

  const streak = usage?.profile.currentStreak ?? 0;

  return (
    <header className="sticky top-0 z-30 border-b border-border glass">
      <div className="flex h-14 items-center justify-between gap-3 px-4 sm:h-16 sm:px-6">
        <div className="flex items-center gap-2 lg:hidden">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
          <Logo variant="mark" />
        </div>

        <div className="hidden lg:block">
          {usage ? (
            <div className="flex items-center gap-3 text-sm">
              <span className="text-muted-foreground">
                {usage.profile.classLevel ?? "Your"} · {usage.profile.board ?? "study"} dashboard
              </span>
              <PlanBadge plan={usage.plan} />
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          {streak > 0 ? (
            <span
              className="hidden items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs font-medium sm:inline-flex"
              title={`${streak}-day study streak`}
            >
              🔥 {streak}
            </span>
          ) : null}
          <ThemeToggle className="hidden sm:inline-flex" />
          <Link
            href="/profile"
            aria-label="Profile"
            className="rounded-lg border border-border p-2 text-muted-foreground transition-colors hover:text-foreground lg:hidden"
          >
            <Bell className="h-4 w-4" />
          </Link>
          <div className="hidden lg:block">
            <UserMenu />
          </div>
        </div>
      </div>

      {open ? (
        <div className="border-t border-border bg-background px-3 py-3 lg:hidden">
          <ul className="grid grid-cols-2 gap-1">
            {dashboardNav.map((item) => {
              const Icon = ICONS[item.icon] ?? LayoutDashboard;
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm transition-colors",
                      active
                        ? "bg-muted font-medium text-foreground"
                        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.title}
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="mt-3 border-t border-border pt-3">
            <UserMenu />
          </div>
        </div>
      ) : null}
    </header>
  );
}

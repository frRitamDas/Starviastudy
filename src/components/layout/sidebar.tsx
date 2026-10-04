"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import * as React from "react";
import {
  BookOpen,
  GraduationCap,
  LayoutDashboard,
  Layers,
  ListChecks,
  LogOut,
  MessagesSquare,
  ScanSearch,
  Settings,
  TrendingUp,
  User,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";
import { dashboardNav } from "@/lib/site";
import { createClient } from "@/lib/supabase/client";
import { useApp } from "@/components/providers/app-provider";
import { Progress } from "@/components/ui/progress";
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

/** Desktop sidebar for the authenticated app. */
export function Sidebar() {
  const pathname = usePathname();
  const { usage } = useApp();

  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-border bg-background lg:flex">
      <div className="flex h-16 items-center border-b border-border px-5">
        <Logo />
      </div>

      <nav aria-label="App" className="flex-1 overflow-y-auto px-3 py-4 scrollbar-thin">
        <ul className="flex flex-col gap-0.5">
          {dashboardNav.map((item) => {
            const Icon = ICONS[item.icon] ?? LayoutDashboard;
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
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
      </nav>

      {usage ? (
        <div className="border-t border-border p-3">
          <UsageMeter usage={usage} />
        </div>
      ) : null}

      <div className="border-t border-border p-3">
        <UserMenu />
      </div>
    </aside>
  );
}

function UsageMeter({ usage }: { usage: NonNullable<ReturnType<typeof useApp>["usage"]> }) {
  const tutor = usage.limits.tutor;
  const used = usage.used.tutor ?? 0;
  const percent = tutor ? Math.min((used / tutor) * 100, 100) : 0;

  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium">Today&apos;s AI usage</span>
        <PlanBadge plan={usage.plan} />
      </div>
      <div className="mt-2.5">
        <Progress value={percent} className="h-1.5" />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {tutor === null
          ? "Unlimited tutor messages"
          : `${used} of ${tutor} tutor messages used`}
      </p>
      {usage.plan === "free" ? (
        <Link
          href="/pricing"
          className="mt-2 inline-block text-xs font-medium underline underline-offset-4"
        >
          Upgrade for more
        </Link>
      ) : null}
    </div>
  );
}

export function UserMenu() {
  const router = useRouter();
  const { usage } = useApp();
  const [signingOut, setSigningOut] = React.useState(false);

  const name = usage?.profile.fullName || "Student";
  const email = usage?.profile.board ? `${usage.profile.classLevel} · ${usage.profile.board}` : null;

  async function signOut() {
    setSigningOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      await fetch("/api/auth/signout", { method: "POST" });
    } catch {
      /* fall through to redirect */
    }
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-xs font-semibold">
        {name.slice(0, 1).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{name}</p>
        {email ? <p className="truncate text-xs text-muted-foreground">{email}</p> : null}
      </div>
      <div className="flex items-center gap-0.5">
        <Link
          href="/profile"
          aria-label="Profile settings"
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Settings className="h-4 w-4" />
        </Link>
        <button
          type="button"
          onClick={signOut}
          disabled={signingOut}
          aria-label="Sign out"
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

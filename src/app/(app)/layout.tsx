import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { AppProvider, type UsageResponse } from "@/components/providers/app-provider";
import { toStudentContext } from "@/lib/session";

export const dynamic = "force-dynamic";

/**
 * Layout for every authenticated screen.
 *
 * The session is read on the server and passed down as initial data, so the
 * first paint already has the plan, streak and usage — no loading flash.
 * Students who have not finished onboarding are sent there first.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  if (!session.profile.onboarded) redirect("/onboarding");

  const initialUsage: UsageResponse = {
    plan: session.subscription.plan,
    status: session.subscription.status,
    currentPeriodEnd: session.subscription.currentPeriodEnd,
    cancelAtPeriodEnd: session.subscription.cancelAtPeriodEnd,
    date: session.usage.date,
    limits: session.usage.limits,
    used: session.usage.used,
    remaining: session.usage.remaining,
    profile: {
      fullName: session.profile.full_name,
      classLevel: session.profile.class_level,
      board: session.profile.board,
      subjects: session.profile.subjects ?? [],
      learningLevel: session.profile.learning_level,
      examTarget: session.profile.exam_target,
      onboarded: session.profile.onboarded,
      xp: session.profile.xp,
      level: session.profile.level,
      currentStreak: session.profile.current_streak,
      longestStreak: session.profile.longest_streak,
    },
    context: toStudentContext(session.profile) as Record<string, unknown>,
  };

  return (
    <AppProvider initialUsage={initialUsage}>
      <div className="flex min-h-dvh bg-background">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar />
          <main id="main" className="flex-1 pb-20 lg:pb-0">
            {children}
          </main>
        </div>
      </div>
      <MobileNav />
    </AppProvider>
  );
}

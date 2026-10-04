import type { Metadata } from "next";
import Link from "next/link";
import {
  BookOpen,
  Flame,
  GraduationCap,
  Layers,
  ListChecks,
  MessagesSquare,
  ScanSearch,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";
import { getSession } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { levelFromXp } from "@/lib/gamification";
import { PageContainer } from "@/components/shared/page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { UsageCard } from "@/components/dashboard/usage-card";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { relativeTime, todayInTZ } from "@/lib/utils";
import { getPlanLimits } from "@/lib/usage/limits";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

/** Load everything the dashboard needs in one parallel batch. */
async function getDashboardData(userId: string) {
  const supabase = createAdminClient();
  const today = todayInTZ();

  const [
    { data: tutorials },
    { data: attempts },
    { data: topics },
    { count: tutorialsCompleted },
    { count: quizzesCompleted },
    { data: usageRows },
  ] = await Promise.all([
    supabase
      .from("tutorials")
      .select("id, title, subject, topic, difficulty, is_complete, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(4),
    supabase
      .from("quiz_attempts")
      .select("id, score, total, created_at, quiz_id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(4),
    supabase
      .from("study_progress")
      .select("subject, chapter, topic, status, mastery, updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false }),
    supabase
      .from("tutorials")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_complete", true),
    supabase
      .from("quiz_attempts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase.from("ai_usage").select("feature, count").eq("user_id", userId).eq("usage_date", today),
  ]);

  const weakTopics = (topics ?? [])
    .filter((t) => t.status === "not_started" || t.status === "learning")
    .slice(0, 5);

  const masteredCount = (topics ?? []).filter((t) => t.status === "mastered").length;

  return {
    tutorials: tutorials ?? [],
    attempts: attempts ?? [],
    topics: topics ?? [],
    weakTopics,
    masteredCount,
    tutorialsCompleted: tutorialsCompleted ?? 0,
    quizzesCompleted: quizzesCompleted ?? 0,
    usageToday: usageRows ?? [],
  };
}

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) return null;

  const [data, limits] = await Promise.all([
    getDashboardData(session.user.id),
    getPlanLimits(session.subscription.plan),
  ]);

  const profile = session.profile;
  const level = levelFromXp(profile.xp);
  const firstName = (profile.full_name ?? "there").split(" ")[0];
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      hour12: false,
    }).format(new Date()),
  );
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const tutorUsed = data.usageToday.find((u) => u.feature === "tutor")?.count ?? 0;
  const tutorLimit = limits.tutor;

  // Recommend topics the student has already started but not mastered.
  const recommended = data.weakTopics.slice(0, 3);
  const avgScore = data.attempts.length
    ? Math.round(
        (data.attempts.reduce((sum, a) => sum + a.score / Math.max(a.total, 1), 0) /
          data.attempts.length) *
          100,
      )
    : null;

  return (
    <PageContainer width="wide">
      {/* Greeting */}
      <section className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{greeting},</p>
          <h1 className="mt-0.5 text-2xl font-semibold tracking-tight sm:text-3xl">{firstName}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {profile.board && profile.class_level
              ? `${profile.class_level} · ${profile.board} · Let's make today count.`
              : "Let's make today count."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm">
            <Flame className="h-3.5 w-3.5" />
            {profile.current_streak} day{profile.current_streak === 1 ? "" : "s"} streak
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm">
            <Zap className="h-3.5 w-3.5" />
            {profile.xp} XP
          </span>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Today's progress */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Today&apos;s learning</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Level {level.level} · {level.title}</span>
                <span className="text-muted-foreground">
                  {level.nextLevelXp ? `${profile.xp} / ${level.nextLevelXp} XP` : "Max level"}
                </span>
              </div>
              <Progress value={level.progress * 100} />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Stat label="Tutorials" value={data.tutorialsCompleted} />
              <Stat label="Quizzes" value={data.quizzesCompleted} />
              <Stat label="Topics mastered" value={data.masteredCount} />
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <Button size="sm" asChild>
                <Link href="/tutor">
                  <MessagesSquare className="h-3.5 w-3.5" />
                  Continue learning
                </Link>
              </Button>
              {avgScore !== null ? (
                <Button size="sm" variant="outline" asChild>
                  <Link href="/progress">
                    <TrendingUp className="h-3.5 w-3.5" />
                    {avgScore}% average score
                  </Link>
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>

        {/* AI usage */}
        <UsageCard
          plan={session.subscription.plan}
          limits={limits}
          used={Object.fromEntries(data.usageToday.map((u) => [u.feature, u.count]))}
        />
      </div>

      {/* Quick actions */}
      <section className="mt-6">
        <h2 className="mb-3 text-sm font-semibold">Quick actions</h2>
        <QuickActions />
      </section>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {/* Recent tutorials */}
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Recent tutorials</CardTitle>
            <Link
              href="/tutorials"
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {data.tutorials.length ? (
              <ul className="flex flex-col gap-2">
                {data.tutorials.map((t) => (
                  <li key={t.id}>
                    <Link
                      href={`/tutorials/${t.id}`}
                      className="flex items-center justify-between gap-3 rounded-xl border border-border p-3 transition-colors hover:bg-muted/40"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">{t.title}</span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {t.subject} · {relativeTime(t.created_at)}
                        </span>
                      </span>
                      {t.is_complete ? (
                        <Badge variant="success">Done</Badge>
                      ) : (
                        <Badge variant="muted">In progress</Badge>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                icon={<BookOpen className="h-5 w-5" />}
                title="No tutorials yet"
                description="Generate your first AI tutorial for any chapter you're studying."
                action={{ label: "Create a tutorial", href: "/tutorials" }}
              />
            )}
          </CardContent>
        </Card>

        {/* Recent quizzes */}
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Recent quizzes</CardTitle>
            <Link
              href="/quiz"
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {data.attempts.length ? (
              <ul className="flex flex-col gap-2">
                {data.attempts.map((a) => {
                  const percent = Math.round((a.score / Math.max(a.total, 1)) * 100);
                  return (
                    <li
                      key={a.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-border p-3"
                    >
                      <span className="min-w-0">
                        <span className="block text-sm font-medium">
                          {a.score} / {a.total} correct
                        </span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {relativeTime(a.created_at)}
                        </span>
                      </span>
                      <Badge variant={percent >= 70 ? "success" : percent >= 40 ? "warning" : "destructive"}>
                        {percent}%
                      </Badge>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <EmptyState
                icon={<ListChecks className="h-5 w-5" />}
                title="No quizzes yet"
                description="Test yourself on any topic and see exactly where to revise."
                action={{ label: "Generate a quiz", href: "/quiz" }}
              />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {/* Weak topics */}
        <Card>
          <CardHeader>
            <CardTitle>Needs attention</CardTitle>
          </CardHeader>
          <CardContent>
            {data.weakTopics.length ? (
              <ul className="flex flex-col gap-2">
                {data.weakTopics.map((t) => (
                  <li
                    key={`${t.subject}-${t.chapter}-${t.topic}`}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border p-3"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{t.topic}</span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {t.subject} · {t.chapter}
                      </span>
                    </span>
                    <Badge variant={t.status === "learning" ? "warning" : "muted"}>
                      {t.status === "learning" ? "Learning" : "Not started"}
                    </Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                icon={<Sparkles className="h-5 w-5" />}
                title="Nothing flagged yet"
                description="Take a quiz or build an exam plan and Starvia will track what needs work."
                action={{ label: "Take a quiz", href: "/quiz" }}
              />
            )}
          </CardContent>
        </Card>

        {/* Recommended */}
        <Card>
          <CardHeader>
            <CardTitle>Recommended next</CardTitle>
          </CardHeader>
          <CardContent>
            {recommended.length ? (
              <ul className="flex flex-col gap-2">
                {recommended.map((t) => (
                  <li
                    key={`rec-${t.subject}-${t.topic}`}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border p-3"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{t.topic}</span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">{t.subject}</span>
                    </span>
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/tutor?topic=${encodeURIComponent(t.topic)}`}>Study</Link>
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-col gap-3">
                <p className="text-sm text-muted-foreground">
                  Start with your strongest subject and build momentum.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" asChild>
                    <Link href="/tutor">
                      <MessagesSquare className="h-3.5 w-3.5" />
                      Ask AI
                    </Link>
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <Link href="/exam-prep">
                      <GraduationCap className="h-3.5 w-3.5" />
                      Exam prep
                    </Link>
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <Link href="/flashcards">
                      <Layers className="h-3.5 w-3.5" />
                      Flashcards
                    </Link>
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <Link href="/solve">
                      <ScanSearch className="h-3.5 w-3.5" />
                      Solve a question
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {tutorLimit !== null ? (
        <p className="mt-6 text-center text-xs text-muted-foreground">
          {tutorUsed} of {tutorLimit} AI tutor messages used today on the{" "}
          {session.subscription.plan} plan.
        </p>
      ) : null}
    </PageContainer>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border p-3">
      <p className="text-lg font-semibold tabular-nums">{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

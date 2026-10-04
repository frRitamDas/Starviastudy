import type { Metadata } from "next";
import Link from "next/link";
import { Award, BookOpen, Flame, ListChecks, MessagesSquare, TrendingUp, Zap } from "lucide-react";
import { getSession } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { ACHIEVEMENTS, levelFromXp } from "@/lib/gamification";
import { PageContainer, PageHeader } from "@/components/shared/page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { BarChart, LineChart } from "@/components/progress/learning-charts";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Progress" };
export const dynamic = "force-dynamic";

/**
 * Progress analytics.
 *
 * Aggregates are computed in the database where possible; the score trend is
 * derived from the student's most recent quiz attempts.
 */
async function getProgressData(userId: string) {
  const supabase = createAdminClient();

  const [
    { count: tutorialsCompleted },
    { count: quizzesCompleted },
    { count: questionsAsked },
    { data: attempts },
    { data: topics },
    { data: usageRows },
    { data: achievements },
  ] = await Promise.all([
    supabase.from("tutorials").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("is_complete", true),
    supabase.from("quiz_attempts").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("messages").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("role", "user"),
    supabase
      .from("quiz_attempts")
      .select("score, total, created_at, quizzes(subject)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(12),
    supabase.from("study_progress").select("subject, status, mastery").eq("user_id", userId),
    supabase.from("ai_usage").select("feature, count, usage_date").eq("user_id", userId).order("usage_date", { ascending: false }).limit(120),
    supabase.from("achievements").select("key, unlocked_at").eq("user_id", userId),
  ]);

  return {
    tutorialsCompleted: tutorialsCompleted ?? 0,
    quizzesCompleted: quizzesCompleted ?? 0,
    questionsAsked: questionsAsked ?? 0,
    attempts: attempts ?? [],
    topics: topics ?? [],
    usageRows: usageRows ?? [],
    unlocked: new Set((achievements ?? []).map((a) => a.key)),
  };
}

export default async function ProgressPage() {
  const session = await getSession();
  if (!session) return null;

  const data = await getProgressData(session.user.id);
  const profile = session.profile;
  const level = levelFromXp(profile.xp);

  // Score trend, oldest → newest.
  const trend = [...data.attempts]
    .reverse()
    .map((a, index) => ({
      label: `#${index + 1}`,
      value: Math.round((a.score / Math.max(a.total, 1)) * 100),
    }));

  // Study time estimate: AI requests × average minutes.
  const totalRequests = data.usageRows.reduce((sum, row) => sum + row.count, 0);
  const studyMinutes = totalRequests * 6;

  // Subject breakdown by mastery.
  const bySubject = new Map<string, { total: number; mastered: number; sum: number }>();
  for (const topic of data.topics) {
    const entry = bySubject.get(topic.subject) ?? { total: 0, mastered: 0, sum: 0 };
    entry.total += 1;
    entry.sum += topic.mastery ?? 0;
    if (topic.status === "mastered") entry.mastered += 1;
    bySubject.set(topic.subject, entry);
  }

  const subjectRows = Array.from(bySubject.entries()).map(([subject, entry]) => ({
    subject,
    percent: Math.round(entry.sum / Math.max(entry.total, 1)),
  }));

  const weakest = [...subjectRows].sort((a, b) => a.percent - b.percent).slice(0, 3);

  const stats = [
    { label: "Tutorials completed", value: data.tutorialsCompleted, icon: BookOpen },
    { label: "Quizzes completed", value: data.quizzesCompleted, icon: ListChecks },
    { label: "Questions asked", value: data.questionsAsked, icon: MessagesSquare },
    { label: "Day streak", value: profile.current_streak, icon: Flame },
  ];

  return (
    <PageContainer width="wide">
      <PageHeader
        title="Your progress"
        description="Everything you've studied, in one place. Keep the streak alive."
      />

      {/* Headline stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="pt-5">
              <Icon className="h-4 w-4 text-muted-foreground" />
              <p className="mt-3 text-2xl font-semibold tabular-nums">{value}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {/* Level */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Level {level.level} · {level.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={level.progress * 100} />
            <p className="text-xs text-muted-foreground">
              {level.nextLevelXp
                ? `${profile.xp} / ${level.nextLevelXp} XP to level ${level.level + 1}`
                : "You've reached the top level."}
            </p>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="rounded-xl border border-border p-3">
                <p className="text-lg font-semibold tabular-nums">{profile.xp}</p>
                <p className="text-xs text-muted-foreground">Total XP</p>
              </div>
              <div className="rounded-xl border border-border p-3">
                <p className="text-lg font-semibold tabular-nums">{profile.longest_streak}</p>
                <p className="text-xs text-muted-foreground">Longest streak</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Score trend */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Quiz score trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <LineChart data={trend} />
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {/* Subject mastery */}
        <Card>
          <CardHeader>
            <CardTitle>Subject mastery</CardTitle>
          </CardHeader>
          <CardContent>
            {subjectRows.length ? (
              <BarChart data={subjectRows.map((r) => ({ label: r.subject, value: r.percent }))} />
            ) : (
              <EmptyState
                icon={<BookOpen className="h-5 w-5" />}
                title="No tracked topics yet"
                description="Generate an exam plan to start tracking mastery by subject."
                action={{ label: "Exam prep", href: "/exam-prep" }}
              />
            )}
          </CardContent>
        </Card>

        {/* Focus areas */}
        <Card>
          <CardHeader>
            <CardTitle>Where to focus</CardTitle>
          </CardHeader>
          <CardContent>
            {weakest.length ? (
              <ul className="flex flex-col gap-2">
                {weakest.map((row) => (
                  <li
                    key={row.subject}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border p-3"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{row.subject}</span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {row.percent}% mastery
                      </span>
                    </span>
                    <Link
                      href={`/tutor?subject=${encodeURIComponent(row.subject)}`}
                      className="shrink-0 text-xs font-medium underline underline-offset-4"
                    >
                      Study
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                Track a few topics and Starvia will highlight your weakest areas here.
              </p>
            )}
            <p className="mt-4 text-xs text-muted-foreground">
              Approx. {Math.round(studyMinutes / 60)}h {studyMinutes % 60}m of AI-assisted study so
              far.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Achievements */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            Achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {ACHIEVEMENTS.map((achievement) => {
              const unlocked = data.unlocked.has(achievement.key);
              return (
                <li
                  key={achievement.key}
                  className={cn(
                    "rounded-xl border p-3 transition-colors",
                    unlocked ? "border-border bg-muted/40" : "border-dashed border-border opacity-60",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium">{achievement.title}</p>
                    {unlocked ? <Badge variant="success">Unlocked</Badge> : null}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground text-pretty">
                    {achievement.description}
                  </p>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>
    </PageContainer>
  );
}

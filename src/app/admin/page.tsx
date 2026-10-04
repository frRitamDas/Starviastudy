import type { Metadata } from "next";
import {
  Activity,
  AlertTriangle,
  BookOpen,
  CreditCard,
  ListChecks,
  Sparkles,
  Users,
} from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page";
import { formatDate, todayInTZ } from "@/lib/utils";

export const metadata: Metadata = { title: "Admin overview" };
export const dynamic = "force-dynamic";

function daysAgo(n: number) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString();
}

interface Totals {
  users: number;
  active7: number;
  free: number;
  pro: number;
  ultra: number;
  revenue: number;
  aiRequests: number;
  aiErrors: number;
  cached: number;
  quizzes: number;
  attempts: number;
  tutorials: number;
  dau: number;
}

/** Aggregate platform metrics in one batch of count queries. */
async function getAdminData(): Promise<Totals> {
  const supabase = createAdminClient();
  const since7 = daysAgo(7);
  const today = todayInTZ();

  const head = { count: "exact" as const, head: true };

  const [
    users,
    active7,
    free,
    pro,
    ultra,
    aiRequests,
    aiErrors,
    cached,
    quizzes,
    attempts,
    tutorials,
    dau,
    payments,
  ] = await Promise.all([
    supabase.from("profiles").select("*", head),
    supabase.from("profiles").select("*", head).gte("last_active_date", since7.slice(0, 10)),
    supabase.from("subscriptions").select("*", head).eq("plan", "free"),
    supabase.from("subscriptions").select("*", head).eq("plan", "pro"),
    supabase.from("subscriptions").select("*", head).eq("plan", "ultra"),
    supabase.from("ai_events").select("*", head),
    supabase.from("ai_events").select("*", head).eq("status", "error"),
    supabase.from("ai_events").select("*", head).eq("cached", true),
    supabase.from("quizzes").select("*", head),
    supabase.from("quiz_attempts").select("*", head),
    supabase.from("tutorials").select("*", head),
    supabase.from("ai_usage").select("*", head).eq("usage_date", today),
    supabase.from("payments").select("amount").eq("status", "paid"),
  ]);

  const revenue = (payments.data ?? []).reduce((sum, p) => sum + (p.amount ?? 0), 0);

  return {
    users: users.count ?? 0,
    active7: active7.count ?? 0,
    free: free.count ?? 0,
    pro: pro.count ?? 0,
    ultra: ultra.count ?? 0,
    revenue,
    aiRequests: aiRequests.count ?? 0,
    aiErrors: aiErrors.count ?? 0,
    cached: cached.count ?? 0,
    quizzes: quizzes.count ?? 0,
    attempts: attempts.count ?? 0,
    tutorials: tutorials.count ?? 0,
    dau: dau.count ?? 0,
  };
}

function rupees(paise: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(paise / 100);
}

export default async function AdminOverviewPage() {
  let data: Totals;
  try {
    data = await getAdminData();
  } catch {
    return (
      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-base font-semibold">Metrics unavailable</h2>
        <p className="mt-2 text-sm text-muted-foreground text-pretty">
          The admin client needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY. Add them in
          your environment to see platform metrics.
        </p>
      </div>
    );
  }

  const errorRate = data.aiRequests ? (data.aiErrors / data.aiRequests) * 100 : 0;
  const cacheRate = data.aiRequests ? (data.cached / data.aiRequests) * 100 : 0;
  const paid = data.pro + data.ultra;

  const cards = [
    { label: "Total users", value: data.users, icon: Users },
    { label: "Active (7 days)", value: data.active7, icon: Activity },
    { label: "Daily active", value: data.dau, icon: Sparkles },
    { label: "Revenue", value: rupees(data.revenue), icon: CreditCard },
  ];

  const secondary = [
    { label: "Free users", value: data.free },
    { label: "Pro users", value: data.pro },
    { label: "Ultra users", value: data.ultra },
    { label: "Paying users", value: paid },
  ];

  const activity = [
    { label: "AI requests", value: data.aiRequests, icon: Sparkles },
    { label: "Tutorials generated", value: data.tutorials, icon: BookOpen },
    { label: "Quizzes generated", value: data.quizzes, icon: ListChecks },
    { label: "Quiz attempts", value: data.attempts, icon: ListChecks },
  ];

  return (
    <>
      <PageHeader title="Overview" description="Platform health and usage at a glance." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {card.label}
                </p>
                <card.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="mt-2 text-2xl font-semibold tabular-nums">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Subscriptions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {secondary.map((row) => (
              <div key={row.label}>
                <p className="text-xs text-muted-foreground">{row.label}</p>
                <p className="mt-1 text-xl font-semibold tabular-nums">{row.value}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Reliability</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Error rate</span>
              <Badge variant={errorRate > 5 ? "destructive" : "success"}>
                {errorRate.toFixed(1)}%
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Cache hit rate</span>
              <Badge variant="secondary">{cacheRate.toFixed(1)}%</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <AlertTriangle className="h-3.5 w-3.5" />
                Failed AI calls
              </span>
              <span className="text-sm tabular-nums">{data.aiErrors}</span>
            </div>
            <p className="border-t border-border pt-3 text-xs text-muted-foreground">
              Updated {formatDate(new Date().toISOString())}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {activity.map((row) => (
          <Card key={row.label}>
            <CardContent className="flex items-center gap-3 pt-5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-border">
                <row.icon className="h-4 w-4 text-muted-foreground" />
              </span>
              <div>
                <p className="text-xs text-muted-foreground">{row.label}</p>
                <p className="text-lg font-semibold tabular-nums">{row.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}

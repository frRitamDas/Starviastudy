import Link from "next/link";
import { ListChecks } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { relativeTime } from "@/lib/utils";
import type { QuizAttemptRow } from "@/types/rows";

/** Past quiz attempts with their scores. */
export function QuizHistory({ attempts }: { attempts: QuizAttemptRow[] }) {
  return (
    <div>
      <h2 className="mb-3 text-sm font-semibold">Your attempts</h2>
      {attempts.length ? (
        <ul className="flex flex-col gap-2">
          {attempts.map((attempt) => {
            const percent = Math.round((attempt.score / Math.max(attempt.total, 1)) * 100);
            const title = attempt.quizzes?.title ?? "Quiz";
            return (
              <li key={attempt.id}>
                <Link
                  href={`/quiz/${attempt.quiz_id}`}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:bg-muted/40"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{title}</span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {attempt.score}/{attempt.total} correct · {relativeTime(attempt.created_at)}
                    </span>
                  </span>
                  <Badge
                    variant={percent >= 70 ? "success" : percent >= 40 ? "warning" : "destructive"}
                  >
                    {percent}%
                  </Badge>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState
          icon={<ListChecks className="h-5 w-5" />}
          title="No attempts yet"
          description="Generate a quiz and your scores will show up here so you can track improvement."
        />
      )}
    </div>
  );
}

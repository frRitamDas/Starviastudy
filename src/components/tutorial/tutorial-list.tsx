import Link from "next/link";
import { BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { relativeTime } from "@/lib/utils";

interface TutorialRow {
  id: string;
  title: string;
  subject: string;
  topic: string;
  difficulty: string;
  is_complete: boolean;
  created_at: string;
}

/** Saved tutorial library. */
export function TutorialList({ tutorials }: { tutorials: TutorialRow[] }) {
  return (
    <div>
      <h2 className="mb-3 text-sm font-semibold">Your library</h2>
      {tutorials.length ? (
        <ul className="flex flex-col gap-2">
          {tutorials.map((tutorial) => (
            <li key={tutorial.id}>
              <Link
                href={`/tutorials/${tutorial.id}`}
                className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:bg-muted/40"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{tutorial.title}</span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {tutorial.subject} · {tutorial.difficulty} · {relativeTime(tutorial.created_at)}
                  </span>
                </span>
                <Badge variant={tutorial.is_complete ? "success" : "muted"}>
                  {tutorial.is_complete ? "Complete" : "To read"}
                </Badge>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={<BookOpen className="h-5 w-5" />}
          title="Your library is empty"
          description="Every tutorial you generate is saved here so you can revise it any time — no need to regenerate."
        />
      )}
    </div>
  );
}

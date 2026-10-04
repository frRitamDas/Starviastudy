"use client";

import * as React from "react";
import { Target } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { apiFetch } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { TOPIC_STATUSES, TOPIC_STATUS_LABELS, type TopicStatus } from "@/lib/education";
import type { StudyTopicRow } from "@/types/rows";

/**
 * Topic mastery tracker.
 *
 * Each row can be advanced through not started → learning → practiced →
 * mastered. Status is written server-side, and mastery feeds the progress
 * charts, so this is the single place a student updates topic state.
 */
export function TopicTracker({ topics: initialTopics }: { topics: StudyTopicRow[] }) {
  const [topics, setTopics] = React.useState(initialTopics);
  const [savingKey, setSavingKey] = React.useState<string | null>(null);

  async function setStatus(topic: StudyTopicRow, status: TopicStatus) {
    const key = `${topic.subject}|${topic.chapter}|${topic.topic}`;
    setSavingKey(key);
    const previous = topics;
    setTopics((prev) =>
      prev.map((t) =>
        t.subject === topic.subject && t.chapter === topic.chapter && t.topic === topic.topic
          ? { ...t, status }
          : t,
      ),
    );
    try {
      await apiFetch("/api/progress/topics", {
        method: "PATCH",
        json: { subject: topic.subject, chapter: topic.chapter, topic: topic.topic, status },
      });
    } catch {
      setTopics(previous);
      toast.error("We couldn't save that. Please try again.");
    } finally {
      setSavingKey(null);
    }
  }

  const grouped = React.useMemo(() => {
    const map = new Map<string, StudyTopicRow[]>();
    for (const topic of topics) {
      const list = map.get(topic.subject) ?? [];
      list.push(topic);
      map.set(topic.subject, list);
    }
    return Array.from(map.entries());
  }, [topics]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-4 w-4" />
          Topic mastery
        </CardTitle>
      </CardHeader>
      <CardContent>
        {topics.length ? (
          <div className="space-y-6">
            {grouped.map(([subject, rows]) => (
              <div key={subject}>
                <h3 className="mb-2 text-sm font-semibold">{subject}</h3>
                <ul className="flex flex-col gap-2">
                  {rows.map((topic) => {
                    const key = `${topic.subject}|${topic.chapter}|${topic.topic}`;
                    return (
                      <li
                        key={key}
                        className="flex flex-col gap-3 rounded-xl border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-pretty">{topic.topic}</p>
                          {topic.chapter ? (
                            <p className="mt-0.5 text-xs text-muted-foreground">{topic.chapter}</p>
                          ) : null}
                        </div>
                        <div className="flex shrink-0 flex-wrap gap-1">
                          {TOPIC_STATUSES.map((status) => {
                            const active = topic.status === status;
                            return (
                              <button
                                key={status}
                                type="button"
                                disabled={savingKey === key}
                                onClick={() => setStatus(topic, status)}
                                aria-pressed={active}
                                className={cn(
                                  "rounded-full border px-2.5 py-1 text-xs transition-colors disabled:opacity-60",
                                  active
                                    ? "border-foreground bg-foreground text-background"
                                    : "border-border text-muted-foreground hover:bg-muted",
                                )}
                              >
                                {TOPIC_STATUS_LABELS[status]}
                              </button>
                            );
                          })}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Target className="h-5 w-5" />}
            title="No topics tracked yet"
            description="Generate an exam plan and its important topics will appear here so you can mark your progress."
          />
        )}
      </CardContent>
    </Card>
  );
}

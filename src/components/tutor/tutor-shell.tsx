"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { History, Send, Sparkles, Square } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { apiFetch, ApiClientError } from "@/lib/api/client";
import { useApp } from "@/components/providers/app-provider";
import { useTutorStream, type ChatMessage } from "@/hooks/use-tutor-stream";
import { MessageBubble, ThinkingBubble } from "@/components/tutor/message-bubble";
import { ConversationList, type ConversationSummary } from "@/components/tutor/conversation-list";
import { LimitDialog } from "@/components/billing/limit-dialog";
import { DIFFICULTIES } from "@/lib/education";

const STARTERS = [
  "Explain photosynthesis for my class in simple words",
  "Why is the sky blue?",
  "Help me understand quadratic equations step by step",
  "Give me a practice question on the periodic table",
];

/**
 * The tutor workspace.
 *
 * Layout: history on the left (desktop), conversation in the middle, composer
 * pinned to the bottom. On mobile the history becomes a sheet so the chat gets
 * the full screen — which is how most students will use it.
 */
export function TutorShell({
  conversations: initialConversations,
  initialConversationId,
  subjects,
  context,
  seedTopic,
  seedSubject,
}: {
  conversations: ConversationSummary[];
  initialConversationId: string | null;
  subjects: string[];
  context: { classLevel: string | null; board: string | null; learningLevel: string | null };
  seedTopic: string | null;
  seedSubject: string | null;
}) {
  const router = useRouter();
  const { usage, refresh, applyLocalUsage } = useApp();

  const [conversations, setConversations] = React.useState(initialConversations);
  const [conversationId, setConversationId] = React.useState<string | null>(initialConversationId);
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [input, setInput] = React.useState(
    seedTopic ? `Explain ${seedTopic} for ${context.classLevel ?? "my class"}.` : "",
  );
  const [subject, setSubject] = React.useState(seedSubject ?? subjects[0] ?? "");
  const [difficulty, setDifficulty] = React.useState<string>("medium");
  const [loadingHistory, setLoadingHistory] = React.useState(Boolean(initialConversationId));
  const [historyOpen, setHistoryOpen] = React.useState(false);
  const [limit, setLimit] = React.useState<{ feature: string; limit: number } | null>(null);

  const bottomRef = React.useRef<HTMLDivElement>(null);

  const { send, stop, streaming } = useTutorStream({
    onConversationCreated: (id) => {
      setConversationId(id);
      void reloadConversations();
      router.replace(`/tutor?conversation=${id}`, { scroll: false });
    },
    onLimitReached: () => {
      const tutorLimit = usage?.limits.tutor ?? 5;
      setLimit({ feature: "tutor", limit: tutorLimit });
    },
  });

  const reloadConversations = React.useCallback(async () => {
    try {
      const data = await apiFetch<{ conversations: ConversationSummary[] }>(
        "/api/ai/tutor/conversations",
      );
      setConversations(data.conversations);
    } catch {
      /* history refresh is best-effort */
    }
  }, []);

  // Load the selected conversation's messages.
  React.useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      return;
    }
    let cancelled = false;
    setLoadingHistory(true);
    apiFetch<{ messages: ChatMessage[] }>(
      `/api/ai/tutor/conversations?id=${conversationId}`,
    )
      .then((data) => {
        if (cancelled) return;
        setMessages(
          data.messages.map((m) => ({ id: m.id, role: m.role, content: m.content, feedback: m.feedback })),
        );
      })
      .catch(() => {
        if (!cancelled) toast.error("We couldn't load that conversation.");
      })
      .finally(() => {
        if (!cancelled) setLoadingHistory(false);
      });
    return () => {
      cancelled = true;
    };
  }, [conversationId]);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  async function submit(text: string) {
    const message = text.trim();
    if (!message || streaming) return;

    const userMessage: ChatMessage = {
      id: `local-user-${Date.now()}`,
      role: "user",
      content: message,
    };
    const assistantId = `local-assistant-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      userMessage,
      { id: assistantId, role: "assistant", content: "", streaming: true },
    ]);
    setInput("");

    try {
      await send({
        message,
        conversationId,
        subject: subject || null,
        difficulty,
        onDelta: (chunk) => {
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + chunk } : m)),
          );
        },
        onDone: ({ messageId }) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, id: messageId || m.id, streaming: false } : m,
            ),
          );
          applyLocalUsage("tutor", 1);
          void refresh();
        },
      });
    } catch (error) {
      setMessages((prev) => prev.filter((m) => m.id !== assistantId));
      if (error instanceof ApiClientError && error.isLimitReached) {
        const tutorLimit = error.details?.limit ?? usage?.limits.tutor ?? 5;
        setLimit({ feature: "tutor", limit: tutorLimit });
      } else {
        const msg =
          error instanceof ApiClientError ? error.message : "AI is temporarily unavailable. Please try again.";
        toast.error(msg);
      }
    }
  }

  async function regenerate(message: ChatMessage) {
    if (!conversationId || streaming) return;
    setMessages((prev) => prev.filter((m) => m.id !== message.id));
    const assistantId = `local-assistant-${Date.now()}`;
    setMessages((prev) => [...prev, { id: assistantId, role: "assistant", content: "", streaming: true }]);
    try {
      const data = await apiFetch<{ message: ChatMessage }>("/api/ai/tutor", {
        method: "PUT",
        json: { conversationId, removeMessageId: message.id },
      });
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { id: data.message.id, role: "assistant", content: data.message.content }
            : m,
        ),
      );
      applyLocalUsage("tutor", 1);
      void refresh();
    } catch (error) {
      setMessages((prev) => prev.filter((m) => m.id !== assistantId));
      if (error instanceof ApiClientError && error.isLimitReached) {
        setLimit({ feature: "tutor", limit: error.details?.limit ?? usage?.limits.tutor ?? 5 });
      } else {
        toast.error("AI is temporarily unavailable. Please try again.");
      }
    }
  }

  async function feedback(message: ChatMessage, rating: "helpful" | "not_helpful") {
    setMessages((prev) => prev.map((m) => (m.id === message.id ? { ...m, feedback: rating } : m)));
    try {
      await apiFetch("/api/ai/feedback", {
        method: "POST",
        json: { messageId: message.id, rating },
      });
    } catch {
      /* feedback is non-critical */
    }
  }

  async function removeConversation(id: string) {
    if (!window.confirm("Delete this conversation? This cannot be undone.")) return;
    try {
      await apiFetch("/api/ai/tutor/conversations", {
        method: "DELETE",
        json: { conversationId: id },
      });
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (id === conversationId) {
        setConversationId(null);
        setMessages([]);
        router.replace("/tutor", { scroll: false });
      }
    } catch {
      toast.error("We couldn't delete that conversation.");
    }
  }

  function newConversation() {
    setConversationId(null);
    setMessages([]);
    setHistoryOpen(false);
    router.replace("/tutor", { scroll: false });
  }

  const remaining = usage?.remaining.tutor;
  const exhausted = remaining !== null && remaining !== undefined && remaining <= 0;

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] lg:h-dvh">
      {/* History — desktop */}
      <div className="hidden w-72 shrink-0 border-r border-border lg:block">
        <ConversationList
          conversations={conversations}
          activeId={conversationId}
          onSelect={(id) => setConversationId(id)}
          onNew={newConversation}
          onDelete={removeConversation}
        />
      </div>

      {/* History — mobile sheet */}
      {historyOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close history"
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setHistoryOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-80 max-w-[85%] border-r border-border bg-background">
            <ConversationList
              conversations={conversations}
              activeId={conversationId}
              onSelect={(id) => {
                setConversationId(id);
                setHistoryOpen(false);
              }}
              onNew={() => {
                newConversation();
                setHistoryOpen(false);
              }}
              onDelete={removeConversation}
            />
          </div>
        </div>
      ) : null}

      {/* Conversation */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon-sm"
              className="lg:hidden"
              onClick={() => setHistoryOpen(true)}
              aria-label="Conversation history"
            >
              <History className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-sm font-semibold">AI Tutor</h1>
              <p className="text-xs text-muted-foreground">
                {context.classLevel && context.board
                  ? `Adapted to ${context.classLevel} · ${context.board}`
                  : "Personalised to your profile"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {remaining !== null && remaining !== undefined ? (
              <Badge variant={exhausted ? "destructive" : "muted"} className="hidden sm:inline-flex">
                {remaining} left today
              </Badge>
            ) : (
              <Badge variant="muted" className="hidden sm:inline-flex">
                Unlimited
              </Badge>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 scrollbar-thin">
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
            {loadingHistory ? (
              <div className="flex flex-col gap-4">
                <div className="ml-auto h-10 w-2/3 animate-pulse rounded-2xl bg-muted" />
                <div className="h-24 w-full animate-pulse rounded-2xl bg-muted" />
              </div>
            ) : messages.length ? (
              messages.map((message) =>
                message.role === "assistant" && message.streaming && !message.content ? (
                  <ThinkingBubble key={message.id} />
                ) : (
                  <MessageBubble
                    key={message.id}
                    role={message.role}
                    content={message.content}
                    streaming={message.streaming}
                    feedback={message.feedback}
                    onFeedback={
                      message.role === "assistant" && !message.streaming
                        ? (rating) => feedback(message, rating)
                        : undefined
                    }
                    onRegenerate={
                      message.role === "assistant" && !message.streaming
                        ? () => regenerate(message)
                        : undefined
                    }
                  />
                ),
              )
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-muted/50">
                  <Sparkles className="h-5 w-5" />
                </div>
                <h2 className="text-base font-semibold">Ask anything you&apos;re stuck on</h2>
                <p className="mt-1.5 max-w-sm text-sm text-muted-foreground text-pretty">
                  Your tutor explains concepts step by step, at your class level, and never just
                  hands over an answer.
                </p>
                <div className="mt-6 grid w-full max-w-lg gap-2 sm:grid-cols-2">
                  {STARTERS.map((starter) => (
                    <button
                      key={starter}
                      type="button"
                      onClick={() => submit(starter)}
                      className="rounded-xl border border-border p-3 text-left text-sm transition-colors hover:bg-muted/50"
                    >
                      {starter}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* Composer */}
        <div className="border-t border-border bg-background px-4 py-3 sm:px-6">
          <div className="mx-auto w-full max-w-3xl">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              {subjects.length ? (
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  aria-label="Subject"
                  className="h-8 rounded-lg border border-border bg-background px-2 text-xs"
                >
                  <option value="">Any subject</option>
                  {subjects.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              ) : null}
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                aria-label="Explanation depth"
                className="h-8 rounded-lg border border-border bg-background px-2 text-xs"
              >
                {DIFFICULTIES.map((d) => (
                  <option key={d} value={d}>
                    {d === "easy" ? "Keep it simple" : d === "medium" ? "Standard" : "Go deeper"}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end gap-2 rounded-2xl border border-border bg-card p-2 focus-within:ring-2 focus-within:ring-ring">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void submit(input);
                  }
                }}
                placeholder={exhausted ? "You've used today's AI messages." : "Ask your tutor anything…"}
                rows={1}
                maxLength={4000}
                disabled={streaming}
                className="max-h-40 min-h-9 resize-none border-0 bg-transparent px-2 py-1.5 shadow-none focus-visible:ring-0"
              />
              {streaming ? (
                <Button size="icon" variant="outline" onClick={stop} aria-label="Stop generating">
                  <Square className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  size="icon"
                  onClick={() => submit(input)}
                  disabled={!input.trim() || exhausted}
                  aria-label="Send message"
                >
                  <Send className="h-4 w-4" />
                </Button>
              )}
            </div>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              Starvia can make mistakes. Always check important answers with your textbook.
            </p>
          </div>
        </div>
      </div>

      <LimitDialog
        open={Boolean(limit)}
        onOpenChange={(open) => !open && setLimit(null)}
        featureLabel="AI tutor messages"
        limit={limit?.limit ?? 5}
      />
    </div>
  );
}

"use client";

import * as React from "react";
import { Layers, Plus, RotateCcw, Sparkles, ThumbsDown, ThumbsUp, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/ui/empty-state";
import { apiFetch, ApiClientError } from "@/lib/api/client";
import { useApp } from "@/components/providers/app-provider";
import { LimitDialog } from "@/components/billing/limit-dialog";
import type { FlashcardWithProgress } from "@/types/content";

/** Flashcard studio: study loop, manual creation, and AI generation. */
export function FlashcardStudio({
  initialCards,
  subjects,
  defaults,
}: {
  initialCards: FlashcardWithProgress[];
  subjects: string[];
  defaults: { classLevel: string; board: string };
}) {
  const { refresh, applyLocalUsage, usage } = useApp();
  const [cards, setCards] = React.useState(initialCards);
  const [limit, setLimit] = React.useState<number | null>(null);

  function upsertCards(next: FlashcardWithProgress[]) {
    setCards((prev) => [...next, ...prev]);
  }

  function removeCard(id: string) {
    setCards((prev) => prev.filter((c) => c.id !== id));
  }

  return (
    <Tabs defaultValue={cards.length ? "study" : "generate"} className="space-y-6">
      <TabsList>
        <TabsTrigger value="study">Study</TabsTrigger>
        <TabsTrigger value="generate">Generate with AI</TabsTrigger>
        <TabsTrigger value="create">Create manually</TabsTrigger>
      </TabsList>

      <TabsContent value="study">
        <StudyMode
          cards={cards}
          onReview={(id, status) =>
            setCards((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)))
          }
          onDelete={removeCard}
        />
      </TabsContent>

      <TabsContent value="generate">
        <GenerateDeck
          subjects={subjects}
          defaults={defaults}
          onGenerated={upsertCards}
          onLimit={setLimit}
          remaining={usage?.remaining.flashcards}
          onUsed={() => {
            applyLocalUsage("flashcards", 1);
            void refresh();
          }}
        />
      </TabsContent>

      <TabsContent value="create">
        <CreateCard subjects={subjects} onCreated={upsertCards} />
      </TabsContent>

      <LimitDialog
        open={limit !== null}
        onOpenChange={(open) => !open && setLimit(null)}
        featureLabel="AI flashcard decks"
        limit={limit ?? 2}
      />
    </Tabs>
  );
}

function StudyMode({
  cards,
  onReview,
  onDelete,
}: {
  cards: FlashcardWithProgress[];
  onReview: (id: string, status: "known" | "unknown") => void;
  onDelete: (id: string) => void;
}) {
  const [index, setIndex] = React.useState(0);
  const [flipped, setFlipped] = React.useState(false);

  const current = cards[index];
  const known = cards.filter((c) => c.status === "known").length;
  const reviewed = cards.filter((c) => c.status !== "unseen").length;

  React.useEffect(() => {
    setFlipped(false);
  }, [index]);

  async function review(status: "known" | "unknown") {
    if (!current) return;
    onReview(current.id, status);
    try {
      await apiFetch("/api/ai/flashcards", {
        method: "PATCH",
        json: { flashcardId: current.id, status },
      });
    } catch {
      /* review state is optimistic; a failure is not worth blocking on */
    }
    setIndex((i) => Math.min(i + 1, cards.length));
  }

  async function remove(id: string) {
    try {
      await apiFetch(`/api/ai/flashcards?id=${id}`, { method: "DELETE" });
      onDelete(id);
      setIndex((i) => Math.max(0, Math.min(i, cards.length - 2)));
    } catch {
      toast.error("We couldn't delete that card.");
    }
  }

  if (!cards.length) {
    return (
      <EmptyState
        icon={<Layers className="h-5 w-5" />}
        title="No flashcards yet"
        description="Generate a deck for a topic, or write your own cards. They'll all be saved here."
      />
    );
  }

  if (!current) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 pt-10 pb-10 text-center">
          <h2 className="text-base font-semibold">Deck reviewed</h2>
          <p className="text-sm text-muted-foreground">
            You marked {known} of {cards.length} cards as known.
          </p>
          <Button variant="outline" onClick={() => setIndex(0)}>
            <RotateCcw className="h-4 w-4" />
            Review again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Progress value={(reviewed / cards.length) * 100} className="h-1 flex-1" />
        <span className="text-xs tabular-nums text-muted-foreground">
          {index + 1} / {cards.length}
        </span>
      </div>

      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        className="block w-full text-left"
        aria-label="Flip card"
      >
        <Card className="min-h-56 transition-colors hover:bg-muted/30">
          <CardContent className="flex min-h-56 flex-col items-center justify-center gap-4 p-8 text-center">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              {flipped ? "Answer" : "Question"}
            </span>
            <p className="text-base font-medium text-balance">
              {flipped ? current.back : current.front}
            </p>
            <span className="text-xs text-muted-foreground">Tap to flip</span>
          </CardContent>
        </Card>
      </button>

      <div className="flex items-center justify-center gap-3">
        <Button variant="outline" onClick={() => review("unknown")}>
          <ThumbsDown className="h-4 w-4" />
          Still learning
        </Button>
        <Button onClick={() => review("known")}>
          <ThumbsUp className="h-4 w-4" />
          I know this
        </Button>
      </div>

      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => remove(current.id)}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete this card
        </button>
      </div>
    </div>
  );
}

function GenerateDeck({
  subjects,
  defaults,
  onGenerated,
  onLimit,
  onUsed,
  remaining,
}: {
  subjects: string[];
  defaults: { classLevel: string; board: string };
  onGenerated: (cards: FlashcardWithProgress[]) => void;
  onLimit: (limit: number) => void;
  onUsed: () => void;
  remaining: number | null | undefined;
}) {
  const [subject, setSubject] = React.useState(subjects[0] ?? "Science");
  const [topic, setTopic] = React.useState("");
  const [count, setCount] = React.useState(10);
  const [loading, setLoading] = React.useState(false);

  const exhausted = remaining !== null && remaining !== undefined && remaining <= 0;

  async function generate(event: React.FormEvent) {
    event.preventDefault();
    if (topic.trim().length < 2) {
      toast.error("Enter a topic to build a deck from.");
      return;
    }
    setLoading(true);
    try {
      const data = await apiFetch<{
        flashcards: {
          id: string;
          deck_name: string | null;
          subject: string | null;
          topic: string | null;
          front: string;
          back: string;
          source: string;
          created_at: string;
        }[];
      }>("/api/ai/flashcards", {
        method: "POST",
        json: {
          classLevel: defaults.classLevel,
          board: defaults.board,
          subject,
          topic: topic.trim(),
          count,
        },
      });
      onGenerated(
        data.flashcards.map((c) => ({ ...c, status: "unseen" as const, reviewCount: 0 })),
      );
      onUsed();
      toast.success(`${data.flashcards.length} cards added.`);
      setTopic("");
    } catch (error) {
      if (error instanceof ApiClientError && error.isLimitReached) {
        onLimit(error.details?.limit ?? 2);
      } else {
        toast.error(
          error instanceof ApiClientError ? error.message : "Something went wrong. Please try again.",
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate a deck</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={generate} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="fc-subject">Subject</Label>
              <select
                id="fc-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
              >
                {(subjects.length ? subjects : ["Science", "Mathematics", "English"]).map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fc-count">Cards</Label>
              <select
                id="fc-count"
                value={String(count)}
                onChange={(e) => setCount(Number(e.target.value))}
                className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
              >
                {[6, 10, 15, 20].map((c) => (
                  <option key={c} value={c}>
                    {c} cards
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fc-topic">Topic</Label>
              <Input
                id="fc-topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Cell organelles"
                maxLength={200}
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              {remaining === null || remaining === undefined
                ? "Unlimited decks"
                : `${remaining} deck${remaining === 1 ? "" : "s"} left today`}
            </p>
            <Button type="submit" loading={loading} disabled={exhausted}>
              <Sparkles className="h-4 w-4" />
              {loading ? "Building…" : "Generate deck"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function CreateCard({
  subjects,
  onCreated,
}: {
  subjects: string[];
  onCreated: (cards: FlashcardWithProgress[]) => void;
}) {
  const [deckName, setDeckName] = React.useState("My deck");
  const [subject, setSubject] = React.useState(subjects[0] ?? "");
  const [front, setFront] = React.useState("");
  const [back, setBack] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  async function create(event: React.FormEvent) {
    event.preventDefault();
    if (!front.trim() || !back.trim()) {
      toast.error("Add both a question and an answer.");
      return;
    }
    setSaving(true);
    try {
      const data = await apiFetch<{
        flashcard: {
          id: string;
          deck_name: string | null;
          subject: string | null;
          topic: string | null;
          front: string;
          back: string;
          source: string;
          created_at: string;
        };
      }>("/api/ai/flashcards", {
        method: "PUT",
        json: { deckName, subject: subject || null, front: front.trim(), back: back.trim() },
      });
      onCreated([{ ...data.flashcard, status: "unseen", reviewCount: 0 }]);
      setFront("");
      setBack("");
      toast.success("Card added.");
    } catch (error) {
      toast.error(
        error instanceof ApiClientError ? error.message : "Something went wrong. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create a card</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={create} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="deck-name">Deck name</Label>
              <Input
                id="deck-name"
                value={deckName}
                onChange={(e) => setDeckName(e.target.value)}
                maxLength={120}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="card-subject">Subject</Label>
              <select
                id="card-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
              >
                <option value="">None</option>
                {(subjects.length ? subjects : ["Science", "Mathematics", "English"]).map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="card-front">Question</Label>
            <Textarea
              id="card-front"
              value={front}
              onChange={(e) => setFront(e.target.value)}
              rows={2}
              maxLength={600}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="card-back">Answer</Label>
            <Textarea
              id="card-back"
              value={back}
              onChange={(e) => setBack(e.target.value)}
              rows={3}
              maxLength={2000}
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" loading={saving}>
              <Plus className="h-4 w-4" />
              Add card
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

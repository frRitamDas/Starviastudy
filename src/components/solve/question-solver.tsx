"use client";

import * as React from "react";
import { ImagePlus, ScanSearch, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Markdown } from "@/components/shared/markdown";
import { CopyButton } from "@/components/shared/copy-button";
import { apiFetch, ApiClientError } from "@/lib/api/client";
import { useApp } from "@/components/providers/app-provider";
import { LimitDialog } from "@/components/billing/limit-dialog";
import { cn } from "@/lib/utils";

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const ACCEPTED = ["image/png", "image/jpeg", "image/webp"];

/**
 * Question solver.
 *
 * Images are downscaled on the client before upload to keep requests small and
 * cheap — the model gets a legible page, not a 12-megapixel photo. The server
 * still validates size and mime type.
 */
export function QuestionSolver({
  subjects,
  classLevel,
  board,
}: {
  subjects: string[];
  classLevel: string | null;
  board: string | null;
}) {
  const { refresh, applyLocalUsage, usage } = useApp();
  const [question, setQuestion] = React.useState("");
  const [subject, setSubject] = React.useState("");
  const [image, setImage] = React.useState<{ dataUrl: string; base64: string; mime: string } | null>(
    null,
  );
  const [answer, setAnswer] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [limit, setLimit] = React.useState<{ label: string; limit: number } | null>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);

  async function onPickImage(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!ACCEPTED.includes(file.type)) {
      toast.error("Use a PNG, JPG or WebP image.");
      return;
    }

    try {
      const dataUrl = await downscale(file);
      const base64 = dataUrl.split(",")[1] ?? "";
      setImage({ dataUrl, base64, mime: "image/jpeg" });
    } catch {
      toast.error("We couldn't read that image. Try another one.");
    }
  }

  async function solve() {
    if (!question.trim() && !image) {
      toast.error("Type a question or attach an image.");
      return;
    }
    setLoading(true);
    setAnswer(null);
    try {
      const data = await apiFetch<{ answer: string }>("/api/ai/solve", {
        method: "POST",
        json: {
          question: question.trim() || undefined,
          subject: subject || undefined,
          imageBase64: image?.base64,
          imageMimeType: image?.mime,
        },
      });
      setAnswer(data.answer);
      applyLocalUsage(image ? "image_solve" : "solve", 1);
      void refresh();
    } catch (error) {
      if (error instanceof ApiClientError && error.isLimitReached) {
        setLimit({
          label: image ? "image questions" : "solved questions",
          limit: error.details?.limit ?? (image ? 1 : 5),
        });
      } else {
        toast.error(
          error instanceof ApiClientError ? error.message : "Something went wrong. Please try again.",
        );
      }
    } finally {
      setLoading(false);
    }
  }

  const remaining = image ? usage?.remaining.image_solve : usage?.remaining.solve;

  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-2">
            <Label htmlFor="question">Your question</Label>
            <Textarea
              id="question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Paste or type the question here — include the full question and any options."
              rows={5}
              maxLength={4000}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              aria-label="Subject"
              className="h-9 rounded-lg border border-border bg-background px-2 text-sm"
            >
              <option value="">Any subject</option>
              {(subjects.length ? subjects : ["Mathematics", "Science", "English"]).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <input
              ref={fileRef}
              type="file"
              accept={ACCEPTED.join(",")}
              onChange={onPickImage}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileRef.current?.click()}
            >
              <ImagePlus className="h-4 w-4" />
              Attach image
            </Button>

            {classLevel && board ? (
              <span className="text-xs text-muted-foreground">
                Answered for {classLevel} · {board}
              </span>
            ) : null}
          </div>

          {image ? (
            <div className="relative w-fit">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.dataUrl}
                alt="Attached question"
                className="max-h-56 rounded-xl border border-border object-contain"
              />
              <button
                type="button"
                onClick={() => setImage(null)}
                aria-label="Remove image"
                className="absolute -right-2 -top-2 rounded-full border border-border bg-background p-1 shadow-sm"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : null}

          <div className="flex items-center justify-between gap-3 pt-1">
            <p className="text-xs text-muted-foreground">
              {remaining === null || remaining === undefined
                ? "Unlimited today"
                : `${remaining} ${image ? "image question" : "question"}${remaining === 1 ? "" : "s"} left today`}
            </p>
            <Button onClick={solve} loading={loading}>
              <ScanSearch className="h-4 w-4" />
              {loading ? "Working it out…" : "Solve step by step"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card>
          <CardContent className="space-y-3 pt-6">
            <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
            <div className="h-3 w-full animate-pulse rounded bg-muted" />
            <div className="h-3 w-5/6 animate-pulse rounded bg-muted" />
            <div className="h-3 w-4/6 animate-pulse rounded bg-muted" />
          </CardContent>
        </Card>
      ) : null}

      {answer ? (
        <Card className={cn("animate-fade-up")}>
          <CardContent className="pt-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Step-by-step solution</h2>
              <CopyButton value={answer} label="Copy" />
            </div>
            <Markdown>{answer}</Markdown>
          </CardContent>
        </Card>
      ) : null}

      <LimitDialog
        open={limit !== null}
        onOpenChange={(open) => !open && setLimit(null)}
        featureLabel={limit?.label ?? "questions"}
        limit={limit?.limit ?? 5}
      />
    </div>
  );
}

/** Downscale and re-encode a photo so uploads stay small. */
async function downscale(file: File): Promise<string> {
  if (file.size <= MAX_IMAGE_BYTES && file.type === "image/jpeg") {
    return await fileToDataUrl(file);
  }
  const dataUrl = await fileToDataUrl(file);
  const img = document.createElement("img");
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("image_load_failed"));
    img.src = dataUrl;
  });

  const maxDimension = 1600;
  const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.85);
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("file_read_failed"));
    reader.readAsDataURL(file);
  });
}

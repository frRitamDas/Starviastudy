"use client";

import * as React from "react";
import { RefreshCw, ThumbsDown, ThumbsUp } from "lucide-react";
import { Markdown } from "@/components/shared/markdown";
import { CopyButton } from "@/components/shared/copy-button";
import { cn } from "@/lib/utils";

/** A single tutor turn. Student messages are compact; answers are full width. */
export function MessageBubble({
  role,
  content,
  streaming,
  feedback,
  onFeedback,
  onRegenerate,
  className,
}: {
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
  feedback?: "helpful" | "not_helpful" | null;
  onFeedback?: (rating: "helpful" | "not_helpful") => void;
  onRegenerate?: () => void;
  className?: string;
}) {
  if (role === "user") {
    return (
      <div className={cn("flex justify-end", className)}>
        <div className="max-w-[85%] rounded-2xl rounded-br-md border border-border bg-muted/60 px-4 py-2.5 text-sm whitespace-pre-wrap text-pretty">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("group flex flex-col gap-2", className)}>
      <div className="rounded-2xl rounded-bl-md border border-border bg-card px-4 py-3.5">
        <Markdown>{content}</Markdown>
        {streaming ? (
          <span className="mt-1 inline-block h-4 w-1.5 animate-blink bg-foreground align-middle" />
        ) : null}
      </div>

      {!streaming && content ? (
        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
          <CopyButton value={content} />
          {onRegenerate ? (
            <button
              type="button"
              onClick={onRegenerate}
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Regenerate
            </button>
          ) : null}
          {onFeedback ? (
            <>
              <button
                type="button"
                onClick={() => onFeedback("helpful")}
                aria-pressed={feedback === "helpful"}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors hover:bg-muted",
                  feedback === "helpful" ? "text-foreground" : "text-muted-foreground",
                )}
              >
                <ThumbsUp className="h-3.5 w-3.5" />
                Helpful
              </button>
              <button
                type="button"
                onClick={() => onFeedback("not_helpful")}
                aria-pressed={feedback === "not_helpful"}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors hover:bg-muted",
                  feedback === "not_helpful" ? "text-foreground" : "text-muted-foreground",
                )}
              >
                <ThumbsDown className="h-3.5 w-3.5" />
                Not helpful
              </button>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/** Shown while the first tokens are still arriving. */
export function ThinkingBubble() {
  return (
    <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-border bg-card px-4 py-3.5">
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" />
    </div>
  );
}

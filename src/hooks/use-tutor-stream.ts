"use client";

import * as React from "react";
import { ApiClientError, type LimitDetails } from "@/lib/api/client";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  feedback?: "helpful" | "not_helpful" | null;
  streaming?: boolean;
}

interface StreamMeta {
  conversationId: string;
}

/**
 * Tutor streaming hook.
 *
 * Reads the server-sent event stream from `/api/ai/tutor` and appends deltas
 * as they arrive. The daily limit is enforced server-side — if the server says
 * no, we surface the limit error rather than pretending the message was sent.
 */
export function useTutorStream(options: {
  onConversationCreated?: (id: string) => void;
  onLimitReached?: (details: LimitDetails | undefined) => void;
}) {
  const { onConversationCreated, onLimitReached } = options;
  const [streaming, setStreaming] = React.useState(false);
  const abortRef = React.useRef<AbortController | null>(null);

  const send = React.useCallback(
    async (params: {
      message: string;
      conversationId: string | null;
      subject?: string | null;
      topic?: string | null;
      difficulty?: string | null;
      onDelta: (text: string) => void;
      onDone: (payload: { conversationId: string; messageId: string }) => void;
    }) => {
      setStreaming(true);
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const response = await fetch("/api/ai/tutor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: params.message,
            conversationId: params.conversationId,
            subject: params.subject,
            topic: params.topic,
            difficulty: params.difficulty,
          }),
          signal: controller.signal,
        });

        // A non-stream error response is JSON in the standard envelope.
        if (!response.ok && response.headers.get("content-type")?.includes("application/json")) {
          const body = await response.json().catch(() => null);
          const code = body?.error?.code ?? "INTERNAL";
          const details = body?.error?.details as LimitDetails | undefined;
          if (code === "LIMIT_REACHED" || code === "PAYMENT_REQUIRED") {
            onLimitReached?.(details);
          }
          throw new ApiClientError(code, body?.error?.message ?? "AI is temporarily unavailable.");
        }

        if (!response.body) {
          throw new ApiClientError(
            "AI_UNAVAILABLE",
            "AI is temporarily unavailable. Please try again.",
          );
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let conversationId = params.conversationId ?? "";
        let messageId = "";
        let streamError: string | null = null;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const events = buffer.split("\n\n");
          buffer = events.pop() ?? "";

          for (const raw of events) {
            const lines = raw.split("\n");
            let eventName = "message";
            let dataRaw = "";
            for (const line of lines) {
              if (line.startsWith("event:")) eventName = line.slice(6).trim();
              else if (line.startsWith("data:")) dataRaw += line.slice(5).trim();
            }
            if (!dataRaw) continue;

            let payload: Record<string, unknown> = {};
            try {
              payload = JSON.parse(dataRaw);
            } catch {
              continue;
            }

            if (eventName === "meta") {
              const meta = payload as unknown as StreamMeta;
              conversationId = meta.conversationId;
              if (!params.conversationId) onConversationCreated?.(conversationId);
            } else if (eventName === "delta") {
              params.onDelta(String(payload.text ?? ""));
            } else if (eventName === "done") {
              messageId = String(payload.messageId ?? "");
              conversationId = String(payload.conversationId ?? conversationId);
            } else if (eventName === "error") {
              streamError = String(
                payload.message ?? "AI is temporarily unavailable. Please try again.",
              );
            }
          }
        }

        if (streamError) {
          throw new ApiClientError("AI_UNAVAILABLE", streamError);
        }

        params.onDone({ conversationId, messageId });
      } finally {
        setStreaming(false);
        abortRef.current = null;
      }
    },
    [onConversationCreated, onLimitReached],
  );

  const stop = React.useCallback(() => {
    abortRef.current?.abort();
    setStreaming(false);
  }, []);

  return { send, stop, streaming };
}

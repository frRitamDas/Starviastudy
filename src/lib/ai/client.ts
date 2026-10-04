import "server-only";

import { getGemini, modelFor, withRetry, toProviderError } from "./provider";

/**
 * Thin, typed helpers over the Gemini SDK. Only this file knows the SDK shape.
 */

export interface TextPart {
  text: string;
}

export interface InlineImagePart {
  inlineData: { mimeType: string; data: string };
}

export type Part = TextPart | InlineImagePart;

export interface GenerateTextOptions {
  systemInstruction?: string;
  temperature?: number;
  maxOutputTokens?: number;
  /** Ask the model for JSON output. */
  json?: boolean;
  vision?: boolean;
  /** Abort signal so a cancelled request stops billing. */
  signal?: AbortSignal;
}

/** Single-shot text (or JSON) generation. */
export async function generateText(
  prompt: string | Part[],
  options: GenerateTextOptions = {},
): Promise<{ text: string; model: string }> {
  const model = modelFor(options.vision ? "vision" : "text");
  const contents =
    typeof prompt === "string" ? [{ text: prompt }] : prompt;

  const result = await withRetry(() =>
    getGemini().models.generateContent({
      model,
      contents,
      config: {
        systemInstruction: options.systemInstruction,
        temperature: options.temperature ?? 0.7,
        maxOutputTokens: options.maxOutputTokens ?? 4096,
        responseMimeType: options.json ? "application/json" : "text/plain",
        abortSignal: options.signal,
      },
    }),
  );

  return { text: result.text ?? "", model };
}

/** Streaming text generation. Yields incremental text chunks. */
export async function* streamText(
  prompt: string | Part[],
  options: GenerateTextOptions = {},
): AsyncGenerator<string, void, unknown> {
  const model = modelFor(options.vision ? "vision" : "text");
  const contents = typeof prompt === "string" ? [{ text: prompt }] : prompt;

  let stream: Awaited<ReturnType<ReturnType<typeof getGemini>["models"]["generateContentStream"]>>;
  try {
    stream = await getGemini().models.generateContentStream({
      model,
      contents,
      config: {
        systemInstruction: options.systemInstruction,
        temperature: options.temperature ?? 0.7,
        maxOutputTokens: options.maxOutputTokens ?? 4096,
        abortSignal: options.signal,
      },
    });
  } catch (error) {
    throw toProviderError(error);
  }

  for await (const chunk of stream) {
    const text = chunk.text;
    if (text) yield text;
  }
}

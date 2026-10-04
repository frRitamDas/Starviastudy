import "server-only";

import { extractJson } from "@/lib/utils";
import { generateText, streamText, type Part } from "./client";
import { cacheKey, readCache, writeCache } from "./cache";
import { logAiEvent, timed } from "./events";
import {
  FLASHCARD_SYSTEM_PROMPT,
  EXAM_PREP_SYSTEM_PROMPT,
  QUIZ_SYSTEM_PROMPT,
  SOLVE_SYSTEM_PROMPT,
  TUTORIAL_SYSTEM_PROMPT,
  TUTOR_SYSTEM_PROMPT,
  studentProfileBlock,
  tutorUserPrompt,
  type StudentContext,
} from "./prompts";
import {
  examPrepSchema,
  flashcardSchema,
  normaliseQuestion,
  quizSchema,
  tutorialSchema,
  type ExamPrepContent,
  type FlashcardContent,
  type QuizContent,
  type TutorialContent,
} from "./schemas";
import { AiProviderError } from "./provider";

/**
 * Starvia's AI service.
 *
 * Every feature calls one of these functions. They own caching, validation,
 * telemetry and safe error messages. Routes never touch the SDK directly.
 */

// ---------------------------------------------------------------------------
// AI Tutor
// ---------------------------------------------------------------------------

/** Non-streaming tutor answer. Used for regenerate and non-stream clients. */
export async function generateTutorResponse(params: {
  userId: string;
  message: string;
  ctx: StudentContext;
  subject?: string | null;
  topic?: string | null;
  difficulty?: string | null;
  history?: { role: "user" | "assistant"; content: string }[];
}): Promise<{ text: string; model: string }> {
  const prompt = tutorUserPrompt(params);
  const { value, latencyMs } = await timed(() =>
    generateText(prompt, {
      systemInstruction: TUTOR_SYSTEM_PROMPT,
      temperature: 0.6,
      maxOutputTokens: 4096,
    }),
  );

  await logAiEvent({
    userId: params.userId,
    feature: "tutor",
    model: value.model,
    status: "ok",
    latencyMs,
  });

  return value;
}

/** Streaming tutor answer. Yields incremental Markdown. */
export async function* streamTutorResponse(params: {
  userId: string;
  message: string;
  ctx: StudentContext;
  subject?: string | null;
  topic?: string | null;
  difficulty?: string | null;
  history?: { role: "user" | "assistant"; content: string }[];
  signal?: AbortSignal;
}): AsyncGenerator<string, void, unknown> {
  const prompt = tutorUserPrompt(params);
  const start = Date.now();
  let produced = false;

  try {
    for await (const chunk of streamText(prompt, {
      systemInstruction: TUTOR_SYSTEM_PROMPT,
      temperature: 0.6,
      maxOutputTokens: 4096,
      signal: params.signal,
    })) {
      produced = true;
      yield chunk;
    }
    await logAiEvent({
      userId: params.userId,
      feature: "tutor",
      status: "ok",
      latencyMs: Date.now() - start,
    });
  } catch (error) {
    await logAiEvent({
      userId: params.userId,
      feature: "tutor",
      status: "error",
      latencyMs: Date.now() - start,
      error: error instanceof Error ? error.message : "unknown",
    });
    if (produced) return; // Partial answer already streamed; stop quietly.
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Tutorial generator
// ---------------------------------------------------------------------------

export interface TutorialRequest {
  userId: string;
  classLevel: string;
  board: string;
  subject: string;
  chapter?: string | null;
  topic: string;
  difficulty: string;
  ctx: StudentContext;
}

export async function generateTutorial(
  req: TutorialRequest,
): Promise<{ content: TutorialContent; cached: boolean; cacheKey: string }> {
  const key = cacheKey([
    "tutorial-v1",
    req.board,
    req.classLevel,
    req.subject,
    req.chapter,
    req.topic,
    req.difficulty,
  ]);

  const cached = await readCache<TutorialContent>("tutorial", key);
  if (cached) {
    await logAiEvent({ userId: req.userId, feature: "tutorial", status: "cached", cached: true });
    return { content: cached, cached: true, cacheKey: key };
  }

  const prompt = `${studentProfileBlock(req.ctx)}

Create a complete study tutorial.

- Board: ${req.board}
- Class: ${req.classLevel}
- Subject: ${req.subject}
- Chapter: ${req.chapter || "not specified"}
- Topic: ${req.topic}
- Difficulty: ${req.difficulty}

Return only the JSON object described in your instructions.`;

  const { value, latencyMs } = await timed(() =>
    generateText(prompt, {
      systemInstruction: TUTORIAL_SYSTEM_PROMPT,
      temperature: 0.55,
      maxOutputTokens: 8192,
      json: true,
    }),
  );

  const parsed = extractJson(value.text);
  const validated = tutorialSchema.safeParse(parsed);
  if (!validated.success) {
    await logAiEvent({
      userId: req.userId,
      feature: "tutorial",
      model: value.model,
      status: "error",
      latencyMs,
      error: "schema_validation_failed",
    });
    throw new AiProviderError("Could not generate a tutorial. Please try again.", true);
  }

  await writeCache("tutorial", key, validated.data);
  await logAiEvent({
    userId: req.userId,
    feature: "tutorial",
    model: value.model,
    status: "ok",
    latencyMs,
  });

  return { content: validated.data, cached: false, cacheKey: key };
}

// ---------------------------------------------------------------------------
// Quiz generator
// ---------------------------------------------------------------------------

export interface QuizRequest {
  userId: string;
  classLevel: string;
  board: string;
  subject: string;
  chapter?: string | null;
  topic?: string | null;
  difficulty: string;
  count: number;
  types?: ("mcq" | "true_false" | "short_answer")[];
  ctx: StudentContext;
}

export async function generateQuiz(
  req: QuizRequest,
): Promise<{ content: QuizContent; cached: boolean; cacheKey: string }> {
  const types = req.types?.length ? req.types : ["mcq", "true_false", "short_answer"];
  const key = cacheKey([
    "quiz-v1",
    req.board,
    req.classLevel,
    req.subject,
    req.chapter,
    req.topic,
    req.difficulty,
    req.count,
    types.join(","),
  ]);

  const cached = await readCache<QuizContent>("quiz", key);
  if (cached) {
    await logAiEvent({ userId: req.userId, feature: "quiz", status: "cached", cached: true });
    return { content: cached, cached: true, cacheKey: key };
  }

  const prompt = `${studentProfileBlock(req.ctx)}

Create a quiz with exactly ${req.count} questions.

- Board: ${req.board}
- Class: ${req.classLevel}
- Subject: ${req.subject}
- Chapter: ${req.chapter || "not specified"}
- Topic: ${req.topic || "general"}
- Difficulty: ${req.difficulty}
- Allowed question types: ${types.join(", ")}

Return only the JSON object described in your instructions.`;

  const { value, latencyMs } = await timed(() =>
    generateText(prompt, {
      systemInstruction: QUIZ_SYSTEM_PROMPT,
      temperature: 0.6,
      maxOutputTokens: 8192,
      json: true,
    }),
  );

  const parsed = extractJson(value.text);
  const validated = quizSchema.safeParse(parsed);
  if (!validated.success) {
    await logAiEvent({
      userId: req.userId,
      feature: "quiz",
      model: value.model,
      status: "error",
      latencyMs,
      error: "schema_validation_failed",
    });
    throw new AiProviderError("Could not generate a quiz. Please try again.", true);
  }

  const content: QuizContent = {
    title: validated.data.title,
    questions: validated.data.questions.slice(0, req.count).map(normaliseQuestion),
  };

  await writeCache("quiz", key, content);
  await logAiEvent({
    userId: req.userId,
    feature: "quiz",
    model: value.model,
    status: "ok",
    latencyMs,
  });

  return { content, cached: false, cacheKey: key };
}

// ---------------------------------------------------------------------------
// Question solver (text or image)
// ---------------------------------------------------------------------------

export interface SolveRequest {
  userId: string;
  question?: string;
  image?: { mimeType: string; base64: string };
  subject?: string | null;
  ctx: StudentContext;
}

export async function solveQuestion(
  req: SolveRequest,
): Promise<{ text: string; model: string; cached: boolean }> {
  const useVision = Boolean(req.image);
  const key = req.image
    ? null
    : cacheKey(["solve-v1", req.subject, req.question ?? "", req.ctx.classLevel, req.ctx.board]);

  if (key) {
    const cached = await readCache<{ text: string; model: string }>("solve", key);
    if (cached) {
      await logAiEvent({
        userId: req.userId,
        feature: useVision ? "image_solve" : "solve",
        status: "cached",
        cached: true,
      });
      return { ...cached, cached: true };
    }
  }

  const instructions = `${studentProfileBlock(req.ctx)}

${req.subject ? `The student says this is a ${req.subject} question.` : "Identify the subject yourself."}

${
  req.image
    ? "Solve the question shown in the attached image. Read it carefully, including any diagrams, formulas or handwriting."
    : `Solve this question:\n\n${req.question}`
}

Follow the required answer structure exactly.`;

  const parts: Part[] = [];
  if (req.image) {
    parts.push({ inlineData: { mimeType: req.image.mimeType, data: req.image.base64 } });
  }
  parts.push({ text: instructions });

  const { value, latencyMs } = await timed(() =>
    generateText(parts, {
      systemInstruction: SOLVE_SYSTEM_PROMPT,
      temperature: 0.4,
      maxOutputTokens: 4096,
      vision: useVision,
    }),
  );

  if (!value.text.trim()) {
    await logAiEvent({
      userId: req.userId,
      feature: useVision ? "image_solve" : "solve",
      model: value.model,
      status: "error",
      latencyMs,
      error: "empty_response",
    });
    throw new AiProviderError("Could not read that question. Please try again.", true);
  }

  if (key) await writeCache("solve", key, { text: value.text, model: value.model });
  await logAiEvent({
    userId: req.userId,
    feature: useVision ? "image_solve" : "solve",
    model: value.model,
    status: "ok",
    latencyMs,
  });

  return { text: value.text, model: value.model, cached: false };
}

// ---------------------------------------------------------------------------
// Flashcards
// ---------------------------------------------------------------------------

export interface FlashcardRequest {
  userId: string;
  classLevel: string;
  board: string;
  subject: string;
  topic: string;
  count: number;
  ctx: StudentContext;
}

export async function generateFlashcards(
  req: FlashcardRequest,
): Promise<{ content: FlashcardContent; cached: boolean; cacheKey: string }> {
  const key = cacheKey(["flashcards-v1", req.board, req.classLevel, req.subject, req.topic, req.count]);

  const cached = await readCache<FlashcardContent>("flashcards", key);
  if (cached) {
    await logAiEvent({ userId: req.userId, feature: "flashcards", status: "cached", cached: true });
    return { content: cached, cached: true, cacheKey: key };
  }

  const prompt = `${studentProfileBlock(req.ctx)}

Create ${req.count} revision flashcards.

- Board: ${req.board}
- Class: ${req.classLevel}
- Subject: ${req.subject}
- Topic: ${req.topic}

Return only the JSON object described in your instructions.`;

  const { value, latencyMs } = await timed(() =>
    generateText(prompt, {
      systemInstruction: FLASHCARD_SYSTEM_PROMPT,
      temperature: 0.6,
      maxOutputTokens: 4096,
      json: true,
    }),
  );

  const parsed = extractJson(value.text);
  const validated = flashcardSchema.safeParse(parsed);
  if (!validated.success) {
    await logAiEvent({
      userId: req.userId,
      feature: "flashcards",
      model: value.model,
      status: "error",
      latencyMs,
      error: "schema_validation_failed",
    });
    throw new AiProviderError("Could not generate flashcards. Please try again.", true);
  }

  await writeCache("flashcards", key, validated.data);
  await logAiEvent({
    userId: req.userId,
    feature: "flashcards",
    model: value.model,
    status: "ok",
    latencyMs,
  });

  return { content: validated.data, cached: false, cacheKey: key };
}

// ---------------------------------------------------------------------------
// Exam preparation
// ---------------------------------------------------------------------------

export interface ExamPrepRequest {
  userId: string;
  classLevel: string;
  board: string;
  subject: string;
  chapter?: string | null;
  examType: string;
  days: number;
  ctx: StudentContext;
}

export async function generateExamPrep(
  req: ExamPrepRequest,
): Promise<{ content: ExamPrepContent; cached: boolean; cacheKey: string }> {
  const key = cacheKey([
    "exam-prep-v1",
    req.board,
    req.classLevel,
    req.subject,
    req.chapter,
    req.examType,
    req.days,
  ]);

  const cached = await readCache<ExamPrepContent>("exam_prep", key);
  if (cached) {
    await logAiEvent({ userId: req.userId, feature: "exam_prep", status: "cached", cached: true });
    return { content: cached, cached: true, cacheKey: key };
  }

  const prompt = `${studentProfileBlock(req.ctx)}

Build an exam preparation plan.

- Board: ${req.board}
- Class: ${req.classLevel}
- Subject: ${req.subject}
- Chapter / scope: ${req.chapter || "full syllabus"}
- Exam type: ${req.examType}
- Days available: ${req.days}

Return only the JSON object described in your instructions.`;

  const { value, latencyMs } = await timed(() =>
    generateText(prompt, {
      systemInstruction: EXAM_PREP_SYSTEM_PROMPT,
      temperature: 0.55,
      maxOutputTokens: 8192,
      json: true,
    }),
  );

  const parsed = extractJson(value.text);
  const validated = examPrepSchema.safeParse(parsed);
  if (!validated.success) {
    await logAiEvent({
      userId: req.userId,
      feature: "exam_prep",
      model: value.model,
      status: "error",
      latencyMs,
      error: "schema_validation_failed",
    });
    throw new AiProviderError("Could not build an exam plan. Please try again.", true);
  }

  await writeCache("exam_prep", key, validated.data);
  await logAiEvent({
    userId: req.userId,
    feature: "exam_prep",
    model: value.model,
    status: "ok",
    latencyMs,
  });

  return { content: validated.data, cached: false, cacheKey: key };
}

import { z } from "zod";

/**
 * Zod schemas for every structured AI response.
 * The model's JSON is validated here before it ever reaches the database or UI,
 * so a malformed generation fails loudly instead of corrupting stored content.
 */

export const tutorialSchema = z.object({
  title: z.string().min(1).max(200),
  learningObjectives: z.array(z.string()).default([]),
  introduction: z.string().default(""),
  sections: z
    .array(z.object({ heading: z.string(), content: z.string() }))
    .default([]),
  examples: z
    .array(z.object({ question: z.string(), solution: z.string() }))
    .default([]),
  importantTerms: z
    .array(z.object({ term: z.string(), definition: z.string() }))
    .default([]),
  examTips: z.array(z.string()).default([]),
  commonMistakes: z.array(z.string()).default([]),
  practiceQuestions: z
    .array(z.object({ question: z.string(), answer: z.string() }))
    .default([]),
  summary: z.string().default(""),
});
export type TutorialContent = z.infer<typeof tutorialSchema>;

export const quizQuestionSchema = z.object({
  type: z.enum(["mcq", "true_false", "short_answer"]).default("mcq"),
  question: z.string().min(1),
  options: z.array(z.string()).optional(),
  correctAnswer: z.string().min(1),
  explanation: z.string().default(""),
});
export type GeneratedQuizQuestion = z.infer<typeof quizQuestionSchema>;

export const quizSchema = z.object({
  title: z.string().default("Quiz"),
  questions: z.array(quizQuestionSchema).min(1),
});
export type QuizContent = z.infer<typeof quizSchema>;

export const flashcardSchema = z.object({
  deckName: z.string().default("New deck"),
  cards: z
    .array(z.object({ front: z.string().min(1), back: z.string().min(1) }))
    .min(1),
});
export type FlashcardContent = z.infer<typeof flashcardSchema>;

export const examPrepSchema = z.object({
  overview: z.string().default(""),
  revisionPlan: z
    .array(
      z.object({
        day: z.coerce.number().default(1),
        focus: z.string(),
        tasks: z.array(z.string()).default([]),
      }),
    )
    .default([]),
  importantTopics: z
    .array(
      z.object({
        topic: z.string(),
        why: z.string().default(""),
        priority: z.enum(["high", "medium", "low"]).default("medium"),
      }),
    )
    .default([]),
  practiceQuestions: z
    .array(z.object({ question: z.string(), answer: z.string() }))
    .default([]),
  mcqs: z
    .array(
      z.object({
        question: z.string(),
        options: z.array(z.string()).default([]),
        correctAnswer: z.string(),
        explanation: z.string().default(""),
      }),
    )
    .default([]),
  weakAreaRecommendations: z.array(z.string()).default([]),
  examTips: z.array(z.string()).default([]),
});
export type ExamPrepContent = z.infer<typeof examPrepSchema>;

/** Normalise a generated question so options/answers are always consistent. */
export function normaliseQuestion(q: GeneratedQuizQuestion): GeneratedQuizQuestion {
  if (q.type === "true_false") {
    return {
      ...q,
      options: ["True", "False"],
      correctAnswer: /^true$/i.test(q.correctAnswer.trim()) ? "True" : "False",
    };
  }
  if (q.type === "mcq") {
    const options = q.options ?? [];
    if (!options.length) {
      // Degrade to a short-answer question rather than storing an unanswerable MCQ.
      return { ...q, type: "short_answer", options: undefined };
    }
    const match = options.find(
      (o) => o.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase(),
    );
    return { ...q, options, correctAnswer: match ?? options[0] };
  }
  return { ...q, options: undefined };
}

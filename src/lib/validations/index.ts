import { z } from "zod";
import { BOARDS, CLASS_LEVELS, DIFFICULTIES, LEARNING_LEVELS, TOPIC_STATUSES } from "@/lib/education";

/**
 * Request validation. Every API route parses its body through one of these,
 * so malformed or hostile input is rejected before it reaches business logic.
 */

export const emailSchema = z
  .string()
  .trim()
  .min(3)
  .max(254)
  .email("Enter a valid email address.");

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(72, "Password is too long.");

export const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  fullName: z.string().trim().min(1, "Enter your name.").max(120),
});

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password."),
});

export const resetRequestSchema = z.object({ email: emailSchema });

export const onboardingSchema = z.object({
  fullName: z.string().trim().min(1, "Enter your name.").max(120),
  classLevel: z.enum(CLASS_LEVELS),
  board: z.enum(BOARDS),
  subjects: z.array(z.string().trim().min(1).max(60)).min(1, "Pick at least one subject.").max(12),
  learningLevel: z.enum(LEARNING_LEVELS.map((l) => l.value) as [string, ...string[]]),
  examTarget: z.string().trim().max(80).optional().nullable(),
});

export const profileUpdateSchema = onboardingSchema.partial().extend({
  avatarUrl: z.string().url().max(500).optional().nullable(),
});

export const tutorMessageSchema = z.object({
  conversationId: z.string().uuid().optional().nullable(),
  message: z.string().trim().min(1, "Type a question first.").max(4000),
  subject: z.string().trim().max(80).optional().nullable(),
  topic: z.string().trim().max(160).optional().nullable(),
  difficulty: z.enum(DIFFICULTIES).optional().nullable(),
});

export const tutorialRequestSchema = z.object({
  classLevel: z.enum(CLASS_LEVELS),
  board: z.enum(BOARDS),
  subject: z.string().trim().min(1).max(80),
  chapter: z.string().trim().max(160).optional().nullable(),
  topic: z.string().trim().min(2, "Describe the topic.").max(200),
  difficulty: z.enum(DIFFICULTIES),
});

export const quizRequestSchema = z.object({
  classLevel: z.enum(CLASS_LEVELS),
  board: z.enum(BOARDS),
  subject: z.string().trim().min(1).max(80),
  chapter: z.string().trim().max(160).optional().nullable(),
  topic: z.string().trim().max(200).optional().nullable(),
  difficulty: z.enum(DIFFICULTIES),
  count: z.coerce.number().int().min(3).max(20),
  types: z.array(z.enum(["mcq", "true_false", "short_answer"])).min(1).max(3).optional(),
});

export const quizSubmitSchema = z.object({
  quizId: z.string().uuid(),
  answers: z
    .array(z.object({ questionId: z.string().uuid(), answer: z.string().max(2000) }))
    .min(1)
    .max(50),
  durationSeconds: z.coerce.number().int().min(0).max(36000).optional(),
});

export const solveRequestSchema = z
  .object({
    question: z.string().trim().max(4000).optional(),
    subject: z.string().trim().max(80).optional().nullable(),
    /** Base64 image payload (data URL stripped client-side). */
    imageBase64: z.string().max(8_000_000).optional(),
    imageMimeType: z
      .enum(["image/png", "image/jpeg", "image/webp", "image/heic", "image/heif"])
      .optional(),
  })
  .refine((v) => Boolean(v.question?.trim()) || Boolean(v.imageBase64), {
    message: "Type a question or attach an image.",
  })
  .refine((v) => !v.imageBase64 || Boolean(v.imageMimeType), {
    message: "Image type is required when attaching an image.",
  });

export const flashcardGenerateSchema = z.object({
  classLevel: z.enum(CLASS_LEVELS),
  board: z.enum(BOARDS),
  subject: z.string().trim().min(1).max(80),
  topic: z.string().trim().min(2).max(200),
  count: z.coerce.number().int().min(4).max(30),
});

export const flashcardManualSchema = z.object({
  deckName: z.string().trim().min(1).max(120),
  subject: z.string().trim().max(80).optional().nullable(),
  topic: z.string().trim().max(160).optional().nullable(),
  front: z.string().trim().min(1).max(600),
  back: z.string().trim().min(1).max(2000),
});

export const flashcardReviewSchema = z.object({
  flashcardId: z.string().uuid(),
  status: z.enum(["known", "unknown"]),
});

export const examPrepRequestSchema = z.object({
  classLevel: z.enum(CLASS_LEVELS),
  board: z.enum(BOARDS),
  subject: z.string().trim().min(1).max(80),
  chapter: z.string().trim().max(160).optional().nullable(),
  examType: z.string().trim().min(1).max(80),
  days: z.coerce.number().int().min(1).max(60),
});

export const topicStatusSchema = z.object({
  subject: z.string().trim().min(1).max(80),
  chapter: z.string().trim().max(160).default("General"),
  topic: z.string().trim().min(1).max(200),
  status: z.enum(TOPIC_STATUSES),
});

export const feedbackSchema = z.object({
  messageId: z.string().uuid().optional().nullable(),
  rating: z.enum(["helpful", "not_helpful"]).optional().nullable(),
  comment: z.string().trim().max(2000).optional().nullable(),
  context: z.string().trim().max(80).optional().nullable(),
});

export const checkoutSchema = z.object({
  plan: z.enum(["pro", "ultra"]),
});

export const checkoutVerifySchema = z.object({
  plan: z.enum(["pro", "ultra"]),
  orderId: z.string().trim().min(1).max(120),
  paymentId: z.string().trim().min(1).max(120),
  signature: z.string().trim().min(1).max(300),
});

export const conversationActionSchema = z.object({
  conversationId: z.string().uuid(),
});

export const contactSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(200),
  topic: z.string().trim().min(1).max(60),
  message: z.string().trim().min(10).max(4000),
});

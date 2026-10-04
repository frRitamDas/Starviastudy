/**
 * Client-facing content shapes.
 *
 * These mirror the validated AI schemas in `src/lib/ai/schemas.ts` — the model
 * is always asked for JSON in these forms, and the server validates before
 * anything is stored or rendered.
 */

export interface TutorialSection {
  heading: string;
  content: string;
}

export interface TutorialExample {
  question: string;
  solution: string;
}

export interface TutorialTerm {
  term: string;
  definition: string;
}

export interface PracticeQuestion {
  question: string;
  answer: string;
}

export interface TutorialContent {
  title: string;
  learningObjectives: string[];
  introduction: string;
  sections: TutorialSection[];
  examples: TutorialExample[];
  importantTerms: TutorialTerm[];
  examTips: string[];
  commonMistakes: string[];
  practiceQuestions: PracticeQuestion[];
  summary: string;
}

export type QuestionType = "mcq" | "true_false" | "short_answer";

export interface QuizQuestionContent {
  type: QuestionType;
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
}

export interface QuizContent {
  title: string;
  questions: QuizQuestionContent[];
}

export interface FlashcardContent {
  deckName: string;
  cards: { front: string; back: string }[];
}

export interface ExamPlanContent {
  overview: string;
  revisionPlan: { day: number; focus: string; tasks: string[] }[];
  importantTopics: { topic: string; why: string; priority: "high" | "medium" | "low" }[];
  practiceQuestions: PracticeQuestion[];
  mcqs: { question: string; options: string[]; correctAnswer: string; explanation: string }[];
  weakAreaRecommendations: string[];
  examTips: string[];
}

/** A stored quiz question as sent to the browser — never includes the answer. */
export interface PublicQuizQuestion {
  id: string;
  type: QuestionType;
  question: string;
  options: string[] | null;
  topic: string | null;
}

/** Flashcards as returned by the flashcards API (with review status merged). */
export interface FlashcardWithProgress {
  id: string;
  deck_name: string | null;
  subject: string | null;
  topic: string | null;
  front: string;
  back: string;
  source: string;
  status: "known" | "unknown" | "unseen";
  reviewCount: number;
  created_at: string;
}

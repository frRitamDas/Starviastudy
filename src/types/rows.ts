/** Shapes for rows that are read directly from Supabase in server components. */

export interface TutorialRow {
  id: string;
  title: string;
  subject: string;
  topic: string;
  difficulty: string;
  is_complete: boolean;
  created_at: string;
}

export interface QuizAttemptRow {
  id: string;
  score: number;
  total: number;
  created_at: string;
  quiz_id: string | null;
  quizzes: { title: string; subject: string } | null;
}

export interface StudyTopicRow {
  subject: string;
  chapter: string;
  topic: string;
  status: "not_started" | "learning" | "practiced" | "mastered";
  mastery: number;
  updated_at: string;
}

export interface FlashcardRow {
  id: string;
  front: string;
  back: string;
  subject: string | null;
  topic: string | null;
  created_at: string;
  flashcard_progress: { status: string }[] | null;
}

export interface ConversationRow {
  id: string;
  title: string;
  subject: string | null;
  topic: string | null;
  created_at: string;
  updated_at: string;
}

export interface MessageRow {
  id: string;
  role: "user" | "assistant";
  content: string;
  feedback: "helpful" | "not_helpful" | null;
  created_at: string;
}

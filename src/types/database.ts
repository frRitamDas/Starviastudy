/**
 * Hand-maintained database types for the Starvia Supabase schema.
 * Mirrors `supabase/migrations/0001_init.sql`.
 *
 * Regenerate with the Supabase CLI after schema changes:
 *   npx supabase gen types typescript --project-id <id> > src/types/database.ts
 */

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          avatar_url: string | null;
          class_level: string | null;
          board: string | null;
          subjects: string[];
          learning_level: string | null;
          exam_target: string | null;
          onboarded: boolean;
          role: string;
          xp: number;
          level: number;
          current_streak: number;
          longest_streak: number;
          last_active_date: string | null;
          study_minutes: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & { id: string };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
        Relationships: [];
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          plan: string;
          status: string;
          provider: string;
          provider_customer_id: string | null;
          provider_subscription_id: string | null;
          provider_order_id: string | null;
          current_period_start: string | null;
          current_period_end: string | null;
          cancel_at_period_end: boolean;
          cancelled_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["subscriptions"]["Row"]> & {
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["subscriptions"]["Row"]>;
        Relationships: [];
      };
      payments: {
        Row: {
          id: string;
          user_id: string;
          plan: string;
          amount: number;
          currency: string;
          status: string;
          mode: string;
          provider: string;
          provider_order_id: string | null;
          provider_payment_id: string | null;
          provider_signature: string | null;
          notes: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["payments"]["Row"]> & {
          user_id: string;
          plan: string;
          amount: number;
        };
        Update: Partial<Database["public"]["Tables"]["payments"]["Row"]>;
        Relationships: [];
      };
      ai_usage: {
        Row: {
          id: string;
          user_id: string;
          feature: string;
          usage_date: string;
          count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["ai_usage"]["Row"]> & {
          user_id: string;
          feature: string;
        };
        Update: Partial<Database["public"]["Tables"]["ai_usage"]["Row"]>;
        Relationships: [];
      };
      ai_events: {
        Row: {
          id: string;
          user_id: string | null;
          feature: string;
          model: string | null;
          status: string;
          latency_ms: number | null;
          tokens: number | null;
          cached: boolean;
          error: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["ai_events"]["Row"]> & {
          feature: string;
          status: string;
        };
        Update: Partial<Database["public"]["Tables"]["ai_events"]["Row"]>;
        Relationships: [];
      };
      conversations: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          subject: string | null;
          topic: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["conversations"]["Row"]> & {
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["conversations"]["Row"]>;
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          user_id: string;
          role: string;
          content: string;
          model: string | null;
          tokens: number | null;
          feedback: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["messages"]["Row"]> & {
          conversation_id: string;
          user_id: string;
          role: string;
          content: string;
        };
        Update: Partial<Database["public"]["Tables"]["messages"]["Row"]>;
        Relationships: [];
      };
      tutorials: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          class_level: string | null;
          board: string | null;
          subject: string;
          chapter: string | null;
          topic: string;
          difficulty: string;
          content: Json;
          is_complete: boolean;
          progress: number;
          cache_key: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["tutorials"]["Row"]> & {
          user_id: string;
          subject: string;
          topic: string;
          cache_key: string;
          content: Json;
        };
        Update: Partial<Database["public"]["Tables"]["tutorials"]["Row"]>;
        Relationships: [];
      };
      quizzes: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          class_level: string | null;
          board: string | null;
          subject: string;
          chapter: string | null;
          topic: string | null;
          difficulty: string;
          question_count: number;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["quizzes"]["Row"]> & {
          user_id: string;
          subject: string;
        };
        Update: Partial<Database["public"]["Tables"]["quizzes"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey";
            columns: ["id"];
            isOneToOne: false;
            referencedRelation: "quiz_attempts";
            referencedColumns: ["quiz_id"];
          },
        ];
      };
      quiz_questions: {
        Row: {
          id: string;
          quiz_id: string;
          user_id: string;
          order_index: number;
          type: string;
          question: string;
          options: Json | null;
          correct_answer: string;
          explanation: string | null;
          topic: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["quiz_questions"]["Row"]> & {
          quiz_id: string;
          user_id: string;
          question: string;
          correct_answer: string;
        };
        Update: Partial<Database["public"]["Tables"]["quiz_questions"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey";
            columns: ["quiz_id"];
            isOneToOne: false;
            referencedRelation: "quizzes";
            referencedColumns: ["id"];
          },
        ];
      };
      quiz_attempts: {
        Row: {
          id: string;
          quiz_id: string;
          user_id: string;
          score: number;
          total: number;
          answers: Json;
          weak_topics: string[];
          duration_seconds: number | null;
          completed_at: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["quiz_attempts"]["Row"]> & {
          quiz_id: string;
          user_id: string;
          score: number;
          total: number;
          answers: Json;
        };
        Update: Partial<Database["public"]["Tables"]["quiz_attempts"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey";
            columns: ["quiz_id"];
            isOneToOne: false;
            referencedRelation: "quizzes";
            referencedColumns: ["id"];
          },
        ];
      };
      flashcards: {
        Row: {
          id: string;
          user_id: string;
          deck_name: string;
          subject: string | null;
          topic: string | null;
          front: string;
          back: string;
          source: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["flashcards"]["Row"]> & {
          user_id: string;
          deck_name: string;
          front: string;
          back: string;
        };
        Update: Partial<Database["public"]["Tables"]["flashcards"]["Row"]>;
        Relationships: [];
      };
      flashcard_progress: {
        Row: {
          id: string;
          flashcard_id: string;
          user_id: string;
          status: string;
          review_count: number;
          last_reviewed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["flashcard_progress"]["Row"]> & {
          flashcard_id: string;
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["flashcard_progress"]["Row"]>;
        Relationships: [];
      };
      study_progress: {
        Row: {
          id: string;
          user_id: string;
          subject: string;
          chapter: string;
          topic: string;
          status: string;
          mastery: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["study_progress"]["Row"]> & {
          user_id: string;
          subject: string;
          topic: string;
        };
        Update: Partial<Database["public"]["Tables"]["study_progress"]["Row"]>;
        Relationships: [];
      };
      achievements: {
        Row: {
          id: string;
          user_id: string;
          key: string;
          title: string;
          description: string | null;
          icon: string | null;
          unlocked_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["achievements"]["Row"]> & {
          user_id: string;
          key: string;
          title: string;
        };
        Update: Partial<Database["public"]["Tables"]["achievements"]["Row"]>;
        Relationships: [];
      };
      feedback: {
        Row: {
          id: string;
          user_id: string | null;
          message_id: string | null;
          rating: string | null;
          comment: string | null;
          context: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["feedback"]["Row"]> & {
          user_id?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["feedback"]["Row"]>;
        Relationships: [];
      };
      plan_limits: {
        Row: {
          plan: string;
          limits: Json;
          updated_at: string;
        };
        Insert: { plan: string; limits: Json };
        Update: Partial<Database["public"]["Tables"]["plan_limits"]["Row"]>;
        Relationships: [];
      };
      content_cache: {
        Row: {
          id: string;
          kind: string;
          cache_key: string;
          payload: Json;
          hits: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["content_cache"]["Row"]> & {
          kind: string;
          cache_key: string;
          payload: Json;
        };
        Update: Partial<Database["public"]["Tables"]["content_cache"]["Row"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      increment_ai_usage: {
        Args: { p_user_id: string; p_feature: string; p_date: string; p_amount?: number };
        Returns: number;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

export type Profile = Tables<"profiles">;
export type Subscription = Tables<"subscriptions">;
export type Payment = Tables<"payments">;
export type AiUsage = Tables<"ai_usage">;
export type AiEvent = Tables<"ai_events">;
export type Conversation = Tables<"conversations">;
export type Message = Tables<"messages">;
export type Tutorial = Tables<"tutorials">;
export type Quiz = Tables<"quizzes">;
export type QuizQuestion = Tables<"quiz_questions">;
export type QuizAttempt = Tables<"quiz_attempts">;
export type Flashcard = Tables<"flashcards">;
export type FlashcardProgress = Tables<"flashcard_progress">;
export type StudyProgress = Tables<"study_progress">;
export type Achievement = Tables<"achievements">;
export type Feedback = Tables<"feedback">;

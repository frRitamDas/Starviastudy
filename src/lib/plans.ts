/**
 * Central plan + limit configuration.
 *
 * This is the ONE place daily AI limits and feature flags are defined.
 * The frontend never hard-codes a limit — it reads whatever the server reports
 * via `getUsageSnapshot()`, so changing a number here changes it everywhere.
 *
 * A DB-backed override table (`plan_limits`) can supersede these defaults at
 * runtime without a redeploy — see `src/lib/usage/limits.ts`.
 */

export type PlanId = "free" | "pro" | "ultra";

/** Every metered AI action. Add a key here and it flows through the whole system. */
export type UsageFeature =
  | "tutor"
  | "tutorial"
  | "quiz"
  | "image_solve"
  | "solve"
  | "flashcards"
  | "exam_prep";

export interface PlanDefinition {
  id: PlanId;
  name: string;
  /** Price in paise (INR). 0 = free. */
  priceMonthly: number;
  /** Price shown on pricing page (rupees). */
  priceLabel: string;
  description: string;
  /** `null` means unlimited. */
  limits: Record<UsageFeature, number | null>;
  features: string[];
  /** Ordering / emphasis on the pricing page. */
  highlighted?: boolean;
  badge?: string;
}

export const PLANS: Record<PlanId, PlanDefinition> = {
  free: {
    id: "free",
    name: "Free",
    priceMonthly: 0,
    priceLabel: "₹0",
    description: "Everything you need to start learning with AI today.",
    limits: {
      tutor: 5,
      tutorial: 2,
      quiz: 3,
      image_solve: 1,
      solve: 5,
      flashcards: 1,
      exam_prep: 1,
    },
    features: [
      "5 AI tutor messages per day",
      "2 AI tutorials per day",
      "3 AI quizzes per day",
      "1 image question per day",
      "Basic progress tracking",
      "Daily streak and XP",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    priceMonthly: 9900,
    priceLabel: "₹99",
    description: "For students who study with AI every day.",
    highlighted: true,
    badge: "Most popular",
    limits: {
      tutor: 30,
      tutorial: 5,
      quiz: 10,
      image_solve: 5,
      solve: 30,
      flashcards: 5,
      exam_prep: 5,
    },
    features: [
      "30 AI tutor messages per day",
      "5 AI tutorials per day",
      "10 AI quizzes per day",
      "5 image questions per day",
      "Advanced exam preparation",
      "Advanced progress analytics",
      "Flashcard generation",
      "Full study streak history",
    ],
  },
  ultra: {
    id: "ultra",
    name: "Ultra",
    priceMonthly: 24900,
    priceLabel: "₹249",
    description: "Maximum AI access for serious board exam preparation.",
    badge: "Best value",
    limits: {
      tutor: 100,
      tutorial: 15,
      quiz: 30,
      image_solve: 15,
      solve: 100,
      flashcards: 15,
      exam_prep: 15,
    },
    features: [
      "100 AI tutor messages per day",
      "15 AI tutorials per day",
      "30 AI quizzes per day",
      "15 image questions per day",
      "Priority AI access",
      "Advanced exam preparation",
      "Unlimited flashcard sets",
      "Everything in Pro",
    ],
  },
};

export const PLAN_ORDER: PlanId[] = ["free", "pro", "ultra"];

export const FEATURE_LABELS: Record<UsageFeature, string> = {
  tutor: "AI tutor messages",
  tutorial: "AI tutorials",
  quiz: "AI quizzes",
  image_solve: "image questions",
  solve: "question solves",
  flashcards: "flashcard sets",
  exam_prep: "exam prep plans",
};

export function isPlanId(value: unknown): value is PlanId {
  return value === "free" || value === "pro" || value === "ultra";
}

export function getPlan(plan: PlanId | string | null | undefined): PlanDefinition {
  return PLANS[isPlanId(plan) ? plan : "free"];
}

/** Rank a plan so we can compare tiers (upgrade/downgrade logic). */
export function planRank(plan: PlanId): number {
  return PLAN_ORDER.indexOf(plan);
}

export function isUpgrade(from: PlanId, to: PlanId) {
  return planRank(to) > planRank(from);
}

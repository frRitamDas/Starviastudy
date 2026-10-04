import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { todayInTZ } from "@/lib/utils";
import type { Profile } from "@/types/database";

/**
 * Gamification: XP, levels, streaks and achievements.
 *
 * Deliberately understated — the numbers are real but the presentation stays
 * premium rather than playful.
 */

export interface LevelInfo {
  level: number;
  title: string;
  /** XP at the start of this level. */
  minXp: number;
  /** XP needed to reach the next level (null at the top). */
  nextLevelXp: number | null;
  /** 0..1 progress toward the next level. */
  progress: number;
}

/** Level thresholds. Increasing gaps so later levels feel earned. */
const LEVELS: { level: number; title: string; minXp: number }[] = [
  { level: 1, title: "Beginner", minXp: 0 },
  { level: 2, title: "Explorer", minXp: 100 },
  { level: 3, title: "Learner", minXp: 300 },
  { level: 4, title: "Achiever", minXp: 650 },
  { level: 5, title: "Scholar", minXp: 1200 },
  { level: 6, title: "High Achiever", minXp: 2000 },
  { level: 7, title: "Topper", minXp: 3200 },
  { level: 8, title: "Master", minXp: 5000 },
  { level: 9, title: "Star", minXp: 7500 },
  { level: 10, title: "Starvia Legend", minXp: 11000 },
];

export function levelFromXp(xp: number): LevelInfo {
  let current = LEVELS[0];
  let next: (typeof LEVELS)[number] | null = null;
  for (let i = 0; i < LEVELS.length; i++) {
    if (xp >= LEVELS[i].minXp) {
      current = LEVELS[i];
      next = LEVELS[i + 1] ?? null;
    }
  }
  const span = next ? next.minXp - current.minXp : 1;
  const progress = next ? Math.min(Math.max((xp - current.minXp) / span, 0), 1) : 1;
  return {
    level: current.level,
    title: current.title,
    minXp: current.minXp,
    nextLevelXp: next?.minXp ?? null,
    progress,
  };
}

/** XP awarded per activity. Kept here so it is easy to rebalance. */
export const XP_AWARDS = {
  tutor_message: 5,
  tutorial_complete: 40,
  quiz_complete: 20,
  quiz_perfect: 25,
  solve_question: 10,
  flashcard_review: 2,
  exam_prep: 30,
  topic_mastered: 50,
  daily_login: 5,
} as const;

export type XpAction = keyof typeof XP_AWARDS;

export interface AchievementDefinition {
  key: string;
  title: string;
  description: string;
  icon: string;
  /** Predicate over the user's current stats. */
  check: (stats: AchievementStats) => boolean;
}

export interface AchievementStats {
  xp: number;
  currentStreak: number;
  longestStreak: number;
  tutorialsCompleted: number;
  quizzesCompleted: number;
  questionsAsked: number;
  topicsMastered: number;
}

export const ACHIEVEMENTS: AchievementDefinition[] = [
  { key: "first_step", title: "First Step", description: "Ask your first AI question.", icon: "Sparkles", check: (s) => s.questionsAsked >= 1 },
  { key: "curious_mind", title: "Curious Mind", description: "Ask 25 AI questions.", icon: "Brain", check: (s) => s.questionsAsked >= 25 },
  { key: "streak_3", title: "Getting Consistent", description: "Study 3 days in a row.", icon: "Flame", check: (s) => s.currentStreak >= 3 },
  { key: "streak_7", title: "Week Warrior", description: "Study 7 days in a row.", icon: "Flame", check: (s) => s.currentStreak >= 7 },
  { key: "streak_30", title: "Unstoppable", description: "Study 30 days in a row.", icon: "Trophy", check: (s) => s.currentStreak >= 30 },
  { key: "first_tutorial", title: "Chapter One", description: "Complete your first tutorial.", icon: "BookOpen", check: (s) => s.tutorialsCompleted >= 1 },
  { key: "tutorial_10", title: "Well Read", description: "Complete 10 tutorials.", icon: "Library", check: (s) => s.tutorialsCompleted >= 10 },
  { key: "first_quiz", title: "Test Drive", description: "Complete your first quiz.", icon: "ListChecks", check: (s) => s.quizzesCompleted >= 1 },
  { key: "quiz_25", title: "Quiz Machine", description: "Complete 25 quizzes.", icon: "Medal", check: (s) => s.quizzesCompleted >= 25 },
  { key: "master_5", title: "Mastering It", description: "Master 5 topics.", icon: "Star", check: (s) => s.topicsMastered >= 5 },
  { key: "xp_1000", title: "Thousand Club", description: "Earn 1000 XP.", icon: "Zap", check: (s) => s.xp >= 1000 },
];

/**
 * Award XP, update the streak, and unlock any newly earned achievements.
 * Returns what changed so the UI can celebrate subtly.
 */
export async function awardProgress(params: {
  userId: string;
  action: XpAction;
  /** Additional XP on top of the action's base award. */
  bonusXp?: number;
  /** Optional override for streak-eligible activity. */
  countsAsActivity?: boolean;
}): Promise<{
  xp: number;
  level: number;
  levelUp: boolean;
  currentStreak: number;
  unlocked: AchievementDefinition[];
}> {
  const supabase = createAdminClient();
  const today = todayInTZ();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", params.userId)
    .maybeSingle();

  const before = profile as Profile | null;
  const baseXp = XP_AWARDS[params.action] ?? 0;
  const gained = baseXp + (params.bonusXp ?? 0);

  const prevXp = before?.xp ?? 0;
  const newXp = prevXp + gained;
  const prevLevel = levelFromXp(prevXp).level;
  const newLevel = levelFromXp(newXp).level;

  const countsAsActivity = params.countsAsActivity ?? true;
  let currentStreak = before?.current_streak ?? 0;
  let longestStreak = before?.longest_streak ?? 0;
  let lastActive = before?.last_active_date ?? null;

  if (countsAsActivity && lastActive !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(yesterday);

    currentStreak = lastActive === yesterdayStr ? currentStreak + 1 : 1;
    longestStreak = Math.max(longestStreak, currentStreak);
    lastActive = today;
  }

  await supabase
    .from("profiles")
    .update({
      xp: newXp,
      level: newLevel,
      current_streak: currentStreak,
      longest_streak: longestStreak,
      last_active_date: lastActive,
    })
    .eq("id", params.userId);

  // Recompute stats for achievement checks.
  const stats = await getAchievementStats(params.userId);
  const { data: existing } = await supabase
    .from("achievements")
    .select("key")
    .eq("user_id", params.userId);
  const owned = new Set((existing ?? []).map((a) => a.key));

  const newlyUnlocked = ACHIEVEMENTS.filter((a) => !owned.has(a.key) && a.check(stats));
  if (newlyUnlocked.length) {
    await supabase.from("achievements").insert(
      newlyUnlocked.map((a) => ({
        user_id: params.userId,
        key: a.key,
        title: a.title,
        description: a.description,
        icon: a.icon,
      })),
    );
  }

  return {
    xp: newXp,
    level: newLevel,
    levelUp: newLevel > prevLevel,
    currentStreak,
    unlocked: newlyUnlocked,
  };
}

/** Aggregate the numbers achievement rules depend on. */
export async function getAchievementStats(userId: string): Promise<AchievementStats> {
  const supabase = createAdminClient();

  const [{ data: profile }, { count: tutorials }, { count: quizzes }, { count: mastered }, { count: questions }] =
    await Promise.all([
      supabase.from("profiles").select("xp, current_streak, longest_streak").eq("id", userId).maybeSingle(),
      supabase.from("tutorials").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("is_complete", true),
      supabase.from("quiz_attempts").select("id", { count: "exact", head: true }).eq("user_id", userId),
      supabase.from("study_progress").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("status", "mastered"),
      supabase.from("ai_events").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("feature", "tutor").eq("status", "ok"),
    ]);

  return {
    xp: profile?.xp ?? 0,
    currentStreak: profile?.current_streak ?? 0,
    longestStreak: profile?.longest_streak ?? 0,
    tutorialsCompleted: tutorials ?? 0,
    quizzesCompleted: quizzes ?? 0,
    questionsAsked: questions ?? 0,
    topicsMastered: mastered ?? 0,
  };
}

/** Record the daily login visit without inflating XP on every page load. */
export async function recordDailyVisit(userId: string) {
  const supabase = createAdminClient();
  const today = todayInTZ();
  const { data: profile } = await supabase
    .from("profiles")
    .select("last_active_date, xp, current_streak, longest_streak")
    .eq("id", userId)
    .maybeSingle();

  if (!profile || profile.last_active_date === today) return null;
  return awardProgress({ userId, action: "daily_login" });
}

"use client";

import * as React from "react";
import { apiFetch } from "@/lib/api/client";
import type { PlanId, UsageFeature } from "@/lib/plans";

/**
 * App context: the signed-in student's profile, plan and live usage.
 *
 * Usage lives here so every screen shows the same numbers. The server is still
 * the source of truth — this is a cache that the AI routes refresh after each
 * call, so a student cannot inflate their allowance by refreshing.
 */

export interface UsageLimits {
  limits: Record<UsageFeature, number | null>;
  used: Record<UsageFeature, number>;
  remaining: Record<UsageFeature, number | null>;
}

export interface AppProfile {
  fullName: string | null;
  classLevel: string | null;
  board: string | null;
  subjects: string[];
  learningLevel: string | null;
  examTarget: string | null;
  onboarded: boolean;
  xp: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
}

export interface UsageResponse extends UsageLimits {
  plan: PlanId;
  status: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  date: string;
  profile: AppProfile;
  context: Record<string, unknown>;
}

interface AppContextValue {
  usage: UsageResponse | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  applyLocalUsage: (feature: UsageFeature, delta: number) => void;
}

const AppContext = React.createContext<AppContextValue | null>(null);

export function AppProvider({
  children,
  initialUsage,
}: {
  children: React.ReactNode;
  initialUsage: UsageResponse | null;
}) {
  const [usage, setUsage] = React.useState<UsageResponse | null>(initialUsage);
  const [loading, setLoading] = React.useState(!initialUsage);
  const [error, setError] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    try {
      setError(null);
      const data = await apiFetch<UsageResponse>("/api/usage", { cache: "no-store" });
      setUsage(data);
    } catch {
      setError("We couldn't load your usage right now.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (!initialUsage) void refresh();
  }, [initialUsage, refresh]);

  /**
   * Optimistically reflect a server-approved change so the meter moves
   * immediately after an AI call. The next refresh reconciles it.
   */
  const applyLocalUsage = React.useCallback((feature: UsageFeature, delta: number) => {
    setUsage((prev) => {
      if (!prev) return prev;
      const limit = prev.limits[feature];
      const used = Math.max((prev.used[feature] ?? 0) + delta, 0);
      return {
        ...prev,
        used: { ...prev.used, [feature]: used },
        remaining: {
          ...prev.remaining,
          [feature]: limit === null ? null : Math.max(limit - used, 0),
        },
      };
    });
  }, []);

  const value = React.useMemo(
    () => ({ usage, loading, error, refresh, applyLocalUsage }),
    [usage, loading, error, refresh, applyLocalUsage],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = React.useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

/** Remaining units for a feature, or null when unlimited. */
export function remainingFor(usage: UsageResponse | null, feature: UsageFeature) {
  if (!usage) return null;
  return usage.remaining[feature];
}

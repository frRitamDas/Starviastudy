import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a number with thousands separators (en-IN by default). */
export function formatNumber(value: number, locale = "en-IN") {
  return new Intl.NumberFormat(locale).format(value);
}

/** Format paise/rupees as an INR string. */
export function formatINR(amount: number, opts: { paise?: boolean } = {}) {
  const rupees = opts.paise ? amount / 100 : amount;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: rupees % 1 === 0 ? 0 : 2,
  }).format(rupees);
}

export function formatDate(value: string | number | Date, opts?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...opts,
  }).format(new Date(value));
}

export function relativeTime(value: string | number | Date) {
  const date = new Date(value).getTime();
  const diff = Date.now() - date;
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(value);
}

/** Today's date as YYYY-MM-DD in a fixed timezone (default IST for Indian students). */
export function todayInTZ(timeZone = "Asia/Kolkata") {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function truncate(text: string, max = 120) {
  if (text.length <= max) return text;
  return `${text.slice(0, max).trimEnd()}…`;
}

export function initials(name: string | null | undefined) {
  if (!name) return "S";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function titleCase(text: string) {
  return text.replace(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase());
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

/** Safely parse JSON, returning null instead of throwing. */
export function safeJsonParse<T = unknown>(input: string): T | null {
  try {
    return JSON.parse(input) as T;
  } catch {
    return null;
  }
}

/** Strip code fences the model may wrap JSON in. */
export function extractJson<T = unknown>(raw: string): T | null {
  if (!raw) return null;
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = (fenced ? fenced[1] : raw).trim();
  const direct = safeJsonParse<T>(candidate);
  if (direct) return direct;
  const first = candidate.indexOf("{");
  const last = candidate.lastIndexOf("}");
  if (first !== -1 && last > first) {
    return safeJsonParse<T>(candidate.slice(first, last + 1));
  }
  return null;
}

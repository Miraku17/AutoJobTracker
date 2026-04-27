import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function jsonOk<T>(data: T, init?: ResponseInit) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
}

export function jsonError(message: string, status = 400, extra?: Record<string, unknown>) {
  return new Response(JSON.stringify({ error: message, ...(extra ?? {}) }), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export function safeJsonArray(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const v = JSON.parse(value);
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function hashUrl(url: string) {
  // simple normalized URL hash for duplicate detection (no crypto needed)
  const normalized = url
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/+$/, "")
    .split("?")[0];
  let h = 5381;
  for (let i = 0; i < normalized.length; i++) {
    h = ((h << 5) + h) ^ normalized.charCodeAt(i);
  }
  return (h >>> 0).toString(16);
}

export function formatDate(d: Date | string | null | undefined) {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function relativeTime(d: Date | string | null | undefined) {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "";
  const diff = (date.getTime() - Date.now()) / 1000;
  const abs = Math.abs(diff);
  const fmt = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  if (abs < 60) return fmt.format(Math.round(diff), "second");
  if (abs < 3600) return fmt.format(Math.round(diff / 60), "minute");
  if (abs < 86400) return fmt.format(Math.round(diff / 3600), "hour");
  if (abs < 86400 * 30) return fmt.format(Math.round(diff / 86400), "day");
  if (abs < 86400 * 365) return fmt.format(Math.round(diff / (86400 * 30)), "month");
  return fmt.format(Math.round(diff / (86400 * 365)), "year");
}

export const STATUSES = [
  { id: "saved", label: "Saved" },
  { id: "applied", label: "Applied" },
] as const;

export type StatusId = (typeof STATUSES)[number]["id"];

export function isStatus(s: string): s is StatusId {
  return STATUSES.some((x) => x.id === s);
}

export function statusColor(s: string) {
  switch (s) {
    case "applied":
      return "bg-status-applied/[0.08] text-status-applied border-status-applied/40";
    default:
      return "bg-paper-deep text-status-saved border-status-saved/40";
  }
}

export function statusDot(s: string) {
  switch (s) {
    case "applied":
      return "#5b9dff";
    default:
      return "#9aa8c2";
  }
}

export function employmentTypeColor(t: string | null | undefined): string {
  if (!t) return "bg-paper-deep border-rule text-ink-muted";
  switch (t.toLowerCase()) {
    case "full-time":
      return "bg-status-applied/[0.10] text-status-applied border-status-applied/50";
    case "part-time":
      return "bg-status-ghosted/[0.12] text-status-ghosted border-status-ghosted/50";
    case "gig":
      return "bg-status-offer/[0.12] text-status-offer border-status-offer/50";
    case "freelance":
      return "bg-status-interview/[0.12] text-status-interview border-status-interview/50";
    case "contract":
      return "bg-accent/[0.12] text-accent border-accent/50";
    case "intern":
      return "bg-status-saved/[0.15] text-status-saved border-status-saved/50";
    case "temporary":
      return "bg-status-rejected/[0.10] text-status-rejected border-status-rejected/50";
    default:
      return "bg-paper-deep border-rule text-ink-muted";
  }
}

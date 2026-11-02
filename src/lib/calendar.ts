import { SESSIONS } from "./data";
import { DAY_MS, MIN_MS, dayStartMs, fmtHM } from "./time";
import { buildEvent, dedupe } from "./events";
import type { NewsEvent } from "./types";

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

/**
 * Parse a Forex Factory weekly calendar export (JSON array of
 * { title, country (currency), date (ISO with offset), impact, forecast, previous }).
 * Unknown or malformed rows are skipped rather than failing the whole feed.
 */
export function parseFeed(raw: unknown): NewsEvent[] {
  if (!Array.isArray(raw)) return [];
  return dedupe(
    raw.map((item) => {
      if (!item || typeof item !== "object") return null;
      const r = item as Record<string, unknown>;
      return buildEvent({
        title: str(r.title),
        currency: str(r.country),
        impact: str(r.impact),
        atMs: Date.parse(str(r.date)),
        forecast: str(r.forecast),
        previous: str(r.previous),
      });
    }),
  );
}

/** Events that belong to a calendar date in the viewer's GMT offset. */
export function eventsForDay(events: NewsEvent[], dateKey: string, offsetMin: number) {
  const start = dayStartMs(dateKey, offsetMin);
  const end = start + DAY_MS;
  return events
    .filter((e) => (e.allDay ? e.dateKey === dateKey : e.atMs >= start && e.atMs < end))
    .sort((a, b) => Number(b.allDay) - Number(a.allDay) || a.atMs - b.atMs);
}

/* ---------- Market closure ---------- */

const dayOfWeek = (ms: number) => (Math.floor(ms / DAY_MS) + 4) % 7; // 0 = Sunday (epoch was a Thursday)

/** Forex weekend closure: Friday 22:00 UTC → Sunday 22:00 UTC (standard approximation). */
export function weekendClosures(startMs: number, endMs: number): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  const firstDay = Math.floor(startMs / DAY_MS) - 3;
  const lastDay = Math.floor(endMs / DAY_MS) + 1;
  for (let day = firstDay; day <= lastDay; day++) {
    if (dayOfWeek(day * DAY_MS) !== 5) continue;
    const from = day * DAY_MS + 22 * 60 * MIN_MS;
    const to = from + 48 * 60 * MIN_MS;
    const a = Math.max(from, startMs);
    const b = Math.min(to, endMs);
    if (b > a) out.push([a, b]);
  }
  return out;
}

export const isWeekendClosed = (ms: number) =>
  weekendClosures(ms, ms + 1).length > 0;

export interface DayStatus {
  /** The whole local day is closed (weekend or a global holiday). */
  fullyClosed: boolean;
  /** Closed windows inside the day, as local minutes [start, end]. */
  closedWindows: Array<[number, number]>;
  headline: string | null;
  notes: string[];
  /** Session id → reason, for sessions closed by a bank holiday that day. */
  closedSessions: Record<string, string>;
}

export function computeDayStatus(
  dateKey: string,
  offsetMin: number,
  dayEvents: NewsEvent[],
): DayStatus {
  const start = dayStartMs(dateKey, offsetMin);
  const end = start + DAY_MS;
  const windows = weekendClosures(start, end).map(
    ([a, b]) => [(a - start) / MIN_MS, (b - start) / MIN_MS] as [number, number],
  );

  const notes: string[] = [];
  const closedSessions: Record<string, string> = {};
  let headline: string | null = null;
  let fullyClosed = false;

  for (const [a, b] of windows) {
    if (a <= 0 && b >= 1440) {
      fullyClosed = true;
      headline = "Market closed — weekend";
    } else if (a > 0) {
      notes.push(`Market closes at ${fmtHM(a)} for the weekend`);
    } else {
      notes.push(`Market reopens at ${fmtHM(b)}`);
    }
  }

  for (const e of dayEvents) {
    if (e.impact !== "holiday") continue;
    if (e.country === "ALL") {
      fullyClosed = true;
      headline = headline ?? "Market closed — holiday";
      notes.push(`Holiday: ${e.title}`);
      continue;
    }
    const sessions = SESSIONS.filter((s) => s.currencies.includes(e.country));
    if (sessions.length === 0) {
      notes.push(`${e.country} holiday: ${e.title}`);
      continue;
    }
    for (const s of sessions) {
      closedSessions[s.id] = `${e.country} holiday: ${e.title}`;
      notes.push(`${s.name} session closed — ${e.country} holiday (${e.title})`);
    }
  }

  return { fullyClosed, closedWindows: windows, headline, notes, closedSessions };
}

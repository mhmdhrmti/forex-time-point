import { DAY_MS } from "./time";
import type { EventImpact, NewsEvent } from "./types";

export interface RawEvent {
  title: string;
  currency: string;
  /** Impact label as published ("High", "medium", "Holiday"…). */
  impact: string;
  /** Absolute instant in UTC milliseconds. */
  atMs: number;
  /** True when the source marks the item as "All Day". Sources that cannot say pass undefined. */
  allDayLabel?: boolean;
  forecast?: string;
  previous?: string;
}

const clean = (v: unknown) => (typeof v === "string" ? v.trim() : "");

/**
 * One place that turns a source row into a NewsEvent, so every source behaves the same.
 *
 * Forex Factory anchors true all-day holidays at 00:00 UTC of the holiday's calendar date
 * (e.g. Japan's Culture Day 3 Nov = 2026-11-03T00:00Z). Items with the "Holiday" impact at any other
 * time are notices such as "Daylight Saving Time Shift"; they are timed, and they do NOT close a market.
 */
export function buildEvent(raw: RawEvent): NewsEvent | null {
  const title = clean(raw.title);
  if (!title || !Number.isFinite(raw.atMs)) return null;

  const currency = (clean(raw.currency) || "ALL").toUpperCase();
  const label = clean(raw.impact).toLowerCase();

  let impact: EventImpact = "low";
  if (label.includes("high")) impact = "high";
  else if (label.includes("med")) impact = "medium";

  let allDay = false;
  let dateKey: string | undefined;
  if (label.includes("holiday")) {
    const atMidnightUtc = raw.atMs % DAY_MS === 0;
    if (raw.allDayLabel ?? atMidnightUtc) {
      allDay = true;
      impact = "holiday";
      dateKey = new Date(raw.atMs).toISOString().slice(0, 10);
    }
  }

  return {
    id: `${currency}|${title}|${raw.atMs}`,
    title,
    country: currency,
    impact,
    atMs: raw.atMs,
    allDay,
    dateKey,
    forecast: clean(raw.forecast) || undefined,
    previous: clean(raw.previous) || undefined,
  };
}

/** Add events to a list, skipping duplicates by id. */
export function dedupe(events: Array<NewsEvent | null>): NewsEvent[] {
  const seen = new Set<string>();
  const out: NewsEvent[] = [];
  for (const e of events) {
    if (!e || seen.has(e.id)) continue;
    seen.add(e.id);
    out.push(e);
  }
  return out;
}

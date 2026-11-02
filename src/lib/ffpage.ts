import { buildEvent, dedupe } from "./events";
import type { NewsEvent } from "./types";

/**
 * Parser for the Forex Factory calendar *web page* (used for weeks the public JSON export does not cover).
 *
 * The page renders its table in the browser, but ships all the data in an embedded
 * `window.calendarComponentStates[1] = { days: [ { dateline, events: [ … ] } ] }` block.
 * Every event carries an absolute epoch `dateline` (seconds), so the viewer's time zone does not matter.
 * Verified against the live page (week of 1 Nov 2026): events matched the public JSON feed one-for-one.
 *
 * Returns [] when the block is missing so callers can show a clear error.
 */

const MARKER = "calendarComponentStates[1] = {";
const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

/** Slice the JSON array that follows `days: ` using a string-aware bracket scan. */
function extractDays(html: string): unknown[] | null {
  const start = html.indexOf(MARKER);
  if (start < 0) return null;
  const daysAt = html.indexOf("days: [", start);
  if (daysAt < 0) return null;
  const open = daysAt + "days: ".length;

  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = open; i < html.length; i++) {
    const c = html[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (c === "\\") escaped = true;
      else if (c === '"') inString = false;
      continue;
    }
    if (c === '"') inString = true;
    else if (c === "[") depth++;
    else if (c === "]" && --depth === 0) {
      try {
        const parsed: unknown = JSON.parse(html.slice(open, i + 1));
        return Array.isArray(parsed) ? parsed : null;
      } catch {
        return null;
      }
    }
  }
  return null;
}

const str = (v: unknown) => (typeof v === "string" ? v : "");

export function parseFfPage(html: string): NewsEvent[] {
  const days = extractDays(html);
  if (!days) return [];
  const events: Array<NewsEvent | null> = [];
  for (const day of days) {
    const list = (day as { events?: unknown }).events;
    if (!Array.isArray(list)) continue;
    for (const item of list) {
      const e = item as Record<string, unknown>;
      const dateline = Number(e.dateline);
      events.push(
        buildEvent({
          title: str(e.name),
          currency: str(e.currency),
          impact: str(e.impactName),
          atMs: dateline * 1000,
          allDayLabel: /all\s*day/i.test(str(e.timeLabel)),
          forecast: str(e.forecast),
          previous: str(e.previous),
        }),
      );
    }
  }
  return dedupe(events);
}

/** Forex Factory's week URL parameter, e.g. 2026-11-01 -> "nov1.2026". */
export const ffWeekParam = (weekKey: string) => {
  const [y, m, d] = weekKey.split("-").map(Number);
  return `${MONTHS[m - 1]}${d}.${y}`;
};

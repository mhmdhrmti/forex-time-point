import { addDaysKey } from "./time";
import type { EventImpact, NewsEvent } from "./types";

/**
 * Best-effort parser for the Forex Factory calendar *web page* (used for weeks
 * the public JSON export does not cover). It reads the calendar table rows
 * (`calendar__row`, `calendar__time`, `calendar__currency`, `calendar__impact`,
 * `calendar__event`, `calendar__forecast`, `calendar__previous`) and assumes the
 * page was requested with its time zone set to UTC.
 *
 * Returns [] when the markup is not recognised so callers can show a clear error.
 */

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

const text = (html: string) =>
  html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();

const cell = (row: string, name: string) => {
  const re = new RegExp(`<td[^>]*class="[^"]*calendar__${name}[^"]*"[^>]*>([\\s\\S]*?)</td>`, "i");
  const m = re.exec(row);
  return m ? m[1] : null;
};

const parseTime = (label: string): { minutes: number | null; allDay: boolean } => {
  const m = /(\d{1,2}):(\d{2})\s*(am|pm)/i.exec(label);
  if (m) {
    let h = Number(m[1]) % 12;
    if (m[3].toLowerCase() === "pm") h += 12;
    return { minutes: h * 60 + Number(m[2]), allDay: false };
  }
  if (/all\s*day|tentative|day\s*\d/i.test(label)) return { minutes: null, allDay: true };
  return { minutes: null, allDay: false };
};

const impactOf = (cellHtml: string | null, title: string, allDay: boolean): EventImpact => {
  const m = cellHtml ? /icon--ff-impact-(red|ora|yel|gra)/i.exec(cellHtml) : null;
  const tag = m?.[1].toLowerCase();
  if (tag === "red") return "high";
  if (tag === "ora") return "medium";
  if (tag === "yel") return "low";
  if (tag === "gra" && (allDay || /holiday/i.test(title))) return "holiday";
  return "low";
};

export function parseFfPage(html: string, weekKey: string): NewsEvent[] {
  const dates = new Map<string, string>();
  for (let i = 0; i < 7; i++) {
    const key = addDaysKey(weekKey, i);
    const [, m, d] = key.split("-").map(Number);
    dates.set(`${MONTHS[m - 1]} ${d}`, key);
  }
  const findDate = (s: string) => {
    const m = /([A-Za-z]{3})[a-z]*\s*(\d{1,2})/g;
    let hit: RegExpExecArray | null;
    while ((hit = m.exec(s))) {
      const key = dates.get(`${hit[1].toLowerCase()} ${Number(hit[2])}`);
      if (key) return key;
    }
    return null;
  };

  const out: NewsEvent[] = [];
  const seen = new Set<string>();
  let dateKey: string | null = null;
  let timeLabel = "";
  const rowRe = /<tr\b([^>]*)>([\s\S]*?)<\/tr>/gi;
  let row: RegExpExecArray | null;

  while ((row = rowRe.exec(html))) {
    const attrs = row[1];
    const body = row[2];
    if (!/calendar__row/i.test(attrs)) continue;

    if (/day-breaker/i.test(attrs)) {
      dateKey = findDate(text(body)) ?? dateKey;
      continue;
    }

    const dateCell = cell(body, "date");
    if (dateCell) dateKey = findDate(text(dateCell)) ?? dateKey;
    if (!dateKey) continue;

    const timeCell = cell(body, "time");
    const rawTime = timeCell ? text(timeCell) : "";
    if (rawTime) timeLabel = rawTime;

    const eventCell = cell(body, "event");
    if (!eventCell) continue;
    const titleSpan = /calendar__event-title[^>]*>([\s\S]*?)<\/span>/i.exec(eventCell);
    const title = text(titleSpan ? titleSpan[1] : eventCell);
    if (!title) continue;

    const currency = (text(cell(body, "currency") ?? "") || "ALL").toUpperCase();
    const { minutes, allDay } = parseTime(timeLabel);
    const [y, mo, d] = dateKey.split("-").map(Number);
    const atMs = Date.UTC(y, mo - 1, d) + (minutes ?? 0) * 60_000;
    const impact = impactOf(cell(body, "impact"), title, allDay);
    const holiday = impact === "holiday";
    const id = `${currency}|${title}|${atMs}`;
    if (seen.has(id)) continue;
    seen.add(id);

    out.push({
      id,
      title,
      country: currency,
      impact,
      atMs,
      allDay: allDay || holiday,
      dateKey: allDay || holiday ? dateKey : undefined,
      forecast: text(cell(body, "forecast") ?? "") || undefined,
      previous: text(cell(body, "previous") ?? "") || undefined,
    });
  }
  return out;
}

/** FF week URL parameter, e.g. 2026-11-01 -> "nov1.2026". */
export const ffWeekParam = (weekKey: string) => {
  const [y, m, d] = weekKey.split("-").map(Number);
  return `${MONTHS[m - 1]}${d}.${y}`;
};

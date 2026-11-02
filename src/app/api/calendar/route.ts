import { connection } from "next/server";
import { parseFeed } from "@/lib/calendar";
import { ffWeekParam, parseFfPage } from "@/lib/ffpage";
import { DAY_MS, addDaysKey, isValidDateKey, weekStartKey } from "@/lib/time";
import type { NewsEvent } from "@/lib/types";

/**
 * GET /api/calendar?week=YYYY-MM-DD
 *
 * Returns the Forex Factory events for the (Sunday-start) week containing `week`.
 *  - This week / next week: Forex Factory's public JSON export (reliable, has exact time offsets).
 *  - Any other week: the calendar web page, parsed best-effort. Forex Factory may block
 *    server-side requests; the error is reported instead of being hidden.
 * Results are cached per week; the last good copy is served if a refresh fails.
 */
const JSON_BASE = "https://nfs.faireconomy.media";
const PAGE_BASE = "https://www.forexfactory.com/calendar";
const SHORT_TTL = 30 * 60_000;
const LONG_TTL = 12 * 60 * 60_000;

type Entry = { at: number; events: NewsEvent[]; source: "json" | "page" };
const cache = new Map<string, Entry>();
const inflight = new Map<string, Promise<Entry>>();

async function fromJson(file: string): Promise<NewsEvent[]> {
  const res = await fetch(`${JSON_BASE}/${file}`, {
    headers: { accept: "application/json", "user-agent": "forex-time-point/0.3" },
    signal: AbortSignal.timeout(10_000),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Forex Factory feed returned HTTP ${res.status}`);
  return parseFeed(await res.json());
}

async function fromPage(weekKey: string): Promise<NewsEvent[]> {
  const res = await fetch(`${PAGE_BASE}?week=${ffWeekParam(weekKey)}`, {
    headers: {
      accept: "text/html,application/xhtml+xml",
      "accept-language": "en-US,en;q=0.9",
      "user-agent":
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    },
    signal: AbortSignal.timeout(15_000),
    cache: "no-store",
  });
  if (res.status === 403 || res.status === 429 || res.status === 503) {
    throw new Error(`Forex Factory blocked the request for this week (HTTP ${res.status})`);
  }
  if (!res.ok) throw new Error(`Forex Factory page returned HTTP ${res.status}`);
  const events = parseFfPage(await res.text());
  if (events.length === 0) throw new Error("Forex Factory's page did not contain calendar data for this week");
  return events;
}

/** A feed that is stale or for another week must not be shown as this week's events. */
function coversWeek(events: NewsEvent[], weekKey: string) {
  const start = Date.parse(`${weekKey}T00:00:00Z`) - DAY_MS;
  const end = start + 9 * DAY_MS;
  const inside = events.filter((e) => e.atMs >= start && e.atMs < end).length;
  return inside / events.length > 0.9;
}

async function load(weekKey: string): Promise<Entry> {
  const thisWeek = weekStartKey(new Date().toISOString().slice(0, 10));
  const nextWeek = addDaysKey(thisWeek, 7);

  if (weekKey === thisWeek || weekKey === nextWeek) {
    try {
      const events = await fromJson(weekKey === thisWeek ? "ff_calendar_thisweek.json" : "ff_calendar_nextweek.json");
      // The next-week export is only published late in the week; an empty list is not an answer.
      if (events.length > 0 && coversWeek(events, weekKey)) return { at: Date.now(), events, source: "json" };
    } catch {
      /* fall through to the page */
    }
  }
  return { at: Date.now(), events: await fromPage(weekKey), source: "page" };
}

export async function GET(request: Request) {
  await connection();
  const param = new URL(request.url).searchParams.get("week") ?? new Date().toISOString().slice(0, 10);
  if (!isValidDateKey(param)) {
    return Response.json({ error: "Invalid week parameter; expected YYYY-MM-DD." }, { status: 400 });
  }
  const weekKey = weekStartKey(param);
  const ageLimit = Math.abs(Date.now() - Date.parse(`${weekKey}T00:00:00Z`)) < 14 * DAY_MS ? SHORT_TTL : LONG_TTL;

  const hit = cache.get(weekKey);
  if (hit && Date.now() - hit.at < ageLimit) {
    return Response.json({ week: weekKey, events: hit.events, fetchedAt: hit.at, stale: false, source: hit.source });
  }

  try {
    let p = inflight.get(weekKey);
    if (!p) {
      p = load(weekKey).finally(() => inflight.delete(weekKey));
      inflight.set(weekKey, p);
    }
    const entry = await p;
    cache.set(weekKey, entry);
    return Response.json({ week: weekKey, events: entry.events, fetchedAt: entry.at, stale: false, source: entry.source });
  } catch (err) {
    if (hit) {
      return Response.json({ week: weekKey, events: hit.events, fetchedAt: hit.at, stale: true, source: hit.source });
    }
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: `Could not load events from Forex Factory: ${message}.` }, { status: 502 });
  }
}

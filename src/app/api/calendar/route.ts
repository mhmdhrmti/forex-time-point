import { connection } from "next/server";
import { parseFeed } from "@/lib/calendar";
import type { NewsEvent } from "@/lib/types";

/**
 * Forex Factory publishes its calendar as weekly export feeds. We fetch this
 * week and next week server-side (the browser can't, due to CORS), cache the
 * result for 30 minutes, and fall back to the last good copy if the feed
 * errors or rate-limits us.
 */
const BASE = "https://nfs.faireconomy.media";
const FEEDS = ["ff_calendar_thisweek.json", "ff_calendar_nextweek.json"];
const TTL_MS = 30 * 60_000;

let cache: { at: number; events: NewsEvent[] } | null = null;
let inflight: Promise<NewsEvent[]> | null = null;

async function fetchFeed(name: string): Promise<NewsEvent[]> {
  const res = await fetch(`${BASE}/${name}`, {
    headers: { accept: "application/json", "user-agent": "forex-time-point/0.2" },
    signal: AbortSignal.timeout(10_000),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`${name}: HTTP ${res.status}`);
  return parseFeed(await res.json());
}

async function loadAll(): Promise<NewsEvent[]> {
  const [thisWeek, nextWeek] = await Promise.allSettled(FEEDS.map(fetchFeed));
  // Next week's file is often not published until late in the week; that is fine.
  if (thisWeek.status === "rejected") throw thisWeek.reason;
  const merged = new Map<string, NewsEvent>();
  for (const e of thisWeek.value) merged.set(e.id, e);
  if (nextWeek.status === "fulfilled") for (const e of nextWeek.value) merged.set(e.id, e);
  return [...merged.values()];
}

export async function GET() {
  await connection();
  const now = Date.now();

  if (cache && now - cache.at < TTL_MS) {
    return Response.json({ events: cache.events, fetchedAt: cache.at, stale: false });
  }

  try {
    inflight ??= loadAll().finally(() => {
      inflight = null;
    });
    const events = await inflight;
    cache = { at: Date.now(), events };
    return Response.json({ events, fetchedAt: cache.at, stale: false });
  } catch (err) {
    if (cache) {
      return Response.json({ events: cache.events, fetchedAt: cache.at, stale: true });
    }
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json(
      { error: `Could not load the Forex Factory calendar (${message}).` },
      { status: 502 },
    );
  }
}

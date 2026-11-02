"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FeedState } from "@/components/news/FeedNotice";
import type { NewsEvent } from "@/lib/types";

type WeekState = { events: NewsEvent[]; stale: boolean; error: string | null };

const NONE: NewsEvent[] = [];
const REFRESH_MS = 30 * 60_000;

/**
 * Forex Factory events, loaded one week at a time the first time a date in that week is viewed.
 * `weekKey` is the Sunday (YYYY-MM-DD) of the week on screen.
 */
export function useCalendarWeeks(weekKey: string | null) {
  const [weeks, setWeeks] = useState<Record<string, WeekState>>({});
  const inflight = useRef<Set<string>>(new Set());

  const loadWeek = useCallback(async (key: string) => {
    if (inflight.current.has(key)) return;
    inflight.current.add(key);
    try {
      const res = await fetch(`/api/calendar?week=${key}`, { cache: "no-store" });
      const data = (await res.json()) as { events?: NewsEvent[]; stale?: boolean; error?: string };
      if (!res.ok || data.error || !data.events) throw new Error(data.error ?? `HTTP ${res.status}`);
      setWeeks((prev) => ({ ...prev, [key]: { events: data.events!, stale: Boolean(data.stale), error: null } }));
    } catch (e) {
      const message = e instanceof Error ? e.message : "Could not load the calendar.";
      setWeeks((prev) => ({ ...prev, [key]: { events: prev[key]?.events ?? NONE, stale: false, error: message } }));
    } finally {
      inflight.current.delete(key);
    }
  }, []);

  const week = weekKey ? weeks[weekKey] : undefined;

  // Fetch a week the first time it is viewed (deferred so state is never set synchronously in the effect).
  useEffect(() => {
    if (!weekKey || week) return;
    const id = window.setTimeout(() => void loadWeek(weekKey), 0);
    return () => window.clearTimeout(id);
  }, [weekKey, week, loadWeek]);

  // Keep the visible week fresh.
  useEffect(() => {
    if (!weekKey) return;
    const id = window.setInterval(() => void loadWeek(weekKey), REFRESH_MS);
    return () => window.clearInterval(id);
  }, [weekKey, loadWeek]);

  const retry = useCallback(() => {
    if (!weekKey) return;
    setWeeks((prev) => {
      const next = { ...prev };
      delete next[weekKey];
      return next;
    });
  }, [weekKey]);

  const events = useMemo(() => {
    const map = new Map<string, NewsEvent>();
    for (const w of Object.values(weeks)) for (const e of w.events) map.set(e.id, e);
    return [...map.values()];
  }, [weeks]);

  const feed: FeedState = !week
    ? { status: "loading" }
    : week.error
      ? { status: "error", message: week.error }
      : { status: "ready", stale: week.stale };

  return { events, feed, retry };
}

"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Clock from "./Clock";
import Logo from "./Logo";
import MarksPanel from "./MarksPanel";
import NewsPanel, { type FeedState, type ImpactFilter } from "./NewsPanel";
import StatusBanner from "./StatusBanner";
import ThemeToggle from "./ThemeToggle";
import { computeDayStatus, eventsForDay, isWeekendClosed } from "@/lib/calendar";
import { SESSIONS, TIMEZONES } from "@/lib/data";
import {
  DAY_MS,
  addDaysKey,
  dateKeyFor,
  dayStartMs,
  fmtClock,
  fmtCountdown,
  fmtDateKey,
  fmtDateKeyShort,
  fmtGmt,
  fmtHM,
  isInRange,
  isValidDateKey,
  localMinutesOf,
  toLocalMinutes,
  weekStartKey,
} from "@/lib/time";
import type { NewsEvent, Theme, TimePoint, TimeRange } from "@/lib/types";
import { useStoredState } from "@/lib/useStoredState";

/* Stable references for useStoredState defaults. */
const NO_OFFSET: number | null = null;
const NO_IDS: string[] = [];
const NO_EVENTS: NewsEvent[] = [];
const NO_POINTS: TimePoint[] = [];
const NO_RANGES: TimeRange[] = [];
const NO_SESSION_PREFS: Record<string, boolean> = {};
const NO_REASONS: Record<string, string> = {};
const NO_WINDOWS: Array<[number, number]> = [];
const DEFAULT_THEME: Theme = "system";
const DEFAULT_TAB: "news" | "marks" = "news";
const DEFAULT_IMPACT: ImpactFilter = "all";
const DEFAULT_CURRENCY = "all";
const DEFAULT_LEAD = 15;

type WeekState = { events: NewsEvent[]; stale: boolean; error: string | null };

/* Browser notification permission as an external store. */
const permListeners = new Set<() => void>();
const subscribePerm = (cb: () => void) => {
  permListeners.add(cb);
  return () => permListeners.delete(cb);
};
const getPerm = (): NotificationPermission | "unsupported" =>
  typeof Notification === "undefined" ? "unsupported" : Notification.permission;
const getServerPerm = (): NotificationPermission | "unsupported" => "default";

const noopSubscribe = () => () => {};
const getDeviceOffset = () => -new Date().getTimezoneOffset();
const getServerOffset = () => 0;

const btn =
  "rounded-md px-3 py-1.5 text-xs text-[var(--muted)] ring-1 ring-[var(--line)] transition-colors hover:text-[var(--fg)] hover:ring-[var(--fg)]";
const panel = "rounded-xl bg-[var(--surface)] ring-1 ring-[var(--line)]";

export default function Dashboard() {
  const deviceOffset = useSyncExternalStore(noopSubscribe, getDeviceOffset, getServerOffset);

  /* Settings that persist in this browser. */
  const [storedOffset, setStoredOffset] = useStoredState<number | null>("ftp:offset", NO_OFFSET);
  const [theme, setTheme] = useStoredState<Theme>("ftp:theme", DEFAULT_THEME);
  const [selected, setSelected] = useStoredState<NewsEvent[]>("ftp:selected", NO_EVENTS);
  const [custom, setCustom] = useStoredState<NewsEvent[]>("ftp:custom-events", NO_EVENTS);
  const [points, setPoints] = useStoredState<TimePoint[]>("ftp:points", NO_POINTS);
  const [ranges, setRanges] = useStoredState<TimeRange[]>("ftp:intervals", NO_RANGES);
  const [dismissed, setDismissed] = useStoredState<string[]>("ftp:dismissed", NO_IDS);
  const [sessionPrefs, setSessionPrefs] = useStoredState<Record<string, boolean>>("ftp:sessions", NO_SESSION_PREFS);
  const [tab, setTab] = useStoredState<"news" | "marks">("ftp:tab", DEFAULT_TAB);
  const [impactFilter, setImpactFilter] = useStoredState<ImpactFilter>("ftp:impact", DEFAULT_IMPACT);
  const [currencyFilter, setCurrencyFilter] = useStoredState<string>("ftp:currency", DEFAULT_CURRENCY);
  const [leadMin, setLeadMin] = useStoredState<number>("ftp:lead", DEFAULT_LEAD);

  const offset = storedOffset ?? deviceOffset;

  const [nowMs, setNowMs] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null); // null = follow today
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [weeks, setWeeks] = useState<Record<string, WeekState>>({});
  const inflight = useRef<Set<string>>(new Set());
  const perm = useSyncExternalStore(subscribePerm, getPerm, getServerPerm);
  const audioRef = useRef<AudioContext | null>(null);
  const notifiedRef = useRef<Set<string>>(new Set());

  /* Apply the stored theme to <html>. (An inline script in the layout does this before first paint.) */
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "light" || theme === "dark") root.setAttribute("data-theme", theme);
    else root.removeAttribute("data-theme");
  }, [theme]);

  /* Live clock. */
  useEffect(() => {
    const first = window.setTimeout(() => setNowMs(Date.now()), 0);
    const id = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(id);
    };
  }, []);

  /* ---------- Calendar data: one request per week, fetched when that week is viewed ---------- */
  const loadWeek = useCallback(async (weekKey: string) => {
    if (inflight.current.has(weekKey)) return;
    inflight.current.add(weekKey);
    try {
      const res = await fetch(`/api/calendar?week=${weekKey}`, { cache: "no-store" });
      const data = (await res.json()) as { events?: NewsEvent[]; stale?: boolean; error?: string };
      if (!res.ok || data.error || !data.events) throw new Error(data.error ?? `HTTP ${res.status}`);
      setWeeks((prev) => ({ ...prev, [weekKey]: { events: data.events!, stale: Boolean(data.stale), error: null } }));
    } catch (e) {
      const message = e instanceof Error ? e.message : "Could not load the calendar.";
      setWeeks((prev) => ({
        ...prev,
        [weekKey]: { events: prev[weekKey]?.events ?? NO_EVENTS, stale: false, error: message },
      }));
    } finally {
      inflight.current.delete(weekKey);
    }
  }, []);

  const today = nowMs === null ? null : dateKeyFor(nowMs, offset);
  const dateKey = selectedDate ?? today;
  const isToday = selectedDate === null;
  const weekKey = dateKey ? weekStartKey(dateKey) : null;
  const week = weekKey ? weeks[weekKey] : undefined;

  useEffect(() => {
    if (!weekKey || week) return;
    const id = window.setTimeout(() => void loadWeek(weekKey), 0);
    return () => window.clearTimeout(id);
  }, [weekKey, week, loadWeek]);

  /* Refresh the visible week every 30 minutes. */
  useEffect(() => {
    if (!weekKey) return;
    const id = window.setInterval(() => void loadWeek(weekKey), 30 * 60_000);
    return () => window.clearInterval(id);
  }, [weekKey, loadWeek]);

  const retry = () => {
    if (!weekKey) return;
    setWeeks((prev) => {
      const next = { ...prev };
      delete next[weekKey];
      return next;
    });
  };

  const feed: FeedState = !week
    ? { status: "loading" }
    : week.error
      ? { status: "error", message: week.error }
      : { status: "ready", stale: week.stale };

  /* ---------- Derived data ---------- */
  const allEvents = useMemo(() => {
    const map = new Map<string, NewsEvent>();
    for (const w of Object.values(weeks)) for (const e of w.events) map.set(e.id, e);
    for (const e of custom) map.set(e.id, e);
    return [...map.values()];
  }, [weeks, custom]);

  const dayEvents = useMemo(
    () => (dateKey ? eventsForDay(allEvents, dateKey, offset) : NO_EVENTS),
    [allEvents, dateKey, offset],
  );
  const status = useMemo(
    () => (dateKey ? computeDayStatus(dateKey, offset, dayEvents) : null),
    [dateKey, offset, dayEvents],
  );

  const selectedIds = useMemo(() => selected.map((e) => e.id), [selected]);

  /* Selected events are stored as snapshots so alerts work whichever week is on screen. */
  const selectedOnDay = useMemo(() => {
    if (!dateKey) return NO_EVENTS;
    const start = dayStartMs(dateKey, offset);
    return selected.filter((e) => !e.allDay && e.atMs >= start && e.atMs < start + DAY_MS);
  }, [selected, dateKey, offset]);

  const upcomingSelected = useMemo(() => {
    if (nowMs === null) return NO_EVENTS;
    return selected.filter((e) => e.atMs > nowMs - 5 * 60_000).sort((a, b) => a.atMs - b.atMs);
  }, [selected, nowMs]);

  const toggleSelect = (e: NewsEvent) =>
    setSelected((prev) => (prev.some((x) => x.id === e.id) ? prev.filter((x) => x.id !== e.id) : [...prev, e]));

  /* Alerts: any selected event starting within the chosen lead time. */
  const activeAlerts = useMemo(() => {
    if (nowMs === null) return NO_EVENTS;
    const lead = leadMin * 60_000;
    return upcomingSelected.filter(
      (e) => e.atMs >= nowMs && e.atMs - nowMs <= lead && !dismissed.includes(e.id),
    );
  }, [upcomingSelected, nowMs, leadMin, dismissed]);

  useEffect(() => {
    for (const e of activeAlerts) {
      if (notifiedRef.current.has(e.id)) continue;
      notifiedRef.current.add(e.id);
      try {
        if (typeof Notification !== "undefined" && Notification.permission === "granted") {
          new Notification(`Starting soon: ${e.title}`, {
            body: `${e.country} · ${fmtHM(localMinutesOf(e.atMs, offset))} (${fmtGmt(offset)})`,
          });
        }
      } catch {
        /* notifications can be blocked by the browser */
      }
      const ctx = audioRef.current;
      if (ctx) {
        try {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.frequency.value = 880;
          gain.gain.setValueAtTime(0.0001, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
          osc.connect(gain).connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.65);
        } catch {
          /* audio unavailable */
        }
      }
    }
  }, [activeAlerts, offset]);

  const enableAlerts = async () => {
    try {
      if (!audioRef.current) {
        const Ctor =
          window.AudioContext ??
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (Ctor) audioRef.current = new Ctor();
      }
      await audioRef.current?.resume();
    } catch {
      /* ignore */
    }
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      await Notification.requestPermission();
      permListeners.forEach((cb) => cb());
    }
  };

  const pickDate = (key: string) => {
    if (!isValidDateKey(key)) return;
    setSelectedDate(key === today ? null : key);
  };
  const shiftDate = (days: number) => {
    if (dateKey) pickDate(addDaysKey(dateKey, days));
  };

  const nowUtcMin = nowMs === null ? null : (nowMs % DAY_MS) / 60_000;
  const marketClosedNow = nowMs !== null && isWeekendClosed(nowMs);
  const closedHeadline = status?.fullyClosed ? status.headline : isToday && marketClosedNow ? "Market closed" : null;

  const offsetOptions = useMemo(() => {
    const list = TIMEZONES.map((t) => ({ offset: t.offset, label: `${fmtGmt(t.offset)} · ${t.places}` }));
    if (!list.some((o) => o.offset === deviceOffset)) {
      list.push({ offset: deviceOffset, label: `${fmtGmt(deviceOffset)} · This device` });
      list.sort((a, b) => a.offset - b.offset);
    }
    return list;
  }, [deviceOffset]);

  return (
    <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-5 px-4 py-5 sm:px-6 sm:py-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <Logo />
        <div className="flex flex-wrap items-center gap-2">
          <ThemeToggle theme={theme} onChange={setTheme} />
          <button
            type="button"
            onClick={enableAlerts}
            disabled={perm === "denied"}
            className={`${btn} disabled:opacity-50`}
            title={
              perm === "denied"
                ? "Notifications are blocked in your browser settings"
                : "Enable sound and desktop notifications for event alerts"
            }
          >
            {perm === "granted" ? "Alerts on" : perm === "denied" ? "Alerts blocked" : "Enable alerts"}
          </button>
        </div>
      </header>

      {/* Time zone + trading day */}
      <div className={`${panel} flex flex-wrap items-center gap-x-5 gap-y-3 p-3`}>
        <label className="flex min-w-0 flex-1 basis-64 items-center gap-2 text-xs text-[var(--muted)] sm:flex-none">
          <span className="shrink-0">Time zone</span>
          <select
            value={offset}
            onChange={(e) => setStoredOffset(Number(e.target.value))}
            className="min-w-0 flex-1 rounded-md border border-[var(--line)] bg-[var(--surface)] px-2 py-1.5 text-sm text-[var(--fg)] sm:w-[300px] sm:flex-none"
          >
            {offsetOptions.map((o) => (
              <option key={o.offset} value={o.offset}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        {storedOffset !== null && (
          <button type="button" onClick={() => setStoredOffset(null)} className="text-xs text-[var(--muted)] underline-offset-2 hover:text-[var(--fg)] hover:underline">
            Use device zone
          </button>
        )}

        <div className="flex flex-wrap items-center gap-2 sm:ml-auto" role="group" aria-label="Trading day">
          <button type="button" onClick={() => shiftDate(-1)} disabled={!dateKey} aria-label="Previous day" className={btn}>
            ‹
          </button>
          <input
            type="date"
            value={dateKey ?? ""}
            onChange={(e) => pickDate(e.target.value)}
            aria-label="Trading day"
            className="rounded-md border border-[var(--line)] bg-transparent px-2 py-1.5 font-mono text-sm outline-none focus:border-[var(--accent)]"
          />
          <button type="button" onClick={() => shiftDate(1)} disabled={!dateKey} aria-label="Next day" className={btn}>
            ›
          </button>
          <button type="button" onClick={() => setSelectedDate(null)} disabled={isToday} className={`${btn} disabled:opacity-40`}>
            Today
          </button>
        </div>
      </div>

      <main className="grid gap-6 lg:grid-cols-[minmax(0,700px)_minmax(0,1fr)] lg:gap-8">
        <div className="flex min-w-0 flex-col gap-4">
          {status && <StatusBanner status={status} />}

          {/* Readout lives above the dial so the dial stays clean */}
          <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2 px-1">
            <div>
              <p className="font-mono text-4xl font-semibold leading-none tabular-nums tracking-tight sm:text-5xl">
                {nowMs === null ? "--:--:--" : fmtClock(nowMs, offset)}
              </p>
              <p className="mt-2 text-sm text-[var(--muted)]">
                {dateKey ? (isToday ? fmtDateKey(dateKey) : `Viewing ${fmtDateKey(dateKey)}`) : ""}
                <span className="ml-2 font-mono text-xs">{fmtGmt(offset)}</span>
              </p>
            </div>
            {nowMs !== null && (
              <span
                className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ring-1 ${
                  closedHeadline
                    ? "text-[var(--danger)] ring-[color-mix(in_srgb,var(--danger)_45%,transparent)]"
                    : "text-[var(--ok)] ring-[color-mix(in_srgb,var(--ok)_45%,transparent)]"
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${closedHeadline ? "bg-[var(--danger)]" : "bg-[var(--ok)]"}`} />
                {closedHeadline ?? (isToday ? "Market open" : "Trading day")}
              </span>
            )}
          </div>

          <div className={`${panel} p-2 sm:p-4`}>
            <Clock
              nowMs={nowMs}
              offset={offset}
              isToday={isToday}
              pinned={selectedOnDay}
              highlightId={hoverId}
              points={points}
              ranges={ranges}
              visibleSessions={sessionPrefs}
              closedSessions={status?.closedSessions ?? NO_REASONS}
              closedWindows={status?.closedWindows ?? NO_WINDOWS}
              fullyClosed={status?.fullyClosed ?? false}
            />
          </div>

          <section aria-label="Trading sessions">
            <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Sessions</h2>
            <ul className={`${panel} grid gap-px overflow-hidden bg-[var(--line)] sm:grid-cols-2`}>
              {SESSIONS.map((s) => {
                const visible = sessionPrefs[s.id] !== false;
                const holidayReason = status?.closedSessions[s.id];
                let label = "—";
                let tone: "open" | "closed" | "none" = "none";
                let tip = "";
                if (status?.fullyClosed) {
                  label = "Closed";
                  tone = "closed";
                  tip = status.headline ?? "";
                } else if (holidayReason) {
                  label = "Holiday";
                  tone = "closed";
                  tip = holidayReason;
                } else if (isToday && nowUtcMin !== null) {
                  const open = !marketClosedNow && isInRange(nowUtcMin, s.startUtc, s.endUtc);
                  label = open ? "Open" : "Closed";
                  tone = open ? "open" : "none";
                }
                return (
                  <li key={s.id} className="flex items-center gap-3 bg-[var(--surface)] px-3.5 py-2.5" title={tip || undefined}>
                    <input
                      type="checkbox"
                      checked={visible}
                      onChange={() => setSessionPrefs((p) => ({ ...p, [s.id]: !visible }))}
                      aria-label={`Show ${s.name} on clock`}
                      className="accent-[var(--accent)]"
                    />
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: s.color }} />
                    <span className="min-w-0 flex-1 truncate text-sm">{s.name}</span>
                    <span className="font-mono text-xs text-[var(--muted)]">
                      {fmtHM(toLocalMinutes(s.startUtc, offset))}–{fmtHM(toLocalMinutes(s.endUtc, offset))}
                    </span>
                    <span
                      className={`w-14 text-right text-xs ${
                        tone === "open"
                          ? "font-medium text-[var(--ok)]"
                          : tone === "closed"
                            ? "font-medium text-[var(--danger)]"
                            : "text-[var(--muted)]"
                      }`}
                    >
                      {label}
                    </span>
                  </li>
                );
              })}
            </ul>
            <p className="mt-2 px-1 text-[11px] text-[var(--muted)]">
              Standard UTC hours; daylight-saving shifts are not applied. Weekend closure is Fri 22:00 – Sun 22:00 UTC.
            </p>
          </section>
        </div>

        <div className="flex min-w-0 flex-col gap-5">
          <div role="tablist" className="flex gap-6 border-b border-[var(--line)]">
            {(
              [
                ["news", "News"],
                ["marks", "Points & ranges"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                role="tab"
                type="button"
                aria-selected={tab === id}
                onClick={() => setTab(id)}
                className={`-mb-px border-b-2 pb-2 text-sm transition-colors ${
                  tab === id
                    ? "border-[var(--accent)] font-medium text-[var(--fg)]"
                    : "border-transparent text-[var(--muted)] hover:text-[var(--fg)]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {tab === "news" ? (
            dateKey ? (
              <NewsPanel
                dateKey={dateKey}
                isToday={isToday}
                dayEvents={dayEvents}
                upcomingSelected={upcomingSelected}
                selectedIds={selectedIds}
                offset={offset}
                nowMs={nowMs}
                feed={feed}
                leadMin={leadMin}
                impactFilter={impactFilter}
                currencyFilter={currencyFilter}
                hoverId={hoverId}
                onHover={setHoverId}
                onLeadChange={setLeadMin}
                onImpactFilter={setImpactFilter}
                onCurrencyFilter={setCurrencyFilter}
                onToggleSelect={toggleSelect}
                onAddCustom={(e) => {
                  const ev: NewsEvent = { ...e, id: `c-${crypto.randomUUID()}`, custom: true };
                  setCustom((prev) => [...prev, ev]);
                  setSelected((prev) => [...prev, ev]);
                }}
                onRemoveCustom={(id) => {
                  setCustom((prev) => prev.filter((e) => e.id !== id));
                  setSelected((prev) => prev.filter((e) => e.id !== id));
                }}
                onRetry={retry}
              />
            ) : (
              <p className="py-6 text-center text-xs text-[var(--muted)]">Loading…</p>
            )
          ) : (
            <MarksPanel
              points={points}
              ranges={ranges}
              offset={offset}
              onAddPoint={(p) => setPoints((prev) => [...prev, { ...p, id: crypto.randomUUID() }])}
              onRemovePoint={(id) => setPoints((prev) => prev.filter((p) => p.id !== id))}
              onAddRange={(r) => setRanges((prev) => [...prev, { ...r, id: crypto.randomUUID() }])}
              onRemoveRange={(id) => setRanges((prev) => prev.filter((r) => r.id !== id))}
            />
          )}
        </div>
      </main>

      <footer className="border-t border-[var(--line)] pt-4 text-[11px] leading-relaxed text-[var(--muted)]">
        Event data from{" "}
        <a href="https://www.forexfactory.com/calendar" target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-[var(--fg)]">
          Forex Factory
        </a>
        , converted to your selected GMT zone. Your settings are saved in this browser.
      </footer>

      {/* Event alerts */}
      <div
        aria-live="assertive"
        className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2"
      >
        {activeAlerts.map((e) => (
          <div
            key={e.id}
            role="alert"
            className="pointer-events-auto flex items-start gap-3 rounded-xl border-l-4 border-[var(--accent)] bg-[var(--surface)] p-3.5 shadow-xl ring-1 ring-[var(--line)]"
          >
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">
                Starts in {nowMs === null ? "" : fmtCountdown(e.atMs - nowMs)}
              </p>
              <p className="truncate text-sm font-medium">
                {e.country && <span className="mr-2 font-mono text-xs text-[var(--muted)]">{e.country}</span>}
                {e.title}
              </p>
              <p className="font-mono text-xs text-[var(--muted)]">
                {fmtDateKeyShort(dateKeyFor(e.atMs, offset))} · {fmtHM(localMinutesOf(e.atMs, offset))} {fmtGmt(offset)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setDismissed((prev) => [...prev.slice(-49), e.id])}
              aria-label="Dismiss alert"
              className="text-[var(--muted)] hover:text-[var(--fg)]"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

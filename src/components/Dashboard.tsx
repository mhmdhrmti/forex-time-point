"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import AlertToasts from "./AlertToasts";
import Clock from "./clock/Clock";
import ControlBar from "./controls/ControlBar";
import AppHeader from "./header/AppHeader";
import MarksPanel from "./marks/MarksPanel";
import type { ImpactFilter } from "./news/EventFilters";
import NewsPanel from "./news/NewsPanel";
import SessionList from "./sessions/SessionList";
import ClockReadout from "./status/ClockReadout";
import StatusBanner from "./status/StatusBanner";
import Panel from "./ui/Panel";
import Tabs from "./ui/Tabs";
import { useCalendarWeeks } from "@/hooks/useCalendarWeeks";
import { useEventAlerts } from "@/hooks/useEventAlerts";
import { useNow } from "@/hooks/useNow";
import { useTheme } from "@/hooks/useTheme";
import { resolveSessions } from "@/lib/data";
import { computeDayStatus, eventsForDay, isWeekendClosed } from "@/lib/calendar";
import { DAY_MS, addDaysKey, dateKeyFor, dayStartMs, isValidDateKey, weekStartKey } from "@/lib/time";
import type { NewsEvent, Theme, TimePoint, TimeRange } from "@/lib/types";
import { useStoredState } from "@/lib/useStoredState";

/* Stable references for useStoredState defaults. */
const NO_OFFSET: number | null = null;
const NO_IDS: string[] = [];
const NO_EVENTS: NewsEvent[] = [];
const NO_POINTS: TimePoint[] = [];
const NO_RANGES: TimeRange[] = [];
const NO_PREFS: Record<string, boolean> = {};
const NO_REASONS: Record<string, string> = {};
const NO_WINDOWS: Array<[number, number]> = [];
type Tab = "news" | "marks";
const TABS: Array<{ value: Tab; label: string }> = [
  { value: "news", label: "News" },
  { value: "marks", label: "Points & ranges" },
];

const noopSubscribe = () => () => {};
const getDeviceOffset = () => -new Date().getTimezoneOffset();
const getServerOffset = () => 0;

export default function Dashboard() {
  const deviceOffset = useSyncExternalStore(noopSubscribe, getDeviceOffset, getServerOffset);

  /* Settings that persist in this browser. */
  const [storedOffset, setStoredOffset] = useStoredState<number | null>("ftp:offset", NO_OFFSET);
  const [theme, setTheme] = useStoredState<Theme>("ftp:theme", "system");
  const [selected, setSelected] = useStoredState<NewsEvent[]>("ftp:selected", NO_EVENTS);
  const [custom, setCustom] = useStoredState<NewsEvent[]>("ftp:custom-events", NO_EVENTS);
  const [points, setPoints] = useStoredState<TimePoint[]>("ftp:points", NO_POINTS);
  const [ranges, setRanges] = useStoredState<TimeRange[]>("ftp:intervals", NO_RANGES);
  const [dismissed, setDismissed] = useStoredState<string[]>("ftp:dismissed", NO_IDS);
  const [sessionPrefs, setSessionPrefs] = useStoredState<Record<string, boolean>>("ftp:sessions", NO_PREFS);
  const [tab, setTab] = useStoredState<Tab>("ftp:tab", "news");
  const [impactFilter, setImpactFilter] = useStoredState<ImpactFilter>("ftp:impact", "all");
  const [currencyFilter, setCurrencyFilter] = useStoredState<string>("ftp:currency", "all");
  const [leadMin, setLeadMin] = useStoredState<number>("ftp:lead", 15);

  const offset = storedOffset ?? deviceOffset;
  useTheme(theme);
  const nowMs = useNow();

  const [selectedDate, setSelectedDate] = useState<string | null>(null); // null = follow today
  const [hoverId, setHoverId] = useState<string | null>(null);

  const today = nowMs === null ? null : dateKeyFor(nowMs, offset);
  const dateKey = selectedDate ?? today;
  const isToday = selectedDate === null || selectedDate === today;
  const weekKey = dateKey ? weekStartKey(dateKey) : null;

  const { events: feedEvents, feed, retry } = useCalendarWeeks(weekKey);

  /* ---------- Derived data ---------- */
  const allEvents = useMemo(() => {
    const map = new Map<string, NewsEvent>();
    for (const e of feedEvents) map.set(e.id, e);
    for (const e of custom) map.set(e.id, e);
    return [...map.values()];
  }, [feedEvents, custom]);

  const dayEvents = useMemo(() => (dateKey ? eventsForDay(allEvents, dateKey, offset) : NO_EVENTS), [allEvents, dateKey, offset]);
  const status = useMemo(() => (dateKey ? computeDayStatus(dateKey, offset, dayEvents) : null), [dateKey, offset, dayEvents]);

  /* Session hours follow daylight saving for the viewed date. */
  const sessionRefMs = dateKey ? dayStartMs(dateKey, offset) + DAY_MS / 2 : 0;
  const sessions = useMemo(() => resolveSessions(sessionRefMs), [sessionRefMs]);

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

  const { active: activeAlerts, permission, enable: enableAlerts } = useEventAlerts({
    events: upcomingSelected,
    nowMs,
    leadMin,
    dismissed,
    offset,
  });

  /* ---------- Market state ---------- */
  const marketClosed = Boolean(status?.fullyClosed) || (isToday && nowMs !== null && isWeekendClosed(nowMs));
  const closedLabel = marketClosed ? (status?.fullyClosed ? status.headline : null) ?? "Market closed" : null;
  const nowUtcMin = nowMs === null ? null : (nowMs % DAY_MS) / 60_000;

  /* ---------- Actions ---------- */
  const toggleSelect = (e: NewsEvent) =>
    setSelected((prev) => (prev.some((x) => x.id === e.id) ? prev.filter((x) => x.id !== e.id) : [...prev, e]));
  const addCustom = (e: Omit<NewsEvent, "id" | "custom">) => {
    const ev: NewsEvent = { ...e, id: `c-${crypto.randomUUID()}`, custom: true };
    setCustom((prev) => [...prev, ev]);
    setSelected((prev) => [...prev, ev]);
  };
  const removeCustom = (id: string) => {
    setCustom((prev) => prev.filter((e) => e.id !== id));
    setSelected((prev) => prev.filter((e) => e.id !== id));
  };
  const pickDate = (key: string) => {
    if (isValidDateKey(key)) setSelectedDate(key === today ? null : key);
  };

  return (
    <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-5 px-4 py-5 sm:px-6 sm:py-8">
      <AppHeader theme={theme} onTheme={setTheme} alertPermission={permission} onEnableAlerts={() => void enableAlerts()} />

      <ControlBar
        offset={offset}
        deviceOffset={deviceOffset}
        usingDeviceZone={storedOffset === null}
        onOffset={setStoredOffset}
        onUseDevice={() => setStoredOffset(null)}
        dateKey={dateKey}
        isToday={isToday}
        onPickDate={pickDate}
        onShiftDate={(d) => dateKey && pickDate(addDaysKey(dateKey, d))}
        onToday={() => setSelectedDate(null)}
      />

      <main className="grid gap-6 lg:grid-cols-[minmax(0,700px)_minmax(0,1fr)] lg:gap-8">
        <div className="flex min-w-0 flex-col gap-4">
          {status && <StatusBanner status={status} />}
          <ClockReadout nowMs={nowMs} offset={offset} dateKey={dateKey} isToday={isToday} closedLabel={closedLabel} />
          <Panel className="p-2 sm:p-4">
            <Clock
              nowMs={nowMs}
              offset={offset}
              sessions={sessions}
              marketClosed={marketClosed}
              closedWindows={status?.closedWindows ?? NO_WINDOWS}
              closedSessions={status?.closedSessions ?? NO_REASONS}
              visibleSessions={sessionPrefs}
              points={points}
              ranges={ranges}
              events={selectedOnDay}
              highlightId={hoverId}
            />
          </Panel>
          <SessionList
            offset={offset}
            sessions={sessions}
            nowUtcMin={nowUtcMin}
            isToday={isToday}
            marketClosed={marketClosed}
            closedReason={closedLabel}
            closedSessions={status?.closedSessions ?? NO_REASONS}
            visible={sessionPrefs}
            onToggle={(id, v) => setSessionPrefs((p) => ({ ...p, [id]: v }))}
          />
        </div>

        <div className="flex min-w-0 flex-col gap-5">
          <Tabs value={tab} tabs={TABS} onChange={setTab} />
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
                onAddCustom={addCustom}
                onRemoveCustom={removeCustom}
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
              locked={marketClosed}
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

      <AlertToasts alerts={activeAlerts} nowMs={nowMs} offset={offset} onDismiss={(id) => setDismissed((prev) => [...prev.slice(-49), id])} />
    </div>
  );
}

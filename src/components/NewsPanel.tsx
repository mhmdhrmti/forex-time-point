"use client";

import { useMemo, useState } from "react";
import {
  dateKeyFor,
  dayStartMs,
  fmtCountdown,
  fmtDateKey,
  fmtDateKeyShort,
  fmtHM,
  localMinutesOf,
  parseHM,
} from "@/lib/time";
import type { Impact, NewsEvent } from "@/lib/types";

export type ImpactFilter = Impact | "all";

export type FeedState =
  | { status: "loading" }
  | { status: "ready"; stale: boolean }
  | { status: "error"; message: string };

interface Props {
  dateKey: string;
  isToday: boolean;
  /** Events (feed + custom) on the viewed date. */
  dayEvents: NewsEvent[];
  /** Upcoming pinned events on any date. */
  upcomingPinned: NewsEvent[];
  pinnedIds: string[];
  offset: number;
  nowMs: number | null;
  feed: FeedState;
  /** Set when the viewed date lies outside the Forex Factory feed's range. */
  outOfRangeNote: string | null;
  impactFilter: ImpactFilter;
  currencyFilter: string;
  onImpactFilter: (f: ImpactFilter) => void;
  onCurrencyFilter: (c: string) => void;
  onTogglePin: (id: string) => void;
  onAddCustom: (e: Omit<NewsEvent, "id" | "custom">) => void;
  onRemoveCustom: (id: string) => void;
  onRetry: () => void;
}

const IMPACT_DOT: Record<Impact, string> = {
  high: "bg-[var(--impact-high)]",
  medium: "bg-[var(--impact-medium)]",
  low: "bg-[var(--impact-low)]",
};

const field =
  "rounded border border-[var(--line)] bg-transparent px-2 py-1.5 text-sm outline-none focus:border-[var(--accent)]";

export default function NewsPanel({
  dateKey,
  isToday,
  dayEvents,
  upcomingPinned,
  pinnedIds,
  offset,
  nowMs,
  feed,
  outOfRangeNote,
  impactFilter,
  currencyFilter,
  onImpactFilter,
  onCurrencyFilter,
  onTogglePin,
  onAddCustom,
  onRemoveCustom,
  onRetry,
}: Props) {
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");
  const [impact, setImpact] = useState<Impact>("high");
  const [error, setError] = useState("");

  const currencies = useMemo(
    () => [...new Set(dayEvents.filter((e) => e.country && e.country !== "ALL").map((e) => e.country))].sort(),
    [dayEvents],
  );

  const rows = useMemo(
    () =>
      dayEvents.filter(
        (e) =>
          e.impact === "holiday" ||
          ((impactFilter === "all" || e.impact === impactFilter) &&
            (currencyFilter === "all" || e.country === currencyFilter)),
      ),
    [dayEvents, impactFilter, currencyFilter],
  );

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    const minutes = parseHM(time);
    if (!title.trim()) return setError("Enter a title.");
    if (minutes === null) return setError("Time must be HH:MM (24h).");
    setError("");
    onAddCustom({
      title: title.trim(),
      country: "",
      impact,
      allDay: false,
      atMs: dayStartMs(dateKey, offset) + minutes * 60_000,
    });
    setTitle("");
    setTime("");
  };

  return (
    <section aria-label="Daily news and events" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-sm font-medium tracking-wide">
            {fmtDateKey(dateKey)}
            {isToday && <span className="ml-2 text-xs font-normal text-[var(--accent)]">Today</span>}
          </h2>
          <p className="text-xs text-[var(--muted)]">
            Forex Factory calendar · times in your selected zone
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex gap-1" role="group" aria-label="Filter by impact">
            {(["all", "high", "medium", "low"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => onImpactFilter(f)}
                aria-pressed={impactFilter === f}
                className={`rounded px-2 py-1 text-xs capitalize transition-colors ${
                  impactFilter === f
                    ? "bg-[var(--fg)] text-[var(--bg)]"
                    : "border border-[var(--line)] text-[var(--muted)] hover:text-[var(--fg)]"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <select
            value={currencyFilter}
            onChange={(e) => onCurrencyFilter(e.target.value)}
            aria-label="Filter by currency"
            className="rounded border border-[var(--line)] bg-[var(--bg)] px-2 py-1 text-xs"
          >
            <option value="all">All currencies</option>
            {currencies.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
            {currencyFilter !== "all" && !currencies.includes(currencyFilter) && (
              <option value={currencyFilter}>{currencyFilter}</option>
            )}
          </select>
        </div>
      </div>

      {feed.status === "loading" && (
        <p className="rounded border border-[var(--line)] px-3 py-2 text-xs text-[var(--muted)]">
          Loading the Forex Factory calendar…
        </p>
      )}
      {feed.status === "error" && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded border border-[var(--danger)] px-3 py-2 text-xs">
          <span className="text-[var(--danger)]">{feed.message}</span>
          <button type="button" onClick={onRetry} className="rounded border border-[var(--line)] px-2 py-1 hover:border-[var(--fg)]">
            Retry
          </button>
        </div>
      )}
      {feed.status === "ready" && feed.stale && (
        <p className="text-[11px] text-[var(--muted)]">
          Showing the last saved copy; Forex Factory could not be reached just now.
        </p>
      )}
      {outOfRangeNote && (
        <p className="rounded border border-[var(--line)] px-3 py-2 text-xs text-[var(--muted)]">
          {outOfRangeNote}
        </p>
      )}

      {upcomingPinned.length > 0 && (
        <div className="rounded border border-[var(--line)] p-3">
          <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
            Pinned · alerts 15 min before
          </h3>
          <ul className="flex flex-col gap-1.5">
            {upcomingPinned.map((e) => (
              <li key={e.id} className="flex items-center gap-2 text-xs">
                <span className="w-[88px] shrink-0 font-mono text-[var(--muted)]">
                  {fmtDateKeyShort(dateKeyFor(e.atMs, offset))}
                </span>
                <span className="w-11 shrink-0 font-mono">{fmtHM(localMinutesOf(e.atMs, offset))}</span>
                <span className="min-w-0 flex-1 truncate">
                  {e.country && <span className="mr-1.5 font-mono text-[var(--muted)]">{e.country}</span>}
                  {e.title}
                </span>
                {nowMs !== null && (
                  <span className="shrink-0 font-mono text-[var(--accent)]">
                    {fmtCountdown(e.atMs - nowMs)}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => onTogglePin(e.id)}
                  aria-label={`Unpin ${e.title}`}
                  className="shrink-0 text-[var(--muted)] hover:text-[var(--danger)]"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <ul className="flex flex-col divide-y divide-[var(--line)] border-y border-[var(--line)] lg:max-h-[440px] lg:overflow-y-auto">
        {rows.length === 0 && feed.status !== "loading" && (
          <li className="py-6 text-center text-xs text-[var(--muted)]">
            No events for this date{impactFilter !== "all" || currencyFilter !== "all" ? " with these filters" : ""}.
          </li>
        )}
        {rows.map((e) => {
          const isPinned = pinnedIds.includes(e.id);
          const holiday = e.impact === "holiday";
          const day = e.allDay && e.dateKey ? e.dateKey : dateKeyFor(e.atMs, offset);
          const countdown =
            isPinned && nowMs !== null && e.atMs > nowMs ? fmtCountdown(e.atMs - nowMs) : null;
          return (
            <li key={e.id} className="flex items-start gap-3 py-2.5">
              <span className="w-12 shrink-0 pt-0.5 font-mono text-sm">
                {holiday ? "All day" : fmtHM(localMinutesOf(e.atMs, offset))}
              </span>
              {holiday ? (
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--danger)]" title="Holiday" />
              ) : (
                <span
                  className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${IMPACT_DOT[e.impact as Impact]}`}
                  title={`${e.impact} impact`}
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm">
                  {e.country && <span className="mr-2 font-mono text-xs text-[var(--muted)]">{e.country}</span>}
                  {e.title}
                  {holiday && (
                    <span className="ml-2 rounded bg-[color-mix(in_srgb,var(--danger)_16%,transparent)] px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-[var(--danger)]">
                      {e.country === "ALL" ? "Market closed" : "Holiday"}
                    </span>
                  )}
                </p>
                <p className="font-mono text-[11px] text-[var(--muted)]">
                  {fmtDateKeyShort(day)}
                  {e.forecast ? ` · F ${e.forecast}` : ""}
                  {e.previous ? ` · P ${e.previous}` : ""}
                  {countdown && <span className="text-[var(--accent)]"> · in {countdown}</span>}
                </p>
              </div>
              {e.custom && (
                <button
                  type="button"
                  onClick={() => onRemoveCustom(e.id)}
                  className="pt-0.5 text-xs text-[var(--muted)] hover:text-[var(--danger)]"
                  aria-label={`Delete ${e.title}`}
                >
                  ✕
                </button>
              )}
              {!holiday && (
                <button
                  type="button"
                  onClick={() => onTogglePin(e.id)}
                  aria-pressed={isPinned}
                  className={`shrink-0 rounded border px-2.5 py-1 text-xs transition-colors ${
                    isPinned
                      ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--bg)]"
                      : "border-[var(--line)] text-[var(--muted)] hover:border-[var(--fg)] hover:text-[var(--fg)]"
                  }`}
                >
                  {isPinned ? "On clock" : "Add"}
                </button>
              )}
            </li>
          );
        })}
      </ul>

      <form onSubmit={submit} className="flex flex-col gap-2">
        <h3 className="text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
          Add your own event on {fmtDateKeyShort(dateKey)}
        </h3>
        <div className="flex flex-wrap gap-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            aria-label="Event title"
            className={`${field} min-w-0 flex-1 basis-40`}
          />
          <input
            value={time}
            onChange={(e) => setTime(e.target.value)}
            placeholder="HH:MM"
            aria-label="Event time (24h)"
            className={`${field} w-20 font-mono`}
          />
          <select
            value={impact}
            onChange={(e) => setImpact(e.target.value as Impact)}
            aria-label="Impact"
            className={`${field} bg-[var(--bg)]`}
          >
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <button type="submit" className="rounded bg-[var(--fg)] px-3 py-1.5 text-sm text-[var(--bg)]">
            Add
          </button>
        </div>
        {error && <p className="text-xs text-[var(--danger)]">{error}</p>}
      </form>
    </section>
  );
}

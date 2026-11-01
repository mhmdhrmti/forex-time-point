"use client";

import { useMemo, useState } from "react";
import {
  dateKeyFor,
  dayStartMs,
  fmtCountdown,
  fmtDateKey,
  fmtDateKeyShort,
  fmtGmt,
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
  /** Selected events that have not happened yet, on any date. */
  upcomingSelected: NewsEvent[];
  selectedIds: string[];
  offset: number;
  nowMs: number | null;
  feed: FeedState;
  leadMin: number;
  impactFilter: ImpactFilter;
  currencyFilter: string;
  hoverId: string | null;
  onHover: (id: string | null) => void;
  onLeadChange: (m: number) => void;
  onImpactFilter: (f: ImpactFilter) => void;
  onCurrencyFilter: (c: string) => void;
  onToggleSelect: (e: NewsEvent) => void;
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
  "rounded-md border border-[var(--line)] bg-transparent px-2 py-1.5 text-sm outline-none focus:border-[var(--accent)]";

export default function NewsPanel({
  dateKey,
  isToday,
  dayEvents,
  upcomingSelected,
  selectedIds,
  offset,
  nowMs,
  feed,
  leadMin,
  impactFilter,
  currencyFilter,
  hoverId,
  onHover,
  onLeadChange,
  onImpactFilter,
  onCurrencyFilter,
  onToggleSelect,
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
          selectedIds.includes(e.id) ||
          ((impactFilter === "all" || e.impact === impactFilter) &&
            (currencyFilter === "all" || e.country === currencyFilter)),
      ),
    [dayEvents, impactFilter, currencyFilter, selectedIds],
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
          <h2 className="text-base font-semibold tracking-tight">
            {fmtDateKey(dateKey)}
            {isToday && (
              <span className="ml-2 rounded-full bg-[color-mix(in_srgb,var(--accent)_14%,transparent)] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-[var(--accent)]">
                Today
              </span>
            )}
          </h2>
          <p className="text-xs text-[var(--muted)]">Forex Factory · times in {fmtGmt(offset)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex gap-1" role="group" aria-label="Filter by impact">
            {(["all", "high", "medium", "low"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => onImpactFilter(f)}
                aria-pressed={impactFilter === f}
                className={`rounded-md px-2 py-1 text-xs capitalize transition-colors ${
                  impactFilter === f
                    ? "bg-[var(--fg)] text-[var(--bg)]"
                    : "text-[var(--muted)] ring-1 ring-[var(--line)] hover:text-[var(--fg)]"
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
            className="rounded-md border border-[var(--line)] bg-[var(--surface)] px-2 py-1 text-xs"
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
        <p className="rounded-lg bg-[var(--surface)] px-3 py-2.5 text-xs text-[var(--muted)] ring-1 ring-[var(--line)]">
          Loading events for {fmtDateKeyShort(dateKey)} from Forex Factory…
        </p>
      )}
      {feed.status === "error" && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border-l-4 border-[var(--danger)] bg-[var(--surface)] px-3 py-2.5 text-xs ring-1 ring-[var(--line)]">
          <span className="min-w-0 flex-1 text-[var(--danger)]">{feed.message}</span>
          <button type="button" onClick={onRetry} className="rounded-md px-2.5 py-1 ring-1 ring-[var(--line)] hover:ring-[var(--fg)]">
            Retry
          </button>
        </div>
      )}
      {feed.status === "ready" && feed.stale && (
        <p className="text-[11px] text-[var(--muted)]">
          Showing the last saved copy; Forex Factory could not be reached just now.
        </p>
      )}

      {/* Selected events and their alerts */}
      <div className="rounded-xl bg-[var(--surface)] p-3.5 ring-1 ring-[var(--line)]">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
            Selected events
          </h3>
          <label className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
            Alert me
            <select
              value={leadMin}
              onChange={(e) => onLeadChange(Number(e.target.value))}
              aria-label="Alert lead time in minutes"
              className="rounded-md border border-[var(--line)] bg-[var(--surface)] px-1.5 py-1 text-xs text-[var(--fg)]"
            >
              {[2, 5, 10, 15, 30].map((m) => (
                <option key={m} value={m}>
                  {m} min
                </option>
              ))}
            </select>
            before
          </label>
        </div>
        {upcomingSelected.length === 0 ? (
          <p className="text-xs text-[var(--muted)]">
            Press <span className="font-medium text-[var(--fg)]">Select</span> on an event below to show it on the
            clock and get an alert.
          </p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {upcomingSelected.map((e) => (
              <li
                key={e.id}
                onMouseEnter={() => onHover(e.id)}
                onMouseLeave={() => onHover(null)}
                className="flex items-center gap-2 text-xs"
              >
                <span className="w-[84px] shrink-0 font-mono text-[var(--muted)]">
                  {fmtDateKeyShort(dateKeyFor(e.atMs, offset))}
                </span>
                <span className="w-11 shrink-0 font-mono font-medium">{fmtHM(localMinutesOf(e.atMs, offset))}</span>
                <span className="min-w-0 flex-1 truncate">
                  {e.country && <span className="mr-1.5 font-mono text-[var(--muted)]">{e.country}</span>}
                  {e.title}
                </span>
                {nowMs !== null && (
                  <span className="shrink-0 font-mono text-[var(--accent)]">{fmtCountdown(e.atMs - nowMs)}</span>
                )}
                <button
                  type="button"
                  onClick={() => onToggleSelect(e)}
                  aria-label={`Unselect ${e.title}`}
                  className="shrink-0 text-[var(--muted)] hover:text-[var(--danger)]"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ul className="flex flex-col overflow-hidden rounded-xl bg-[var(--surface)] ring-1 ring-[var(--line)] lg:max-h-[460px] lg:overflow-y-auto">
        {rows.length === 0 && feed.status !== "loading" && feed.status !== "error" && (
          <li className="px-4 py-8 text-center text-xs text-[var(--muted)]">
            No events for this date{impactFilter !== "all" || currencyFilter !== "all" ? " with these filters" : ""}.
          </li>
        )}
        {rows.map((e, i) => {
          const isSelected = selectedIds.includes(e.id);
          const holiday = e.impact === "holiday";
          const day = e.allDay && e.dateKey ? e.dateKey : dateKeyFor(e.atMs, offset);
          const countdown =
            isSelected && nowMs !== null && e.atMs > nowMs ? fmtCountdown(e.atMs - nowMs) : null;
          return (
            <li
              key={e.id}
              onMouseEnter={() => onHover(e.id)}
              onMouseLeave={() => onHover(null)}
              className={`flex items-start gap-3 border-l-[3px] px-3.5 py-2.5 transition-colors ${
                i > 0 ? "border-t border-t-[var(--line)]" : ""
              } ${
                isSelected
                  ? "border-l-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_9%,transparent)]"
                  : hoverId === e.id
                    ? "border-l-transparent bg-[color-mix(in_srgb,var(--fg)_4%,transparent)]"
                    : "border-l-transparent"
              }`}
            >
              <span className="w-12 shrink-0 pt-0.5 font-mono text-sm">
                {e.allDay ? "All day" : fmtHM(localMinutesOf(e.atMs, offset))}
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
                  <span className={isSelected ? "font-medium" : ""}>{e.title}</span>
                  {holiday && (
                    <span className="ml-2 rounded bg-[color-mix(in_srgb,var(--danger)_14%,transparent)] px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-[var(--danger)]">
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
              {!holiday && !e.allDay && (
                <button
                  type="button"
                  onClick={() => onToggleSelect(e)}
                  aria-pressed={isSelected}
                  className={`shrink-0 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                    isSelected
                      ? "bg-[var(--accent)] text-white"
                      : "text-[var(--muted)] ring-1 ring-[var(--line)] hover:text-[var(--fg)] hover:ring-[var(--fg)]"
                  }`}
                >
                  {isSelected ? "Selected" : "Select"}
                </button>
              )}
            </li>
          );
        })}
      </ul>

      <form onSubmit={submit} className="flex flex-col gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
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
            className={`${field} bg-[var(--surface)]`}
          >
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <button type="submit" className="rounded-md bg-[var(--fg)] px-3 py-1.5 text-sm font-medium text-[var(--bg)]">
            Add
          </button>
        </div>
        {error && <p className="text-xs text-[var(--danger)]">{error}</p>}
      </form>
    </section>
  );
}

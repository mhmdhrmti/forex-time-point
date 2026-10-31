"use client";

import { useMemo, useState } from "react";
import { fmtCountdown, fmtHM, nextOccurrenceMs, parseHM, toLocalMinutes, toUtcMinutes } from "@/lib/time";
import type { Impact, NewsEvent } from "@/lib/types";

interface Props {
  events: NewsEvent[];
  pinnedIds: string[];
  offset: number;
  nowMs: number | null;
  onTogglePin: (id: string) => void;
  onAddCustom: (e: Omit<NewsEvent, "id" | "custom">) => void;
  onRemoveCustom: (id: string) => void;
}

const IMPACT_DOT: Record<Impact, string> = {
  high: "bg-[#e5736b]",
  medium: "bg-[#e0b457]",
  low: "bg-[#8fa3b8]",
};

export default function NewsPanel({
  events,
  pinnedIds,
  offset,
  nowMs,
  onTogglePin,
  onAddCustom,
  onRemoveCustom,
}: Props) {
  const [filter, setFilter] = useState<Impact | "all">("all");
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");
  const [impact, setImpact] = useState<Impact>("high");
  const [error, setError] = useState("");

  const rows = useMemo(
    () =>
      events
        .filter((e) => filter === "all" || e.impact === filter)
        .map((e) => ({ e, local: toLocalMinutes(e.utcMinutes, offset) }))
        .sort((a, b) => a.local - b.local),
    [events, filter, offset],
  );

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    const minutes = parseHM(time);
    if (!title.trim()) return setError("Enter a title.");
    if (minutes === null) return setError("Time must be HH:MM (24h).");
    setError("");
    onAddCustom({
      title: title.trim(),
      region: "—",
      impact,
      utcMinutes: toUtcMinutes(minutes, offset),
    });
    setTitle("");
    setTime("");
  };

  return (
    <section aria-label="Daily news and events" className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-medium tracking-wide">Daily events</h2>
          <p className="text-xs text-[var(--muted)]">
            Sample feed · times shown in your selected zone
          </p>
        </div>
        <div className="flex gap-1" role="group" aria-label="Filter by impact">
          {(["all", "high", "medium", "low"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              aria-pressed={filter === f}
              className={`rounded px-2 py-1 text-xs capitalize transition-colors ${
                filter === f
                  ? "bg-[var(--fg)] text-[var(--bg)]"
                  : "border border-[var(--line)] text-[var(--muted)] hover:text-[var(--fg)]"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <ul className="flex max-h-[420px] flex-col divide-y divide-[var(--line)] overflow-y-auto border-y border-[var(--line)]">
        {rows.length === 0 && (
          <li className="py-6 text-center text-xs text-[var(--muted)]">No events match.</li>
        )}
        {rows.map(({ e, local }) => {
          const isPinned = pinnedIds.includes(e.id);
          const countdown =
            isPinned && nowMs !== null
              ? fmtCountdown(nextOccurrenceMs(nowMs, e.utcMinutes) - nowMs)
              : null;
          return (
            <li key={e.id} className="flex items-center gap-3 py-2.5">
              <span className="w-12 shrink-0 font-mono text-sm">{fmtHM(local)}</span>
              <span
                className={`h-2 w-2 shrink-0 rounded-full ${IMPACT_DOT[e.impact]}`}
                title={`${e.impact} impact`}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">
                  <span className="mr-2 font-mono text-xs text-[var(--muted)]">{e.region}</span>
                  {e.title}
                </p>
                {countdown && (
                  <p className="font-mono text-[11px] text-[var(--accent)]">in {countdown}</p>
                )}
              </div>
              {e.custom && (
                <button
                  type="button"
                  onClick={() => onRemoveCustom(e.id)}
                  className="text-xs text-[var(--muted)] hover:text-[#e5736b]"
                  aria-label={`Delete ${e.title}`}
                >
                  ✕
                </button>
              )}
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
            </li>
          );
        })}
      </ul>

      <form onSubmit={submit} className="flex flex-col gap-2">
        <h3 className="text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
          Add your own event
        </h3>
        <div className="flex flex-wrap gap-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            aria-label="Event title"
            className="min-w-0 flex-1 rounded border border-[var(--line)] bg-transparent px-2 py-1.5 text-sm outline-none focus:border-[var(--accent)]"
          />
          <input
            value={time}
            onChange={(e) => setTime(e.target.value)}
            placeholder="HH:MM"
            aria-label="Event time (24h)"
            className="w-20 rounded border border-[var(--line)] bg-transparent px-2 py-1.5 font-mono text-sm outline-none focus:border-[var(--accent)]"
          />
          <select
            value={impact}
            onChange={(e) => setImpact(e.target.value as Impact)}
            aria-label="Impact"
            className="rounded border border-[var(--line)] bg-[var(--bg)] px-2 py-1.5 text-sm"
          >
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <button
            type="submit"
            className="rounded bg-[var(--fg)] px-3 py-1.5 text-sm text-[var(--bg)]"
          >
            Add
          </button>
        </div>
        {error && <p className="text-xs text-[#e5736b]">{error}</p>}
      </form>
    </section>
  );
}

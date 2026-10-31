"use client";

import { useState } from "react";
import { fmtHM, parseHM, toLocalMinutes, toUtcMinutes } from "@/lib/time";
import type { TimeInterval, TimePoint } from "@/lib/types";

interface Props {
  points: TimePoint[];
  intervals: TimeInterval[];
  offset: number;
  onAddPoint: (p: Omit<TimePoint, "id">) => void;
  onRemovePoint: (id: string) => void;
  onAddInterval: (i: Omit<TimeInterval, "id">) => void;
  onRemoveInterval: (id: string) => void;
}

const field =
  "rounded border border-[var(--line)] bg-transparent px-2 py-1.5 text-sm outline-none focus:border-[var(--accent)]";

export default function MarksPanel({
  points,
  intervals,
  offset,
  onAddPoint,
  onRemovePoint,
  onAddInterval,
  onRemoveInterval,
}: Props) {
  const [pLabel, setPLabel] = useState("");
  const [pTime, setPTime] = useState("");
  const [iLabel, setILabel] = useState("");
  const [iStart, setIStart] = useState("");
  const [iEnd, setIEnd] = useState("");
  const [error, setError] = useState("");

  const addPoint = (ev: React.FormEvent) => {
    ev.preventDefault();
    const m = parseHM(pTime);
    if (!pLabel.trim() || m === null) return setError("Point needs a label and HH:MM time.");
    setError("");
    onAddPoint({ label: pLabel.trim(), utcMinutes: toUtcMinutes(m, offset) });
    setPLabel("");
    setPTime("");
  };

  const addInterval = (ev: React.FormEvent) => {
    ev.preventDefault();
    const s = parseHM(iStart);
    const e = parseHM(iEnd);
    if (!iLabel.trim() || s === null || e === null || s === e)
      return setError("Interval needs a label and two different HH:MM times.");
    setError("");
    onAddInterval({
      label: iLabel.trim(),
      startUtc: toUtcMinutes(s, offset),
      endUtc: toUtcMinutes(e, offset),
    });
    setILabel("");
    setIStart("");
    setIEnd("");
  };

  return (
    <section aria-label="Time points and intervals" className="flex flex-col gap-5">
      <div>
        <h2 className="text-sm font-medium tracking-wide">Time points & intervals</h2>
        <p className="text-xs text-[var(--muted)]">
          Entered in your selected zone; they follow it when you switch.
        </p>
      </div>

      <form onSubmit={addPoint} className="flex flex-wrap gap-2">
        <input value={pLabel} onChange={(e) => setPLabel(e.target.value)} placeholder="Point label" aria-label="Point label" className={`${field} min-w-0 flex-1`} />
        <input value={pTime} onChange={(e) => setPTime(e.target.value)} placeholder="HH:MM" aria-label="Point time" className={`${field} w-20 font-mono`} />
        <button type="submit" className="rounded bg-[var(--fg)] px-3 py-1.5 text-sm text-[var(--bg)]">
          Add point
        </button>
      </form>

      <form onSubmit={addInterval} className="flex flex-wrap gap-2">
        <input value={iLabel} onChange={(e) => setILabel(e.target.value)} placeholder="Interval label" aria-label="Interval label" className={`${field} min-w-0 flex-1`} />
        <input value={iStart} onChange={(e) => setIStart(e.target.value)} placeholder="Start" aria-label="Interval start" className={`${field} w-20 font-mono`} />
        <input value={iEnd} onChange={(e) => setIEnd(e.target.value)} placeholder="End" aria-label="Interval end" className={`${field} w-20 font-mono`} />
        <button type="submit" className="rounded bg-[var(--fg)] px-3 py-1.5 text-sm text-[var(--bg)]">
          Add interval
        </button>
      </form>
      {error && <p className="text-xs text-[#e5736b]">{error}</p>}

      <ul className="flex flex-col divide-y divide-[var(--line)] border-y border-[var(--line)]">
        {points.length === 0 && intervals.length === 0 && (
          <li className="py-6 text-center text-xs text-[var(--muted)]">Nothing marked yet.</li>
        )}
        {points.map((p) => (
          <li key={p.id} className="flex items-center gap-3 py-2.5 text-sm">
            <span className="w-24 shrink-0 font-mono">{fmtHM(toLocalMinutes(p.utcMinutes, offset))}</span>
            <span className="min-w-0 flex-1 truncate">{p.label}</span>
            <span className="text-xs text-[var(--muted)]">point</span>
            <button type="button" onClick={() => onRemovePoint(p.id)} aria-label={`Delete ${p.label}`} className="text-xs text-[var(--muted)] hover:text-[#e5736b]">
              ✕
            </button>
          </li>
        ))}
        {intervals.map((i) => (
          <li key={i.id} className="flex items-center gap-3 py-2.5 text-sm">
            <span className="w-24 shrink-0 font-mono">
              {fmtHM(toLocalMinutes(i.startUtc, offset))}–{fmtHM(toLocalMinutes(i.endUtc, offset))}
            </span>
            <span className="min-w-0 flex-1 truncate">{i.label}</span>
            <span className="text-xs text-[var(--muted)]">interval</span>
            <button type="button" onClick={() => onRemoveInterval(i.id)} aria-label={`Delete ${i.label}`} className="text-xs text-[var(--muted)] hover:text-[#e5736b]">
              ✕
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

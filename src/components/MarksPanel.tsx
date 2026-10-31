"use client";

import { useState } from "react";
import { fmtHM, parseHM, toLocalMinutes, toUtcMinutes } from "@/lib/time";
import type { TimePoint, TimeRange } from "@/lib/types";

interface Props {
  points: TimePoint[];
  ranges: TimeRange[];
  offset: number;
  onAddPoint: (p: Omit<TimePoint, "id">) => void;
  onRemovePoint: (id: string) => void;
  onAddRange: (r: Omit<TimeRange, "id">) => void;
  onRemoveRange: (id: string) => void;
}

const field =
  "rounded border border-[var(--line)] bg-transparent px-2 py-1.5 text-sm outline-none focus:border-[var(--accent)]";

export default function MarksPanel({
  points,
  ranges,
  offset,
  onAddPoint,
  onRemovePoint,
  onAddRange,
  onRemoveRange,
}: Props) {
  const [pLabel, setPLabel] = useState("");
  const [pTime, setPTime] = useState("");
  const [rLabel, setRLabel] = useState("");
  const [rStart, setRStart] = useState("");
  const [rEnd, setREnd] = useState("");
  const [error, setError] = useState("");

  const addPoint = (ev: React.FormEvent) => {
    ev.preventDefault();
    const m = parseHM(pTime);
    if (!pLabel.trim() || m === null) return setError("A point needs a label and an HH:MM time.");
    setError("");
    onAddPoint({ label: pLabel.trim(), utcMinutes: toUtcMinutes(m, offset) });
    setPLabel("");
    setPTime("");
  };

  const addRange = (ev: React.FormEvent) => {
    ev.preventDefault();
    const s = parseHM(rStart);
    const e = parseHM(rEnd);
    if (!rLabel.trim() || s === null || e === null || s === e)
      return setError("A range needs a label and two different HH:MM times.");
    setError("");
    onAddRange({
      label: rLabel.trim(),
      startUtc: toUtcMinutes(s, offset),
      endUtc: toUtcMinutes(e, offset),
    });
    setRLabel("");
    setRStart("");
    setREnd("");
  };

  return (
    <section aria-label="Time points and ranges" className="flex flex-col gap-5">
      <div>
        <h2 className="text-sm font-medium tracking-wide">Time points & ranges</h2>
        <p className="text-xs text-[var(--muted)]">
          Entered in your selected zone and repeated every day. A range is drawn as a triangle
          from the centre to its start and end.
        </p>
      </div>

      <form onSubmit={addPoint} className="flex flex-wrap gap-2">
        <input value={pLabel} onChange={(e) => setPLabel(e.target.value)} placeholder="Point label" aria-label="Point label" className={`${field} min-w-0 flex-1 basis-36`} />
        <input value={pTime} onChange={(e) => setPTime(e.target.value)} placeholder="HH:MM" aria-label="Point time" className={`${field} w-20 font-mono`} />
        <button type="submit" className="rounded bg-[var(--fg)] px-3 py-1.5 text-sm text-[var(--bg)]">
          Add point
        </button>
      </form>

      <form onSubmit={addRange} className="flex flex-wrap gap-2">
        <input value={rLabel} onChange={(e) => setRLabel(e.target.value)} placeholder="Range label" aria-label="Range label" className={`${field} min-w-0 flex-1 basis-36`} />
        <input value={rStart} onChange={(e) => setRStart(e.target.value)} placeholder="Start" aria-label="Range start" className={`${field} w-20 font-mono`} />
        <input value={rEnd} onChange={(e) => setREnd(e.target.value)} placeholder="End" aria-label="Range end" className={`${field} w-20 font-mono`} />
        <button type="submit" className="rounded bg-[var(--fg)] px-3 py-1.5 text-sm text-[var(--bg)]">
          Add range
        </button>
      </form>
      {error && <p className="text-xs text-[var(--danger)]">{error}</p>}

      <ul className="flex flex-col divide-y divide-[var(--line)] border-y border-[var(--line)]">
        {points.length === 0 && ranges.length === 0 && (
          <li className="py-6 text-center text-xs text-[var(--muted)]">Nothing marked yet.</li>
        )}
        {points.map((p) => (
          <li key={p.id} className="flex items-center gap-3 py-2.5 text-sm">
            <span className="w-24 shrink-0 font-mono">{fmtHM(toLocalMinutes(p.utcMinutes, offset))}</span>
            <span className="min-w-0 flex-1 truncate">{p.label}</span>
            <span className="text-xs text-[var(--muted)]">point</span>
            <button type="button" onClick={() => onRemovePoint(p.id)} aria-label={`Delete ${p.label}`} className="text-xs text-[var(--muted)] hover:text-[var(--danger)]">
              ✕
            </button>
          </li>
        ))}
        {ranges.map((r) => (
          <li key={r.id} className="flex items-center gap-3 py-2.5 text-sm">
            <span className="w-24 shrink-0 font-mono">
              {fmtHM(toLocalMinutes(r.startUtc, offset))}–{fmtHM(toLocalMinutes(r.endUtc, offset))}
            </span>
            <span className="min-w-0 flex-1 truncate">{r.label}</span>
            <span className="text-xs text-[var(--muted)]">range</span>
            <button type="button" onClick={() => onRemoveRange(r.id)} aria-label={`Delete ${r.label}`} className="text-xs text-[var(--muted)] hover:text-[var(--danger)]">
              ✕
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

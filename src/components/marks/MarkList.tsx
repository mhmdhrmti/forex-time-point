import { fmtHM, toLocalMinutes } from "@/lib/time";
import type { TimePoint, TimeRange } from "@/lib/types";

interface Props {
  points: TimePoint[];
  ranges: TimeRange[];
  offset: number;
  onRemovePoint: (id: string) => void;
  onRemoveRange: (id: string) => void;
}

function Row({ time, label, kind, onRemove }: { time: string; label: string; kind: string; onRemove: () => void }) {
  return (
    <li className="flex items-center gap-3 py-2.5 text-sm">
      <span className="w-24 shrink-0 font-mono">{time}</span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
      <span className="text-xs text-[var(--muted)]">{kind}</span>
      <button type="button" onClick={onRemove} aria-label={`Delete ${label}`} className="text-xs text-[var(--muted)] hover:text-[var(--danger)]">
        ✕
      </button>
    </li>
  );
}

/** Existing points and ranges (deleting stays possible while the market is closed). */
export default function MarkList({ points, ranges, offset, onRemovePoint, onRemoveRange }: Props) {
  return (
    <ul className="flex flex-col divide-y divide-[var(--line)] border-y border-[var(--line)]">
      {points.length === 0 && ranges.length === 0 && <li className="py-6 text-center text-xs text-[var(--muted)]">Nothing marked yet.</li>}
      {points.map((p) => (
        <Row key={p.id} time={fmtHM(toLocalMinutes(p.utcMinutes, offset))} label={p.label} kind="point" onRemove={() => onRemovePoint(p.id)} />
      ))}
      {ranges.map((r) => (
        <Row key={r.id} time={`${fmtHM(toLocalMinutes(r.startUtc, offset))}–${fmtHM(toLocalMinutes(r.endUtc, offset))}`} label={r.label} kind="range" onRemove={() => onRemoveRange(r.id)} />
      ))}
    </ul>
  );
}

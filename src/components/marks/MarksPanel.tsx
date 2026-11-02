import { useState } from "react";
import type { TimePoint, TimeRange } from "@/lib/types";
import MarkList from "./MarkList";
import PointForm from "./PointForm";
import RangeForm from "./RangeForm";

interface Props {
  points: TimePoint[];
  ranges: TimeRange[];
  offset: number;
  /** Market closed: adding is locked (existing marks can still be removed). */
  locked: boolean;
  onAddPoint: (p: Omit<TimePoint, "id">) => void;
  onRemovePoint: (id: string) => void;
  onAddRange: (r: Omit<TimeRange, "id">) => void;
  onRemoveRange: (id: string) => void;
}

/** The "Points & ranges" tab. */
export default function MarksPanel(p: Props) {
  const [error, setError] = useState("");
  return (
    <section aria-label="Time points and ranges" className="flex flex-col gap-5">
      <div>
        <h2 className="text-sm font-medium tracking-wide">Time points & ranges</h2>
        <p className="text-xs text-[var(--muted)]">
          Entered in your selected zone and repeated every day. A range is drawn as a wedge from the centre to its start and end.
        </p>
      </div>
      {p.locked && (
        <p role="status" className="rounded-lg border-l-4 border-[var(--danger)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--danger)] ring-1 ring-[var(--line)]">
          The market is closed — adding time points and ranges is disabled.
        </p>
      )}
      <PointForm offset={p.offset} disabled={p.locked} onAdd={p.onAddPoint} onError={setError} />
      <RangeForm offset={p.offset} disabled={p.locked} onAdd={p.onAddRange} onError={setError} />
      {error && <p className="text-xs text-[var(--danger)]">{error}</p>}
      <MarkList points={p.points} ranges={p.ranges} offset={p.offset} onRemovePoint={p.onRemovePoint} onRemoveRange={p.onRemoveRange} />
    </section>
  );
}

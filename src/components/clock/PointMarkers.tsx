import { fmtHM, toLocalMinutes } from "@/lib/time";
import type { TimePoint } from "@/lib/types";
import Marker from "./Marker";

/** User time points: high-contrast "ink" pills (white on dark, black on light) joined to the centre by a dashed line. */
export default function PointMarkers({ points, offset }: { points: TimePoint[]; offset: number }) {
  return (
    <g>
      {points.map((p) => {
        const m = toLocalMinutes(p.utcMinutes, offset);
        return (
          <Marker
            key={p.id}
            minutes={m}
            text={fmtHM(m)}
            fill="var(--fg)"
            textFill="var(--bg)"
            title={`${p.label} · ${fmtHM(m)}`}
          />
        );
      })}
    </g>
  );
}

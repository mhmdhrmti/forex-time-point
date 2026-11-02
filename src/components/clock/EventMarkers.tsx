import { fmtHM, localMinutesOf } from "@/lib/time";
import type { NewsEvent } from "@/lib/types";
import Marker from "./Marker";

/* Fixed marker colours (not theme variables) so white text stays readable in both themes. */
const FILL = { high: "#e5484d", medium: "#d98a0b", low: "#6b7a90", holiday: "#e5484d" } as const;

interface Props {
  events: NewsEvent[];
  offset: number;
  highlightId: string | null;
}

/** Selected news events, coloured by impact. */
export default function EventMarkers({ events, offset, highlightId }: Props) {
  return (
    <g>
      {events.map((e) => {
        const m = localMinutesOf(e.atMs, offset);
        return (
          <Marker
            key={e.id}
            minutes={m}
            text={fmtHM(m)}
            fill={FILL[e.impact]}
            textFill="#fff"
            hot={e.id === highlightId}
            title={`${e.country} ${e.title} · ${fmtHM(m)}`}
          />
        );
      })}
    </g>
  );
}

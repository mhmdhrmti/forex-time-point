import { SESSIONS } from "@/lib/data";
import { arcPath, fmtGmt, fmtHM, toLocalMinutes } from "@/lib/time";
import { C, LANE_BOTTOM, LANE_TOP, LANE_W, laneCentre } from "./geometry";

interface Props {
  offset: number;
  /** Per-session visibility (missing = visible). */
  visible: Record<string, boolean>;
  /** Session id → reason, for sessions closed by a bank holiday. */
  closedSessions: Record<string, string>;
}

/** Trading sessions as wide, translucent, distinctly coloured lanes on a shared faint track. */
export default function SessionLanes({ offset, visible, closedSessions }: Props) {
  const shown = SESSIONS.filter((s) => visible[s.id] !== false);
  return (
    <g>
      <circle cx={C} cy={C} r={(LANE_TOP + LANE_BOTTOM) / 2} fill="none" stroke="var(--lane-track)" strokeWidth={LANE_TOP - LANE_BOTTOM} />
      {shown.map((s, i) => {
        const start = toLocalMinutes(s.startUtc, offset);
        const end = toLocalMinutes(s.endUtc, offset);
        const reason = closedSessions[s.id];
        return (
          <path
            key={s.id}
            d={arcPath(C, C, laneCentre(i), start, end)}
            fill="none"
            stroke={s.color}
            strokeWidth={LANE_W - 3}
            strokeOpacity={reason ? 0.14 : 0.55}
          >
            <title>{`${s.name}: ${fmtHM(start)}–${fmtHM(end)} (${fmtGmt(offset)})${reason ? ` — closed (${reason})` : ""}`}</title>
          </path>
        );
      })}
    </g>
  );
}

"use client";

import { SESSIONS } from "@/lib/data";
import {
  arcPath,
  fmtClock,
  fmtDateKey,
  fmtGmt,
  fmtHM,
  localMinutesOf,
  polar,
  toLocalMinutes,
} from "@/lib/time";
import type { NewsEvent, TimePoint, TimeRange } from "@/lib/types";

interface Props {
  nowMs: number | null;
  offset: number;
  /** Calendar date being viewed (null until the client clock is ready). */
  dateKey: string | null;
  isToday: boolean;
  /** Timed events pinned to the clock for the viewed date. */
  pinned: NewsEvent[];
  points: TimePoint[];
  ranges: TimeRange[];
  visibleSessions: Record<string, boolean>;
  closedSessions: Record<string, string>;
  closedWindows: Array<[number, number]>;
  fullyClosed: boolean;
}

/* Geometry (viewBox units; the SVG scales to its container). */
const SIZE = 720;
const C = SIZE / 2;
const R_LABEL = 328; // numerals sit outside the ring; 3 and 9 o'clock ones extend ~22 units sideways
const R_RING = 290;
const LANE_W = 20;
const LANE_OUTER = 282;
const R_TRI = 194;
const R_BAND_MID = LANE_OUTER - (SESSIONS.length * LANE_W) / 2;

const RANGE_COLORS = ["#3a9bd0", "#e0a030", "#b062c8", "#2fa37a", "#e0605a"];
const IMPACT_VAR = {
  high: "var(--impact-high)",
  medium: "var(--impact-medium)",
  low: "var(--impact-low)",
  holiday: "var(--danger)",
} as const;

export default function Clock({
  nowMs,
  offset,
  dateKey,
  isToday,
  pinned,
  points,
  ranges,
  visibleSessions,
  closedSessions,
  closedWindows,
  fullyClosed,
}: Props) {
  const nowMin = nowMs === null ? null : localMinutesOf(nowMs, offset);
  const visible = SESSIONS.filter((s) => visibleSessions[s.id] !== false);
  const hand = nowMin === null ? null : polar(C, C, R_RING + 4, nowMin);

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      role="img"
      aria-label="24-hour trading clock"
      className="mx-auto h-auto w-full max-w-[720px]"
    >
      <defs>
        <pattern
          id="ftp-hatch"
          width="9"
          height="9"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <line x1="0" y1="0" x2="0" y2="9" stroke="var(--danger)" strokeWidth="2.4" opacity="0.6" />
        </pattern>
      </defs>

      {/* Dial rings */}
      <circle cx={C} cy={C} r={R_RING} fill="none" stroke="var(--line)" strokeWidth={1.5} />
      <circle cx={C} cy={C} r={R_TRI} fill="none" stroke="var(--line)" strokeWidth={1} strokeDasharray="2 5" />

      {/* Hour ticks and (large) numerals */}
      {Array.from({ length: 24 }, (_, hour) => {
        const major = hour % 6 === 0;
        const a = polar(C, C, R_RING, hour * 60);
        const b = polar(C, C, R_RING + (major ? 13 : 8), hour * 60);
        const l = polar(C, C, R_LABEL, hour * 60);
        return (
          <g key={hour}>
            <line
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={major ? "var(--fg)" : "var(--muted)"}
              strokeWidth={major ? 2.4 : 1.4}
            />
            <text
              x={l.x}
              y={l.y}
              textAnchor="middle"
              dominantBaseline="central"
              className="font-mono"
              fontSize={major ? 36 : 28}
              fontWeight={major ? 700 : 500}
              fill={major ? "var(--fg)" : "var(--muted)"}
            >
              {String(hour).padStart(2, "0")}
            </text>
          </g>
        );
      })}

      {/* Selected time ranges: low-opacity triangles from the centre */}
      {ranges.map((r, i) => {
        const start = toLocalMinutes(r.startUtc, offset);
        const end = toLocalMinutes(r.endUtc, offset);
        const p1 = polar(C, C, R_TRI, start);
        const p2 = polar(C, C, R_TRI, end);
        const span = (end - start + 1440) % 1440;
        const lp = polar(C, C, R_TRI * 0.66, start + span / 2);
        const color = RANGE_COLORS[i % RANGE_COLORS.length];
        return (
          <g key={r.id}>
            <polygon
              points={`${C},${C} ${p1.x.toFixed(2)},${p1.y.toFixed(2)} ${p2.x.toFixed(2)},${p2.y.toFixed(2)}`}
              fill={color}
              fillOpacity={0.18}
              stroke={color}
              strokeOpacity={0.55}
              strokeWidth={1.5}
              strokeLinejoin="round"
            >
              <title>{`${r.label}: ${fmtHM(start)}–${fmtHM(end)}`}</title>
            </polygon>
            <text
              x={lp.x}
              y={lp.y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={17}
              fontWeight={600}
              fill={color}
              stroke="var(--bg)"
              strokeWidth={4}
              paintOrder="stroke"
            >
              {r.label.slice(0, 14)}
            </text>
          </g>
        );
      })}

      {/* Trading sessions: wide, translucent, distinctly coloured lanes (outside the triangles) */}
      {visible.map((s, i) => {
        const r = LANE_OUTER - LANE_W / 2 - i * LANE_W;
        const start = toLocalMinutes(s.startUtc, offset);
        const end = toLocalMinutes(s.endUtc, offset);
        const closed = fullyClosed || Boolean(closedSessions[s.id]);
        return (
          <g key={s.id}>
            <circle cx={C} cy={C} r={r} fill="none" stroke="var(--line)" strokeWidth={LANE_W - 2} opacity={0.35} />
            <path
              d={arcPath(C, C, r, start, end)}
              fill="none"
              stroke={s.color}
              strokeWidth={LANE_W - 2}
              strokeOpacity={closed ? 0.16 : 0.42}
              strokeDasharray={closed ? "3 5" : undefined}
            >
              <title>{`${s.name}: ${fmtHM(start)}–${fmtHM(end)} (${fmtGmt(offset)})${
                closed ? ` — closed${closedSessions[s.id] ? ` (${closedSessions[s.id]})` : ""}` : ""
              }`}</title>
            </path>
          </g>
        );
      })}

      {/* Market-closed hatching over the session band */}
      {fullyClosed ? (
        <circle
          cx={C}
          cy={C}
          r={R_BAND_MID}
          fill="none"
          stroke="url(#ftp-hatch)"
          strokeWidth={SESSIONS.length * LANE_W}
        />
      ) : (
        closedWindows.map(([a, b], i) => (
          <path
            key={i}
            d={arcPath(C, C, R_BAND_MID, a, b)}
            fill="none"
            stroke="url(#ftp-hatch)"
            strokeWidth={SESSIONS.length * LANE_W}
          />
        ))
      )}

      {/* Custom time points */}
      {points.map((p) => {
        const m = toLocalMinutes(p.utcMinutes, offset);
        const a = polar(C, C, R_TRI, m);
        const b = polar(C, C, R_RING, m);
        return (
          <g key={p.id}>
            <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="var(--accent)" strokeWidth={1.6} strokeDasharray="4 4" />
            <rect
              x={b.x - 6}
              y={b.y - 6}
              width={12}
              height={12}
              transform={`rotate(45 ${b.x} ${b.y})`}
              fill="var(--bg)"
              stroke="var(--accent)"
              strokeWidth={2}
            >
              <title>{`${p.label} · ${fmtHM(m)}`}</title>
            </rect>
          </g>
        );
      })}

      {/* Pinned news events */}
      {pinned.map((e) => {
        const m = localMinutesOf(e.atMs, offset);
        const a = polar(C, C, LANE_OUTER - SESSIONS.length * LANE_W, m);
        const b = polar(C, C, R_RING, m);
        const color = IMPACT_VAR[e.impact];
        return (
          <g key={e.id}>
            <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={color} strokeWidth={1.8} opacity={0.8} />
            <circle cx={b.x} cy={b.y} r={7.5} fill={color} stroke="var(--bg)" strokeWidth={2}>
              <title>{`${e.country} ${e.title} · ${fmtHM(m)}`}</title>
            </circle>
          </g>
        );
      })}

      {/* Now hand (only when viewing today) */}
      {isToday && hand && (
        <g>
          <line x1={C} y1={C} x2={hand.x} y2={hand.y} stroke="var(--fg)" strokeWidth={2.2} strokeLinecap="round" />
          <circle cx={C} cy={C} r={5.5} fill="var(--fg)" />
        </g>
      )}

      {/* Centre readout */}
      {fullyClosed && (
        <text
          x={C}
          y={C - 74}
          textAnchor="middle"
          fontSize={21}
          fontWeight={700}
          letterSpacing={4}
          fill="var(--danger)"
          stroke="var(--bg)"
          strokeWidth={5}
          paintOrder="stroke"
        >
          MARKET CLOSED
        </text>
      )}
      <text
        x={C}
        y={C - 8}
        textAnchor="middle"
        dominantBaseline="central"
        className="font-mono"
        fontSize={50}
        fontWeight={600}
        fill="var(--fg)"
        stroke="var(--bg)"
        strokeWidth={6}
        paintOrder="stroke"
      >
        {nowMs === null ? "--:--:--" : fmtClock(nowMs, offset)}
      </text>
      <text
        x={C}
        y={C + 40}
        textAnchor="middle"
        fontSize={19}
        fill={isToday ? "var(--muted)" : "var(--accent)"}
        stroke="var(--bg)"
        strokeWidth={5}
        paintOrder="stroke"
      >
        {dateKey ? fmtDateKey(dateKey) : ""}
      </text>
      <text
        x={C}
        y={C + 68}
        textAnchor="middle"
        className="font-mono"
        fontSize={19}
        fill="var(--accent)"
        stroke="var(--bg)"
        strokeWidth={5}
        paintOrder="stroke"
      >
        {fmtGmt(offset)}
      </text>
    </svg>
  );
}

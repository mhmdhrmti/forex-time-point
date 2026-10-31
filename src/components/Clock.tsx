"use client";

import { SESSIONS } from "@/lib/data";
import {
  arcPath,
  fmtClock,
  fmtDate,
  fmtGmt,
  fmtHM,
  nowLocalMinutes,
  polar,
  toLocalMinutes,
} from "@/lib/time";
import type { NewsEvent, TimeInterval, TimePoint } from "@/lib/types";

interface Props {
  nowMs: number | null;
  offset: number;
  pinned: NewsEvent[];
  points: TimePoint[];
  intervals: TimeInterval[];
  visibleSessions: Record<string, boolean>;
}

const C = 320;
const R_LABEL = 300;
const R_TICK_OUT = 278;
const R_SESSION0 = 258;
const R_SESSION_STEP = 13;
const R_INTERVAL = 196;
const R_INNER = 178;

const IMPACT_COLOR = { high: "#e5736b", medium: "#e0b457", low: "#8fa3b8" } as const;

export default function Clock({
  nowMs,
  offset,
  pinned,
  points,
  intervals,
  visibleSessions,
}: Props) {
  const nowMin = nowMs === null ? null : nowLocalMinutes(nowMs, offset);
  const visible = SESSIONS.filter((s) => visibleSessions[s.id] !== false);

  return (
    <svg
      viewBox="0 0 640 640"
      role="img"
      aria-label="24-hour trading clock"
      className="h-auto w-full max-w-[640px]"
    >
      {/* Hour ring */}
      <circle cx={C} cy={C} r={R_TICK_OUT} fill="none" stroke="var(--line)" strokeWidth={1} />
      <circle cx={C} cy={C} r={R_INNER} fill="none" stroke="var(--line)" strokeWidth={1} />

      {Array.from({ length: 24 }, (_, hour) => {
        const major = hour % 6 === 0;
        const a = polar(C, C, R_TICK_OUT, hour * 60);
        const b = polar(C, C, R_TICK_OUT + (major ? 14 : 8), hour * 60);
        const l = polar(C, C, R_LABEL + 6, hour * 60);
        return (
          <g key={hour}>
            <line
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={major ? "var(--fg)" : "var(--muted)"}
              strokeWidth={major ? 1.6 : 1}
            />
            <text
              x={l.x}
              y={l.y}
              textAnchor="middle"
              dominantBaseline="central"
              className="font-mono"
              fontSize={major ? 15 : 12}
              fill={major ? "var(--fg)" : "var(--muted)"}
            >
              {String(hour).padStart(2, "0")}
            </text>
          </g>
        );
      })}

      {/* Sessions: one thin concentric arc per market */}
      {visible.map((s, i) => {
        const r = R_SESSION0 - i * R_SESSION_STEP;
        const start = toLocalMinutes(s.startUtc, offset);
        const end = toLocalMinutes(s.endUtc, offset);
        return (
          <g key={s.id}>
            <circle cx={C} cy={C} r={r} fill="none" stroke="var(--line)" strokeWidth={1} strokeDasharray="2 4" />
            <path
              d={arcPath(C, C, r, start, end)}
              fill="none"
              stroke={s.color}
              strokeWidth={7}
              strokeLinecap="butt"
              opacity={0.9}
            >
              <title>
                {s.name}: {fmtHM(start)}–{fmtHM(end)} ({fmtGmt(offset)})
              </title>
            </path>
          </g>
        );
      })}

      {/* Custom intervals */}
      {intervals.map((iv) => {
        const start = toLocalMinutes(iv.startUtc, offset);
        const end = toLocalMinutes(iv.endUtc, offset);
        const mid = start + ((((end - start) % 1440) + 1440) % 1440) / 2;
        const lp = polar(C, C, R_INTERVAL - 16, mid);
        return (
          <g key={iv.id}>
            <path
              d={arcPath(C, C, R_INTERVAL, start, end)}
              fill="none"
              stroke="var(--accent)"
              strokeWidth={9}
              opacity={0.55}
            >
              <title>
                {iv.label}: {fmtHM(start)}–{fmtHM(end)}
              </title>
            </path>
            <text
              x={lp.x}
              y={lp.y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={10}
              fill="var(--accent)"
            >
              {iv.label.slice(0, 12)}
            </text>
          </g>
        );
      })}

      {/* Custom time points */}
      {points.map((p) => {
        const m = toLocalMinutes(p.utcMinutes, offset);
        const a = polar(C, C, R_INNER + 4, m);
        const b = polar(C, C, R_TICK_OUT, m);
        return (
          <g key={p.id}>
            <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="var(--accent)" strokeWidth={1.2} strokeDasharray="3 3" />
            <circle cx={a.x} cy={a.y} r={4} fill="var(--bg)" stroke="var(--accent)" strokeWidth={1.5}>
              <title>
                {p.label} · {fmtHM(m)}
              </title>
            </circle>
          </g>
        );
      })}

      {/* Pinned news events */}
      {pinned.map((e) => {
        const m = toLocalMinutes(e.utcMinutes, offset);
        const a = polar(C, C, R_INNER, m);
        const b = polar(C, C, R_TICK_OUT + 4, m);
        const color = IMPACT_COLOR[e.impact];
        return (
          <g key={e.id}>
            <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={color} strokeWidth={1.5} />
            <circle cx={b.x} cy={b.y} r={5} fill={color} stroke="var(--bg)" strokeWidth={1.5}>
              <title>
                {e.region} {e.title} · {fmtHM(m)}
              </title>
            </circle>
          </g>
        );
      })}

      {/* Now hand */}
      {nowMin !== null && (
        <g>
          <line
            x1={C}
            y1={C}
            x2={polar(C, C, R_TICK_OUT + 6, nowMin).x}
            y2={polar(C, C, R_TICK_OUT + 6, nowMin).y}
            stroke="var(--fg)"
            strokeWidth={1.5}
          />
          <circle cx={C} cy={C} r={4} fill="var(--fg)" />
        </g>
      )}

      {/* Digital readout */}
      <text
        x={C}
        y={C - 22}
        textAnchor="middle"
        className="font-mono"
        fontSize={42}
        fill="var(--fg)"
        letterSpacing={1}
      >
        {nowMs === null ? "--:--:--" : fmtClock(nowMs, offset)}
      </text>
      <text x={C} y={C + 12} textAnchor="middle" fontSize={13} fill="var(--muted)">
        {nowMs === null ? "" : fmtDate(nowMs, offset)}
      </text>
      <text x={C} y={C + 36} textAnchor="middle" className="font-mono" fontSize={13} fill="var(--accent)">
        {fmtGmt(offset)}
      </text>
    </svg>
  );
}

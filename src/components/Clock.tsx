"use client";

import { SESSIONS } from "@/lib/data";
import {
  arcPath,
  fmtGmt,
  fmtHM,
  localMinutesOf,
  polar,
  sectorPath,
  toLocalMinutes,
} from "@/lib/time";
import type { NewsEvent, TimePoint, TimeRange } from "@/lib/types";

interface Props {
  nowMs: number | null;
  offset: number;
  /** Only show the live hand while viewing today. */
  isToday: boolean;
  /** Selected (timed) events falling on the viewed date. */
  pinned: NewsEvent[];
  /** Event currently emphasised (hovered in the list). */
  highlightId: string | null;
  points: TimePoint[];
  ranges: TimeRange[];
  visibleSessions: Record<string, boolean>;
  closedSessions: Record<string, string>;
  /** Closed windows inside the day as local minutes (weekend start / end). */
  closedWindows: Array<[number, number]>;
  fullyClosed: boolean;
}

/* Geometry in viewBox units; the SVG scales to its container.
   outside → in:  numerals · hour ring · event track · session lanes · range sectors */
const SIZE = 720;
const C = SIZE / 2;
const R_LABEL = 329;
const R_RING = 292;
const R_EVENT = 277;
const LANE_W = 18;
const LANE_TOP = 264;
const LANE_BOTTOM = LANE_TOP - SESSIONS.length * LANE_W; // 192
const R_RANGE = 184;

const IMPACT_VAR = {
  high: "var(--impact-high)",
  medium: "var(--impact-medium)",
  low: "var(--impact-low)",
  holiday: "var(--danger)",
} as const;

const initials = (s: string) =>
  s
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 4)
    .toUpperCase();

export default function Clock({
  nowMs,
  offset,
  isToday,
  pinned,
  highlightId,
  points,
  ranges,
  visibleSessions,
  closedSessions,
  closedWindows,
  fullyClosed,
}: Props) {
  const nowMin = nowMs === null ? null : localMinutesOf(nowMs, offset);
  const handEnd = nowMin === null ? null : polar(C, C, R_RING, nowMin);
  const visible = SESSIONS.filter((s) => visibleSessions[s.id] !== false);
  const laneCentre = (i: number) => LANE_TOP - LANE_W / 2 - i * LANE_W;

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      role="img"
      aria-label="24-hour trading clock"
      className="mx-auto h-auto w-full max-w-[720px]"
    >
      <defs>
        {/* Ranges fade from the centre tip to a solid curved outer edge. */}
        <radialGradient id="ftp-range" gradientUnits="userSpaceOnUse" cx={C} cy={C} r={R_RANGE}>
          <stop offset="0" stopColor="var(--accent)" stopOpacity="0.03" />
          <stop offset="1" stopColor="var(--accent)" stopOpacity="0.34" />
        </radialGradient>
      </defs>

      {/* Clock face: turns red-tinted when the market is closed */}
      <circle
        className="ftp-face"
        cx={C}
        cy={C}
        r={R_RING}
        fill={fullyClosed ? "var(--face-closed)" : "var(--face)"}
        stroke={fullyClosed ? "var(--danger)" : "var(--line)"}
        strokeOpacity={fullyClosed ? 0.55 : 1}
        strokeWidth={1.5}
      />
      {/* Partial closure inside the day (weekend starts / ends): tint that part of the face */}
      {!fullyClosed &&
        closedWindows.map(([a, b], i) => (
          <path key={i} d={sectorPath(C, C, R_RING - 1, a, b)} fill="var(--face-closed)" />
        ))}

      {/* Hour ticks and numerals */}
      {Array.from({ length: 24 }, (_, hour) => {
        const major = hour % 6 === 0;
        const a = polar(C, C, R_RING, hour * 60);
        const b = polar(C, C, R_RING + (major ? 12 : 7), hour * 60);
        const l = polar(C, C, R_LABEL, hour * 60);
        return (
          <g key={hour}>
            <line
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={major ? "var(--fg)" : "var(--muted)"}
              strokeWidth={major ? 2.2 : 1.3}
              strokeOpacity={major ? 0.9 : 0.6}
            />
            <text
              x={l.x}
              y={l.y}
              textAnchor="middle"
              dominantBaseline="central"
              className="font-mono"
              fontSize={major ? 35 : 27}
              fontWeight={major ? 700 : 500}
              fill={major ? "var(--fg)" : "var(--muted)"}
            >
              {String(hour).padStart(2, "0")}
            </text>
          </g>
        );
      })}

      {/* Selected time ranges: tip at the centre, curved outer end, no border */}
      {ranges.map((r) => {
        const start = toLocalMinutes(r.startUtc, offset);
        const end = toLocalMinutes(r.endUtc, offset);
        const span = (end - start + 1440) % 1440;
        const mid = start + span / 2;
        const labelR = R_RANGE - 24;
        const room = (labelR * (span / 1440) * Math.PI * 2) / 9.5; // approx. characters that fit
        const label = r.label.length <= room ? r.label : initials(r.label).length <= room ? initials(r.label) : "";
        const lp = polar(C, C, labelR, mid);
        return (
          <g key={r.id}>
            <path d={sectorPath(C, C, R_RANGE, start, end)} fill="url(#ftp-range)">
              <title>{`${r.label}: ${fmtHM(start)}–${fmtHM(end)}`}</title>
            </path>
            {label && (
              <text
                x={lp.x}
                y={lp.y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={15}
                fontWeight={600}
                fill="var(--fg)"
                fillOpacity={0.88}
              >
                {label}
              </text>
            )}
          </g>
        );
      })}

      {/* Trading sessions: one wide translucent lane each, on a shared faint track */}
      <circle
        cx={C}
        cy={C}
        r={(LANE_TOP + LANE_BOTTOM) / 2}
        fill="none"
        stroke="var(--lane-track)"
        strokeWidth={LANE_TOP - LANE_BOTTOM}
      />
      {visible.map((s, i) => {
        const start = toLocalMinutes(s.startUtc, offset);
        const end = toLocalMinutes(s.endUtc, offset);
        const closed = fullyClosed || Boolean(closedSessions[s.id]);
        return (
          <path
            key={s.id}
            d={arcPath(C, C, laneCentre(i), start, end)}
            fill="none"
            stroke={s.color}
            strokeWidth={LANE_W - 3}
            strokeOpacity={closed ? 0.14 : 0.55}
          >
            <title>{`${s.name}: ${fmtHM(start)}–${fmtHM(end)} (${fmtGmt(offset)})${
              closed ? ` — closed${closedSessions[s.id] ? ` (${closedSessions[s.id]})` : ""}` : ""
            }`}</title>
          </path>
        );
      })}

      {/* Custom time points: small diamonds on the event track */}
      {points.map((p) => {
        const m = toLocalMinutes(p.utcMinutes, offset);
        const d = polar(C, C, R_EVENT, m);
        return (
          <rect
            key={p.id}
            x={d.x - 5.5}
            y={d.y - 5.5}
            width={11}
            height={11}
            transform={`rotate(45 ${d.x} ${d.y})`}
            fill="var(--face)"
            stroke="var(--fg)"
            strokeWidth={1.8}
          >
            <title>{`${p.label} · ${fmtHM(m)}`}</title>
          </rect>
        );
      })}

      {/* Selected news events */}
      {pinned.map((e) => {
        const m = localMinutesOf(e.atMs, offset);
        const d = polar(C, C, R_EVENT, m);
        const inner = polar(C, C, LANE_BOTTOM, m);
        const hot = e.id === highlightId;
        const color = IMPACT_VAR[e.impact];
        return (
          <g key={e.id}>
            {hot && (
              <line x1={d.x} y1={d.y} x2={inner.x} y2={inner.y} stroke="var(--accent)" strokeWidth={1.6} strokeOpacity={0.8} />
            )}
            <circle cx={d.x} cy={d.y} r={hot ? 13 : 10} fill={color} fillOpacity={hot ? 0.28 : 0.2} />
            <circle cx={d.x} cy={d.y} r={hot ? 7.5 : 6} fill={color} stroke="var(--face)" strokeWidth={2}>
              <title>{`${e.country} ${e.title} · ${fmtHM(m)}`}</title>
            </circle>
          </g>
        );
      })}

      {/* Live hand (today only) */}
      {isToday && handEnd && (
        <g>
          <line x1={C} y1={C} x2={handEnd.x} y2={handEnd.y} stroke="var(--fg)" strokeOpacity={0.75} strokeWidth={1.6} strokeLinecap="round" />
          <circle cx={handEnd.x} cy={handEnd.y} r={5} fill="var(--fg)" stroke="var(--face)" strokeWidth={2} />
          <circle cx={C} cy={C} r={4.5} fill="var(--fg)" />
        </g>
      )}
    </svg>
  );
}

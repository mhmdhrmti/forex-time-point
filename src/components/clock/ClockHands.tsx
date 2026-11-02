import { localMinutesOf } from "@/lib/time";
import { C } from "./geometry";

/* Lengths follow the usual proportions: hour ≈ half the dial, minute ≈ 4/5, second reaches the rim. */
const HOUR = { len: 150, tail: 18, width: 13 };
const MINUTE = { len: 238, tail: 24, width: 9 };
const SECOND = { len: 272, tail: 52 };

/** A tapered kite-shaped hand pointing up from the centre, then rotated. */
function Hand({ deg, len, tail, width }: { deg: number; len: number; tail: number; width: number }) {
  const w = width / 2;
  const pts = [
    [-w * 0.7, tail],
    [w * 0.7, tail],
    [w, 0],
    [w * 0.3, -len],
    [-w * 0.3, -len],
    [-w, 0],
  ]
    .map(([x, y]) => `${C + x},${C + y}`)
    .join(" ");
  return (
    <polygon
      points={pts}
      transform={`rotate(${deg} ${C} ${C})`}
      fill="var(--fg)"
      stroke="var(--surface)"
      strokeWidth={2.5}
      strokeLinejoin="round"
      paintOrder="stroke"
    />
  );
}

/**
 * Hour, minute and second hands for the selected time zone.
 * The dial is 24 hours, so the hour hand turns once per day; the minute and second hands turn once per hour / minute.
 */
export default function ClockHands({ nowMs, offset }: { nowMs: number; offset: number }) {
  const local = localMinutesOf(nowMs, offset); // minutes since local midnight, with fractions
  const hourDeg = (local / 1440) * 360;
  const minuteDeg = ((local % 60) / 60) * 360;
  const secondDeg = (Math.floor(nowMs / 1000) % 60) * 6;

  return (
    <g>
      <Hand deg={hourDeg} {...HOUR} />
      <Hand deg={minuteDeg} {...MINUTE} />
      <g transform={`rotate(${secondDeg} ${C} ${C})`}>
        <line x1={C} y1={C + SECOND.tail} x2={C} y2={C - SECOND.len} stroke="var(--accent)" strokeWidth={2.6} strokeLinecap="round" />
        <circle cx={C} cy={C + SECOND.tail - 8} r={7} fill="var(--accent)" stroke="var(--surface)" strokeWidth={2} />
      </g>
      <circle cx={C} cy={C} r={9.5} fill="var(--fg)" stroke="var(--surface)" strokeWidth={2.5} />
      <circle cx={C} cy={C} r={3.4} fill="var(--accent)" />
    </g>
  );
}

"use client";

import type { NewsEvent, TimePoint, TimeRange } from "@/lib/types";
import ClockFace from "./ClockFace";
import ClockHands from "./ClockHands";
import EventMarkers from "./EventMarkers";
import HourMarks from "./HourMarks";
import PointMarkers from "./PointMarkers";
import RangeWedges from "./RangeWedges";
import SessionLanes from "./SessionLanes";
import { C, R_RANGE, SIZE } from "./geometry";

interface Props {
  nowMs: number | null;
  offset: number;
  /** Closed: empty face + red border, session lanes hidden. The clock itself keeps running. */
  marketClosed: boolean;
  /** Part-day closures as local minutes. */
  closedWindows: Array<[number, number]>;
  closedSessions: Record<string, string>;
  visibleSessions: Record<string, boolean>;
  points: TimePoint[];
  ranges: TimeRange[];
  /** Selected events falling on the viewed date. */
  events: NewsEvent[];
  highlightId: string | null;
}

/** The 24-hour dial. Each layer is its own small component (see ./). */
export default function Clock({
  nowMs,
  offset,
  marketClosed,
  closedWindows,
  closedSessions,
  visibleSessions,
  points,
  ranges,
  events,
  highlightId,
}: Props) {
  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label="24-hour trading clock" className="mx-auto h-auto w-full max-w-[720px]">
      <defs>
        <radialGradient id="ftp-range" gradientUnits="userSpaceOnUse" cx={C} cy={C} r={R_RANGE}>
          <stop offset="0" stopColor="var(--accent)" stopOpacity="0.03" />
          <stop offset="1" stopColor="var(--accent)" stopOpacity="0.34" />
        </radialGradient>
      </defs>
      <ClockFace closed={marketClosed} closedWindows={closedWindows} />
      <HourMarks />
      <RangeWedges ranges={ranges} offset={offset} />
      {!marketClosed && <SessionLanes offset={offset} visible={visibleSessions} closedSessions={closedSessions} />}
      <PointMarkers points={points} offset={offset} />
      <EventMarkers events={events} offset={offset} highlightId={highlightId} />
      {nowMs !== null && <ClockHands nowMs={nowMs} offset={offset} />}
    </svg>
  );
}

import { SESSIONS } from "@/lib/data";
import { DAY_MIN } from "@/lib/time";

/*
  Dial geometry in viewBox units (the SVG scales to its container).
  From the outside in:  numerals · hour ring · marker track · session lanes · range wedges · centre
*/
export const SIZE = 720;
export const C = SIZE / 2;
export const R_LABEL = 329;
export const R_RING = 292;
export const R_MARKER = 277;
export const LANE_W = 18;
export const LANE_TOP = 264;
export const LANE_BOTTOM = LANE_TOP - SESSIONS.length * LANE_W; // 192
export const R_RANGE = 184;

/** Point at `radius` from the centre for a time on the 24-hour dial (00:00 at the top, clockwise). */
export const atMinute = (radius: number, minutes: number) => {
  const rad = (minutes / DAY_MIN) * Math.PI * 2;
  return { x: C + radius * Math.sin(rad), y: C - radius * Math.cos(rad) };
};

export const laneCentre = (index: number) => LANE_TOP - LANE_W / 2 - index * LANE_W;

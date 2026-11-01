export const DAY_MIN = 1440;
export const MIN_MS = 60_000;
export const DAY_MS = 86_400_000;
export const ALERT_LEAD_MS = 15 * MIN_MS;

export const mod = (n: number, m: number) => ((n % m) + m) % m;

/** Minutes after local midnight for a UTC-minute value in a GMT offset (minutes). */
export const toLocalMinutes = (utcMinutes: number, offsetMin: number) =>
  mod(utcMinutes + offsetMin, DAY_MIN);

export const toUtcMinutes = (localMinutes: number, offsetMin: number) =>
  mod(localMinutes - offsetMin, DAY_MIN);

export const fmtHM = (minutes: number) => {
  const m = Math.floor(mod(minutes, DAY_MIN));
  const h = Math.floor(m / 60);
  return `${String(h).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
};

export const parseHM = (value: string): number | null => {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h > 23 || m > 59) return null;
  return h * 60 + m;
};

export const fmtGmt = (offsetMin: number) => {
  const sign = offsetMin < 0 ? "-" : "+";
  const abs = Math.abs(offsetMin);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return `GMT${sign}${h}${m ? `:${String(m).padStart(2, "0")}` : ""}`;
};

/** Minutes after local midnight for an instant, in the given GMT offset. */
export const localMinutesOf = (ms: number, offsetMin: number) =>
  mod((ms + offsetMin * MIN_MS) / MIN_MS, DAY_MIN);

export const fmtClock = (nowMs: number, offsetMin: number) => {
  const shifted = new Date(nowMs + offsetMin * MIN_MS);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(shifted.getUTCHours())}:${p(shifted.getUTCMinutes())}:${p(shifted.getUTCSeconds())}`;
};

/* ---------- Calendar dates ("YYYY-MM-DD" keys in a chosen GMT offset) ---------- */

export const dateKeyFor = (ms: number, offsetMin: number) =>
  new Date(ms + offsetMin * MIN_MS).toISOString().slice(0, 10);

const parseDateKey = (key: string) => {
  const [y, m, d] = key.split("-").map(Number);
  return { y, m, d };
};

/** UTC instant at which the given calendar date starts in the GMT offset. */
export const dayStartMs = (key: string, offsetMin: number) => {
  const { y, m, d } = parseDateKey(key);
  return Date.UTC(y, m - 1, d) - offsetMin * MIN_MS;
};

export const addDaysKey = (key: string, days: number) => {
  const { y, m, d } = parseDateKey(key);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
};

export const isValidDateKey = (key: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(key) && !Number.isNaN(Date.parse(`${key}T00:00:00Z`));

export const fmtDateKey = (key: string) =>
  new Date(`${key}T00:00:00Z`).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });

export const fmtDateKeyShort = (key: string) =>
  new Date(`${key}T00:00:00Z`).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  });

export const fmtCountdown = (ms: number) => {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m`;
  return `${m}m ${String(s).padStart(2, "0")}s`;
};

/* ---------- Dial geometry ---------- */

/** Point on a circle; 0 minutes is at the top, increasing clockwise. */
export const polar = (cx: number, cy: number, r: number, minutes: number) => {
  const rad = (minutes / DAY_MIN) * Math.PI * 2;
  return { x: cx + r * Math.sin(rad), y: cy - r * Math.cos(rad) };
};

export const arcPath = (
  cx: number,
  cy: number,
  r: number,
  startMin: number,
  endMin: number,
) => {
  const length = mod(endMin - startMin, DAY_MIN);
  if (length === 0) return "";
  const a = polar(cx, cy, r, startMin);
  const b = polar(cx, cy, r, startMin + length);
  const large = length > DAY_MIN / 2 ? 1 : 0;
  return `M ${a.x.toFixed(2)} ${a.y.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${b.x.toFixed(2)} ${b.y.toFixed(2)}`;
};

export const isInRange = (minute: number, start: number, end: number) => {
  const m = mod(minute, DAY_MIN);
  const s = mod(start, DAY_MIN);
  const e = mod(end, DAY_MIN);
  return s <= e ? m >= s && m < e : m >= s || m < e;
};

/** Pie-slice path: tip at the centre, outer edge following the circle (no stroke needed). */
export const sectorPath = (
  cx: number,
  cy: number,
  r: number,
  startMin: number,
  endMin: number,
) => {
  const length = mod(endMin - startMin, DAY_MIN);
  if (length === 0) return "";
  const a = polar(cx, cy, r, startMin);
  const b = polar(cx, cy, r, startMin + length);
  const large = length > DAY_MIN / 2 ? 1 : 0;
  return `M ${cx} ${cy} L ${a.x.toFixed(2)} ${a.y.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${b.x.toFixed(2)} ${b.y.toFixed(2)} Z`;
};

/** Forex Factory weeks start on Sunday. Returns the Sunday (YYYY-MM-DD) of the week containing the date. */
export const weekStartKey = (key: string) => {
  const dow = new Date(`${key}T00:00:00Z`).getUTCDay();
  return addDaysKey(key, -dow);
};

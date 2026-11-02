export type Impact = "high" | "medium" | "low";
export type EventImpact = Impact | "holiday";

export interface NewsEvent {
  id: string;
  title: string;
  /** Currency code (USD, EUR…) or "ALL" for items that apply to every market. */
  country: string;
  impact: EventImpact;
  /** Absolute instant of the event (UTC milliseconds). */
  atMs: number;
  /** All-day items (holidays) have no meaningful time of day. */
  allDay: boolean;
  /** Calendar date (YYYY-MM-DD) of an all-day item, as published by the feed. */
  dateKey?: string;
  forecast?: string;
  previous?: string;
  custom?: boolean;
}

export interface TimePoint {
  id: string;
  label: string;
  /** Recurs daily: minutes after 00:00 UTC. */
  utcMinutes: number;
}

export interface TimeRange {
  id: string;
  label: string;
  startUtc: number;
  endUtc: number;
}

export interface Session {
  id: string;
  name: string;
  /** Start / end as minutes after 00:00 UTC. End may be < start (wraps midnight). */
  startUtc: number;
  endUtc: number;
  color: string;
  /** IANA zone and local trading hours; the UTC times above are resolved from these for a given date (daylight saving). */
  zone?: string;
  localOpen?: number;
  localClose?: number;
  /** Currencies whose bank holidays close this session. */
  currencies: string[];
}

export type Theme = "system" | "light" | "dark";

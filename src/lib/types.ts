export type Impact = "high" | "medium" | "low";

export interface NewsEvent {
  id: string;
  title: string;
  region: string;
  impact: Impact;
  /** Minutes after 00:00 UTC on the event's day (0–1439). */
  utcMinutes: number;
  custom?: boolean;
}

export interface TimePoint {
  id: string;
  label: string;
  utcMinutes: number;
}

export interface TimeInterval {
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
}

export interface AlertItem {
  key: string;
  eventId: string;
  title: string;
  atMs: number;
}

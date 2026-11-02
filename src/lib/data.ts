import { mod, zoneOffsetMin } from "./time";
import type { Session } from "./types";

const h = (hh: number, mm = 0) => hh * 60 + mm;

/**
 * Sessions are defined by their local trading hours in the home market's zone and converted to UTC for the
 * date being viewed, so daylight saving (London, New York, Sydney) is followed automatically.
 * Sydney 07:00–16:00, Tokyo 09:00–18:00, London 08:00–17:00, New York 08:00–17:00 (local time).
 * `currencies` maps a holiday in that currency to the session it closes.
 */
export const SESSIONS: Session[] = [
  { id: "sydney", name: "Sydney", zone: "Australia/Sydney", localOpen: h(7), localClose: h(16), startUtc: h(21), endUtc: h(6), color: "#8f7cf0", currencies: ["AUD", "NZD"] },
  { id: "tokyo", name: "Tokyo", zone: "Asia/Tokyo", localOpen: h(9), localClose: h(18), startUtc: h(0), endUtc: h(9), color: "#e0679f", currencies: ["JPY", "CNY"] },
  { id: "london", name: "London", zone: "Europe/London", localOpen: h(8), localClose: h(17), startUtc: h(8), endUtc: h(17), color: "#2fb58f", currencies: ["GBP", "EUR", "CHF"] },
  { id: "newyork", name: "New York", zone: "America/New_York", localOpen: h(8), localClose: h(17), startUtc: h(13), endUtc: h(22), color: "#eaa03a", currencies: ["USD", "CAD"] },
];

/** Sessions with startUtc/endUtc resolved (DST-aware) for the day containing `refMs`. */
export function resolveSessions(refMs: number): Session[] {
  return SESSIONS.map((s) => {
    if (!s.zone || s.localOpen === undefined || s.localClose === undefined) return s;
    const off = zoneOffsetMin(s.zone, refMs);
    return { ...s, startUtc: mod(s.localOpen - off, 1440), endUtc: mod(s.localClose - off, 1440) };
  });
}

export interface TimezoneOption {
  offset: number;
  places: string;
}

/** Fixed GMT offsets (minutes) with representative places. */
export const TIMEZONES: TimezoneOption[] = [
  { offset: -720, places: "Baker Island" },
  { offset: -660, places: "Pago Pago" },
  { offset: -600, places: "Honolulu" },
  { offset: -540, places: "Anchorage" },
  { offset: -480, places: "Los Angeles, Vancouver" },
  { offset: -420, places: "Denver, Phoenix" },
  { offset: -360, places: "Chicago, Mexico City" },
  { offset: -300, places: "New York, Toronto, Bogotá" },
  { offset: -240, places: "Halifax, Caracas, La Paz" },
  { offset: -210, places: "St. John's" },
  { offset: -180, places: "São Paulo, Buenos Aires" },
  { offset: -120, places: "South Georgia" },
  { offset: -60, places: "Azores, Cape Verde" },
  { offset: 0, places: "London, Lisbon, Reykjavik, Accra" },
  { offset: 60, places: "Paris, Berlin, Rome, Lagos" },
  { offset: 120, places: "Athens, Cairo, Johannesburg, Kyiv" },
  { offset: 180, places: "Moscow, Istanbul, Riyadh, Nairobi" },
  { offset: 210, places: "Tehran" },
  { offset: 240, places: "Dubai, Baku, Muscat" },
  { offset: 270, places: "Kabul" },
  { offset: 300, places: "Karachi, Tashkent" },
  { offset: 330, places: "Mumbai, New Delhi, Colombo" },
  { offset: 345, places: "Kathmandu" },
  { offset: 360, places: "Dhaka, Almaty" },
  { offset: 390, places: "Yangon" },
  { offset: 420, places: "Bangkok, Jakarta, Hanoi" },
  { offset: 480, places: "Singapore, Hong Kong, Beijing, Perth" },
  { offset: 525, places: "Eucla" },
  { offset: 540, places: "Tokyo, Seoul" },
  { offset: 570, places: "Adelaide, Darwin" },
  { offset: 600, places: "Sydney, Melbourne, Brisbane" },
  { offset: 630, places: "Lord Howe Island" },
  { offset: 660, places: "Noumea, Solomon Islands" },
  { offset: 720, places: "Auckland, Fiji" },
  { offset: 765, places: "Chatham Islands" },
  { offset: 780, places: "Tonga, Samoa" },
  { offset: 840, places: "Kiritimati" },
];

/** Short place name for a GMT offset, e.g. 210 -> "Tehran". */
export const zoneName = (offset: number) =>
  TIMEZONES.find((t) => t.offset === offset)?.places.split(",")[0].trim() ?? "";

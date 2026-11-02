import type { Session } from "./types";

const h = (hh: number, mm = 0) => hh * 60 + mm;

/**
 * Standard UTC session hours (daylight-saving shifts are not applied).
 * Sydney 22:00–07:00, Tokyo 00:00–09:00, London 08:00–17:00, New York 13:00–22:00.
 * `currencies` maps a holiday in that currency to the session it closes.
 */
export const SESSIONS: Session[] = [
  { id: "sydney", name: "Sydney", startUtc: h(22), endUtc: h(7), color: "#8f7cf0", currencies: ["AUD", "NZD"] },
  { id: "tokyo", name: "Tokyo", startUtc: h(0), endUtc: h(9), color: "#e0679f", currencies: ["JPY", "CNY"] },
  { id: "london", name: "London", startUtc: h(8), endUtc: h(17), color: "#2fb58f", currencies: ["GBP", "EUR", "CHF"] },
  { id: "newyork", name: "New York", startUtc: h(13), endUtc: h(22), color: "#eaa03a", currencies: ["USD", "CAD"] },
];

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

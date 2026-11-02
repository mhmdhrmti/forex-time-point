import test from "node:test";
import assert from "node:assert/strict";
import { dateKeyFor, fmtClock, fmtGmt, localMinutesOf, weekStartKey, toLocalMinutes, toUtcMinutes } from "../src/lib/time";

const wall = (ms: number, tz: string) =>
  new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).format(ms);

test("fixed offsets match the system tz database", () => {
  const zones: Array<[number, string]> = [[210, "Asia/Tehran"], [330, "Asia/Kolkata"], [345, "Asia/Kathmandu"], [-300, "America/Bogota"], [0, "UTC"], [540, "Asia/Tokyo"]];
  for (const base of [Date.UTC(2026, 10, 2, 17, 15, 30), Date.UTC(2026, 10, 2, 23, 59, 59), Date.UTC(2026, 10, 3, 0, 0, 0)]) {
    for (const [off, tz] of zones) assert.equal(fmtClock(base, off), wall(base, tz), `${tz} @ ${base}`);
  }
});

test("Tehran is GMT+3:30", () => {
  assert.equal(fmtGmt(210), "GMT+3:30");
  assert.equal(fmtClock(Date.UTC(2026, 10, 2, 12, 0, 0), 210), "15:30:00");
});

test("date rolls over with the offset", () => {
  const ms = Date.UTC(2026, 10, 2, 21, 0, 0);
  assert.equal(dateKeyFor(ms, 0), "2026-11-02");
  assert.equal(dateKeyFor(ms, 210), "2026-11-03");
  assert.equal(localMinutesOf(ms, 210), 30);
});

test("utc/local minute conversion round-trips", () => {
  for (const off of [-720, -210, 0, 210, 345, 840]) for (let m = 0; m < 1440; m += 37) assert.equal(toUtcMinutes(toLocalMinutes(m, off), off), m);
});

test("week starts on Sunday", () => {
  assert.equal(weekStartKey("2026-11-02"), "2026-11-01");
  assert.equal(weekStartKey("2026-11-01"), "2026-11-01");
  assert.equal(weekStartKey("2026-11-07"), "2026-11-01");
});

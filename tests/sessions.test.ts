import test from "node:test";
import assert from "node:assert/strict";
import { resolveSessions } from "../src/lib/data";
import { isWeekendClosed } from "../src/lib/calendar";

const byId = (ms: number) => Object.fromEntries(resolveSessions(ms).map((s) => [s.id, [s.startUtc / 60, s.endUtc / 60]]));

test("sessions follow daylight saving (northern summer)", () => {
  const s = byId(Date.UTC(2026, 6, 15, 12)); // mid July
  assert.deepEqual(s.london, [7, 16]);
  assert.deepEqual(s.newyork, [12, 21]);
  assert.deepEqual(s.tokyo, [0, 9]);
  assert.deepEqual(s.sydney, [21, 6]); // AEST (winter)
});

test("sessions follow daylight saving (northern winter)", () => {
  const s = byId(Date.UTC(2026, 10, 2, 12)); // 2 Nov 2026
  assert.deepEqual(s.london, [8, 17]);
  assert.deepEqual(s.newyork, [13, 22]);
  assert.deepEqual(s.sydney, [20, 5]); // AEDT (summer)
});

test("weekend closure moves with New York DST", () => {
  assert.equal(isWeekendClosed(Date.UTC(2026, 6, 17, 21, 30)), true); // Fri 21:30Z in July
  assert.equal(isWeekendClosed(Date.UTC(2026, 6, 17, 20, 30)), false);
  assert.equal(isWeekendClosed(Date.UTC(2026, 10, 6, 21, 30)), false); // Fri 21:30Z in Nov
  assert.equal(isWeekendClosed(Date.UTC(2026, 10, 6, 22, 30)), true);
  assert.equal(isWeekendClosed(Date.UTC(2026, 10, 8, 21, 30)), true); // Sun reopen 22:00Z
  assert.equal(isWeekendClosed(Date.UTC(2026, 10, 8, 22, 30)), false);
});

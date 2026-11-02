import test from "node:test";
import assert from "node:assert/strict";
import { buildEvent } from "../src/lib/events";
import { computeDayStatus, isWeekendClosed } from "../src/lib/calendar";

test("an all-day holiday is dated by its UTC day", () => {
  const e = buildEvent({ title: "Culture Day", currency: "JPY", impact: "Holiday", atMs: Date.UTC(2026, 10, 3) })!;
  assert.equal(e.impact, "holiday");
  assert.equal(e.allDay, true);
  assert.equal(e.dateKey, "2026-11-03");
});

test("a timed 'holiday' notice (DST shift) is not a closure", () => {
  const e = buildEvent({ title: "Daylight Saving Time Shift", currency: "EUR", impact: "Holiday", atMs: Date.UTC(2026, 9, 25, 1, 0) })!;
  assert.equal(e.allDay, false);
  assert.notEqual(e.impact, "holiday");
});

test("weekend closure window", () => {
  assert.equal(isWeekendClosed(Date.UTC(2026, 10, 1, 12)), true); // Sun 12:00 UTC
  assert.equal(isWeekendClosed(Date.UTC(2026, 10, 1, 23)), false); // Sun 23:00 UTC
  assert.equal(isWeekendClosed(Date.UTC(2026, 10, 2, 12)), false); // Mon
  assert.equal(isWeekendClosed(Date.UTC(2026, 10, 6, 23)), true); // Fri 23:00 UTC
});

test("an ALL holiday closes the whole day", () => {
  const e = buildEvent({ title: "New Year's Day", currency: "ALL", impact: "Holiday", atMs: Date.UTC(2027, 0, 1) })!;
  assert.equal(computeDayStatus("2027-01-01", 0, [e]).fullyClosed, true);
});

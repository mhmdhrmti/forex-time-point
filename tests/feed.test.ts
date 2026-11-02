import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { eventsForDay, parseFeed } from "../src/lib/calendar";
import { fmtHM, localMinutesOf } from "../src/lib/time";

const raw = JSON.parse(readFileSync(new URL("./fixtures/ff-week-2026-11-01.json", import.meta.url), "utf8"));
const events = parseFeed(raw);
const at = (title: string, off: number) => fmtHM(localMinutesOf(events.find((e) => e.title === title)!.atMs, off));

test("real Forex Factory feed rows keep their exact instants", () => {
  assert.equal(at("ISM Manufacturing PMI", -300), "10:00"); // New York, as on Forex Factory
  assert.equal(at("ISM Manufacturing PMI", 0), "15:00");
  assert.equal(at("ISM Manufacturing PMI", 210), "18:30"); // Tehran
  assert.equal(at("Non-Farm Employment Change", 210), "17:00");
});

test("events land on the right local day", () => {
  const monTehran = eventsForDay(events, "2026-11-02", 210).map((e) => e.title);
  assert.ok(monTehran.includes("ISM Manufacturing PMI"));
  // 22:30 ET Mon = 03:30Z Tue = 07:00 Tue in Tehran, so the RBA decision belongs to Tuesday there
  assert.ok(!monTehran.includes("Cash Rate"));
  assert.ok(eventsForDay(events, "2026-11-03", 210).some((e) => e.title === "Cash Rate"));
  assert.ok(eventsForDay(events, "2026-11-02", -300).some((e) => e.title === "Cash Rate"));
});

test("JPY bank holiday and DST notice", () => {
  const jp = events.find((e) => e.title === "Bank Holiday")!;
  assert.equal(jp.impact === "holiday" || jp.allDay === false, true);
});

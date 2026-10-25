import assert from "node:assert/strict";
import { test } from "node:test";

import { calculateActivityStreak } from "./activityStreak.ts";

test("counts one activity per UTC day and consecutive days", () => {
  const result = calculateActivityStreak([
    "2026-10-11T23:55:00Z",
    "2026-10-11T06:00:00Z",
    "2026-10-10T12:00:00Z",
    "2026-10-09T01:00:00Z",
  ], new Date("2026-10-11T22:00:00Z"));
  assert.deepEqual(result, { currentStreak: 3, lastActivityDate: "2026-10-11" });
});

test("keeps yesterday's streak alive but clears streaks after a missed day", () => {
  assert.equal(calculateActivityStreak(["2026-10-10"], new Date("2026-10-11")).currentStreak, 1);
  assert.equal(calculateActivityStreak(["2026-10-09"], new Date("2026-10-11")).currentStreak, 0);
});

test("returns zero when no valid activity exists and ignores future activity", () => {
  assert.deepEqual(calculateActivityStreak(["invalid", "2026-10-12"], new Date("2026-10-11")), {
    currentStreak: 0,
    lastActivityDate: null,
  });
});

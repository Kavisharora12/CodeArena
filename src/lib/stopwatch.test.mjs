import assert from "node:assert/strict";
import { test } from "node:test";

import {
  elapsedStopwatchMs,
  formatStopwatchTime,
  formatStopwatchTimeCompact,
  initialStopwatchState,
  stopwatchReducer,
} from "./stopwatch.ts";

test("stopwatch starts, pauses, resumes without counting paused time, and resets", () => {
  let state = stopwatchReducer(initialStopwatchState, { type: "start", now: 1000 });
  state = stopwatchReducer(state, { type: "tick", now: 3500 });
  assert.equal(elapsedStopwatchMs(state), 2500);
  state = stopwatchReducer(state, { type: "pause", now: 4000 });
  assert.equal(elapsedStopwatchMs(state, 9000), 3000);
  state = stopwatchReducer(state, { type: "start", now: 10_000 });
  assert.equal(elapsedStopwatchMs(state, 11_250), 4250);
  state = stopwatchReducer(state, { type: "pause", now: 12_000 });
  state = stopwatchReducer(state, { type: "reset", now: 15_000 });
  assert.equal(elapsedStopwatchMs(state), 0);
  assert.equal(state.startedAt, null);
});

test("formats elapsed time accessibly as hours, minutes, and seconds", () => {
  assert.equal(formatStopwatchTime(3_661_000), "01:01:01");
  assert.equal(formatStopwatchTime(-1), "00:00:00");
});

test("formats compact navbar time as HH:MM", () => {
  assert.equal(formatStopwatchTimeCompact(3_661_000), "01:01");
  assert.equal(formatStopwatchTimeCompact(59_000), "00:00");
});

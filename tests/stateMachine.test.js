import test from "node:test";
import assert from "node:assert/strict";
import { demoReducer, initialState } from "../src/stateMachine.js";

test("a new scan creates a semantic diff snapshot", () => {
  const next = demoReducer(initialState, { type: "SCAN" });
  assert.equal(next.phase, "diff");
  assert.equal(next.snapshot, 18);
  assert.equal(next.lastAction, "Semantic diff generated");
});

test("a human correction creates a revision without losing the prior snapshot", () => {
  const scanned = demoReducer(initialState, { type: "SCAN" });
  const corrected = demoReducer(scanned, { type: "CORRECT_TO_B02" });
  assert.equal(corrected.phase, "corrected");
  assert.equal(corrected.snapshot, 18);
  assert.match(corrected.note, /B02/);
});

test("fast-forwarding wakes the autonomous follow-up", () => {
  const next = demoReducer(initialState, { type: "ADVANCE_TIME" });
  assert.equal(next.phase, "overdue");
  assert.equal(next.time, "15:13");
  assert.equal(next.lastAction, "Autonomous follow-up triggered");
});

test("reset returns the exact baseline state", () => {
  const changed = demoReducer(initialState, { type: "SCAN" });
  assert.deepEqual(demoReducer(changed, { type: "RESET" }), initialState);
});

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

test("creating a project makes it the active empty workspace", () => {
  const project = { id: "project-new", name: "Field calibration", location: "Bay / 09", status: "ready", entities: 0, revisions: 0, next: "Add first evidence" };
  const next = demoReducer(initialState, { type: "CREATE_PROJECT", project });
  assert.equal(next.activeProjectId, "project-new");
  assert.equal(next.projects[0].name, "Field calibration");
  assert.equal(next.snapshot, 1);
  assert.equal(next.time, "—");
});

test("adding evidence activates a fresh project and keeps the project list", () => {
  const project = { id: "project-new", name: "Field calibration", location: "Bay / 09", status: "ready", entities: 0, revisions: 0, next: "Add first evidence" };
  const created = demoReducer(initialState, { type: "CREATE_PROJECT", project });
  const next = demoReducer(created, { type: "ADD_EVIDENCE", evidence: { id: "evidence-new", label: "Bench photo", detail: "photo · just now", status: "processed" } });
  assert.equal(next.projects[0].status, "active");
  assert.equal(next.projects[0].entities, 7);
  assert.equal(next.projects[0].revisions, 1);
  assert.equal(next.evidence[0].label, "Bench photo");
});

test("resetting a snapshot does not delete managed projects", () => {
  const project = { id: "project-new", name: "Field calibration", location: "Bay / 09", status: "ready", entities: 0, revisions: 0, next: "Add first evidence" };
  const created = demoReducer(initialState, { type: "CREATE_PROJECT", project });
  const reset = demoReducer(created, { type: "RESET_SNAPSHOT" });
  assert.equal(reset.projects[0].name, "Field calibration");
  assert.equal(reset.activeProjectId, "project-new");
  assert.equal(reset.lastAction, "Snapshot reset");
});

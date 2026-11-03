import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { assertNoUnresolvedAttempt, createEvidence, markProviderOutcome, markUnknown, markSubmissionStarted, readEvidence, readEvidenceJournal, writeEvidence } from "./phase7o-evidence.mjs";

const fixture = (state = "PRE_SUBMISSION") => createEvidence({
  runId: "phase7o-test-run", timestamp: "2026-10-28T08:21:00.000Z", bookingId: "booking-test", paymentId: "payment-test", operationId: "operation-test", razorpayOrderId: "order_test", expectedAmount: 525, expectedCurrency: "INR", submissionState: state,
});

const withPath = async (run) => {
  const directory = await mkdtemp(join(tmpdir(), "phase7o-evidence-"));
  try { await run(join(directory, "evidence.json")); } finally { await rm(directory, { recursive: true, force: true }); }
};

test("evidence is atomically persisted and excludes secrets", async () => withPath(async (path) => {
  const evidence = fixture(); await writeEvidence(path, evidence);
  assert.deepEqual(await readEvidence(path), evidence);
  const text = await readFile(path, "utf8"); assert.equal(/secret|signature|authorization|cvv|card/i.test(text), false);
  await assert.rejects(writeEvidence(path, { ...evidence, signature: "must-not-be-written" }), /Evidence must not contain signature/);
}));

test("evidence journals retain resolved history while recording a later run", async () => withPath(async (path) => {
  const historical = fixture("VERIFIED_NON_EXECUTION");
  const current = createEvidence({ ...fixture(), runId: "phase7o-current-run" });
  await writeEvidence(path, historical); await writeEvidence(path, current);
  assert.equal((await readEvidenceJournal(path)).length, 2);
  assert.equal((await readEvidence(path)).runId, "phase7o-current-run");
}));

test("UNKNOWN outcome blocks a later payment submission", async () => withPath(async (path) => {
  await writeEvidence(path, markUnknown(markSubmissionStarted(fixture()), "No local callback evidence."));
  await assert.rejects(assertNoUnresolvedAttempt(path), /unresolved Razorpay outcome/);
}));

test("provider-confirmed non-execution and failed outcomes do not retry automatically", async () => withPath(async (path) => {
  await writeEvidence(path, markProviderOutcome(markUnknown(markSubmissionStarted(fixture()), "No callback evidence."), "VERIFIED_NON_EXECUTION"));
  assert.equal((await assertNoUnresolvedAttempt(path)).submissionState, "VERIFIED_NON_EXECUTION");
  assert.equal((await readEvidence(path)).reconciliationNote, "No callback evidence.");
  await writeEvidence(path, markProviderOutcome(fixture(), "FAILED", "pay_failed"));
  assert.equal((await assertNoUnresolvedAttempt(path)).submissionState, "FAILED");
}));

test("provider-confirmed capture remains recorded and is not retried", async () => withPath(async (path) => {
  await writeEvidence(path, markProviderOutcome(fixture(), "CAPTURED", "pay_captured"));
  assert.equal((await assertNoUnresolvedAttempt(path)).submissionState, "CAPTURED");
}));

test("missing provider evidence remains unresolved", async () => withPath(async (path) => {
  await writeEvidence(path, markUnknown(markSubmissionStarted(fixture()), "Provider evidence unavailable."));
  await assert.rejects(assertNoUnresolvedAttempt(path), /unresolved Razorpay outcome/);
}));

test("the isolated harness uses only its in-memory replica set and applies the evidence gate", async () => {
  const [harness, runner] = await Promise.all([
    readFile(new URL("../../backend/src/scripts/phase7oStartIsolatedE2e.ts", import.meta.url), "utf8"),
    readFile(new URL("./phase7o-isolated-runner.mjs", import.meta.url), "utf8"),
  ]);
  assert.match(harness, /MongoMemoryReplSet\.create/);
  assert.match(harness, /getUri\("sthn_phase7o_browser_e2e_test"\)/);
  assert.doesNotMatch(harness, /mongoose\.connect\(process\.env\.MONGODB_URI/);
  assert.match(runner, /assertNoUnresolvedAttempt\(evidencePath\)/);
  assert.match(runner, /MONGOMS_SYSTEM_BINARY: mongoSystemBinary/);
  assert.match(runner, /isolated MongoDB replica-set startup/);
});

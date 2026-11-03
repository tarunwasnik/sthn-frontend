import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

export const defaultEvidencePath = resolve(import.meta.dirname, "..", ".phase7o-e2e-evidence.json");

const unresolvedStates = new Set(["SUBMISSION_STARTED", "UNKNOWN"]);
const terminalStates = new Set(["VERIFIED_NON_EXECUTION", "CAPTURED", "FAILED"]);
const forbiddenKey = /(?:secret|password|token|signature|authorization|pan|cvv|card)/i;

const requiredString = (value, label) => {
  assert.equal(typeof value, "string", `${label} must be a string.`);
  assert.ok(value.length > 0, `${label} must not be empty.`);
  return value;
};

const assertNoSensitiveFields = (value) => {
  if (Array.isArray(value)) return value.forEach(assertNoSensitiveFields);
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    assert.ok(!forbiddenKey.test(key), `Evidence must not contain ${key}.`);
    assertNoSensitiveFields(child);
  }
};

export const createEvidence = ({ runId = randomUUID(), timestamp = new Date().toISOString(), bookingId, paymentId, operationId, razorpayOrderId, expectedAmount, expectedCurrency, submissionState = "PRE_SUBMISSION", providerPaymentId } = {}) => {
  const evidence = {
    version: 1,
    runId: requiredString(runId, "runId"),
    timestamp: requiredString(timestamp, "timestamp"),
    bookingId: requiredString(bookingId, "bookingId"),
    paymentId: requiredString(paymentId, "paymentId"),
    operationId: requiredString(operationId, "operationId"),
    razorpayOrderId: requiredString(razorpayOrderId, "razorpayOrderId"),
    expectedAmount,
    expectedCurrency: requiredString(expectedCurrency, "expectedCurrency"),
    submissionState,
    ...(providerPaymentId ? { providerPaymentId: requiredString(providerPaymentId, "providerPaymentId") } : {}),
  };
  assert.ok(Number.isSafeInteger(expectedAmount) && expectedAmount > 0, "expectedAmount must be a positive integer.");
  assert.ok(unresolvedStates.has(submissionState) || terminalStates.has(submissionState) || submissionState === "PRE_SUBMISSION", "Invalid evidence state.");
  assertNoSensitiveFields(evidence);
  return evidence;
};

/** Records a pre-durability historical run without inventing the Mongo ids that teardown destroyed. */
export const createLegacyReconciliationEvidence = ({ runId, timestamp, razorpayOrderId, expectedAmount, expectedCurrency }) => {
  const evidence = {
    version: 1,
    runId: requiredString(runId, "runId"),
    timestamp: requiredString(timestamp, "timestamp"),
    bookingId: null,
    paymentId: null,
    operationId: null,
    razorpayOrderId: requiredString(razorpayOrderId, "razorpayOrderId"),
    expectedAmount,
    expectedCurrency: requiredString(expectedCurrency, "expectedCurrency"),
    submissionState: "VERIFIED_NON_EXECUTION",
    localEvidence: "UNAVAILABLE_AFTER_IN_MEMORY_TEARDOWN",
    providerOutcome: "ORDER_CREATED_WITHOUT_PAYMENT",
  };
  assert.ok(Number.isSafeInteger(expectedAmount) && expectedAmount > 0, "expectedAmount must be a positive integer.");
  assertNoSensitiveFields(evidence);
  return evidence;
};

export const writeEvidence = async (path, evidence) => {
  assertNoSensitiveFields(evidence);
  await mkdir(dirname(path), { recursive: true });
  let existing;
  try { existing = JSON.parse(await readFile(path, "utf8")); } catch (error) { if (!error || typeof error !== "object" || error.code !== "ENOENT") throw error; }
  const priorRuns = Array.isArray(existing?.runs) ? existing.runs : existing ? [existing] : [];
  const runs = [...priorRuns.filter((run) => run?.runId !== evidence.runId), evidence];
  const journal = { version: 1, runs };
  assertNoSensitiveFields(journal);
  const temporary = `${path}.${process.pid}.${randomUUID()}.tmp`;
  await writeFile(temporary, `${JSON.stringify(journal, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
  await rename(temporary, path);
};

export const readEvidenceJournal = async (path = defaultEvidencePath) => {
  try {
    const stored = JSON.parse(await readFile(path, "utf8"));
    const runs = Array.isArray(stored?.runs) ? stored.runs : [stored];
    assertNoSensitiveFields(runs);
    return runs;
  } catch (error) {
    if (error && typeof error === "object" && error.code === "ENOENT") return undefined;
    throw error;
  }
};

export const readEvidence = async (path = defaultEvidencePath) => (await readEvidenceJournal(path))?.at(-1);

export const assertNoUnresolvedAttempt = async (path = defaultEvidencePath) => {
  const runs = await readEvidenceJournal(path);
  const unresolved = runs?.find((evidence) => unresolvedStates.has(evidence.submissionState));
  if (unresolved) {
    throw new Error(`Phase 7O has an unresolved Razorpay outcome (${unresolved.submissionState}) for run ${unresolved.runId}; reconcile it before any further submission.`);
  }
  return runs?.at(-1);
};

export const markSubmissionStarted = (evidence) => ({ ...evidence, submissionState: "SUBMISSION_STARTED", submissionStartedAt: new Date().toISOString() });
export const markUnknown = (evidence, reason) => ({ ...evidence, submissionState: "UNKNOWN", reconciliationNote: requiredString(reason, "reason"), reconciliationRecordedAt: new Date().toISOString() });
export const markProviderOutcome = (evidence, submissionState, providerPaymentId) => {
  assert.ok(terminalStates.has(submissionState), "Provider outcome must be terminal.");
  const resolved = { ...evidence, submissionState, providerReconciledAt: new Date().toISOString(), ...(providerPaymentId ? { providerPaymentId } : {}) };
  assertNoSensitiveFields(resolved);
  return resolved;
};

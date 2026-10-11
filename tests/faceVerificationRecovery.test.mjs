import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import ts from "typescript";

const moduleFromSource = async (path) => {
  let source = await readFile(new URL(path, import.meta.url), "utf8");
  source = source.replace('import axios from "axios";', 'const axios = { isAxiosError: (error) => Boolean(error?.isAxiosError) };');
  source = source.replace('import api from "./axios";', "const api = {}; ");
  const output = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  }).outputText;
  return import(`data:text/javascript;base64,${Buffer.from(output).toString("base64")}`);
};

test("only documented completed-session eligibility failures trigger recapture recovery", async () => {
  const faceVerification = await moduleFromSource("../src/api/faceVerification.ts");
  const error = (status, message) => ({ isAxiosError: true, response: { status, data: { message } } });

  assert.equal(faceVerification.isFaceVerificationRecoveryError(error(409, "Complete live face verification for the current avatar before submitting.")), true);
  assert.equal(faceVerification.isFaceVerificationRecoveryError(error(409, "Complete fresh live face verification for the current avatar before resubmitting.")), true);
  assert.equal(faceVerification.isFaceVerificationRecoveryError(error(409, "Completed face verification session is no longer eligible")), true);
  assert.equal(faceVerification.isFaceVerificationRecoveryError(error(409, "Image admission is not eligible")), false);
  assert.equal(faceVerification.isFaceVerificationRecoveryError(error(500, "Complete live face verification for the current avatar before submitting.")), false);
});

test("only exact backend non-capturable session responses are terminal during capture", async () => {
  const faceVerification = await moduleFromSource("../src/api/faceVerification.ts");
  const error = (status, message) => ({ isAxiosError: true, response: { status, data: { message } } });

  assert.equal(faceVerification.isTerminalFaceVerificationCaptureError(error(409, "Face verification session is not accepting captures")), true);
  assert.equal(faceVerification.isTerminalFaceVerificationCaptureError(error(404, "Face verification session not found")), true);
  assert.equal(faceVerification.isTerminalFaceVerificationCaptureError(error(409, "This challenge capture is already being processed")), false);
  assert.equal(faceVerification.isTerminalFaceVerificationCaptureError(error(409, "Completed face verification session is no longer eligible")), false);
  assert.equal(faceVerification.isTerminalFaceVerificationCaptureError(error(500, "Face verification session is not accepting captures")), false);
});

test("onboarding keeps form/media state but makes expired or incompatible captures require recapture", async () => {
  const source = await readFile(new URL("../src/pages/Onboarding.tsx", import.meta.url), "utf8");

  assert.match(source, /sessionReference: string/);
  assert.match(source, /expiresAt: string/);
  assert.match(source, /isFaceVerificationRecoveryError\(err\)/);
  assert.match(source, /Start a new session and complete all five captures/);
  assert.match(source, /completedFaceVerification\.candidateKey !== faceCandidateKey/);
  assert.match(source, /isProfileMediaAdmissionExpired\(incompleteAvatar\)/);
  assert.match(source, /setCompletedFaceVerification\(null\)/);
  assert.match(source, /candidateAvatar=\{rejectedFaceCandidate\}/);
});

test("the overlay returns the authoritative completed session rather than treating a capture as timeless", async () => {
  const source = await readFile(new URL("../src/components/faceVerification/FaceVerificationOverlay.tsx", import.meta.url), "utf8");

  assert.match(source, /onComplete: \(session: FaceVerificationSessionDto\)/);
  assert.match(source, /onComplete\(result\.session\)/);
  assert.match(source, /session\.expiresAt/);
  assert.match(source, /isTerminalFaceVerificationCaptureError\(captureError\)/);
  assert.match(source, /endTerminalSession\(messageForError\(captureError\)\)/);
  assert.match(source, /Start a new session/);
});

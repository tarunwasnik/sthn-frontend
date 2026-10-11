import { expect, type Request } from "@playwright/test";
import type { FaceVerificationCandidateAvatar } from "../../src/api/faceVerification";

export const fiveFaceChallenges = ["NEUTRAL", "TURN_LEFT", "TURN_RIGHT", "LOOK_UP", "BLINK"] as const;

type SessionStart = Readonly<{ avatar: string } | { candidateAvatar: FaceVerificationCandidateAvatar }>;

type SessionFixtureOptions = Readonly<{
  sessionReference: string;
  expectedStart: SessionStart;
  expiresInMs?: number;
  terminalCaptureIndex?: number;
}>;

const problem = (message: string) => new Error(`Face Verification fixture contract violation: ${message}`);

/**
 * Test-only authoritative session double. It deliberately records invalid client
 * requests and responds with an error; it never advances a capture or completes a
 * session for an invalid candidate, skipped index, or non-JPEG multipart body.
 */
export const createFaceVerificationSessionFixture = ({ sessionReference, expectedStart, expiresInMs = 120_000, terminalCaptureIndex }: SessionFixtureOptions) => {
  let acceptedCaptureCount = 0;
  let cancelled = false;
  let terminal = false;
  let violation: Error | null = null;
  const captureIndexes: number[] = [];
  const captureAttempts: number[] = [];

  const rememberViolation = (message: string) => {
    violation ??= problem(message);
  };
  const session = () => ({
    sessionReference,
    status: cancelled ? "CANCELLED" : acceptedCaptureCount === fiveFaceChallenges.length ? "CAPTURE_COMPLETE" : acceptedCaptureCount ? "CAPTURING" : "CREATED",
    challenges: [...fiveFaceChallenges],
    requiredCaptureCount: fiveFaceChallenges.length,
    acceptedCaptureCount,
    expiresAt: new Date(Date.now() + expiresInMs).toISOString(),
    captureComplete: acceptedCaptureCount === fiveFaceChallenges.length,
  });

  return {
    session,
    captureIndexes,
    captureAttempts,
    start: (body: unknown) => {
      if (JSON.stringify(body) !== JSON.stringify(expectedStart)) rememberViolation(`session start did not exactly match ${JSON.stringify(expectedStart)}`);
      return violation ? { status: 400, json: { message: violation.message } } : { status: 201, json: { session: session() } };
    },
    capture: ({ request, requestedSessionReference, index }: Readonly<{ request: Request; requestedSessionReference: string; index: number }>) => {
      const body = request.postDataBuffer();
      if (requestedSessionReference !== sessionReference) rememberViolation(`capture used ${requestedSessionReference}, expected ${sessionReference}`);
      if (cancelled) rememberViolation("capture was submitted after cancellation");
      if (terminal) rememberViolation("capture was submitted after a terminal session failure");
      if (index !== acceptedCaptureCount) rememberViolation(`capture index ${index} was submitted while ${acceptedCaptureCount} was required`);
      if (!body?.includes(Buffer.from('name="file"'))) rememberViolation("capture did not include multipart file field");
      if (!body?.includes(Buffer.from("image/jpeg"))) rememberViolation("capture was not a JPEG multipart upload");
      if (violation) return { status: 400, json: { message: violation.message } };
      captureAttempts.push(index);
      if (index === terminalCaptureIndex) {
        terminal = true;
        return { status: 409, json: { message: "Face verification session is not accepting captures" } };
      }
      captureIndexes.push(index);
      acceptedCaptureCount += 1;
      return { status: 201, json: { session: session(), replayed: false } };
    },
    cancel: (requestedSessionReference: string) => {
      if (requestedSessionReference !== sessionReference) rememberViolation(`cancel used ${requestedSessionReference}, expected ${sessionReference}`);
      cancelled = true;
      return violation ? { status: 400, json: { message: violation.message } } : { status: 200, json: { session: session() } };
    },
    assertCompleted: () => {
      if (violation) throw violation;
      expect([...new Set(fiveFaceChallenges)]).toHaveLength(fiveFaceChallenges.length);
      expect(captureIndexes).toEqual([0, 1, 2, 3, 4]);
      expect(acceptedCaptureCount).toBe(fiveFaceChallenges.length);
      expect(cancelled).toBe(false);
    },
    assertCancelled: () => {
      if (violation) throw violation;
      expect(cancelled).toBe(true);
      expect(acceptedCaptureCount).toBe(0);
    },
    assertTerminalCapture: (index: number) => {
      if (violation) throw violation;
      expect(terminal).toBe(true);
      expect(captureAttempts).toEqual([index]);
      expect(captureIndexes).toEqual([]);
      expect(acceptedCaptureCount).toBe(0);
    },
  };
};

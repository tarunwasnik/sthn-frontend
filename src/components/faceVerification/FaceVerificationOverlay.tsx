import { useCallback, useEffect, useRef, useState } from "react";
import { FaceLandmarker, FilesetResolver, type FaceLandmarkerResult, type NormalizedLandmark } from "@mediapipe/tasks-vision";
import axios from "axios";
import { FaceVerificationChallenge, FaceVerificationSessionDto, cancelFaceVerificationSession, startFaceVerificationSession, uploadFaceVerificationCapture } from "../../api/faceVerification";

type UiState = "INSTRUCTIONS" | "REQUESTING_CAMERA" | "COUNTDOWN" | "CAPTURING" | "UPLOADING" | "SUCCESS" | "ERROR";
type BlinkPhase = "WAITING_FOR_OPEN" | "WAITING_FOR_CLOSE" | "WAITING_FOR_REOPEN" | "DETECTED";
type NeutralBaseline = { yaw: number; pitch: number; eyeClosure: number };
type FrameMetrics = { yaw: number; pitch: number; eyeClosure: number; centerX: number; centerY: number; faceScale: number };

const labels: Record<FaceVerificationChallenge, string> = { NEUTRAL: "Look straight at the camera", TURN_LEFT: "Turn your head left", TURN_RIGHT: "Turn your head right", LOOK_UP: "Look up", LOOK_DOWN: "Look down", BLINK: "Blink naturally" };
const modelUrl = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task";
const wasmUrl = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm";

// Local-only capture-quality guidance. Keep tuning values together for mobile calibration.
const GUIDANCE = {
  inferenceIntervalMs: 80, baselineSampleMs: 500, trackingLossResetMs: 1_500, correctionWindowMs: 2 * 60 * 1_000, poseHoldMs: 900,
  faceMinScale: 0.22, faceMaxScale: 0.78, centerToleranceX: 0.23, centerToleranceY: 0.25,
  neutralYawTolerance: 0.12, neutralPitchTolerance: 0.12, turnYawThreshold: 0.22, lookPitchThreshold: 0.18, baselinePoseJitter: 0.08,
  blinkMinimumClosure: 0.38, blinkClosureOffset: 0.25, blinkReopenOffset: 0.12, blinkTransitionMs: 1_200,
} as const;

interface Props { avatar: string; onComplete: (avatar: string) => void; onClose: () => void; }
const average = (values: number[]) => values.reduce((total, value) => total + value, 0) / values.length;
const messageForError = (error: unknown) => {
  const body = axios.isAxiosError(error) ? error.response?.data : undefined;
  if (typeof body?.message === "string") return body.message;
  if (error instanceof DOMException && error.name === "NotAllowedError") return "Camera access is required to complete face verification.";
  if (error instanceof DOMException && error.name === "NotFoundError") return "No usable camera was found on this device.";
  return "Unable to continue face verification. Please try again.";
};
const faceBounds = (landmarks: NormalizedLandmark[]) => {
  const xs = landmarks.map((point) => point.x); const ys = landmarks.map((point) => point.y);
  const minX = Math.min(...xs); const maxX = Math.max(...xs); const minY = Math.min(...ys); const maxY = Math.max(...ys);
  return { centerX: (minX + maxX) / 2, centerY: (minY + maxY) / 2, faceScale: Math.max(maxX - minX, maxY - minY) };
};
const eyeClosureScore = (result: FaceLandmarkerResult) => {
  const categories = result.faceBlendshapes[0]?.categories ?? [];
  const score = (name: string) => categories.find((category) => category.categoryName === name)?.score;
  const left = score("eyeBlinkLeft"); const right = score("eyeBlinkRight");
  return left === undefined || right === undefined ? null : (left + right) / 2;
};
const poseFromMatrix = (result: FaceLandmarkerResult) => {
  const matrix = result.facialTransformationMatrixes[0];
  if (!matrix || matrix.rows !== 4 || matrix.columns !== 4 || matrix.data.length < 16) return null;
  // The canonical-face-to-camera matrix is column-major. Its third basis vector is the face normal.
  const normalX = matrix.data[8]; const normalY = matrix.data[9]; const normalZ = matrix.data[10]; const horizontal = Math.hypot(normalX, normalZ);
  if (!Number.isFinite(horizontal) || horizontal === 0) return null;
  return { yaw: Math.atan2(normalX, normalZ), pitch: Math.atan2(-normalY, horizontal) };
};

export default function FaceVerificationOverlay({ avatar, onComplete, onClose }: Props) {
  const [state, setState] = useState<UiState>("INSTRUCTIONS"); const [session, setSession] = useState<FaceVerificationSessionDto | null>(null);
  const [countdown, setCountdown] = useState(3); const [guidance, setGuidance] = useState("Center your face in the frame."); const [error, setError] = useState(""); const [redFeedback, setRedFeedback] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null); const streamRef = useRef<MediaStream | null>(null); const landmarkRef = useRef<FaceLandmarker | null>(null); const timerRef = useRef<number | null>(null); const animationRef = useRef<number | null>(null); const uploadingRef = useRef(false);
  const latestSessionRef = useRef<FaceVerificationSessionDto | null>(null); const baselineRef = useRef<NeutralBaseline | null>(null); const baselineSamplesRef = useRef<FrameMetrics[]>([]); const baselineStartedAtRef = useRef<number | null>(null);
  const challengeIndexRef = useRef<number | null>(null); const holdSinceRef = useRef<number | null>(null); const blinkPhaseRef = useRef<BlinkPhase>("WAITING_FOR_OPEN"); const blinkClosedAtRef = useRef<number | null>(null); const problemSinceRef = useRef<number | null>(null); const lastFaceSeenAtRef = useRef<number | null>(null); const lastInferenceAtRef = useRef(0); const inferenceInFlightRef = useRef(false);
  const guidanceRef = useRef(guidance); const redFeedbackRef = useRef(redFeedback);
  const publishGuidance = useCallback((next: string, problem: boolean) => { if (guidanceRef.current !== next) { guidanceRef.current = next; setGuidance(next); } if (redFeedbackRef.current !== problem) { redFeedbackRef.current = problem; setRedFeedback(problem); } }, []);
  const setAuthoritativeSession = useCallback((next: FaceVerificationSessionDto) => { latestSessionRef.current = next; setSession(next); }, []);
  const resetChallengeState = useCallback((index: number | null) => { challengeIndexRef.current = index; holdSinceRef.current = null; blinkPhaseRef.current = "WAITING_FOR_OPEN"; blinkClosedAtRef.current = null; }, []);
  const resetBaseline = useCallback(() => { baselineRef.current = null; baselineSamplesRef.current = []; baselineStartedAtRef.current = null; }, []);
  const resetBaselineSampling = useCallback(() => { if (!baselineRef.current) { baselineSamplesRef.current = []; baselineStartedAtRef.current = null; } }, []);
  const stopCamera = useCallback(() => { if (animationRef.current) cancelAnimationFrame(animationRef.current); animationRef.current = null; if (timerRef.current) window.clearTimeout(timerRef.current); timerRef.current = null; streamRef.current?.getTracks().forEach((track) => track.stop()); streamRef.current = null; }, []);
  const cancelAndClose = useCallback(async () => { stopCamera(); const active = latestSessionRef.current; if (active && !active.captureComplete) { try { await cancelFaceVerificationSession(active.sessionReference); } catch { /* local cleanup must still complete */ } } onClose(); }, [onClose, stopCamera]);
  useEffect(() => () => stopCamera(), [stopCamera]);

  const capture = useCallback(async () => {
    const active = latestSessionRef.current; if (!active || uploadingRef.current || !videoRef.current) return;
    const index = active.acceptedCaptureCount; if (index < 0 || index >= active.requiredCaptureCount) return;
    uploadingRef.current = true; setState("UPLOADING"); const canvas = document.createElement("canvas"); const source = videoRef.current; const scale = Math.min(1, 960 / Math.max(source.videoWidth, source.videoHeight));
    canvas.width = Math.max(1, Math.round(source.videoWidth * scale)); canvas.height = Math.max(1, Math.round(source.videoHeight * scale)); canvas.getContext("2d")?.drawImage(source, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.88));
    if (!blob) { uploadingRef.current = false; setState("CAPTURING"); setError("Could not capture a camera frame. Please try again."); return; }
    try {
      const result = await uploadFaceVerificationCapture(active.sessionReference, index, blob); setAuthoritativeSession(result.session); uploadingRef.current = false;
      if (result.session.captureComplete || result.session.status === "CAPTURE_COMPLETE") { setState("SUCCESS"); stopCamera(); window.setTimeout(() => { onComplete(avatar); onClose(); }, 1200); return; }
      resetChallengeState(result.session.acceptedCaptureCount); publishGuidance("Follow the next instruction.", false); setState("CAPTURING");
    } catch (captureError) { uploadingRef.current = false; resetChallengeState(latestSessionRef.current?.acceptedCaptureCount ?? null); setState("CAPTURING"); setError(messageForError(captureError)); publishGuidance("Keep still and try again.", true); }
  }, [avatar, onClose, onComplete, publishGuidance, resetChallengeState, setAuthoritativeSession, stopCamera]);

  const runGuidance = useCallback(() => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    const failGuidance = (message: string) => { stopCamera(); setState("ERROR"); setError(message); };
    const inspect = (now: number) => {
      const video = videoRef.current;
      if (!video || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA || uploadingRef.current) { animationRef.current = requestAnimationFrame(inspect); return; }
      if (now - lastInferenceAtRef.current < GUIDANCE.inferenceIntervalMs) { animationRef.current = requestAnimationFrame(inspect); return; }
      if (!landmarkRef.current || inferenceInFlightRef.current) { failGuidance("Face guidance could not initialize. Please start a fresh verification."); return; }
      lastInferenceAtRef.current = now; inferenceInFlightRef.current = true; let result: FaceLandmarkerResult;
      try { result = landmarkRef.current.detectForVideo(video, now); } catch { inferenceInFlightRef.current = false; failGuidance("Face guidance stopped unexpectedly. Please start a fresh verification."); return; }
      inferenceInFlightRef.current = false;
      const active = latestSessionRef.current; const index = active?.acceptedCaptureCount ?? null;
      if (challengeIndexRef.current !== index) resetChallengeState(index);
      const challenge = index !== null && active ? active.challenges[index] : undefined;
      if (!challenge) { failGuidance("Face verification session is no longer available. Please start again."); return; }
      if (!result.facialTransformationMatrixes[0] || !result.faceBlendshapes[0]) { failGuidance("Face guidance data is unavailable. Please start a fresh verification."); return; }
      if (result.faceLandmarks.length !== 1) {
        const next = result.faceLandmarks.length === 0 ? "Center your face in the camera." : "Make sure only you are visible.";
        holdSinceRef.current = null; blinkPhaseRef.current = "WAITING_FOR_OPEN"; resetBaselineSampling(); publishGuidance(next, true); problemSinceRef.current ??= now;
        if (result.faceLandmarks.length === 0 && lastFaceSeenAtRef.current && now - lastFaceSeenAtRef.current >= GUIDANCE.trackingLossResetMs) resetBaseline();
      } else {
        lastFaceSeenAtRef.current = now; const pose = poseFromMatrix(result); const eyeClosure = eyeClosureScore(result);
        if (!pose || eyeClosure === null) { failGuidance("Face guidance data is unavailable. Please start a fresh verification."); return; }
        const metrics: FrameMetrics = { ...pose, eyeClosure, ...faceBounds(result.faceLandmarks[0]) }; const tooFar = metrics.faceScale < GUIDANCE.faceMinScale; const tooClose = metrics.faceScale > GUIDANCE.faceMaxScale;
        const offCenter = Math.abs(metrics.centerX - 0.5) > GUIDANCE.centerToleranceX || Math.abs(metrics.centerY - 0.5) > GUIDANCE.centerToleranceY;
        if (tooFar || tooClose || offCenter) { holdSinceRef.current = null; blinkPhaseRef.current = "WAITING_FOR_OPEN"; resetBaselineSampling(); publishGuidance(tooFar ? "Move closer to the camera." : tooClose ? "Move back slightly." : "Center your face in the frame.", true); problemSinceRef.current ??= now; }
        else if (!baselineRef.current) {
          baselineStartedAtRef.current ??= now; const prior = baselineSamplesRef.current[0]; const stable = !prior || (Math.abs(metrics.yaw - prior.yaw) <= GUIDANCE.baselinePoseJitter && Math.abs(metrics.pitch - prior.pitch) <= GUIDANCE.baselinePoseJitter);
          if (!stable) { baselineStartedAtRef.current = now; baselineSamplesRef.current = [metrics]; } else baselineSamplesRef.current.push(metrics);
          if (now - (baselineStartedAtRef.current ?? now) >= GUIDANCE.baselineSampleMs) { const samples = baselineSamplesRef.current; baselineRef.current = { yaw: average(samples.map((sample) => sample.yaw)), pitch: average(samples.map((sample) => sample.pitch)), eyeClosure: average(samples.map((sample) => sample.eyeClosure)) }; baselineSamplesRef.current = []; baselineStartedAtRef.current = null; publishGuidance("Baseline ready. Follow the instruction.", false); }
          else publishGuidance("Look straight ahead while we calibrate.", false);
          holdSinceRef.current = null; problemSinceRef.current = null;
        } else {
          const baseline = baselineRef.current; const yawDelta = metrics.yaw - baseline.yaw; const pitchDelta = metrics.pitch - baseline.pitch; const blinkClose = Math.max(GUIDANCE.blinkMinimumClosure, baseline.eyeClosure + GUIDANCE.blinkClosureOffset); const blinkReopen = baseline.eyeClosure + GUIDANCE.blinkReopenOffset;
          let qualifies = false; let wrongDirection = false;
          if (challenge === "NEUTRAL") qualifies = Math.abs(yawDelta) <= GUIDANCE.neutralYawTolerance && Math.abs(pitchDelta) <= GUIDANCE.neutralPitchTolerance;
          if (challenge === "TURN_RIGHT") { qualifies = yawDelta >= GUIDANCE.turnYawThreshold; wrongDirection = yawDelta <= -GUIDANCE.turnYawThreshold; }
          if (challenge === "TURN_LEFT") { qualifies = yawDelta <= -GUIDANCE.turnYawThreshold; wrongDirection = yawDelta >= GUIDANCE.turnYawThreshold; }
          if (challenge === "LOOK_UP") { qualifies = pitchDelta >= GUIDANCE.lookPitchThreshold; wrongDirection = pitchDelta <= -GUIDANCE.lookPitchThreshold; }
          if (challenge === "LOOK_DOWN") { qualifies = pitchDelta <= -GUIDANCE.lookPitchThreshold; wrongDirection = pitchDelta >= GUIDANCE.lookPitchThreshold; }
          if (challenge === "BLINK") {
            if (blinkPhaseRef.current === "WAITING_FOR_OPEN" && metrics.eyeClosure <= blinkReopen) blinkPhaseRef.current = "WAITING_FOR_CLOSE";
            else if (blinkPhaseRef.current === "WAITING_FOR_CLOSE" && metrics.eyeClosure >= blinkClose) { blinkPhaseRef.current = "WAITING_FOR_REOPEN"; blinkClosedAtRef.current = now; }
            else if (blinkPhaseRef.current === "WAITING_FOR_REOPEN" && metrics.eyeClosure <= blinkReopen) blinkPhaseRef.current = "DETECTED";
            else if (blinkPhaseRef.current === "WAITING_FOR_REOPEN" && blinkClosedAtRef.current && now - blinkClosedAtRef.current > GUIDANCE.blinkTransitionMs) { blinkPhaseRef.current = "WAITING_FOR_OPEN"; blinkClosedAtRef.current = null; }
            qualifies = blinkPhaseRef.current === "DETECTED" && Math.abs(yawDelta) <= GUIDANCE.neutralYawTolerance && Math.abs(pitchDelta) <= GUIDANCE.neutralPitchTolerance;
          }
          if (qualifies) { problemSinceRef.current = null; holdSinceRef.current ??= now; publishGuidance("Hold still", false); if (now - holdSinceRef.current >= GUIDANCE.poseHoldMs) void capture(); }
          else { holdSinceRef.current = null; problemSinceRef.current ??= now; publishGuidance(wrongDirection ? "Turn your head the other way." : labels[challenge], true); }
        }
      }
      if (problemSinceRef.current && now - problemSinceRef.current >= GUIDANCE.correctionWindowMs && active) { stopCamera(); void cancelFaceVerificationSession(active.sessionReference); setState("ERROR"); setError("Camera guidance could not be corrected in time. Start a fresh verification when ready."); return; }
      animationRef.current = requestAnimationFrame(inspect);
    };
    animationRef.current = requestAnimationFrame(inspect);
  }, [capture, publishGuidance, resetBaseline, resetBaselineSampling, resetChallengeState, stopCamera]);

  const openCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) { setState("ERROR"); setError("This browser does not support camera access."); return; }
    setState("REQUESTING_CAMERA"); setError(""); resetBaseline(); resetChallengeState(null); problemSinceRef.current = null; lastFaceSeenAtRef.current = null; lastInferenceAtRef.current = 0;
    try {
      const started = await startFaceVerificationSession(avatar); setAuthoritativeSession(started); const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "user" }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
      streamRef.current = stream; if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
      try { const files = await FilesetResolver.forVisionTasks(wasmUrl); landmarkRef.current = await FaceLandmarker.createFromOptions(files, { baseOptions: { modelAssetPath: modelUrl }, runningMode: "VIDEO", numFaces: 2, outputFaceBlendshapes: true, outputFacialTransformationMatrixes: true }); }
      catch { stopCamera(); setState("ERROR"); setError("Face guidance could not initialize. Please start a fresh verification."); return; }
      setState("COUNTDOWN");
    } catch (cameraError) { stopCamera(); setState("ERROR"); setError(messageForError(cameraError)); }
  };
  useEffect(() => { if (state !== "COUNTDOWN") return; if (countdown === 0) { if (latestSessionRef.current) { setState("CAPTURING"); runGuidance(); } return; } const id = window.setTimeout(() => setCountdown((value) => value - 1), 1_000); return () => window.clearTimeout(id); }, [countdown, runGuidance, state]);
  useEffect(() => { if (state !== "CAPTURING" || !session) return; const remaining = new Date(session.expiresAt).getTime() - Date.now(); if (remaining <= 0) { stopCamera(); setState("ERROR"); setError("Your verification session expired. Start a new one to continue."); return; } const id = window.setTimeout(() => { stopCamera(); setState("ERROR"); setError("Your verification session expired. Start a new one to continue."); }, remaining); return () => window.clearTimeout(id); }, [session, state, stopCamera]);
  const index = session?.acceptedCaptureCount ?? 0; const challenge = session?.challenges[index];
  return <div className="fixed inset-0 z-[100] bg-[#050807]/95 p-4 text-white backdrop-blur-sm"><button type="button" aria-label="Cancel face verification" onClick={() => void cancelAndClose()} className="absolute right-5 top-5 z-10 rounded-full border border-white/20 px-4 py-2 text-sm">Cancel</button><div className="mx-auto flex h-full max-w-2xl flex-col items-center justify-center">
    {state === "INSTRUCTIONS" && <div className="w-full rounded-3xl border border-white/10 bg-white/5 p-7"><h2 className="text-2xl font-bold">Face verification</h2><p className="mt-3 text-sm text-white/70">This live face check helps verify that you are the person represented by your profile. Verification captures are private and are not shown on your public profile.</p><ul className="mt-6 space-y-2 text-sm text-white/80"><li>• Make sure your face is clearly visible and well lit.</li><li>• Remove sunglasses or anything covering your face.</li><li>• Make sure only you are visible and hold the device steady.</li></ul><button type="button" onClick={() => void openCamera()} className="mt-7 w-full rounded-xl bg-teal-400 px-5 py-3 font-semibold text-black">Open camera</button></div>}
    {["REQUESTING_CAMERA", "COUNTDOWN", "CAPTURING", "UPLOADING", "SUCCESS"].includes(state) && <div className="w-full text-center"><div className={`relative mx-auto aspect-[3/4] max-h-[70vh] max-w-md overflow-hidden rounded-3xl border-4 ${redFeedback ? "border-red-500 motion-safe:animate-pulse" : "border-teal-300"}`}><video ref={videoRef} muted playsInline className="h-full w-full object-cover" />{state === "COUNTDOWN" && <div className="absolute inset-0 flex items-center justify-center bg-black/35 text-8xl font-bold">{countdown || ""}</div>}</div>{state === "SUCCESS" ? <h2 className="mt-5 text-xl font-semibold text-teal-300">Capture successful</h2> : <><p className="mt-5 text-lg font-semibold">{challenge ? labels[challenge] : "Preparing camera"}</p><p className="mt-2 text-sm text-white/70">{state === "UPLOADING" ? "Saving capture…" : guidance}</p><p className="mt-3 text-xs text-white/55">{Math.min(index + 1, 5)} / 5</p></>}</div>}
    {state === "ERROR" && <div className="w-full max-w-md rounded-2xl border border-red-400/30 bg-red-500/10 p-5"><p role="alert">{error}</p><button type="button" onClick={() => { setCountdown(3); setState("INSTRUCTIONS"); }} className="mt-4 rounded-lg bg-white/10 px-4 py-2">Try again</button></div>}
  </div></div>;
}

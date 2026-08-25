import { useCallback, useEffect, useRef, useState } from "react";
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import axios from "axios";
import { FaceVerificationChallenge, FaceVerificationSessionDto, cancelFaceVerificationSession, getFaceVerificationSession, startFaceVerificationSession, uploadFaceVerificationCapture } from "../../api/faceVerification";

type UiState = "INSTRUCTIONS" | "REQUESTING_CAMERA" | "COUNTDOWN" | "CAPTURING" | "UPLOADING" | "SUCCESS" | "ERROR";
const labels: Record<FaceVerificationChallenge, string> = { NEUTRAL: "Look straight at the camera", TURN_LEFT: "Turn your head left", TURN_RIGHT: "Turn your head right", LOOK_UP: "Look up", LOOK_DOWN: "Look down", BLINK: "Blink naturally" };
const modelUrl = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task";
const wasmUrl = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm";

interface Props { avatar: string; onComplete: (avatar: string) => void; onClose: () => void; }
const messageForError = (error: unknown) => {
  const body = axios.isAxiosError(error) ? error.response?.data : undefined;
  if (typeof body?.message === "string") return body.message;
  if (error instanceof DOMException && error.name === "NotAllowedError") return "Camera access is required to complete face verification.";
  if (error instanceof DOMException && error.name === "NotFoundError") return "No usable camera was found on this device.";
  return "Unable to continue face verification. Please try again.";
};

export default function FaceVerificationOverlay({ avatar, onComplete, onClose }: Props) {
  const [state, setState] = useState<UiState>("INSTRUCTIONS"); const [session, setSession] = useState<FaceVerificationSessionDto | null>(null);
  const [countdown, setCountdown] = useState(3); const [guidance, setGuidance] = useState("Center your face in the frame."); const [error, setError] = useState("");
  const [redFeedback, setRedFeedback] = useState(false); const videoRef = useRef<HTMLVideoElement>(null); const streamRef = useRef<MediaStream | null>(null);
  const landmarkRef = useRef<FaceLandmarker | null>(null); const timerRef = useRef<number | null>(null); const animationRef = useRef<number | null>(null); const uploadingRef = useRef(false); const stableSinceRef = useRef<number | null>(null);
  const problemSinceRef = useRef<number | null>(null);
  const latestSessionRef = useRef<FaceVerificationSessionDto | null>(null);
  const setAuthoritativeSession = useCallback((next: FaceVerificationSessionDto) => { latestSessionRef.current = next; setSession(next); }, []);
  const stopCamera = useCallback(() => { if (animationRef.current) cancelAnimationFrame(animationRef.current); if (timerRef.current) window.clearTimeout(timerRef.current); streamRef.current?.getTracks().forEach((track) => track.stop()); streamRef.current = null; }, []);
  const cancelAndClose = useCallback(async () => { stopCamera(); if (session && !session.captureComplete) { try { await cancelFaceVerificationSession(session.sessionReference); } catch { /* local cleanup must still complete */ } } onClose(); }, [onClose, session, stopCamera]);
  useEffect(() => () => stopCamera(), [stopCamera]);

  const capture = useCallback(async () => {
    const activeSession = latestSessionRef.current;
    if (!activeSession || uploadingRef.current || !videoRef.current) return;
    const index = activeSession.acceptedCaptureCount;
    if (index < 0 || index >= activeSession.requiredCaptureCount) return;
    uploadingRef.current = true; setState("UPLOADING");
    const canvas = document.createElement("canvas"); const source = videoRef.current; const scale = Math.min(1, 960 / Math.max(source.videoWidth, source.videoHeight));
    canvas.width = Math.max(1, Math.round(source.videoWidth * scale)); canvas.height = Math.max(1, Math.round(source.videoHeight * scale)); canvas.getContext("2d")?.drawImage(source, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.88));
    if (!blob) { uploadingRef.current = false; setState("CAPTURING"); setError("Could not capture a camera frame. Please try again."); return; }
    try {
      const result = await uploadFaceVerificationCapture(activeSession.sessionReference, index, blob); setAuthoritativeSession(result.session); uploadingRef.current = false;
      if (result.session.captureComplete || result.session.status === "CAPTURE_COMPLETE") { setState("SUCCESS"); stopCamera(); window.setTimeout(() => { onComplete(avatar); onClose(); }, 1200); return; }
      stableSinceRef.current = null; setState("CAPTURING");
    } catch (captureError) { uploadingRef.current = false; setState("CAPTURING"); setError(messageForError(captureError)); setRedFeedback(true); window.setTimeout(() => setRedFeedback(false), 450); }
  }, [avatar, onClose, onComplete, setAuthoritativeSession, stopCamera]);

  const runGuidance = useCallback(() => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    const inspect = (now: number) => {
      const video = videoRef.current; if (!video || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA || uploadingRef.current) { animationRef.current = requestAnimationFrame(inspect); return; }
      let suitable = true; let nextGuidance = "Hold still and follow the instruction.";
      const landmark = landmarkRef.current?.detectForVideo(video, now);
      if (landmark) {
        if (landmark.faceLandmarks.length === 0) { suitable = false; nextGuidance = "Center your face in the camera."; }
        else if (landmark.faceLandmarks.length > 1) { suitable = false; nextGuidance = "Make sure only you are visible."; }
      }
      setGuidance(nextGuidance); setRedFeedback(!suitable);
      if (suitable) { problemSinceRef.current = null; stableSinceRef.current ??= now; if (now - stableSinceRef.current >= 1200) void capture(); }
      else { stableSinceRef.current = null; problemSinceRef.current ??= now; const activeSession = latestSessionRef.current; if (now - problemSinceRef.current >= 2 * 60 * 1000 && activeSession) { stopCamera(); void cancelFaceVerificationSession(activeSession.sessionReference); setState("ERROR"); setError("Camera guidance could not be corrected in time. Start a fresh verification when ready."); return; } }
      animationRef.current = requestAnimationFrame(inspect);
    };
    animationRef.current = requestAnimationFrame(inspect);
  }, [capture, stopCamera]);

  const openCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) { setState("ERROR"); setError("This browser does not support camera access."); return; }
    setState("REQUESTING_CAMERA"); setError("");
    try {
      const started = await startFaceVerificationSession(avatar); setAuthoritativeSession(started);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "user" }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
      streamRef.current = stream; if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
      try { const files = await FilesetResolver.forVisionTasks(wasmUrl); landmarkRef.current = await FaceLandmarker.createFromOptions(files, { baseOptions: { modelAssetPath: modelUrl }, runningMode: "VIDEO", numFaces: 2, outputFaceBlendshapes: true }); } catch { setGuidance("Keep your face centered, well lit, and steady."); }
      setState("COUNTDOWN");
    } catch (cameraError) { stopCamera(); setState("ERROR"); setError(messageForError(cameraError)); }
  };
  useEffect(() => { if (state !== "COUNTDOWN") return; if (countdown === 0) { if (latestSessionRef.current) { setState("CAPTURING"); runGuidance(); } return; } const id = window.setTimeout(() => setCountdown((value) => value - 1), 1000); return () => window.clearTimeout(id); }, [countdown, runGuidance, state]);
  useEffect(() => { if (state !== "CAPTURING" || !session) return; const remaining = new Date(session.expiresAt).getTime() - Date.now(); if (remaining <= 0) { stopCamera(); setState("ERROR"); setError("Your verification session expired. Start a new one to continue."); return; } const id = window.setTimeout(() => { stopCamera(); setState("ERROR"); setError("Your verification session expired. Start a new one to continue."); }, remaining); return () => window.clearTimeout(id); }, [session, state, stopCamera]);

  const index = session?.acceptedCaptureCount ?? 0; const challenge = session?.challenges[index];
  return <div className="fixed inset-0 z-[100] bg-[#050807]/95 p-4 text-white backdrop-blur-sm"><button type="button" aria-label="Cancel face verification" onClick={() => void cancelAndClose()} className="absolute right-5 top-5 z-10 rounded-full border border-white/20 px-4 py-2 text-sm">Cancel</button><div className="mx-auto flex h-full max-w-2xl flex-col items-center justify-center">
    {state === "INSTRUCTIONS" && <div className="w-full rounded-3xl border border-white/10 bg-white/5 p-7"><h2 className="text-2xl font-bold">Face verification</h2><p className="mt-3 text-sm text-white/70">This live face check helps verify that you are the person represented by your profile. Verification captures are private and are not shown on your public profile.</p><ul className="mt-6 space-y-2 text-sm text-white/80"><li>• Make sure your face is clearly visible and well lit.</li><li>• Remove sunglasses or anything covering your face.</li><li>• Make sure only you are visible and hold the device steady.</li></ul><button type="button" onClick={() => void openCamera()} className="mt-7 w-full rounded-xl bg-teal-400 px-5 py-3 font-semibold text-black">Open camera</button></div>}
    {["REQUESTING_CAMERA", "COUNTDOWN", "CAPTURING", "UPLOADING", "SUCCESS"].includes(state) && <div className="w-full text-center"><div className={`relative mx-auto aspect-[3/4] max-h-[70vh] max-w-md overflow-hidden rounded-3xl border-4 ${redFeedback ? "border-red-500 motion-safe:animate-pulse" : "border-teal-300"}`}><video ref={videoRef} muted playsInline className="h-full w-full object-cover" />{state === "COUNTDOWN" && <div className="absolute inset-0 flex items-center justify-center bg-black/35 text-8xl font-bold">{countdown || ""}</div>}</div>{state === "SUCCESS" ? <h2 className="mt-5 text-xl font-semibold text-teal-300">Capture successful</h2> : <><p className="mt-5 text-lg font-semibold">{challenge ? labels[challenge] : "Preparing camera"}</p><p className="mt-2 text-sm text-white/70">{state === "UPLOADING" ? "Saving capture…" : guidance}</p><p className="mt-3 text-xs text-white/55">{Math.min(index + 1, 5)} / 5</p></>}</div>}
    {state === "ERROR" && <div className="w-full max-w-md rounded-2xl border border-red-400/30 bg-red-500/10 p-5"><p role="alert">{error}</p><button type="button" onClick={() => { setCountdown(3); setState("INSTRUCTIONS"); }} className="mt-4 rounded-lg bg-white/10 px-4 py-2">Try again</button></div>}
  </div></div>;
}

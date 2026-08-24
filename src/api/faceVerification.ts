import api from "./axios";

export type FaceVerificationChallenge = "NEUTRAL" | "TURN_LEFT" | "TURN_RIGHT" | "LOOK_UP" | "LOOK_DOWN" | "BLINK";
export type FaceVerificationSessionStatus = "CREATED" | "CAPTURING" | "CAPTURE_COMPLETE" | "CANCELLED" | "EXPIRED" | "INVALIDATED";
export interface FaceVerificationSessionDto { sessionReference: string; status: FaceVerificationSessionStatus; challenges: FaceVerificationChallenge[]; requiredCaptureCount: number; acceptedCaptureCount: number; expiresAt: string; captureComplete: boolean; }

export const startFaceVerificationSession = async (avatar: string) => (await api.post<{ session: FaceVerificationSessionDto }>("/v1/profile/face-verification/session", { avatar })).data.session;
export const getFaceVerificationSession = async (sessionReference: string) => (await api.get<{ session: FaceVerificationSessionDto }>(`/v1/profile/face-verification/session/${encodeURIComponent(sessionReference)}/status`)).data.session;
export const cancelFaceVerificationSession = async (sessionReference: string) => (await api.post<{ session: FaceVerificationSessionDto }>(`/v1/profile/face-verification/session/${encodeURIComponent(sessionReference)}/cancel`)).data.session;
export const uploadFaceVerificationCapture = async (sessionReference: string, challengeIndex: number, capture: Blob) => {
  const form = new FormData(); form.append("file", capture, "face-capture.jpg");
  return (await api.post<{ session: FaceVerificationSessionDto; replayed: boolean }>(`/v1/profile/face-verification/session/${encodeURIComponent(sessionReference)}/captures/${challengeIndex}`, form)).data;
};

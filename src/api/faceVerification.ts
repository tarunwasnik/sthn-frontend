import axios from "axios";
import api from "./axios";

export type FaceVerificationChallenge = "NEUTRAL" | "TURN_LEFT" | "TURN_RIGHT" | "LOOK_UP" | "LOOK_DOWN" | "BLINK";
export type FaceVerificationSessionStatus = "CREATED" | "CAPTURING" | "CAPTURE_COMPLETE" | "CANCELLED" | "EXPIRED" | "INVALIDATED";
export interface FaceVerificationSessionDto { sessionReference: string; status: FaceVerificationSessionStatus; challenges: FaceVerificationChallenge[]; requiredCaptureCount: number; acceptedCaptureCount: number; expiresAt: string; captureComplete: boolean; }
export type FaceVerificationCandidateAvatar = Readonly<{ kind: "UNCHANGED"; reference: string } | { kind: "ADMISSION"; admissionReference: string }>;
export interface FaceVerificationCaptureApi {
  start: () => Promise<FaceVerificationSessionDto>;
  get: (sessionReference: string) => Promise<FaceVerificationSessionDto>;
  upload: (sessionReference: string, challengeIndex: number, capture: Blob) => Promise<{ session: FaceVerificationSessionDto; replayed: boolean }>;
  cancel?: (sessionReference: string) => Promise<FaceVerificationSessionDto>;
}

const faceVerificationErrorMessage = (error: unknown) => axios.isAxiosError(error)
  && typeof error.response?.data?.message === "string"
  ? error.response.data.message
  : undefined;

/** Capture failures from terminal server-side sessions have no backend error code yet. */
export const isTerminalFaceVerificationCaptureError = (error: unknown) => {
  if (!axios.isAxiosError(error)) return false;
  const message = faceVerificationErrorMessage(error);
  return (error.response?.status === 409 && message === "Face verification session is not accepting captures")
    || (error.response?.status === 404 && message === "Face verification session not found");
};

/** The backend currently signals session loss through its 404/409 response contract. */
export const isFaceVerificationRecoveryError = (error: unknown) => {
  if (!axios.isAxiosError(error)) return false;
  if (error.response?.status !== 409) return false;
  const message = error.response.data && typeof error.response.data === "object" && "message" in error.response.data
    ? (error.response.data as { message?: unknown }).message
    : undefined;
  return message === "Complete live face verification for the current avatar before submitting."
    || message === "Complete fresh live face verification for the current avatar before resubmitting."
    || message === "Completed face verification session is no longer eligible";
};

export const startFaceVerificationSession = async (input: Readonly<{ avatar: string } | { candidateAvatar: FaceVerificationCandidateAvatar }>) => (await api.post<{ session: FaceVerificationSessionDto }>("/v1/profile/face-verification/session", input)).data.session;
export const getFaceVerificationSession = async (sessionReference: string) => (await api.get<{ session: FaceVerificationSessionDto }>(`/v1/profile/face-verification/session/${encodeURIComponent(sessionReference)}/status`)).data.session;
export const cancelFaceVerificationSession = async (sessionReference: string) => (await api.post<{ session: FaceVerificationSessionDto }>(`/v1/profile/face-verification/session/${encodeURIComponent(sessionReference)}/cancel`)).data.session;
export const uploadFaceVerificationCapture = async (sessionReference: string, challengeIndex: number, capture: Blob) => {
  const form = new FormData(); form.append("file", capture, "face-capture.jpg");
  return (await api.post<{ session: FaceVerificationSessionDto; replayed: boolean }>(`/v1/profile/face-verification/session/${encodeURIComponent(sessionReference)}/captures/${challengeIndex}`, form)).data;
};

/** Reusable capture transport for the future direct-Creator onboarding screen. */
export const createFaceVerificationCaptureApi = (basePath: string): FaceVerificationCaptureApi => ({
  start: async () => (await api.post<{ session: FaceVerificationSessionDto }>(`${basePath}/session`)).data.session,
  get: async (sessionReference: string) => (await api.get<{ session: FaceVerificationSessionDto }>(`${basePath}/session/${encodeURIComponent(sessionReference)}`)).data.session,
  upload: async (sessionReference: string, challengeIndex: number, capture: Blob) => {
    const form = new FormData();
    form.append("file", capture, "face-capture.jpg");
    return (await api.post<{ session: FaceVerificationSessionDto; replayed: boolean }>(`${basePath}/session/${encodeURIComponent(sessionReference)}/captures/${challengeIndex}`, form)).data;
  },
});

export const creatorFaceVerificationCaptureApi = createFaceVerificationCaptureApi("/v1/creator-applications/me/upgrade-face-verification");

/** Direct-Creator onboarding consumes the existing overlay through this adapter. */
export const submitCreatorVerification = async () => (await api.post<{ verification: { reference: string; status: string } | null }>("/v1/creator-applications")).data.verification;
export const getCreatorVerificationStatus = async () => (await api.get<{ status: { applicationStatus: string; verificationRevision: number; lifecycle: "DRAFT" | "SUBMITTED" | "QUEUED" | "PROCESSING" | "RETRYING" | "COMPLETED" | "FAILED" | "AWAITING_ADMIN_REVIEW"; capture: { acceptedCaptureCount: number; requiredCaptureCount: number; status: FaceVerificationSessionStatus; expiresAt: string } | null; request: { status: string; reference: string } | null; job: { status: string; attemptCount: number } | null; inference: { completed: boolean; reference: string } | null; adminReviewRequired: boolean } }>("/v1/creator-applications/me/upgrade-verification-status")).data.status;

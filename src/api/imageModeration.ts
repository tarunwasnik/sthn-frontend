import axios from "axios";

import api from "./axios";

export const USER_PROFILE_IMAGE_SURFACES = [
  "USER_PROFILE_AVATAR",
  "USER_PROFILE_COVER",
  "USER_PROFILE_PHOTO",
] as const;

export type UserProfileImageSurface = typeof USER_PROFILE_IMAGE_SURFACES[number];
export type ImageAdmissionDecision = "PASS" | "BLOCK" | "UNAVAILABLE";

export type ImageAdmissionPassResponse = Readonly<{
  decision: "PASS";
  attemptReference: string;
  admissionReference: string;
  assetReference: string;
  expiresAt: string;
  message: string;
}>;

export type ImageAdmissionNonPassResponse = Readonly<{
  decision: "BLOCK" | "UNAVAILABLE";
  attemptReference: string;
  assetReference: string;
  message: string;
}>;

export type ImageAdmissionResponse = ImageAdmissionPassResponse | ImageAdmissionNonPassResponse;

export type TemporaryImageReleaseOutcome = "DELETED" | "ALREADY_MISSING" | "ALREADY_RELEASED" | "PROTECTED" | "PENDING" | "PENDING_RETRY" | "PENDING_RECONCILIATION";
export type TemporaryImageReleaseResponse = Readonly<{ outcome: TemporaryImageReleaseOutcome; message: string }>;

export const submitUserProfileImageAdmission = async (
  file: File,
  surface: UserProfileImageSurface,
  signal?: AbortSignal,
): Promise<ImageAdmissionResponse> => {
  const form = new FormData();
  form.append("file", file);
  form.append("surface", surface);
  return (await api.post<ImageAdmissionResponse>("/v1/image-moderation/admissions", form, { signal })).data;
};

/** Releases only a server-issued temporary asset; provider URLs and IDs never leave the backend. */
export const releaseUserProfileTemporaryImage = async (
  assetReference: string,
  surface: UserProfileImageSurface,
): Promise<TemporaryImageReleaseResponse> =>
  (await api.post<TemporaryImageReleaseResponse>(`/v1/image-moderation/temporary-assets/${encodeURIComponent(assetReference)}/release`, { surface })).data;

export const imageAdmissionErrorMessage = (error: unknown, fallback = "Image moderation could not be completed. Please try again.") => {
  if (axios.isAxiosError(error) && typeof error.response?.data?.message === "string") {
    return error.response.data.message;
  }
  return fallback;
};

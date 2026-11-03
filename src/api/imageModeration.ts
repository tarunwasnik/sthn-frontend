import axios from "axios";

import api from "./axios";

export const USER_PROFILE_IMAGE_SURFACES = [
  "USER_PROFILE_AVATAR",
  "USER_PROFILE_COVER",
  "USER_PROFILE_PHOTO",
] as const;

export const CREATOR_APPLICATION_IMAGE_SURFACES = [
  "CREATOR_APPLICATION_AVATAR",
  "CREATOR_APPLICATION_COVER",
  "CREATOR_APPLICATION_MEDIA",
] as const;

export const CREATOR_PROFILE_IMAGE_SURFACES = [
  "CREATOR_PROFILE_AVATAR",
  "CREATOR_PROFILE_COVER",
  "CREATOR_PROFILE_MEDIA",
] as const;
export const CREATOR_SERVICE_IMAGE_SURFACES = ["CREATOR_SERVICE_MEDIA"] as const;

export type UserProfileImageSurface = typeof USER_PROFILE_IMAGE_SURFACES[number];
export type CreatorApplicationImageSurface = typeof CREATOR_APPLICATION_IMAGE_SURFACES[number];
export type CreatorProfileImageSurface = typeof CREATOR_PROFILE_IMAGE_SURFACES[number];
export type CreatorServiceImageSurface = typeof CREATOR_SERVICE_IMAGE_SURFACES[number];
export type ImageAdmissionSurface = UserProfileImageSurface | CreatorApplicationImageSurface | CreatorProfileImageSurface | CreatorServiceImageSurface;
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
  surface: ImageAdmissionSurface,
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
  surface: ImageAdmissionSurface,
): Promise<TemporaryImageReleaseResponse> =>
  (await api.post<TemporaryImageReleaseResponse>(`/v1/image-moderation/temporary-assets/${encodeURIComponent(assetReference)}/release`, { surface })).data;

export const imageAdmissionErrorMessage = (error: unknown, fallback = "Image moderation could not be completed. Please try again.") => {
  if (axios.isAxiosError(error) && typeof error.response?.data?.message === "string") {
    return error.response.data.message;
  }
  return fallback;
};

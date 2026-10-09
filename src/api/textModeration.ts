import api from "./axios";

export type TextModerationRequest =
  | { domain: "USER_PROFILE"; bio: string; interests: string[] }
  | { domain: "CREATOR_APPLICATION"; publicBio: string; services: string[] };

export type TextModerationField = "bio" | "interests" | "publicBio" | "services";

export interface TextModerationResponse {
  decision: "ALLOW" | "BLOCK" | "UNAVAILABLE";
  category?: "PROFANITY" | "SEXUAL" | "ABUSIVE_OR_HARASSING" | "HATE" | "THREAT_OR_VIOLENCE" | "OTHER_INAPPROPRIATE";
  target?: { field: TextModerationField; itemIndex?: number };
  message: string;
  fingerprint: string;
  admissionToken?: string;
}

export const requestTextModeration = async (
  payload: TextModerationRequest,
  signal?: AbortSignal,
): Promise<TextModerationResponse> => {
  const response = await api.post<TextModerationResponse>("/v1/text-moderation", payload, { signal });
  return response.data;
};

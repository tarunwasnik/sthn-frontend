import { useEffect, useState } from "react";
import api from "../../api/axios";
import type { Conversation } from "../../api/chat";

export interface ChatParticipantIdentity {
  displayName: string;
  avatarUrl: string | null;
}

interface ProfileData {
  displayName?: unknown;
  username?: unknown;
  avatarUrl?: unknown;
  avatar?: unknown;
  profilePhotos?: unknown;
}

const identityFromProfile = (
  profile: unknown,
): ChatParticipantIdentity | null => {
  if (!profile || typeof profile !== "object") return null;

  const data = profile as ProfileData;
  const displayName =
    typeof data.displayName === "string" && data.displayName.trim()
      ? data.displayName
      : typeof data.username === "string" && data.username.trim()
        ? data.username
        : null;

  if (!displayName) return null;

  const avatarUrl =
    typeof data.avatarUrl === "string" && data.avatarUrl
      ? data.avatarUrl
      : typeof data.avatar === "string" && data.avatar
        ? data.avatar
        : Array.isArray(data.profilePhotos) && typeof data.profilePhotos[0] === "string"
          ? data.profilePhotos[0]
          : null;

  return { displayName, avatarUrl };
};

const unknownParticipant: ChatParticipantIdentity = {
  displayName: "Unknown participant",
  avatarUrl: null,
};

export function useChatParticipantIdentity(
  userId: string | null,
  conversation: Conversation | null,
) {
  const [userProfile, setUserProfile] = useState<ChatParticipantIdentity | null>(
    null,
  );
  const [creatorProfile, setCreatorProfile] =
    useState<ChatParticipantIdentity | null>(null);

  useEffect(() => {
    let active = true;

    if (!userId) {
      setUserProfile(null);
      setCreatorProfile(null);
      return () => {
        active = false;
      };
    }

    void Promise.allSettled([
      api.get("/v1/profile/me"),
      api.get("/v1/creator/profile"),
    ]).then(([userResult, creatorResult]) => {
      if (!active) return;

      setUserProfile(
        userResult.status === "fulfilled"
          ? identityFromProfile(userResult.value.data)
          : null,
      );
      setCreatorProfile(
        creatorResult.status === "fulfilled"
          ? identityFromProfile(creatorResult.value.data)
          : null,
      );
    });

    return () => {
      active = false;
    };
  }, [userId]);

  return (senderId: string, senderRole: "USER" | "CREATOR") => {
    if (String(senderId) === String(userId)) {
      return senderRole === "CREATOR"
        ? creatorProfile ?? userProfile ?? unknownParticipant
        : userProfile ?? creatorProfile ?? unknownParticipant;
    }

    if (String(senderId) === String(conversation?.otherUser?._id)) {
      return (
        identityFromProfile(conversation?.otherUser?.profile) ??
        unknownParticipant
      );
    }

    return unknownParticipant;
  };
}

export const getInitials = (displayName: string) => {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);

  return parts.length > 1
    ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    : (parts[0]?.[0] ?? "?").toUpperCase();
};

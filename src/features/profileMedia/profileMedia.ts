import type { ImageAdmissionResponse, UserProfileImageSurface } from "../../api/imageModeration";

export type ProfileMediaClaim = Readonly<
  | { kind: "UNCHANGED"; reference: string }
  | { kind: "ADMISSION"; admissionReference: string }
>;

type ProfileMediaPreview = Readonly<{
  clientId: string;
  operationId: number;
  previewUrl: string;
  ownsPreviewUrl: boolean;
}>;

type TemporaryAssetIdentity = Readonly<{ assetReference?: string }>;

export type ExistingProfileMedia = Readonly<{
  clientId: string;
  operationId: number;
  state: "EXISTING";
  surface: UserProfileImageSurface;
  reference: string;
}>;

export type ApprovedProfileMedia = Readonly<{
  state: "APPROVED";
  surface: UserProfileImageSurface;
  admissionReference: string;
  expiresAt: string;
  sourceFile: File;
} & ProfileMediaPreview & TemporaryAssetIdentity>;

export type PendingProfileMedia = Readonly<{
  state: "UPLOADING" | "MODERATING";
  surface: UserProfileImageSurface;
  sourceFile: File;
} & ProfileMediaPreview & TemporaryAssetIdentity>;

export type BlockedProfileMedia = Readonly<{
  state: "BLOCKED";
  surface: UserProfileImageSurface;
  sourceFile: File;
  message: string;
} & ProfileMediaPreview & TemporaryAssetIdentity>;

export type UnavailableProfileMedia = Readonly<{
  state: "UNAVAILABLE";
  surface: UserProfileImageSurface;
  sourceFile: File;
  message: string;
} & ProfileMediaPreview & TemporaryAssetIdentity>;

export type FailedProfileMedia = Readonly<{
  state: "FAILED";
  surface: UserProfileImageSurface;
  sourceFile: File;
  message: string;
} & ProfileMediaPreview & TemporaryAssetIdentity>;

export type ProfileMediaItem =
  | ExistingProfileMedia
  | ApprovedProfileMedia
  | PendingProfileMedia
  | BlockedProfileMedia
  | UnavailableProfileMedia
  | FailedProfileMedia;

let nextClientMediaId = 0;
const newClientMediaId = () => `profile-media-${Date.now().toString(36)}-${++nextClientMediaId}`;
const nextOperationId = (item: ProfileMediaItem) => item.operationId + 1;

export type ProfileMediaRequest = Readonly<{
  avatar?: ProfileMediaClaim;
  cover?: ProfileMediaClaim;
  profilePhotos?: readonly ProfileMediaClaim[];
}>;

export type PersistedProfileMedia = Readonly<{
  avatar?: string | null;
  cover?: string | null;
  profilePhotos?: readonly string[] | null;
}>;

export class ProfileMediaClaimError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProfileMediaClaimError";
  }
}

const galleryRange = (items: readonly ProfileMediaItem[]) => {
  if (items.length < 2 || items.length > 6) {
    throw new ProfileMediaClaimError("Profile gallery must contain between 2 and 6 images.");
  }
};

const parseExpiry = (expiresAt: string) => {
  const expiresAtMs = Date.parse(expiresAt);
  if (Number.isNaN(expiresAtMs)) throw new ProfileMediaClaimError("Image admission expiry is invalid.");
  return expiresAtMs;
};

export const isProfileMediaAdmissionExpired = (item: ProfileMediaItem, now = Date.now()) =>
  item.state === "APPROVED" && parseExpiry(item.expiresAt) <= now;

export const createProfileMediaSelection = (file: File, surface: UserProfileImageSurface): PendingProfileMedia => ({
  clientId: newClientMediaId(),
  operationId: 1,
  state: "UPLOADING",
  surface,
  sourceFile: file,
  previewUrl: URL.createObjectURL(file),
  ownsPreviewUrl: true,
});

/** Converts only server-returned, persisted references into reusable UNCHANGED media state. */
export const restorePersistedProfileMedia = (media: PersistedProfileMedia) => ({
  avatar: media.avatar ? ({ clientId: newClientMediaId(), operationId: 0, state: "EXISTING", surface: "USER_PROFILE_AVATAR", reference: media.avatar } satisfies ExistingProfileMedia) : null,
  cover: media.cover ? ({ clientId: newClientMediaId(), operationId: 0, state: "EXISTING", surface: "USER_PROFILE_COVER", reference: media.cover } satisfies ExistingProfileMedia) : null,
  profilePhotos: (media.profilePhotos ?? []).map((reference) =>
    ({ clientId: newClientMediaId(), operationId: 0, state: "EXISTING", surface: "USER_PROFILE_PHOTO", reference } satisfies ExistingProfileMedia)),
});

export const markProfileMediaModerating = (item: PendingProfileMedia): PendingProfileMedia => ({
  ...item,
  state: "MODERATING",
});

export const resolveProfileMediaAdmission = (
  item: PendingProfileMedia,
  response: ImageAdmissionResponse,
): ProfileMediaItem => {
  if (response.decision === "PASS") {
    return {
      ...item,
      state: "APPROVED",
      assetReference: response.assetReference,
      admissionReference: response.admissionReference,
      expiresAt: response.expiresAt,
    };
  }
  if (response.decision === "BLOCK") {
    return { ...item, state: "BLOCKED", assetReference: response.assetReference, message: response.message };
  }
  return { ...item, state: "UNAVAILABLE", assetReference: response.assetReference, message: response.message };
};

export const failProfileMediaSelection = (item: PendingProfileMedia, message: string): FailedProfileMedia => ({
  ...item,
  state: "FAILED",
  message,
});

export const retryProfileMediaSelection = (item: UnavailableProfileMedia | FailedProfileMedia): PendingProfileMedia => ({
  ...item,
  assetReference: undefined,
  operationId: nextOperationId(item),
  state: "UPLOADING",
});

/** Returns only the opaque temporary identity issued by the backend, never a provider URL. */
export const temporaryProfileMediaRelease = (item: ProfileMediaItem): Readonly<{ assetReference: string; surface: UserProfileImageSurface }> | null =>
  item.state !== "EXISTING" && item.assetReference ? { assetReference: item.assetReference, surface: item.surface } : null;

/** Replaces a slot while invalidating every outstanding result for its prior selection. */
export const replaceProfileMediaSelection = (item: ProfileMediaItem, file: File): PendingProfileMedia => ({
  ...createProfileMediaSelection(file, item.surface),
  clientId: item.clientId,
  operationId: nextOperationId(item),
});

export const isCurrentProfileMediaOperation = (current: ProfileMediaItem, expected: ProfileMediaItem) =>
  Boolean(current.clientId && expected.clientId)
  && current.clientId === expected.clientId
  && current.operationId === expected.operationId;

/** Updates only the exact active item/attempt; removed, replaced, and retried items are ignored. */
export const updateProfileMediaOperation = (
  items: readonly ProfileMediaItem[],
  expected: ProfileMediaItem,
  next: ProfileMediaItem,
) => items.map((item) => isCurrentProfileMediaOperation(item, expected) ? next : item);

export const sharesProfileMediaPreview = (left: ProfileMediaItem, right: ProfileMediaItem) =>
  left.state !== "EXISTING" && right.state !== "EXISTING" && left.previewUrl === right.previewUrl;

export const toProfileMediaClaim = (item: ProfileMediaItem, now = Date.now()): ProfileMediaClaim => {
  if (item.state === "EXISTING") return { kind: "UNCHANGED", reference: item.reference };
  if (item.state === "APPROVED") {
    if (isProfileMediaAdmissionExpired(item, now)) {
      throw new ProfileMediaClaimError("Image admission has expired. Upload the image again.");
    }
    return { kind: "ADMISSION", admissionReference: item.admissionReference };
  }
  throw new ProfileMediaClaimError("Image moderation must approve every selected image before it can be saved.");
};

export const toProfileMediaRequest = (
  input: Readonly<{
    avatar?: ProfileMediaItem;
    cover?: ProfileMediaItem;
    profilePhotos?: readonly ProfileMediaItem[];
  }>,
  now = Date.now(),
): ProfileMediaRequest => {
  const result: {
    avatar?: ProfileMediaClaim;
    cover?: ProfileMediaClaim;
    profilePhotos?: readonly ProfileMediaClaim[];
  } = {};
  if (input.avatar !== undefined) result.avatar = toProfileMediaClaim(input.avatar, now);
  if (input.cover !== undefined) result.cover = toProfileMediaClaim(input.cover, now);
  if (input.profilePhotos !== undefined) {
    galleryRange(input.profilePhotos);
    result.profilePhotos = input.profilePhotos.map((item) => toProfileMediaClaim(item, now));
  }
  return result;
};

export const replaceProfileMedia = (_current: ProfileMediaItem | undefined, replacement: ProfileMediaItem) => replacement;

export const replaceProfileGalleryMedia = (
  items: readonly ProfileMediaItem[],
  index: number,
  replacement: ProfileMediaItem,
) => {
  if (!Number.isInteger(index) || index < 0 || index >= items.length) throw new ProfileMediaClaimError("Gallery image index is invalid.");
  return items.map((item, itemIndex) => itemIndex === index ? replacement : item);
};

export const appendProfileGalleryMedia = (items: readonly ProfileMediaItem[], item: ProfileMediaItem) => {
  if (items.length >= 6) throw new ProfileMediaClaimError("Profile gallery cannot contain more than 6 images.");
  return [...items, item];
};

export const removeProfileGalleryMedia = (items: readonly ProfileMediaItem[], index: number) => {
  if (!Number.isInteger(index) || index < 0 || index >= items.length) throw new ProfileMediaClaimError("Gallery image index is invalid.");
  const next = items.filter((_, itemIndex) => itemIndex !== index);
  galleryRange(next);
  return next;
};

export const disposeProfileMediaPreview = (item: ProfileMediaItem) => {
  if (item.state !== "EXISTING" && item.ownsPreviewUrl) URL.revokeObjectURL(item.previewUrl);
};

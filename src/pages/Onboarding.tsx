// frontend/src/pages/Onboarding.tsx

import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import api from "../api/axios";
import { isFaceVerificationRecoveryError, type FaceVerificationSessionDto } from "../api/faceVerification";
import { imageAdmissionErrorMessage, releaseUserProfileTemporaryImage, submitUserProfileImageAdmission, type ImageAdmissionSurface } from "../api/imageModeration";
import { useAuth } from "../hooks/useAuth";
import FaceVerificationOverlay from "../components/faceVerification/FaceVerificationOverlay";
import {
  appendProfileGalleryMedia,
  createProfileMediaSelection,
  disposeProfileMediaPreview,
  failProfileMediaSelection,
  isProfileMediaAdmissionExpired,
  markProfileMediaModerating,
  ProfileMediaClaimError,
  resolveProfileMediaAdmission,
  restorePersistedProfileMedia,
  retryProfileMediaSelection,
  replaceProfileMediaSelection,
  sharesProfileMediaPreview,
  profileMediaStatusClassName,
  type ProfileMediaItem,
  temporaryProfileMediaRelease,
  toProfileMediaRequest,
  updateProfileMediaOperation,
} from "../features/profileMedia/profileMedia";
type ProfileResponse = {
  username: string; realName?: string | null; dateOfBirth?: string; mobileCountryCode?: string | null;
  mobileNumber?: string | null; country?: string | null; city?: string | null; languages?: string[];
  bio?: string; interests?: string[]; avatar?: string; cover?: string; profilePhotos?: string[];
  profileStatus?: string; rejectionReason?: string | null;
};

type CompletedFaceVerification = Readonly<{
  candidateKey: string;
  sessionReference: string;
  expiresAt: string;
}>;

const mediaPreview = (item: ProfileMediaItem | null) => item && item.state !== "EXISTING" ? item.previewUrl : item?.state === "EXISTING" ? item.reference : null;
const mediaMessage = (item: ProfileMediaItem | null) => {
  if (!item) return null;
  if (item.state === "UPLOADING") return "Uploading image…";
  if (item.state === "MODERATING") return "Checking image…";
  if (item.state === "BLOCKED" || item.state === "UNAVAILABLE" || item.state === "FAILED") return item.message;
  return item.state === "APPROVED" ? "Image approved. Save the draft before face verification." : null;
};

const Onboarding = () => {
  const navigate = useNavigate();
  const { bootstrap } = useAuth();

  const [username, setUsername] = useState("");
  const [realName, setRealName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [mobileCountryCode, setMobileCountryCode] = useState("+91");
  const [mobileNumber, setMobileNumber] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [languages, setLanguages] = useState("");
  const [bio, setBio] = useState("");
  const [interests, setInterests] = useState("");

  const [incompleteAvatar, setIncompleteAvatar] = useState<ProfileMediaItem | null>(null);
  const [incompleteCover, setIncompleteCover] = useState<ProfileMediaItem | null>(null);
  const [incompleteGallery, setIncompleteGallery] = useState<ProfileMediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [faceVerificationOpen, setFaceVerificationOpen] = useState(false);
  const [completedFaceVerification, setCompletedFaceVerification] = useState<CompletedFaceVerification | null>(null);
  const [faceVerificationRecoveryAvailable, setFaceVerificationRecoveryAvailable] = useState(false);
  const [isRejectedResubmission, setIsRejectedResubmission] = useState(false);
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const formRef = useRef<HTMLFormElement>(null);
  const avatarAdmissionVersion = useRef(0);
  const coverAdmissionVersion = useRef(0);
  const galleryAdmissions = useRef(new Map<string, AbortController>());
  const mediaRef = useRef<{ avatar: ProfileMediaItem | null; cover: ProfileMediaItem | null; gallery: ProfileMediaItem[] }>({ avatar: null, cover: null, gallery: [] });
  mediaRef.current = { avatar: incompleteAvatar, cover: incompleteCover, gallery: incompleteGallery };
  const faceAvatar = mediaPreview(incompleteAvatar);
  const faceCandidateKey = incompleteAvatar?.state === "EXISTING" ? `UNCHANGED:${incompleteAvatar.reference}` : incompleteAvatar?.state === "APPROVED" ? `ADMISSION:${incompleteAvatar.admissionReference}` : null;
  const completedFaceVerificationExpiry = completedFaceVerification ? Date.parse(completedFaceVerification.expiresAt) : null;
  const completedFaceVerificationExpired = completedFaceVerification !== null
    && (completedFaceVerificationExpiry === null || Number.isNaN(completedFaceVerificationExpiry) || completedFaceVerificationExpiry <= Date.now());
  const faceCaptureComplete = Boolean(faceCandidateKey && completedFaceVerification?.candidateKey === faceCandidateKey && !completedFaceVerificationExpired);

  const clearCompletedFaceVerification = useCallback((message: string, recoveryAvailable = false) => {
    setCompletedFaceVerification(null);
    setFaceVerificationOpen(false);
    setFaceVerificationRecoveryAvailable(recoveryAvailable);
    setError(message);
  }, []);

  const releaseDiscardedTemporaryMedia = useCallback((item: ProfileMediaItem | null, reportFailure = true) => {
    if (!item) return;
    const release = temporaryProfileMediaRelease(item);
    if (!release) return;
    void releaseUserProfileTemporaryImage(release.assetReference, release.surface).catch(() => {
      if (reportFailure) setError("The image was removed, but secure cleanup is pending and will be retried safely.");
    });
  }, []);

  const galleryAdmissionKey = (item: Pick<ProfileMediaItem, "clientId" | "operationId">) => `${item.clientId}:${item.operationId}`;

  const abortGalleryAdmission = (item: ProfileMediaItem | undefined) => {
    if (!item) return;
    const key = galleryAdmissionKey(item);
    const controller = galleryAdmissions.current.get(key);
    if (!controller) return;
    controller.abort();
    galleryAdmissions.current.delete(key);
  };

  useEffect(() => {
    if (!completedFaceVerification) return;
    if (!faceCandidateKey || completedFaceVerification.candidateKey !== faceCandidateKey) {
      clearCompletedFaceVerification("Your avatar changed. Complete a fresh live face verification before submitting.");
      return;
    }
    if (incompleteAvatar?.state === "APPROVED" && isProfileMediaAdmissionExpired(incompleteAvatar)) {
      clearCompletedFaceVerification("Your replacement avatar admission expired. Upload it again, then complete a fresh live face verification.");
      return;
    }
    const expiresAt = Date.parse(completedFaceVerification.expiresAt);
    if (Number.isNaN(expiresAt) || expiresAt <= Date.now()) {
      clearCompletedFaceVerification("Your face verification session expired. Start a new session and complete all five captures.", true);
      return;
    }
    const timer = window.setTimeout(() => {
      clearCompletedFaceVerification("Your face verification session expired. Start a new session and complete all five captures.", true);
    }, expiresAt - Date.now());
    return () => window.clearTimeout(timer);
  }, [clearCompletedFaceVerification, completedFaceVerification, faceCandidateKey, incompleteAvatar]);

  useEffect(() => () => {
    galleryAdmissions.current.forEach((controller) => controller.abort());
    galleryAdmissions.current.clear();
    const media = mediaRef.current;
    if (media.avatar) disposeProfileMediaPreview(media.avatar);
    if (media.cover) disposeProfileMediaPreview(media.cover);
    media.gallery.forEach(disposeProfileMediaPreview);
  }, []);

  useEffect(() => {
    let active = true;
    const loadExistingProfile = async () => {
      try {
        const { data } = await api.get<ProfileResponse>("/v1/profile/me");
        if (!active) return;
        if (data.profileStatus === "pending_verification") {
          navigate("/profile", { replace: true });
          return;
        }
        if (data.profileStatus === "verified") {
          navigate("/dashboard/user", { replace: true });
          return;
        }
        if (data.profileStatus !== "rejected" && data.profileStatus !== "incomplete") return;
        if (data.profileStatus === "rejected") {
          setIsRejectedResubmission(true);
          setRejectionReason(data.rejectionReason ?? null);
          const restored = restorePersistedProfileMedia(data);
          setIncompleteAvatar(restored.avatar); setIncompleteCover(restored.cover); setIncompleteGallery(restored.profilePhotos);
        } else {
          const restored = restorePersistedProfileMedia(data);
          setIncompleteAvatar(restored.avatar);
          setIncompleteCover(restored.cover);
          setIncompleteGallery(restored.profilePhotos);
        }
        setUsername(data.username ?? "");
        setRealName(data.realName ?? "");
        setDateOfBirth(data.dateOfBirth?.split("T")[0] ?? "");
        setMobileCountryCode(data.mobileCountryCode ?? "+91");
        setMobileNumber(data.mobileNumber ?? "");
        setCountry(data.country ?? ""); setCity(data.city ?? "");
        setLanguages((data.languages ?? []).join(", "));
        setBio(data.bio ?? ""); setInterests((data.interests ?? []).join(", "));
      } catch (caught) {
        if (!axios.isAxiosError(caught) || caught.response?.status !== 404) setError("Unable to load your profile for onboarding.");
      } finally {
        if (active) setProfileLoading(false);
      }
    };
    void loadExistingProfile();
    return () => { active = false; };
  }, [navigate]);

  const admitIncompleteMedia = async (
    file: File,
    surface: ImageAdmissionSurface,
    apply: (item: ProfileMediaItem) => void,
    isCurrent: () => boolean,
  ) => {
    const selection = createProfileMediaSelection(file, surface);
    if (isCurrent()) apply(selection);
    try {
      const moderating = markProfileMediaModerating(selection);
      if (isCurrent()) apply(moderating);
      const resolved = resolveProfileMediaAdmission(moderating, await submitUserProfileImageAdmission(file, surface));
      if (isCurrent()) apply(resolved); else { disposeProfileMediaPreview(resolved); releaseDiscardedTemporaryMedia(resolved, false); }
    } catch (caught) {
      const failed = failProfileMediaSelection(selection, imageAdmissionErrorMessage(caught));
      if (isCurrent()) apply(failed); else disposeProfileMediaPreview(failed);
    }
  };

  const setIncompleteAvatarSelection = (next: ProfileMediaItem) => {
    setIncompleteAvatar((current) => {
      if (current && current !== next && !sharesProfileMediaPreview(current, next)) {
        disposeProfileMediaPreview(current);
      }
      return next;
    });
  };

  const setIncompleteCoverSelection = (next: ProfileMediaItem) => {
    setIncompleteCover((current) => {
      if (current && current !== next && !sharesProfileMediaPreview(current, next)) {
        disposeProfileMediaPreview(current);
      }
      return next;
    });
  };

  const handleAvatarChange = async (file: File) => {
    setCompletedFaceVerification(null);
    const discarded = mediaRef.current.avatar;
    const version = ++avatarAdmissionVersion.current;
    releaseDiscardedTemporaryMedia(discarded);
    await admitIncompleteMedia(file, "USER_PROFILE_AVATAR", setIncompleteAvatarSelection, () => avatarAdmissionVersion.current === version);
  };

  const handleCoverChange = async (file: File) => {
    const discarded = mediaRef.current.cover;
    const version = ++coverAdmissionVersion.current;
    releaseDiscardedTemporaryMedia(discarded);
    await admitIncompleteMedia(file, "USER_PROFILE_COVER", setIncompleteCoverSelection, () => coverAdmissionVersion.current === version);
  };

  const admitGallerySelection = (selection: ProfileMediaItem) => {
    if (selection.state !== "UPLOADING") return;
    const key = galleryAdmissionKey(selection);
    if (galleryAdmissions.current.has(key)) return;
    const controller = new AbortController();
    galleryAdmissions.current.set(key, controller);
    void (async () => {
      let moderating = selection;
      try {
        moderating = markProfileMediaModerating(selection);
        setIncompleteGallery((current) => updateProfileMediaOperation(current, selection, moderating));
        const resolved = resolveProfileMediaAdmission(moderating, await submitUserProfileImageAdmission(selection.sourceFile, "USER_PROFILE_PHOTO", controller.signal));
        const current = mediaRef.current.gallery.some((item) => item.clientId === moderating.clientId && item.operationId === moderating.operationId);
        if (current) setIncompleteGallery((items) => updateProfileMediaOperation(items, moderating, resolved));
        else { disposeProfileMediaPreview(resolved); releaseDiscardedTemporaryMedia(resolved, false); }
      } catch (caught) {
        const failed = failProfileMediaSelection(moderating, imageAdmissionErrorMessage(caught));
        setIncompleteGallery((current) => updateProfileMediaOperation(current, moderating, failed));
      } finally {
        if (galleryAdmissions.current.get(key) === controller) galleryAdmissions.current.delete(key);
      }
    })();
  };

  /* GALLERY UPLOAD */
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (mediaRef.current.gallery.length >= 6) {
      setError("Maximum 6 photos allowed.");
      return;
    }
    setError("");
    const selection = createProfileMediaSelection(file, "USER_PROFILE_PHOTO");
    mediaRef.current = { ...mediaRef.current, gallery: [...mediaRef.current.gallery, selection] };
    setIncompleteGallery((current) => appendProfileGalleryMedia(current, selection));
    admitGallerySelection(selection);
  };

  /* REMOVE IMAGE */
  const handleRemove = (index: number) => {
    const discarded = mediaRef.current.gallery[index];
    abortGalleryAdmission(discarded);
    releaseDiscardedTemporaryMedia(discarded);
    mediaRef.current = { ...mediaRef.current, gallery: mediaRef.current.gallery.filter((_, itemIndex) => itemIndex !== index) };
    setIncompleteGallery((current) => {
      const item = current[index];
      if (!item) return current;
      disposeProfileMediaPreview(item);
      return current.filter((_, itemIndex) => itemIndex !== index);
    });
  };

  const replaceIncompleteGalleryImage = (index: number, file: File) => {
    const currentItem = incompleteGallery[index];
    if (!currentItem) return;
    abortGalleryAdmission(currentItem);
    const selection = replaceProfileMediaSelection(currentItem, file);
    releaseDiscardedTemporaryMedia(currentItem);
    mediaRef.current = { ...mediaRef.current, gallery: mediaRef.current.gallery.map((item, itemIndex) => itemIndex === index ? selection : item) };
    setIncompleteGallery((current) => current.map((item, itemIndex) => {
      if (itemIndex !== index) return item;
      if (!sharesProfileMediaPreview(item, selection)) disposeProfileMediaPreview(item);
      return selection;
    }));
    admitGallerySelection(selection);
  };

  /* SUBMIT */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (loading) return;

    let profileMedia;
    try {
      if (!incompleteAvatar || !incompleteCover) throw new ProfileMediaClaimError("Avatar and cover are required.");
      profileMedia = toProfileMediaRequest({ avatar: incompleteAvatar, cover: incompleteCover, profilePhotos: incompleteGallery });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Finish image moderation before submitting.");
      return;
    }

    if (completedFaceVerificationExpired) {
      clearCompletedFaceVerification("Your face verification session expired. Start a new session and complete all five captures.", true);
      return;
    }

    if (!faceCaptureComplete) {
      setError("Complete live face verification for the current avatar before submitting.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const { data } = await api.post<{ profile?: ProfileResponse }>("/v1/profile/me", {
        username,
        realName,
        dateOfBirth,
        mobileCountryCode,
        mobileNumber,
        country,
        city,
        languages: languages
          .split(",")
          .map((language) => language.trim())
          .filter(Boolean),
        bio,
        interests: interests
          .split(",")
          .map((i) => i.trim())
          .filter(Boolean),
        ...profileMedia,
      });

      if (data.profile) replaceConsumedIncompleteAdmissions(data.profile);
      setCompletedFaceVerification(null);

      const entry = await bootstrap();

      if (!entry?.entryRoute) {
        throw new Error("Unable to refresh account access after profile submission");
      }

      navigate(entry.entryRoute, { replace: true });

    } catch (err: unknown) {
      if (isFaceVerificationRecoveryError(err)) {
        clearCompletedFaceVerification("Your face verification is no longer current. Start a new session and complete all five captures before submitting.", true);
        return;
      }
      const responseData = axios.isAxiosError(err) ? err.response?.data : undefined;
      setError(
        (typeof responseData?.message === "string" && responseData.message) ||
        "Failed to submit profile"
      );
    } finally {
      setLoading(false);
    }
  };

  const incompleteOnboardingPayload = () => {
    if (!incompleteAvatar || !incompleteCover) throw new ProfileMediaClaimError("Avatar and cover are required.");
    return {
      username, realName, dateOfBirth, mobileCountryCode, mobileNumber, country, city,
      languages: languages.split(",").map((language) => language.trim()).filter(Boolean),
      bio, interests: interests.split(",").map((interest) => interest.trim()).filter(Boolean),
      ...toProfileMediaRequest({ avatar: incompleteAvatar, cover: incompleteCover, profilePhotos: incompleteGallery }),
    };
  };

  const replaceConsumedIncompleteAdmissions = (profile: ProfileResponse) => {
    const restored = restorePersistedProfileMedia(profile);
    setIncompleteAvatar((current) => {
      if (current) disposeProfileMediaPreview(current);
      return restored.avatar;
    });
    setIncompleteCover((current) => {
      if (current) disposeProfileMediaPreview(current);
      return restored.cover;
    });
    setIncompleteGallery((current) => {
      current.forEach(disposeProfileMediaPreview);
      return restored.profilePhotos;
    });
  };

  const beginFaceVerification = async () => {
    if (!formRef.current?.reportValidity()) return;
    try {
      // Claim conversion is the admission gate and rejects expired, pending, blocked, unavailable, and failed media.
      incompleteOnboardingPayload();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Finish image moderation before face verification.");
      return;
    }
    setError(""); setLoading(true);
    try {
      if (!isRejectedResubmission) {
        const { data } = await api.put<{ profile: ProfileResponse }>("/v1/profile/me/draft", incompleteOnboardingPayload());
        replaceConsumedIncompleteAdmissions(data.profile);
        setCompletedFaceVerification(null);
      }
      setFaceVerificationRecoveryAvailable(false);
      setFaceVerificationOpen(true);
    } catch (err: unknown) {
      const responseData = axios.isAxiosError(err) ? err.response?.data : undefined;
      setError((typeof responseData?.message === "string" && responseData.message) || "Unable to save your onboarding draft.");
    } finally {
      setLoading(false);
    }
  };

  if (profileLoading) return <div className="min-h-screen grid place-items-center bg-theme-bg text-theme-muted">Loading profile…</div>;

  const avatarPreviewSource = mediaPreview(incompleteAvatar);
  const coverPreviewSource = mediaPreview(incompleteCover);
  const galleryItems = incompleteGallery;
  const rejectedFaceCandidate = isRejectedResubmission && incompleteAvatar?.state === "EXISTING"
    ? { kind: "UNCHANGED" as const, reference: incompleteAvatar.reference }
    : isRejectedResubmission && incompleteAvatar?.state === "APPROVED"
      ? { kind: "ADMISSION" as const, admissionReference: incompleteAvatar.admissionReference }
    : undefined;

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-theme-bg px-4 text-theme-text">

      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[400px] w-[600px] -translate-x-1/2 rounded-full bg-theme-accent-tint blur-[120px] md:h-[600px] md:w-[900px] md:blur-[150px]" />
      </div>

      <div className="w-full max-w-lg rounded-[var(--radius-card)] border border-theme-border bg-theme-surface p-6 [&_input:not([type=file])]:border [&_input:not([type=file])]:border-theme-border [&_input:not([type=file])]:bg-theme-inset [&_input:not([type=file])]:text-theme-text [&_input:not([type=file])]:placeholder:text-theme-muted [&_input:not([type=file])]:focus-visible:outline [&_input:not([type=file])]:focus-visible:outline-2 [&_input:not([type=file])]:focus-visible:outline-offset-2 [&_input:not([type=file])]:focus-visible:outline-theme-accent [&_textarea]:border [&_textarea]:border-theme-border [&_textarea]:bg-theme-inset [&_textarea]:text-theme-text [&_textarea]:placeholder:text-theme-muted [&_textarea]:focus-visible:outline [&_textarea]:focus-visible:outline-2 [&_textarea]:focus-visible:outline-offset-2 [&_textarea]:focus-visible:outline-theme-accent md:p-8">

        <h2 className="text-2xl font-bold mb-2">
          {isRejectedResubmission ? "Resubmit Your Profile for Verification" : "Complete Your Profile"}
        </h2>

        <p className="mb-6 text-sm text-theme-muted">
          {isRejectedResubmission ? "Your profile details were retained. Complete a fresh live face verification before resubmitting." : "Submit your profile for verification"}
        </p>

        {isRejectedResubmission && (
          <div className="mb-4 rounded-[var(--radius-control)] border border-theme-warning bg-theme-warning-tint p-3 text-sm text-theme-warning">
            <p className="font-medium">Your previous verification needs changes.</p>
            {rejectionReason && <p className="mt-1">{rejectionReason}</p>}
            <p className="mt-1">Your profile data is retained, but a new live face verification is required for this resubmission.</p>
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-[var(--radius-control)] border border-theme-danger bg-theme-danger-tint p-3 text-sm text-theme-danger">
            {error}
            {faceVerificationRecoveryAvailable && (
              <button type="button" onClick={beginFaceVerification} disabled={loading} className="mt-3 block rounded-[var(--radius-control)] border border-theme-danger px-3 py-2 text-sm font-medium text-theme-danger disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent">
                Start a new session
              </button>
            )}
          </div>
        )}

        <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col space-y-5">

          {/* Username */}
          <input
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            disabled={isRejectedResubmission}
            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
          />

          <div>
            <input required value={realName} onChange={(e) => setRealName(e.target.value)} placeholder="Real name" className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white" />
            <p className="mt-1 text-xs text-gray-400">Private — used for account purposes and not shown publicly.</p>
          </div>

          {/* DOB */}
          <input
            type="date"
            required
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
          />
          <p className="-mt-3 text-xs text-gray-400">Private — only your age is shown on your public profile.</p>

          <div className="grid grid-cols-3 gap-3">
            <input required value={mobileCountryCode} onChange={(e) => setMobileCountryCode(e.target.value)} placeholder="+91" className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white" />
            <input required value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} placeholder="Mobile number" className="col-span-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white" />
          </div>
          <p className="-mt-3 text-xs text-gray-400">Private — used for important account, booking, wallet, and security notifications. It is not shown publicly.</p>

          <div className="grid grid-cols-2 gap-3">
            <input required value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Country" className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white" />
            <input required value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white" />
          </div>
          <p className="-mt-3 text-xs text-gray-400">Public — shown on your profile.</p>

          <div>
            <input required value={languages} onChange={(e) => setLanguages(e.target.value)} placeholder="Languages, separated by commas" className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white" />
            <p className="mt-1 text-xs text-gray-400">Public — helps Creators understand communication compatibility.</p>
          </div>

          {/* Bio */}
          <textarea
            required
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Bio"
            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
          />

          {/* Interests */}
          <input
            value={interests}
            onChange={(e) => setInterests(e.target.value)}
            placeholder="Photography, Music..."
            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
          />

          {/* AVATAR */}
          <div className="order-[-3]">
            <label className="text-sm text-gray-300 mb-1 block">
              Avatar
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleAvatarChange(file);
              }}
            />
            {avatarPreviewSource && (
  <div className="relative w-20 h-20 mt-2">
    <img
      src={avatarPreviewSource}
      className={`w-20 h-20 object-cover rounded-full ${profileMediaStatusClassName(incompleteAvatar)}`}
    />

    <button
      type="button"
      onClick={() => {
        ++avatarAdmissionVersion.current;
        releaseDiscardedTemporaryMedia(incompleteAvatar);
        if (incompleteAvatar) disposeProfileMediaPreview(incompleteAvatar);
        setIncompleteAvatar(null);
        setCompletedFaceVerification(null);
      }}
      className="absolute top-0 right-0 bg-black/60 text-white text-xs px-1 rounded"
    >
      ✕
    </button>
  </div>
)}
            {mediaMessage(incompleteAvatar) && (
              <p className={`mt-1 text-xs ${incompleteAvatar?.state === "BLOCKED" ? "text-red-400" : "text-gray-400"}`}>{mediaMessage(incompleteAvatar)}</p>
            )}
            {(incompleteAvatar?.state === "FAILED" || incompleteAvatar?.state === "UNAVAILABLE") && (
              <button type="button" className="mt-1 text-xs text-teal-300 underline" onClick={() => {
                releaseDiscardedTemporaryMedia(incompleteAvatar);
                const retry = retryProfileMediaSelection(incompleteAvatar);
                setCompletedFaceVerification(null);
                const version = ++avatarAdmissionVersion.current;
                void admitIncompleteMedia(retry.sourceFile, retry.surface, setIncompleteAvatarSelection, () => avatarAdmissionVersion.current === version);
              }}>Retry avatar</button>
            )}
          </div>

          {/* COVER */}
          <div className="order-[-2]">
            <label className="text-sm text-gray-300 mb-1 block">
              Cover
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleCoverChange(file);
              }}
            />
            {coverPreviewSource && (
  <div className="relative mt-2">
    <img
      src={coverPreviewSource}
      className={`w-full h-24 object-cover rounded-lg ${profileMediaStatusClassName(incompleteCover)}`}
    />

    <button
      type="button"
      onClick={() => {
        ++coverAdmissionVersion.current;
        releaseDiscardedTemporaryMedia(incompleteCover);
        if (incompleteCover) disposeProfileMediaPreview(incompleteCover);
        setIncompleteCover(null);
      }}
      className="absolute top-1 right-1 bg-black/60 text-white text-xs px-1 rounded"
    >
      ✕
    </button>
  </div>
)}
            {mediaMessage(incompleteCover) && (
              <p className={`mt-1 text-xs ${incompleteCover?.state === "BLOCKED" ? "text-red-400" : "text-gray-400"}`}>{mediaMessage(incompleteCover)}</p>
            )}
            {(incompleteCover?.state === "FAILED" || incompleteCover?.state === "UNAVAILABLE") && (
              <button type="button" className="mt-1 text-xs text-teal-300 underline" onClick={() => {
                releaseDiscardedTemporaryMedia(incompleteCover);
                const retry = retryProfileMediaSelection(incompleteCover);
                const version = ++coverAdmissionVersion.current;
                void admitIncompleteMedia(retry.sourceFile, retry.surface, setIncompleteCoverSelection, () => coverAdmissionVersion.current === version);
              }}>Retry cover</button>
            )}
          </div>

          {/* GALLERY */}
          <div className="order-[-1]">
            <label className="text-sm text-gray-300 mb-2 block">
              Profile Photos (2–6 required)
            </label>

            <input
              type="file"
              accept="image/*"
              aria-label="Add one gallery photo"
              disabled={galleryItems.length >= 6}
              onChange={handleFileChange}
            />

            {galleryItems.length > 0 && (
              <div className="grid grid-cols-3 gap-3 mt-4">
                {galleryItems.map((item, index) => (
                  <div key={item.clientId} className="relative">
                    <img src={mediaPreview(item) ?? ""} className={`w-full h-24 object-cover rounded-lg ${profileMediaStatusClassName(item)}`} />
                    <button type="button" onClick={() => handleRemove(index)} className="absolute top-1 right-1 bg-black/60 text-white text-xs px-1 rounded">✕</button>
                    {mediaMessage(item) && <p className={`mt-1 text-xs ${item.state === "BLOCKED" ? "text-red-400" : "text-gray-400"}`}>{mediaMessage(item)}</p>}
                    <label className="mt-1 block text-xs text-teal-300 underline cursor-pointer">
                      Replace
                      <input className="sr-only" type="file" accept="image/*" onChange={(event) => {
                        const replacement = event.target.files?.[0];
                        if (replacement) replaceIncompleteGalleryImage(index, replacement);
                        event.target.value = "";
                      }} />
                    </label>
                    {(item.state === "FAILED" || item.state === "UNAVAILABLE") && (
                      <button type="button" className="text-xs text-teal-300 underline" onClick={() => {
                        releaseDiscardedTemporaryMedia(item);
                        const retry = retryProfileMediaSelection(item);
                        mediaRef.current = { ...mediaRef.current, gallery: mediaRef.current.gallery.map((current) => current.clientId === item.clientId ? retry : current) };
                        setIncompleteGallery((current) => updateProfileMediaOperation(current, item, retry));
                        admitGallerySelection(retry);
                      }}>Retry image</button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type={faceCaptureComplete ? "submit" : "button"}
            onClick={faceCaptureComplete ? undefined : beginFaceVerification}
            disabled={loading}
            className="w-full rounded-[var(--radius-control)] bg-theme-primary py-3 font-semibold text-theme-primary-text transition-opacity hover:opacity-90 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent"
          >
            {loading ? "Submitting..." : faceCaptureComplete ? "Submit Profile" : "Face Verification"}
          </button>

        </form>
      </div>
      {faceVerificationOpen && faceAvatar && (
        <FaceVerificationOverlay
          avatar={faceAvatar}
          candidateAvatar={rejectedFaceCandidate}
          onComplete={(session: FaceVerificationSessionDto) => {
            if (faceCandidateKey) {
              setCompletedFaceVerification({ candidateKey: faceCandidateKey, sessionReference: session.sessionReference, expiresAt: session.expiresAt });
              setFaceVerificationRecoveryAvailable(false);
              setError("");
            }
            setFaceVerificationOpen(false);
          }}
          onClose={() => setFaceVerificationOpen(false)}
        />
      )}
    </div>
  );
};

export default Onboarding;

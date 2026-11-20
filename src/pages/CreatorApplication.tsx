// frontend/src/pages/CreatorApplication.tsx

import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useToast } from "../hooks/useToast";
import { useStatusRefresh } from "../hooks/useStatusRefresh";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";
import { currencies } from "../constants/currencies";
import { imageAdmissionErrorMessage, releaseUserProfileTemporaryImage, submitUserProfileImageAdmission } from "../api/imageModeration";
import { createProfileMediaSelection, disposeProfileMediaPreview, isCurrentProfileMediaOperation, markProfileMediaModerating, profileMediaStatusClassName, resolveProfileMediaAdmission, temporaryProfileMediaRelease, toProfileMediaClaim, type ProfileMediaItem } from "../features/profileMedia/profileMedia";
import FaceVerificationOverlay from "../components/faceVerification/FaceVerificationOverlay";
import { creatorFaceVerificationCaptureApi, getCreatorVerificationStatus, submitCreatorVerification, type FaceVerificationSessionDto } from "../api/faceVerification";

interface CreatorApplicationData {
  draftVersion?: number;
  applicationJourney?: "direct_creator" | "user_upgrade";
  displayName: string;
  primaryCategory?: string;
  interests?: string[];
  country: string;
  city: string;
  currency: string;
  services: string[];
  publicBio: string;
  languages: string[];
  avatarUrl?: string | null;
  coverUrl?: string | null;
  media?: string[];
  status: string;
  rejectionReason?: string;
}

type CreatorVerificationStatus = Awaited<ReturnType<typeof getCreatorVerificationStatus>>;

export default function CreatorApplication() {
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    displayName: "",
    interests: "",
    country: "",
    city: "",
    currency: "",
    publicBio: "",
    languages: "",
  });

  const [avatar, setAvatar] = useState<ProfileMediaItem | null>(null);
  const [cover, setCover] = useState<ProfileMediaItem | null>(null);
  const [media, setMedia] = useState<ProfileMediaItem[]>([]);

  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [currencySearch, setCurrencySearch] = useState("");

  const [profileStatus, setProfileStatus] = useState<string | null>(null);
  const [draftMode, setDraftMode] = useState(false);
  const [applicationJourney, setApplicationJourney] = useState<"direct_creator" | "user_upgrade" | null>(null);
  const [identity, setIdentity] = useState({ realName: "", dateOfBirth: "", mobileCountryCode: "", mobileNumber: "" });

  const [application, setApplication] = useState<CreatorApplicationData | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<CreatorVerificationStatus | null>(null);
  const [faceVerificationOpen, setFaceVerificationOpen] = useState(false);
  const [captureComplete, setCaptureComplete] = useState(false);

  const [pageLoading, setPageLoading] = useState(true);
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const formRef = useRef<HTMLFormElement>(null);
  const mediaRef = useRef({ avatar, cover, media });
  useEffect(() => { mediaRef.current = { avatar, cover, media }; }, [avatar, cover, media]);
  useEffect(() => () => {
    const current = mediaRef.current;
    [current.avatar, current.cover, ...current.media]
      .filter((item): item is ProfileMediaItem => item !== null)
      .forEach(disposeProfileMediaPreview);
  }, []);
  const isUploading = [avatar, cover, ...media].some((item) => item?.state === "UPLOADING" || item?.state === "MODERATING");
  const activeUploads = [avatar, cover, ...media].filter((item) => item?.state === "UPLOADING" || item?.state === "MODERATING").length;
  const previewUrl = (item: ProfileMediaItem) => item.state === "EXISTING" ? item.reference : item.previewUrl;
  const mediaMessage = (item: ProfileMediaItem | null) => {
    if (!item || item.state === "EXISTING") return null;
    if (item.state === "APPROVED") return "Image approved.";
    if (item.state === "UPLOADING" || item.state === "MODERATING") return "Image moderation is in progress.";
    if (item.state === "BLOCKED" || item.state === "UNAVAILABLE" || item.state === "FAILED") return item.message;
    return null;
  };

  const isVerified = profileStatus === "verified";
  const isDirectCreator = applicationJourney === "direct_creator";

  const isResubmission = application?.status === "rejected";

  /* ================= FETCH PROFILE + APPLICATION ================= */

  useEffect(() => {
    const fetchData = async () => {
      try {
        setPageLoading(true);

        const [profileRes, applicationRes] = await Promise.all([api.get("/v1/profile/me"), api.get("/v1/creator-applications/me")]);
        setDraftMode(true);
        setProfileStatus(profileRes.data?.profileStatus || null);
        setApplication(applicationRes.data.application);
      } catch (err) {
        console.error("Failed to load creator application data", err);

        setProfileStatus(null);
      } finally {
        setPageLoading(false);
      }
    };

    fetchData();
  }, []);

  useStatusRefresh(async () => {
    const response = await api.get<{ application: CreatorApplicationData | null }>("/v1/creator-applications/me");
    setApplication(response.data.application);
    if (response.data.application?.status === "submitted") await refreshVerificationStatus();
  }, application?.status === "submitted", !pageLoading && application?.status === "submitted");

  const refreshVerificationStatus = async () => {
    try {
      setVerificationStatus(await getCreatorVerificationStatus());
    } catch (statusError) {
      if (axios.isAxiosError(statusError) && statusError.response?.status === 503) return;
      throw statusError;
    }
  };

  useEffect(() => {
    if (!draftMode || !application) return;
    void refreshVerificationStatus().catch(() => undefined);
  }, [draftMode, application?.draftVersion]);

  /* ================= PREFILL APPLICATION ================= */

  useEffect(() => {
    if (!application) {
      return;
    }

    setForm({
      displayName: application.displayName ?? "",
      interests: (application.interests ?? []).join(", "),
      country: application.country ?? "",
      city: application.city ?? "",
      currency: application.currency ?? "",

      publicBio: application.publicBio ?? "",

      languages: Array.isArray(application.languages)
        ? application.languages.join(", ")
        : "",
    });

    const existing = (reference: string, surface: "CREATOR_APPLICATION_AVATAR" | "CREATOR_APPLICATION_COVER" | "CREATOR_APPLICATION_MEDIA"): ProfileMediaItem => ({ clientId: `creator-legacy-${surface}-${reference}`, operationId: 0, state: "EXISTING", surface, reference });
    setAvatar(application.avatarUrl ? existing(application.avatarUrl, "CREATOR_APPLICATION_AVATAR") : null);
    setCover(application.coverUrl ? existing(application.coverUrl, "CREATOR_APPLICATION_COVER") : null);
    setMedia((application.media ?? []).map((reference) => existing(reference, "CREATOR_APPLICATION_MEDIA")));

    if (application.currency) {
      const selectedCurrency = currencies.find(
        (currency) => currency.code === application.currency,
      );

      setCurrencySearch(
        selectedCurrency
          ? `${selectedCurrency.code} — ${selectedCurrency.label}`
          : application.currency,
      );
    }
  }, [application]);

  /* ================= CLOSE CURRENCY DROPDOWN ================= */

  useEffect(() => {
    const close = () => {
      setCurrencyOpen(false);
    };

    window.addEventListener("click", close);

    return () => {
      window.removeEventListener("click", close);
    };
  }, []);

  /* ================= FILTER CURRENCIES ================= */

  const filteredCurrencies = currencies.filter((currency) =>
    `${currency.code} ${currency.label}`
      .toLowerCase()
      .includes(currencySearch.toLowerCase()),
  );

  /* ================= FORM CHANGE ================= */

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  /* ================= AVATAR ================= */

  const release = (item: ProfileMediaItem, reportFailure = true) => { const temporary = temporaryProfileMediaRelease(item); if (temporary) void releaseUserProfileTemporaryImage(temporary.assetReference, temporary.surface).catch(() => { if (reportFailure) setError("The image was removed, but secure cleanup is pending and will be retried safely."); }); };
  const startSlotAdmission = async (file: File, surface: "CREATOR_APPLICATION_AVATAR" | "CREATOR_APPLICATION_COVER", setter: React.Dispatch<React.SetStateAction<ProfileMediaItem | null>>) => {
    const selected = createProfileMediaSelection(file, surface); const previous = surface === "CREATOR_APPLICATION_AVATAR" ? mediaRef.current.avatar : mediaRef.current.cover;
    if (previous) { release(previous); disposeProfileMediaPreview(previous); }
    setter(selected);
    try { const moderating = markProfileMediaModerating(selected); setter((current) => current && isCurrentProfileMediaOperation(current, selected) ? moderating : current); const resolved = resolveProfileMediaAdmission(moderating, await submitUserProfileImageAdmission(file, surface)); setter((current) => { if (current && isCurrentProfileMediaOperation(current, moderating)) return resolved; disposeProfileMediaPreview(resolved); release(resolved, false); return current; }); }
    catch (error) { setter((current) => current && isCurrentProfileMediaOperation(current, selected) ? { ...selected, state: "FAILED", message: imageAdmissionErrorMessage(error) } : current); }
  };
  const handleAvatarUpload = (file: File) => startSlotAdmission(file, "CREATOR_APPLICATION_AVATAR", setAvatar);

  /* ================= COVER ================= */

  const handleCoverUpload = (file: File) => startSlotAdmission(file, "CREATOR_APPLICATION_COVER", setCover);

  /* ================= MEDIA ================= */

  const handleMediaUpload = async (files: FileList) => {
    const selectedFiles = Array.from(files);
    const remainingSlots = 6 - mediaRef.current.media.length;
    if (selectedFiles.length > remainingSlots) {
      setError(`Creator applications can include at most 6 gallery images. Remove images or select no more than ${remainingSlots}.`);
      return;
    }

    const uploads = selectedFiles.map(async (file) => {
      const selected = createProfileMediaSelection(file, "CREATOR_APPLICATION_MEDIA"); setMedia((previous) => [...previous, selected]);
      try { const moderating = markProfileMediaModerating(selected); setMedia((previous) => previous.map((item) => isCurrentProfileMediaOperation(item, selected) ? moderating : item)); const resolved = resolveProfileMediaAdmission(moderating, await submitUserProfileImageAdmission(file, "CREATOR_APPLICATION_MEDIA")); setMedia((previous) => previous.some((item) => isCurrentProfileMediaOperation(item, moderating)) ? previous.map((item) => isCurrentProfileMediaOperation(item, moderating) ? resolved : item) : (disposeProfileMediaPreview(resolved), release(resolved, false), previous)); }
      catch (error) { setMedia((previous) => previous.map((item) => isCurrentProfileMediaOperation(item, selected) ? { ...selected, state: "FAILED", message: imageAdmissionErrorMessage(error) } : item)); }
    });

    await Promise.all(uploads);
  };

  const removeMedia = (index: number) => {
    setCaptureComplete(false); setVerificationStatus(null);
    setMedia((previous) => { const removed = previous[index]; if (removed) { release(removed); disposeProfileMediaPreview(removed); } return previous.filter((_, mediaIndex) => mediaIndex !== index); });
  };

  const removeSlot = (slot: "avatar" | "cover") => {
    setCaptureComplete(false); setVerificationStatus(null);
    const item = slot === "avatar" ? mediaRef.current.avatar : mediaRef.current.cover;
    if (item) {
      release(item);
      disposeProfileMediaPreview(item);
    }
    if (slot === "avatar") setAvatar(null);
    else setCover(null);
  };

  /* ================= DRAFT / VERIFICATION ================= */

  const creatorPayload = (requireComplete: boolean) => {
    if (isUploading) throw new Error("Please wait until all images finish uploading.");
    const avatarClaim = avatar ? toProfileMediaClaim(avatar) : undefined;
    const coverClaim = cover ? toProfileMediaClaim(cover) : undefined;
    const mediaClaims = media.map((item) => toProfileMediaClaim(item));
    const payload = {
      ...form,
      ...(avatarClaim ? { avatar: avatarClaim } : {}),
      ...(coverClaim ? { cover: coverClaim } : {}),
      media: mediaClaims,
      interests: form.interests.split(",").map((interest) => interest.trim()).filter(Boolean),
      languages: form.languages.split(",").map((language) => language.trim()).filter(Boolean),
    };
    if (!requireComplete) return payload;
    if (!payload.displayName.trim() || !payload.country.trim() || !payload.city.trim() || !payload.currency.trim() || !payload.publicBio.trim() || payload.languages.length < 1 || !avatar || !cover || media.length < 2 || media.length > 6) {
      throw new Error("Complete the required Creator details, avatar, cover, and two to six approved gallery images before face verification.");
    }
    if (isDirectCreator && (!identity.realName.trim() || !identity.dateOfBirth || !identity.mobileCountryCode.trim() || !identity.mobileNumber.trim())) {
      throw new Error("Complete your private identity details before face verification.");
    }
    return payload;
  };

  const saveCreatorDraft = async (requireComplete: boolean) => {
    const payload = creatorPayload(requireComplete);
    const draftPayload = Object.fromEntries(Object.entries({ ...payload, ...identity, draftVersion: application?.draftVersion ?? 0 }).filter(([, value]) => value !== "" && value !== undefined));
    const response = await api.put<{ applicationJourney: "direct_creator" | "user_upgrade"; draft: CreatorApplicationData; identity: { realName: string | null; dateOfBirth: string | null; mobileCountryCode: string | null; mobileNumber: string | null } | null }>("/v1/creator-applications/me/upgrade-draft", draftPayload);
    setApplication(response.data.draft);
    setApplicationJourney(response.data.applicationJourney);
    setIdentity({ realName: response.data.identity?.realName ?? "", dateOfBirth: response.data.identity?.dateOfBirth ? response.data.identity.dateOfBirth.slice(0, 10) : "", mobileCountryCode: response.data.identity?.mobileCountryCode ?? "", mobileNumber: response.data.identity?.mobileNumber ?? "" });
    await refreshVerificationStatus();
    return response.data.draft;
  };

  const messageForCreatorError = (caught: unknown, fallback: string) => {
    if (axios.isAxiosError(caught) && typeof caught.response?.data?.message === "string") return caught.response.data.message;
    return caught instanceof Error ? caught.message : fallback;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (draftMode) {
        await saveCreatorDraft(false);
        // A draft save advances the server-side draft/version contract. Any
        // completed capture therefore has to be repeated against that version.
        setCaptureComplete(false);
        setVerificationStatus(null);
        showToast("Creator application draft saved.", "success");
        return;
      }
      if (!isVerified) throw new Error("Your user profile must be verified before applying as a creator.");
      await api.post("/v1/creator-applications", creatorPayload(true));

      showToast("Creator application submitted successfully.", "success");
      navigate("/dashboard/user");
    } catch (err: unknown) {
      setError(messageForCreatorError(err, "Failed to save creator application."));
    } finally {
      setLoading(false);
    }
  };

  const beginCreatorVerification = async () => {
    if (loading) return;
    if (!formRef.current?.reportValidity()) return;
    setLoading(true);
    setError("");
    try {
      await saveCreatorDraft(true);
      setCaptureComplete(false);
      setFaceVerificationOpen(true);
    } catch (caught) {
      setError(messageForCreatorError(caught, "Unable to save your Creator application before face verification."));
    } finally {
      setLoading(false);
    }
  };

  const submitVerification = async () => {
    setLoading(true);
    setError("");
    try {
      await submitCreatorVerification();
      showToast("Creator application submitted successfully.", "success");
      navigate("/dashboard/user");
    } catch (submitError) {
      if (axios.isAxiosError(submitError) && submitError.response?.status === 409) { setCaptureComplete(false); setVerificationStatus(null); }
      setError((axios.isAxiosError(submitError) && typeof submitError.response?.data?.message === "string" && submitError.response.data.message) || "Creator verification could not be submitted.");
    } finally {
      setLoading(false);
    }
  };

  /* ================= PAGE LOADING ================= */

  if (pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-theme-bg px-4 text-theme-muted">
        <p>Loading creator application...</p>
      </div>
    );
  }

  if (application?.status === "submitted") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-theme-bg px-4 py-10 text-theme-text">
        <div className="w-full max-w-lg rounded-[var(--radius-card)] border border-theme-border bg-theme-surface p-6 text-center">
          <h2 className="text-2xl font-bold">Application under review</h2>
          <p className="mt-3 text-sm leading-relaxed text-theme-muted">
            Your Creator application has been submitted and is being verified. You do not need to take action unless we ask you to correct something.
          </p>
          {verificationStatus && <p className="mt-3 text-sm text-theme-muted">Verification status: {verificationStatus.lifecycle}{verificationStatus.job ? ` (${verificationStatus.job.status.toLowerCase()})` : ""}.</p>}
          {!verificationStatus && <p className="mt-3 text-sm text-theme-muted">Creator face-verification status is unavailable. If this application was submitted before face verification was introduced, contact support before approval.</p>}
          <button
            type="button"
            onClick={() => navigate("/dashboard/user")}
            className="mt-6 h-11 rounded-[var(--radius-control)] bg-theme-primary px-4 text-sm font-medium text-theme-primary-text transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent"
          >
            Back to dashboard
          </button>
        </div>
      </div>
    );
  }

  if (application?.status === "approved") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-theme-bg px-4 py-10 text-theme-text">
        <div className="w-full max-w-lg rounded-[var(--radius-card)] border border-theme-border bg-theme-surface p-6 text-center">
          <h2 className="text-2xl font-bold">Creator application approved</h2>
          <p className="mt-3 text-sm leading-relaxed text-theme-muted">
            Your application has been approved. Your Creator dashboard is ready.
          </p>
          <button
            type="button"
            onClick={() => navigate("/dashboard/creator")}
            className="mt-6 h-11 rounded-[var(--radius-control)] bg-theme-primary px-4 text-sm font-medium text-theme-primary-text transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent"
          >
            Open Creator dashboard
          </button>
        </div>
      </div>
    );
  }

  /* ================= UI ================= */

  return (
    <div className="min-h-screen flex items-center justify-center bg-theme-bg px-4 py-10 text-theme-text">
      <div className="w-full max-w-lg rounded-[var(--radius-card)] border border-theme-border bg-theme-surface p-6">
        <h2 className="text-2xl font-bold mb-2">
          {isResubmission ? "Update Creator Application" : "Become a Creator"}
        </h2>

        <p className="mb-6 text-sm text-theme-muted">
          {isResubmission
            ? "Update your application according to the administrator's feedback, then complete face verification before resubmitting."
            : draftMode ? "Complete your details, then select Face Verification to capture five live photos before submitting." : "Submit your creator application for review."}
        </p>

        {isResubmission && application?.rejectionReason && (
          <div className="mb-6 rounded-[var(--radius-card)] border border-theme-danger bg-theme-danger-tint p-4">
            <p className="mb-2 text-sm font-semibold text-theme-danger">
              Rejection reason and required correction
            </p>

            <p className="text-sm leading-relaxed text-theme-text">
              {application.rejectionReason}
            </p>
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-[var(--radius-card)] border border-theme-danger bg-theme-danger-tint p-3">
            <p className="text-sm text-theme-danger">{error}</p>
          </div>
        )}

        <form ref={formRef} onSubmit={handleSubmit} onChangeCapture={() => { if (captureComplete || verificationStatus?.capture?.status === "CAPTURE_COMPLETE") { setCaptureComplete(false); setVerificationStatus(null); } }} noValidate={draftMode} className="space-y-4">
          {isDirectCreator && <><input name="realName" required value={identity.realName} placeholder="Legal name (private)" onChange={(event) => setIdentity((current) => ({ ...current, realName: event.target.value }))} className="input" /><input name="dateOfBirth" required type="date" value={identity.dateOfBirth} onChange={(event) => setIdentity((current) => ({ ...current, dateOfBirth: event.target.value }))} className="input" /><div className="grid grid-cols-3 gap-2"><input required value={identity.mobileCountryCode} placeholder="+91" onChange={(event) => setIdentity((current) => ({ ...current, mobileCountryCode: event.target.value }))} className="input" /><input required value={identity.mobileNumber} placeholder="Phone number" onChange={(event) => setIdentity((current) => ({ ...current, mobileNumber: event.target.value }))} className="input col-span-2" /></div></>}
          <input
            name="displayName"
            required={!draftMode}
            value={form.displayName}
            placeholder="Display Name"
            onChange={handleChange}
            className="input"
          />

          <label className="block text-sm text-theme-text">Interests
            <span className="mb-2 block text-xs text-theme-muted">What do you enjoy? Separate interests with commas. These are not service categories.</span>
            <input name="interests" value={form.interests} placeholder="Music, travel, art" onChange={handleChange} className="input" />
          </label>

          <input
            name="country"
            required
            value={form.country}
            placeholder="Country"
            onChange={handleChange}
            className="input"
          />

          <input
            name="city"
            required
            value={form.city}
            placeholder="City"
            onChange={handleChange}
            className="input"
          />

          {/* ================= CURRENCY ================= */}

          <div className="relative">
            <input
              value={currencySearch}
            required
              onChange={(e) => {
                setCurrencySearch(e.target.value);

                setForm((previous) => ({
                  ...previous,
                  currency: "",
                }));

                setCurrencyOpen(true);
              }}
              onClick={(e) => {
                e.stopPropagation();

                setCurrencyOpen(true);
              }}
              placeholder="Select Currency"
              className="input"
            />

            {currencyOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute z-50 mt-2 max-h-60 w-full overflow-y-auto rounded-[var(--radius-dropdown)] border border-theme-border bg-theme-surface shadow-lg"
              >
                {filteredCurrencies.length > 0 ? (
                  filteredCurrencies.map((currency) => (
                    <button
                      key={currency.code}
                      type="button"
                      onClick={() => {
                        setCaptureComplete(false); setVerificationStatus(null);
                        setForm((previous) => ({
                          ...previous,
                          currency: currency.code,
                        }));

                        setCurrencySearch(
                          `${currency.code} — ${currency.label}`,
                        );

                        setCurrencyOpen(false);
                      }}
                      className="block w-full cursor-pointer px-3 py-2 text-left text-sm text-theme-text hover:bg-theme-inset focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent"
                    >
                      {currency.code} — {currency.label}
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-2 text-sm text-theme-muted">
                    No results found
                  </div>
                )}
              </div>
            )}
          </div>

          <input
            name="languages"
            required
            value={form.languages}
            placeholder="Languages"
            onChange={handleChange}
            className="input"
          />

          <textarea
            name="publicBio"
            required
            value={form.publicBio}
            placeholder="Public Bio"
            onChange={handleChange}
            className="input min-h-28 resize-y"
          />

          {/* ================= AVATAR ================= */}

          <div>
            <p className="text-sm mb-1">Avatar (required)</p>

            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];

                if (file) {
                  handleAvatarUpload(file);
                }
              }}
            />

            {avatar && (
              <div className="relative w-20 h-20 mt-2">
                <img
                  src={previewUrl(avatar)}
                  alt="Creator avatar"
                  className={`w-20 h-20 object-cover rounded-full ${profileMediaStatusClassName(avatar)}`}
                />

                <button
                  type="button"
                  onClick={() => removeSlot("avatar")}
                  className="absolute top-0 right-0 bg-black/60 text-xs px-1 rounded"
                >
                  ✕
                </button>
              </div>
            )}
            {mediaMessage(avatar) && <p className={`mt-1 text-xs ${avatar?.state === "BLOCKED" ? "text-red-400" : avatar?.state === "UNAVAILABLE" ? "text-amber-300" : avatar?.state === "FAILED" ? "text-orange-300" : "text-gray-400"}`}>{mediaMessage(avatar)}</p>}
          </div>

          {/* ================= COVER ================= */}

          <div>
            <p className="text-sm mb-1">Cover (required)</p>

            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];

                if (file) {
                  handleCoverUpload(file);
                }
              }}
            />

            {cover && (
              <div className="relative mt-2">
                <img
                  src={previewUrl(cover)}
                  alt="Creator cover"
                  className={`w-full h-24 object-cover rounded-lg ${profileMediaStatusClassName(cover)}`}
                />

                <button
                  type="button"
                  onClick={() => removeSlot("cover")}
                  className="absolute top-1 right-1 bg-black/60 text-xs px-2 py-1 rounded"
                >
                  ✕
                </button>
              </div>
            )}
            {mediaMessage(cover) && <p className={`mt-1 text-xs ${cover?.state === "BLOCKED" ? "text-red-400" : cover?.state === "UNAVAILABLE" ? "text-amber-300" : cover?.state === "FAILED" ? "text-orange-300" : "text-gray-400"}`}>{mediaMessage(cover)}</p>}
          </div>

          {/* ================= MEDIA ================= */}

          <div>
            <p className="text-sm mb-1">Media (2–6 required)</p>

            <input
              type="file"
              accept="image/*"
              multiple
              disabled={media.length >= 6}
              onChange={(e) => {
                if (e.target.files) {
                  handleMediaUpload(e.target.files);
                }
              }}
            />

            <div className="grid grid-cols-3 gap-2 mt-2">
              {media.map((image, index) => (
                <div key={image.clientId} className="relative">
                  <img
                    src={previewUrl(image)}
                    alt={`Creator media ${index + 1}`}
                    className={`h-20 w-full object-cover rounded ${profileMediaStatusClassName(image)}`}
                  />

                  <button
                    type="button"
                    onClick={() => removeMedia(index)}
                    className="absolute top-1 right-1 bg-black/60 text-xs px-1 rounded"
                  >
                    ✕
                  </button>
                  {mediaMessage(image) && <p className={`mt-1 text-xs ${image.state === "BLOCKED" ? "text-red-400" : "text-gray-400"}`}>{mediaMessage(image)}</p>}
                </div>
              ))}
            </div>
          </div>

          {/* ================= SUBMIT ================= */}

          <button
            type={draftMode ? "button" : "submit"}
            onClick={draftMode ? () => void (captureComplete || verificationStatus?.capture?.status === "CAPTURE_COMPLETE" ? submitVerification() : beginCreatorVerification()) : undefined}
            disabled={loading || isUploading}
            className="w-full rounded-[var(--radius-control)] bg-theme-primary py-3 font-semibold text-theme-primary-text transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent"
          >
            {isUploading
              ? `Uploading images... (${activeUploads})`
              : loading
                ? draftMode ? "Saving draft..." : "Submitting..."
                : draftMode ? (captureComplete || verificationStatus?.capture?.status === "CAPTURE_COMPLETE" ? "Submit Creator Application" : "Face Verification") : "Submit Application"}
          </button>
        </form>
      </div>

      {faceVerificationOpen && application?.avatarUrl && <FaceVerificationOverlay
        avatar={application.avatarUrl}
        captureApi={creatorFaceVerificationCaptureApi}
        onComplete={(session: FaceVerificationSessionDto) => { setFaceVerificationOpen(false); setCaptureComplete(session.status === "CAPTURE_COMPLETE"); setVerificationStatus((current) => current ? { ...current, capture: { acceptedCaptureCount: session.acceptedCaptureCount, requiredCaptureCount: session.requiredCaptureCount, status: session.status, expiresAt: session.expiresAt } } : current); void refreshVerificationStatus().catch(() => undefined); showToast("Five live face captures completed. Submit your Creator application when ready.", "success"); }}
        onClose={() => setFaceVerificationOpen(false)}
      />}

      <style>
        {`
          .input {
            width: 100%;
            padding: 10px;
            border-radius: var(--radius-control);
            background: var(--color-surface-inset);
            border: 1px solid var(--color-border);
            outline: none;
            color: var(--color-text);
          }
          .input::placeholder {
            color: var(--color-text-muted);
          }
          .input:focus-visible {
            outline: 2px solid var(--color-accent);
            outline-offset: 2px;
          }
        `}
      </style>
    </div>
  );
}

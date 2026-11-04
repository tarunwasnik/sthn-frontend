// frontend/src/pages/CreatorApplication.tsx

import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useToast } from "../hooks/useToast";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";
import { currencies } from "../constants/currencies";
import { imageAdmissionErrorMessage, releaseUserProfileTemporaryImage, submitUserProfileImageAdmission } from "../api/imageModeration";
import { createProfileMediaSelection, disposeProfileMediaPreview, isCurrentProfileMediaOperation, markProfileMediaModerating, profileMediaStatusClassName, resolveProfileMediaAdmission, temporaryProfileMediaRelease, toProfileMediaClaim, type ProfileMediaItem } from "../features/profileMedia/profileMedia";

interface CreatorApplicationData {
  displayName: string;
  primaryCategory: string;
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

export default function CreatorApplication() {
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    displayName: "",
    primaryCategory: "",
    country: "",
    city: "",
    currency: "",
    services: "",
    publicBio: "",
    languages: "",
  });

  const [avatar, setAvatar] = useState<ProfileMediaItem | null>(null);
  const [cover, setCover] = useState<ProfileMediaItem | null>(null);
  const [media, setMedia] = useState<ProfileMediaItem[]>([]);

  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [currencySearch, setCurrencySearch] = useState("");

  const [profileStatus, setProfileStatus] = useState<string | null>(null);

  const [application, setApplication] = useState<CreatorApplicationData | null>(null);

  const [pageLoading, setPageLoading] = useState(true);
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

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

  const isResubmission = application?.status === "rejected";

  /* ================= FETCH PROFILE + APPLICATION ================= */

  useEffect(() => {
    const fetchData = async () => {
      try {
        setPageLoading(true);

        const profileRes = await api.get("/v1/profile/me");

        setProfileStatus(profileRes.data?.profileStatus || null);

        const applicationRes = await api.get("/v1/creator-applications/me");

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

  /* ================= PREFILL APPLICATION ================= */

  useEffect(() => {
    if (!application) {
      return;
    }

    setForm({
      displayName: application.displayName ?? "",
      primaryCategory: application.primaryCategory ?? "",
      country: application.country ?? "",
      city: application.city ?? "",
      currency: application.currency ?? "",

      services: Array.isArray(application.services)
        ? application.services.join(", ")
        : "",

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

    const uploads = selectedFiles.map(async (file) => {
      const selected = createProfileMediaSelection(file, "CREATOR_APPLICATION_MEDIA"); setMedia((previous) => [...previous, selected]);
      try { const moderating = markProfileMediaModerating(selected); setMedia((previous) => previous.map((item) => isCurrentProfileMediaOperation(item, selected) ? moderating : item)); const resolved = resolveProfileMediaAdmission(moderating, await submitUserProfileImageAdmission(file, "CREATOR_APPLICATION_MEDIA")); setMedia((previous) => previous.some((item) => isCurrentProfileMediaOperation(item, moderating)) ? previous.map((item) => isCurrentProfileMediaOperation(item, moderating) ? resolved : item) : (disposeProfileMediaPreview(resolved), release(resolved, false), previous)); }
      catch (error) { setMedia((previous) => previous.map((item) => isCurrentProfileMediaOperation(item, selected) ? { ...selected, state: "FAILED", message: imageAdmissionErrorMessage(error) } : item)); }
    });

    await Promise.all(uploads);
  };

  const removeMedia = (index: number) => {
    setMedia((previous) => { const removed = previous[index]; if (removed) { release(removed); disposeProfileMediaPreview(removed); } return previous.filter((_, mediaIndex) => mediaIndex !== index); });
  };

  const removeSlot = (slot: "avatar" | "cover") => {
    const item = slot === "avatar" ? mediaRef.current.avatar : mediaRef.current.cover;
    if (item) {
      release(item);
      disposeProfileMediaPreview(item);
    }
    if (slot === "avatar") setAvatar(null);
    else setCover(null);
  };

  /* ================= SUBMIT ================= */

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isUploading) {
      setError("Please wait until all images finish uploading.");

      return;
    }

    if (!isVerified) {
      setError(
        "Your user profile must be verified before applying as a creator.",
      );

      return;
    }

    let avatarClaim;
    let coverClaim;
    let mediaClaims;
    try {
      avatarClaim = avatar ? toProfileMediaClaim(avatar) : undefined;
      coverClaim = cover ? toProfileMediaClaim(cover) : undefined;
      mediaClaims = media.map((item) => toProfileMediaClaim(item));
    } catch (claimError) {
      setError(claimError instanceof Error ? claimError.message : "Image moderation must approve every selected image before it can be saved.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await api.post("/v1/creator-applications", {
        ...form,

        ...(avatarClaim ? { avatar: avatarClaim } : {}),
        ...(coverClaim ? { cover: coverClaim } : {}),
        media: mediaClaims,

        services: form.services
          .split(",")
          .map((service) => service.trim())
          .filter(Boolean),
        languages: form.languages
          .split(",")
          .map((language) => language.trim())
          .filter(Boolean),
      });

      showToast("Creator application submitted.", "success");
      navigate("/dashboard/user");
    } catch (err: unknown) {
      setError(
        (axios.isAxiosError(err) && typeof err.response?.data?.message === "string" && err.response.data.message) ||
          "Failed to submit creator application.",
      );
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
            Your Creator application has been submitted and is awaiting an administrator decision. You cannot submit another application while this review is active.
          </p>
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
            ? "Update your application according to the administrator's feedback. Saving your changes will automatically resubmit it for review."
            : "Submit your creator application for review."}
        </p>

        {isResubmission && application?.rejectionReason && (
          <div className="mb-6 rounded-[var(--radius-card)] border border-theme-danger bg-theme-danger-tint p-4">
            <p className="mb-2 text-sm font-semibold text-theme-danger">
              Administrator Feedback
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="displayName"
            value={form.displayName}
            placeholder="Display Name"
            onChange={handleChange}
            className="input"
          />

          <input
            name="primaryCategory"
            value={form.primaryCategory}
            placeholder="Primary Category"
            onChange={handleChange}
            className="input"
          />

          <input
            name="country"
            value={form.country}
            placeholder="Country"
            onChange={handleChange}
            className="input"
          />

          <input
            name="city"
            value={form.city}
            placeholder="City"
            onChange={handleChange}
            className="input"
          />

          {/* ================= CURRENCY ================= */}

          <div className="relative">
            <input
              value={currencySearch}
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
            name="services"
            value={form.services}
            placeholder="Services"
            onChange={handleChange}
            className="input"
          />

          <input
            name="languages"
            value={form.languages}
            placeholder="Languages"
            onChange={handleChange}
            className="input"
          />

          <textarea
            name="publicBio"
            value={form.publicBio}
            placeholder="Public Bio"
            onChange={handleChange}
            className="input min-h-28 resize-y"
          />

          {/* ================= AVATAR ================= */}

          <div>
            <p className="text-sm mb-1">Avatar</p>

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
            <p className="text-sm mb-1">Cover</p>

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
            <p className="text-sm mb-1">Media</p>

            <input
              type="file"
              accept="image/*"
              multiple
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
            type="submit"
            disabled={loading || !isVerified || isUploading}
            className="w-full rounded-[var(--radius-control)] bg-theme-primary py-3 font-semibold text-theme-primary-text transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent"
          >
            {isUploading
              ? `Uploading images... (${activeUploads})`
              : loading
                ? "Submitting..."
                : isResubmission
                  ? "Resubmit Application"
                  : "Submit Application"}
          </button>
        </form>
      </div>

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

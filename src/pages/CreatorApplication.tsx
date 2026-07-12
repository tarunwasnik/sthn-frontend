// frontend/src/pages/CreatorApplication.tsx

import { useEffect, useState } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";
import { currencies } from "../constants/currencies";
import { UPLOAD_PRESET } from "../config/cloudinary";

/* ================= CLOUDINARY ================= */

const uploadToCloudinary = async (file: File): Promise<string> => {
  const formData = new FormData();

  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);
  formData.append("folder", "creator_profiles");

  const res = await fetch(
    "https://api.cloudinary.com/v1_1/dg8hixi8e/image/upload",
    {
      method: "POST",
      body: formData,
    },
  );

  const data = await res.json();

  return data.secure_url;
};

export default function CreatorApplication() {
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

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [media, setMedia] = useState<string[]>([]);

  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [currencySearch, setCurrencySearch] = useState("");

  const [profileStatus, setProfileStatus] = useState<string | null>(null);

  const [application, setApplication] = useState<any>(null);

  const [pageLoading, setPageLoading] = useState(true);
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const [activeUploads, setActiveUploads] = useState(0);

  const isUploading = activeUploads > 0;

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

    setAvatarUrl(application.avatarUrl ?? null);

    setCoverUrl(application.coverUrl ?? null);

    setMedia(Array.isArray(application.media) ? application.media : []);

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

  const handleAvatarUpload = async (file: File) => {
    const preview = URL.createObjectURL(file);

    setAvatarUrl(preview);
    setActiveUploads((previous) => previous + 1);

    try {
      const url = await uploadToCloudinary(file);

      setAvatarUrl(url);
    } catch {
      setAvatarUrl(null);
      setError("Failed to upload avatar.");
    } finally {
      setActiveUploads((previous) => Math.max(0, previous - 1));
      URL.revokeObjectURL(preview);
    }
  };

  /* ================= COVER ================= */

  const handleCoverUpload = async (file: File) => {
    const preview = URL.createObjectURL(file);

    setCoverUrl(preview);
    setActiveUploads((previous) => previous + 1);

    try {
      const url = await uploadToCloudinary(file);

      setCoverUrl(url);
    } catch {
      setCoverUrl(null);
      setError("Failed to upload cover.");
    } finally {
      setActiveUploads((previous) => Math.max(0, previous - 1));
      URL.revokeObjectURL(preview);
    }
  };

  /* ================= MEDIA ================= */

  const handleMediaUpload = async (files: FileList) => {
    const selectedFiles = Array.from(files);

    const uploads = selectedFiles.map(async (file) => {
      const preview = URL.createObjectURL(file);

      setMedia((previous) => [...previous, preview]);
      setActiveUploads((previous) => previous + 1);

      try {
        const url = await uploadToCloudinary(file);

        setMedia((previous) =>
          previous.map((item) => (item === preview ? url : item)),
        );
      } catch {
        setMedia((previous) => previous.filter((item) => item !== preview));

        setError("Failed to upload one of the media images.");
      } finally {
        setActiveUploads((previous) => Math.max(0, previous - 1));
        URL.revokeObjectURL(preview);
      }
    });

    await Promise.all(uploads);
  };

  const removeMedia = (index: number) => {
    setMedia((previous) =>
      previous.filter((_, mediaIndex) => mediaIndex !== index),
    );
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

    setLoading(true);
    setError("");

    try {
      await api.post("/v1/creator-applications", {
        ...form,

        avatarUrl,
        coverUrl,
        media,

        services: form.services
          .split(",")
          .map((service) => service.trim())
          .filter(Boolean),

        languages: form.languages
          .split(",")
          .map((language) => language.trim())
          .filter(Boolean),
      });

      navigate("/dashboard/user");
    } catch (err: any) {
      setError(
        err?.response?.data?.message || "Failed to submit creator application.",
      );
    } finally {
      setLoading(false);
    }
  };

  /* ================= PAGE LOADING ================= */

  if (pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 text-white bg-gradient-to-br from-[#041c1c] via-[#052828] to-[#020617]">
        <p className="text-white/60">Loading creator application...</p>
      </div>
    );
  }

  /* ================= UI ================= */

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 text-white bg-gradient-to-br from-[#041c1c] via-[#052828] to-[#020617]">
      <div className="w-full max-w-lg bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-6">
        <h2 className="text-2xl font-bold mb-2">
          {isResubmission ? "Update Creator Application" : "Become a Creator"}
        </h2>

        <p className="text-gray-400 text-sm mb-6">
          {isResubmission
            ? "Update your application according to the administrator's feedback. Saving your changes will automatically resubmit it for review."
            : "Submit your creator application for review."}
        </p>

        {isResubmission && application?.rejectionReason && (
          <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/5 p-4">
            <p className="mb-2 text-sm font-semibold text-red-300">
              Administrator Feedback
            </p>

            <p className="text-sm leading-relaxed text-white/80">
              {application.rejectionReason}
            </p>
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/5 p-3">
            <p className="text-sm text-red-400">{error}</p>
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
                className="absolute z-50 mt-2 w-full max-h-60 overflow-y-auto rounded-lg bg-white border border-white/10 shadow-xl"
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
                      className="block w-full px-3 py-2 text-left hover:bg-black/10 cursor-pointer text-sm text-black"
                    >
                      {currency.code} — {currency.label}
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-2 text-gray-400 text-sm">
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

            {avatarUrl && (
              <div className="relative w-20 h-20 mt-2">
                <img
                  src={avatarUrl}
                  alt="Creator avatar"
                  className="w-20 h-20 object-cover rounded-full"
                />

                <button
                  type="button"
                  onClick={() => setAvatarUrl(null)}
                  className="absolute top-0 right-0 bg-black/60 text-xs px-1 rounded"
                >
                  ✕
                </button>
              </div>
            )}
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

            {coverUrl && (
              <div className="relative mt-2">
                <img
                  src={coverUrl}
                  alt="Creator cover"
                  className="w-full h-24 object-cover rounded-lg"
                />

                <button
                  type="button"
                  onClick={() => setCoverUrl(null)}
                  className="absolute top-1 right-1 bg-black/60 text-xs px-2 py-1 rounded"
                >
                  ✕
                </button>
              </div>
            )}
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
                <div key={`${image}-${index}`} className="relative">
                  <img
                    src={image}
                    alt={`Creator media ${index + 1}`}
                    className="h-20 w-full object-cover rounded"
                  />

                  <button
                    type="button"
                    onClick={() => removeMedia(index)}
                    className="absolute top-1 right-1 bg-black/60 text-xs px-1 rounded"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* ================= SUBMIT ================= */}

          <button
            type="submit"
            disabled={loading || !isVerified || isUploading}
            className="w-full bg-teal-400 text-black py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
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
            border-radius: 10px;
            background: rgba(255,255,255,0.05);
            border: 1px solid rgba(255,255,255,0.1);
            outline: none;
            color: white;
          }
        `}
      </style>
    </div>
  );
}

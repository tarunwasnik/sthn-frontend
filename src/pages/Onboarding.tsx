// frontend/src/pages/Onboarding.tsx

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import api from "../api/axios";
import { UPLOAD_PRESET } from "../config/cloudinary";
import { useAuth } from "../hooks/useAuth";
import FaceVerificationOverlay from "../components/faceVerification/FaceVerificationOverlay";



const uploadToCloudinary = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);
  formData.append("folder", "user_profiles"); // ✅ ADDED

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/dg8hixi8e/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  const data = await res.json();
  return data.secure_url;
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

  /* AVATAR + COVER */
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);

  /* GALLERY */
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);

  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [faceVerificationOpen, setFaceVerificationOpen] = useState(false);
  const [verifiedAvatar, setVerifiedAvatar] = useState<string | null>(null);
  const [isRejectedResubmission, setIsRejectedResubmission] = useState(false);
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const formRef = useRef<HTMLFormElement>(null);
  const faceCaptureComplete = Boolean(avatarUrl && verifiedAvatar === avatarUrl);

  useEffect(() => {
    let active = true;
    const loadExistingProfile = async () => {
      try {
        const { data } = await api.get<{
          username: string; realName?: string | null; dateOfBirth?: string; mobileCountryCode?: string | null;
          mobileNumber?: string | null; country?: string | null; city?: string | null; languages?: string[];
          bio?: string; interests?: string[]; avatar?: string; cover?: string; profilePhotos?: string[];
          profileStatus?: string; rejectionReason?: string | null;
        }>("/v1/profile/me");
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
        }
        setUsername(data.username ?? "");
        setRealName(data.realName ?? "");
        setDateOfBirth(data.dateOfBirth?.split("T")[0] ?? "");
        setMobileCountryCode(data.mobileCountryCode ?? "+91");
        setMobileNumber(data.mobileNumber ?? "");
        setCountry(data.country ?? ""); setCity(data.city ?? "");
        setLanguages((data.languages ?? []).join(", "));
        setBio(data.bio ?? ""); setInterests((data.interests ?? []).join(", "));
        setAvatarUrl(data.avatar ?? null); setAvatarPreview(data.avatar ?? null);
        setCoverUrl(data.cover ?? null); setCoverPreview(data.cover ?? null);
        setUploadedUrls(data.profilePhotos ?? []); setPreviews(data.profilePhotos ?? []);
      } catch (caught) {
        if (!axios.isAxiosError(caught) || caught.response?.status !== 404) setError("Unable to load your profile for onboarding.");
      } finally {
        if (active) setProfileLoading(false);
      }
    };
    void loadExistingProfile();
    return () => { active = false; };
  }, [navigate]);

  /* AVATAR UPLOAD */
  const handleAvatarChange = async (file: File) => {
    setAvatarPreview(URL.createObjectURL(file));
    setUploading(true);

    try {
      const url = await uploadToCloudinary(file);
      setAvatarUrl(url);
      setVerifiedAvatar(null);
    } catch {
      setError("Avatar upload failed");
    } finally {
      setUploading(false);
    }
  };

  /* COVER UPLOAD */
  const handleCoverChange = async (file: File) => {
    setCoverPreview(URL.createObjectURL(file));
    setUploading(true);

    try {
      const url = await uploadToCloudinary(file);
      setCoverUrl(url);
    } catch {
      setError("Cover upload failed");
    } finally {
      setUploading(false);
    }
  };

  /* GALLERY UPLOAD */
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);

    if (files.length + selectedFiles.length > 6) {
      setError("Maximum 6 photos allowed.");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const newPreviews = selectedFiles.map((file) =>
        URL.createObjectURL(file)
      );

      setFiles((prev) => [...prev, ...selectedFiles]);
      setPreviews((prev) => [...prev, ...newPreviews]);

      const uploaded = await Promise.all(
        selectedFiles.map((file) => uploadToCloudinary(file))
      );

      setUploadedUrls((prev) => [...prev, ...uploaded]);

    } catch {
      setError("Image upload failed");
    } finally {
      setUploading(false);
    }
  };

  /* REMOVE IMAGE */
  const handleRemove = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
    setUploadedUrls((prev) => prev.filter((_, i) => i !== index));
  };

  /* SUBMIT */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (loading || uploading) return;

    if (!avatarUrl) {
      setError("Avatar is required");
      return;
    }

    if (!faceCaptureComplete) {
      setError("Complete live face verification for the current avatar before submitting.");
      return;
    }

    if (!coverUrl) {
      setError("Cover is required");
      return;
    }

    if (uploadedUrls.length < 2 || uploadedUrls.length > 6) {
      setError("You must add between 2 and 6 gallery images.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await api.post("/v1/profile/me", {
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
        profilePhotos: uploadedUrls,
        avatar: avatarUrl,
        cover: coverUrl,
      });

      const entry = await bootstrap();

      if (!entry?.entryRoute) {
        throw new Error("Unable to refresh account access after profile submission");
      }

      navigate(entry.entryRoute, { replace: true });

    } catch (err: unknown) {
      const responseData = axios.isAxiosError(err) ? err.response?.data : undefined;
      setError(
        (typeof responseData?.message === "string" && responseData.message) ||
        "Failed to submit profile"
      );
    } finally {
      setLoading(false);
    }
  };

  const beginFaceVerification = () => {
    if (!formRef.current?.reportValidity()) return;
    if (!avatarUrl || !coverUrl || uploadedUrls.length < 2 || uploadedUrls.length > 6) {
      setError("Add your avatar, cover, and 2–6 gallery photos before face verification.");
      return;
    }
    setError("");
    setFaceVerificationOpen(true);
  };

  if (profileLoading) return <div className="min-h-screen grid place-items-center text-white">Loading profile…</div>;

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 text-white overflow-hidden">

      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] md:w-[900px] h-[400px] md:h-[600px] bg-teal-500/10 blur-[120px] md:blur-[150px] rounded-full" />
      </div>

      <div className="w-full max-w-lg bg-white/5 border border-white/10 backdrop-blur-lg rounded-2xl p-6 md:p-8">

        <h2 className="text-2xl font-bold mb-2">
          {isRejectedResubmission ? "Resubmit Your Profile for Verification" : "Complete Your Profile"}
        </h2>

        <p className="text-gray-400 text-sm mb-6">
          {isRejectedResubmission ? "Your profile details were retained. Complete a fresh live face verification before resubmitting." : "Submit your profile for verification"}
        </p>

        {isRejectedResubmission && (
          <div className="mb-4 rounded-md border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-amber-100">
            <p className="font-medium">Your previous verification needs changes.</p>
            {rejectionReason && <p className="mt-1">{rejectionReason}</p>}
            <p className="mt-1 text-amber-100/80">Your profile data is retained, but a new live face verification is required for this resubmission.</p>
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-md bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">

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
          <div>
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
            {avatarPreview && (
  <div className="relative w-20 h-20 mt-2">
    <img
      src={avatarPreview}
      className="w-20 h-20 object-cover rounded-full"
    />

    <button
      type="button"
      onClick={() => {
        setAvatarPreview(null);
        setAvatarUrl(null);
        setVerifiedAvatar(null);
      }}
      className="absolute top-0 right-0 bg-black/60 text-white text-xs px-1 rounded"
    >
      ✕
    </button>
  </div>
)}
          </div>

          {/* COVER */}
          <div>
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
            {coverPreview && (
  <div className="relative mt-2">
    <img
      src={coverPreview}
      className="w-full h-24 object-cover rounded-lg"
    />

    <button
      type="button"
      onClick={() => {
        setCoverPreview(null);
        setCoverUrl(null);
      }}
      className="absolute top-1 right-1 bg-black/60 text-white text-xs px-1 rounded"
    >
      ✕
    </button>
  </div>
)}
          </div>

          {/* GALLERY */}
          <div>
            <label className="text-sm text-gray-300 mb-2 block">
              Profile Photos (2–6 required)
            </label>

            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileChange}
            />

            {uploading && (
              <p className="text-xs text-gray-400 mt-2">Uploading...</p>
            )}

            {previews.length > 0 && (
              <div className="grid grid-cols-3 gap-3 mt-4">
                {previews.map((src, index) => (
                  <div key={index} className="relative">
                    <img
                      src={src}
                      className="w-full h-24 object-cover rounded-lg"
                    />

                    <button
                      type="button"
                      onClick={() => handleRemove(index)}
                      className="absolute top-1 right-1 bg-black/60 text-white text-xs px-1 rounded"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type={faceCaptureComplete ? "submit" : "button"}
            onClick={faceCaptureComplete ? undefined : beginFaceVerification}
            disabled={loading || uploading}
            className="w-full bg-teal-400 text-black font-semibold py-3 rounded-xl disabled:opacity-50"
          >
            {loading ? "Submitting..." : faceCaptureComplete ? "Submit Profile" : "Face Verification"}
          </button>

        </form>
      </div>
      {faceVerificationOpen && avatarUrl && (
        <FaceVerificationOverlay
          avatar={avatarUrl}
          onComplete={(completedAvatar) => {
            setVerifiedAvatar(completedAvatar);
            setFaceVerificationOpen(false);
          }}
          onClose={() => setFaceVerificationOpen(false)}
        />
      )}
    </div>
  );
};

export default Onboarding;

// frontend/src/pages/Onboarding.tsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

const CLOUD_NAME = "dg8hixi8e";
const UPLOAD_PRESET = "unsigned_preset";

const uploadToCloudinary = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

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

  const [username, setUsername] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
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

  /* AVATAR UPLOAD */
  const handleAvatarChange = async (file: File) => {
    setAvatarPreview(URL.createObjectURL(file));
    setUploading(true);

    try {
      const url = await uploadToCloudinary(file);
      setAvatarUrl(url);
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
        dateOfBirth,
        bio,
        interests: interests
          .split(",")
          .map((i) => i.trim())
          .filter(Boolean),
        profilePhotos: uploadedUrls,
        avatar: avatarUrl,
        cover: coverUrl,
      });

      navigate("/entry", { replace: true });

    } catch (err: any) {
      setError(
        err?.response?.data?.message || "Failed to submit profile"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 text-white overflow-hidden">

      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] md:w-[900px] h-[400px] md:h-[600px] bg-teal-500/10 blur-[120px] md:blur-[150px] rounded-full" />
      </div>

      <div className="w-full max-w-lg bg-white/5 border border-white/10 backdrop-blur-lg rounded-2xl p-6 md:p-8">

        <h2 className="text-2xl font-bold mb-2">
          Complete Your Profile
        </h2>

        <p className="text-gray-400 text-sm mb-6">
          Submit your profile for verification
        </p>

        {error && (
          <div className="mb-4 rounded-md bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Username */}
          <input
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
          />

          {/* DOB */}
          <input
            type="date"
            required
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
          />

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
            disabled={loading || uploading}
            className="w-full bg-teal-400 text-black font-semibold py-3 rounded-xl disabled:opacity-50"
          >
            {loading ? "Submitting..." : "Submit Profile"}
          </button>

        </form>
      </div>
    </div>
  );
};

export default Onboarding;
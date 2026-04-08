// frontend/src/pages/Onboarding.tsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

const Onboarding = () => {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [bio, setBio] = useState("");
  const [interests, setInterests] = useState("");

  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* HANDLE FILE SELECT */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);

    if (files.length + selectedFiles.length > 6) {
      setError("Maximum 6 photos allowed.");
      return;
    }

    const newPreviews = selectedFiles.map((file) =>
      URL.createObjectURL(file)
    );

    setFiles((prev) => [...prev, ...selectedFiles]);
    setPreviews((prev) => [...prev, ...newPreviews]);
    setError("");
  };

  /* REMOVE IMAGE */
  const handleRemove = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (loading) return;

  if (files.length < 2 || files.length > 6) {
    setError("You must add between 2 and 6 profile photos.");
    return;
  }

  setError("");
  setLoading(true);

  try {
    const formData = new FormData();

    formData.append("username", username);
    formData.append("dateOfBirth", dateOfBirth);
    formData.append("bio", bio);

    // interests
    interests
      .split(",")
      .map((i) => i.trim())
      .filter(Boolean)
      .forEach((i) => {
        formData.append("interests[]", i);
      });

    // ✅ REAL FILES (IMPORTANT)
    files.forEach((file) => {
      formData.append("profilePhotos", file);
    });

    await api.post("/v1/profile/me", formData, {
    });

    navigate("/entry", { replace: true });

  } catch (err: any) {
    const message =
      err?.response?.data?.message ||
      "Failed to submit profile";

    setError(message);

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
          <div>
            <label className="text-sm text-gray-300 mb-1 block">
              Username
            </label>
            <input
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:ring-2 focus:ring-teal-400"
            />
          </div>

          {/* DOB */}
          <div>
            <label className="text-sm text-gray-300 mb-1 block">
              Date of Birth
            </label>
            <input
              type="date"
              required
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:ring-2 focus:ring-teal-400"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="text-sm text-gray-300 mb-1 block">
              Bio
            </label>
            <textarea
              required
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:ring-2 focus:ring-teal-400"
            />
          </div>

          {/* Interests */}
          <div>
            <label className="text-sm text-gray-300 mb-1 block">
              Interests
            </label>
            <input
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
              placeholder="Photography, Music..."
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:ring-2 focus:ring-teal-400"
            />
          </div>

          {/* MEDIA UPLOAD */}
          <div>
            <label className="text-sm text-gray-300 mb-2 block">
              Profile Photos (2–6 required)
            </label>

            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              className="text-sm text-gray-300"
            />

            {/* PREVIEW GRID */}
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
            disabled={loading}
            className="w-full bg-teal-400 text-black font-semibold py-3 rounded-xl hover:bg-teal-300 transition disabled:opacity-50"
          >
            {loading ? "Submitting..." : "Submit Profile"}
          </button>

        </form>
      </div>
    </div>
  );
};

export default Onboarding;
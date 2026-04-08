// frontend/src/pages/CreatorApplication.tsx

import { useEffect, useState } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";
import { currencies } from "../constants/currencies";

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
  });

  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [profileStatus, setProfileStatus] = useState<string | null>(null);

  const isVerified = profileStatus === "verified";

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/v1/profile/me");

        const profile =
          res.data?.profile ||
          res.data?.data?.profile ||
          res.data;

        setProfileStatus(profile?.profileStatus || null);
      } catch {
        setProfileStatus(null);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const getLockMessage = () => {
    if (!profileStatus) {
      return "Profile not found. Please complete your profile.";
    }

    if (profileStatus === "pending_verification") {
      return "Your profile is under verification.";
    }

    if (profileStatus === "rejected") {
      return "Your profile was rejected. Please update and resubmit.";
    }

    return "";
  };

  // FILE HANDLING
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);

    const newPreviews = selectedFiles.map((file) =>
      URL.createObjectURL(file)
    );

    setFiles((prev) => [...prev, ...selectedFiles]);
    setPreviews((prev) => [...prev, ...newPreviews]);
  };

  const handleRemove = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isVerified || loading) return;

    setLoading(true);
    setError("");

    try {
      const formData = new FormData();

      formData.append("displayName", form.displayName.trim());
      formData.append("primaryCategory", form.primaryCategory.trim());
      formData.append("country", form.country.trim());
      formData.append("city", form.city.trim());
      formData.append("currency", form.currency);
      formData.append("publicBio", form.publicBio.trim());

      form.services
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .forEach((service) => {
          formData.append("services[]", service);
        });

      files.forEach((file) => {
        formData.append("verificationMedia", file);
      });

      await api.post("/v1/creator-applications", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      navigate("/creator-pending");
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Failed to submit application"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 text-white overflow-hidden">

      {/* Background Glow */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-teal-500/10 blur-[140px] rounded-full" />
      </div>

      <div className="w-full max-w-md bg-white/5 border border-white/10 backdrop-blur-lg rounded-2xl p-6">

        <h2 className="text-2xl font-bold mb-1">
          Become a Creator
        </h2>

        <p className="text-gray-400 text-sm mb-5">
          Submit your creator profile for review
        </p>

        {!isVerified && (
          <div className="mb-4 rounded-md bg-yellow-500/10 border border-yellow-500/30 p-3 text-sm text-yellow-400">
            {getLockMessage()}
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-md bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* INPUT STYLE */}
          {[
            { name: "displayName", placeholder: "Display Name" },
            { name: "primaryCategory", placeholder: "Primary Category" },
            { name: "country", placeholder: "Country" },
            { name: "city", placeholder: "City" },
          ].map((field) => (
            <input
              key={field.name}
              name={field.name}
              placeholder={field.placeholder}
              value={(form as any)[field.name]}
              onChange={handleChange}
              disabled={!isVerified}
              required
              className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
          ))}

          {/* SELECT */}
          <div className="relative">
            <select
              name="currency"
              value={form.currency}
              onChange={handleChange}
              disabled={!isVerified}
              required
              className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-teal-400 appearance-none"
            >
              <option value="" className="bg-[#020617] text-gray-400">
                Select Currency
              </option>

              {currencies.map((c) => (
                <option
                  key={c.code}
                  value={c.code}
                  className="bg-[#020617] text-white"
                >
                  {c.code} — {c.label}
                </option>
              ))}
            </select>

            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              ▼
            </div>
          </div>

          <input
            name="services"
            placeholder="Services (comma separated)"
            value={form.services}
            onChange={handleChange}
            disabled={!isVerified}
            className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400"
          />

          <textarea
            name="publicBio"
            placeholder="Public Bio"
            value={form.publicBio}
            onChange={handleChange}
            disabled={!isVerified}
            required
            className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400 min-h-[120px]"
          />

          {/* MEDIA */}
          <div>
            <label className="text-sm text-gray-300 mb-2 block">
              Verification Media
            </label>

            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              disabled={!isVerified}
              className="text-sm text-gray-300"
            />

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
            disabled={loading || !isVerified}
            className="w-full bg-teal-400 text-black font-semibold py-3 rounded-xl hover:bg-teal-300 transition disabled:opacity-50"
          >
            {loading ? "Submitting..." : "Submit Application"}
          </button>

        </form>
      </div>
    </div>
  );
}
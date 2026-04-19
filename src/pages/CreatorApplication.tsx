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
    languages: "",
  });

  const [profileStatus, setProfileStatus] = useState<string | null>(null);
  const isVerified = profileStatus === "verified";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

  const getLockMessage = () => {
    if (!profileStatus)
      return "Profile not found. Please complete your profile.";

    if (profileStatus === "pending_verification")
      return "Your profile is under verification.";

    if (profileStatus === "rejected")
      return "Your profile was rejected. Please update and resubmit.";

    return "";
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isVerified || loading) return;

    setError("");
    setLoading(true);

    try {
      await api.post("/v1/creator-applications", {
        ...form,
        services: form.services
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        languages: form.languages
          .split(",")
          .map((l) => l.trim())
          .filter(Boolean),
      });

      navigate("/dashboard/user");
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

      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] md:w-[900px] h-[400px] md:h-[600px] bg-teal-500/10 blur-[120px] md:blur-[150px] rounded-full" />
      </div>

      <div className="w-full max-w-lg bg-white/5 border border-white/10 backdrop-blur-lg rounded-2xl p-6 md:p-8">

        <h2 className="text-2xl font-bold mb-2">
          Become a Creator
        </h2>

        <p className="text-gray-400 text-sm mb-6">
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

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* INPUTS */}
          <input name="displayName" placeholder="Display Name" onChange={handleChange} disabled={!isVerified} required className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10" />
          <input name="primaryCategory" placeholder="Primary Category" onChange={handleChange} disabled={!isVerified} required className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10" />
          <input name="country" placeholder="Country" onChange={handleChange} disabled={!isVerified} required className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10" />
          <input name="city" placeholder="City" onChange={handleChange} disabled={!isVerified} required className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10" />

          {/* CURRENCY */}
          <div className="relative">
            <select
              name="currency"
              value={form.currency}
              onChange={handleChange}
              disabled={!isVerified}
              required
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white appearance-none"
            >
              <option value="" className="bg-[#020617] text-gray-400">
                Select Currency
              </option>

              {currencies.map((c) => (
                <option
                  key={c.code}
                  value={c.code}
                  className="bg-white text-black"
                >
                  {c.code} — {c.label}
                </option>
              ))}
            </select>

            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              ▼
            </div>
          </div>

          <input name="services" placeholder="Services (comma separated)" onChange={handleChange} disabled={!isVerified} className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10" />

          {/* ✅ NEW FIELD */}
          <input name="languages" placeholder="Languages (comma separated)" onChange={handleChange} disabled={!isVerified} className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10" />

          <textarea name="publicBio" placeholder="Public Bio" onChange={handleChange} disabled={!isVerified} required className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10" />

          <button
            disabled={loading || !isVerified}
            className="w-full bg-teal-400 text-black font-semibold py-3 rounded-xl disabled:opacity-50"
          >
            {loading ? "Submitting..." : "Submit Application"}
          </button>

        </form>
      </div>
    </div>
  );
}
// frontend/src/pages/CreatorApplication.tsx

import { useEffect, useState } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";
import { currencies } from "../constants/currencies";

/* ================= CLOUDINARY ================= */

const uploadToCloudinary = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "unsigned_preset");

  const res = await fetch(
    "https://api.cloudinary.com/v1_1/dg8hixi8e/image/upload",
    {
      method: "POST",
      body: formData,
    }
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
  const isVerified = profileStatus === "verified";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* ================= FETCH PROFILE ================= */

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/v1/profile/me");
        setProfileStatus(res.data?.profileStatus || null);
      } catch {
        setProfileStatus(null);
      }
    };

    fetchProfile();
  }, []);

  /* ================= CLOSE DROPDOWN ================= */

  useEffect(() => {
    const close = () => setCurrencyOpen(false);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  /* ================= FILTER ================= */

  const filteredCurrencies = currencies.filter((c) =>
    `${c.code} ${c.label}`.toLowerCase().includes(currencySearch.toLowerCase())
  );

  /* ================= HANDLERS ================= */

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAvatarUpload = async (file: File) => {
    const preview = URL.createObjectURL(file);
    setAvatarUrl(preview);

    const url = await uploadToCloudinary(file);
    setAvatarUrl(url);
  };

  const handleCoverUpload = async (file: File) => {
    const preview = URL.createObjectURL(file);
    setCoverUrl(preview);

    const url = await uploadToCloudinary(file);
    setCoverUrl(url);
  };

  const handleMediaUpload = async (files: FileList) => {
    const arr = Array.from(files);

    for (const file of arr) {
      const preview = URL.createObjectURL(file);
      setMedia((prev) => [...prev, preview]);

      const url = await uploadToCloudinary(file);

      setMedia((prev) => {
        const updated = [...prev];
        const index = updated.indexOf(preview);
        if (index !== -1) updated[index] = url;
        return updated;
      });
    }
  };

  const removeMedia = (i: number) => {
    setMedia((prev) => prev.filter((_, idx) => idx !== i));
  };

  /* ================= SUBMIT ================= */

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    if (!isVerified) return;

    setLoading(true);
    setError("");

    try {
      await api.post("/v1/creator-applications", {
        ...form,
        avatarUrl,
        coverUrl,
        media,
        services: form.services.split(",").map((s) => s.trim()),
        languages: form.languages.split(",").map((l) => l.trim()),
      });

      navigate("/dashboard/user");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed");
    } finally {
      setLoading(false);
    }
  };

  /* ================= UI ================= */

  return (
    <div className="min-h-screen flex items-center justify-center px-4 text-white bg-gradient-to-br from-[#041c1c] via-[#052828] to-[#020617]">

      <div className="w-full max-w-lg bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-6">

        <h2 className="text-2xl font-bold mb-2">Become a Creator</h2>
        <p className="text-gray-400 text-sm mb-6">Submit for review</p>

        {error && <p className="text-red-400 mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* INPUTS */}
          <input name="displayName" placeholder="Display Name" onChange={handleChange} className="input" />
          <input name="primaryCategory" placeholder="Primary Category" onChange={handleChange} className="input" />
          <input name="country" placeholder="Country" onChange={handleChange} className="input" />
          <input name="city" placeholder="City" onChange={handleChange} className="input" />

          {/* SEARCHABLE CURRENCY */}
          <div className="relative">
            <input
              value={currencySearch || form.currency}
              onChange={(e) => {
                setCurrencySearch(e.target.value);
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
              <div className="absolute z-50 mt-2 w-full max-h-60 overflow-y-auto rounded-lg bg-white border border-white/10 shadow-xl">

                {filteredCurrencies.length > 0 ? (
                  filteredCurrencies.map((c) => (
                    <div
                      key={c.code}
                      onClick={() => {
                        setForm({ ...form, currency: c.code });
                        setCurrencySearch(`${c.code} — ${c.label}`);
                        setCurrencyOpen(false);
                      }}
                      className="px-3 py-2 hover:bg-white/10 cursor-pointer text-sm text-black"
                    >
                      {c.code} — {c.label}
                    </div>
                  ))
                ) : (
                  <div className="px-3 py-2 text-gray-400 text-sm">
                    No results found
                  </div>
                )}

              </div>
            )}
          </div>

          <input name="services" placeholder="Services" onChange={handleChange} className="input" />
          <input name="languages" placeholder="Languages" onChange={handleChange} className="input" />

          <textarea name="publicBio" placeholder="Public Bio" onChange={handleChange} className="input" />

          {/* AVATAR */}
          <div>
            <p className="text-sm mb-1">Avatar</p>
            <input type="file" onChange={(e) => e.target.files && handleAvatarUpload(e.target.files[0])} />

            {avatarUrl && (
              <div className="relative w-20 h-20 mt-2">
                <img src={avatarUrl} className="w-20 h-20 object-cover rounded-full" />
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

          {/* COVER */}
          <div>
            <p className="text-sm mb-1">Cover</p>
            <input type="file" onChange={(e) => e.target.files && handleCoverUpload(e.target.files[0])} />

            {coverUrl && (
              <div className="relative mt-2">
                <img src={coverUrl} className="w-full h-24 object-cover rounded-lg" />
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

          {/* MEDIA */}
          <div>
            <p className="text-sm mb-1">Media</p>
            <input type="file" multiple onChange={(e) => e.target.files && handleMediaUpload(e.target.files)} />

            <div className="grid grid-cols-3 gap-2 mt-2">
              {media.map((img, i) => (
                <div key={i} className="relative">
                  <img src={img} className="h-20 w-full object-cover rounded" />
                  <button
                    type="button"
                    onClick={() => removeMedia(i)}
                    className="absolute top-1 right-1 bg-black/60 text-xs px-1 rounded"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* SUBMIT */}
          <button className="w-full bg-teal-400 text-black py-3 rounded-xl">
            {loading ? "Submitting..." : "Submit Application"}
          </button>

        </form>
      </div>

      {/* INPUT STYLE */}
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
// frontend/src/pages/profile/CreatorProfile.tsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { UPLOAD_PRESET } from "../../config/cloudinary";

/* ================= TYPES ================= */

interface CreatorProfile {
  displayName: string;
  avatarUrl?: string;
  coverUrl?: string;
  media?: string[];
  bio?: string;
  languages?: string[];
  categories?: string[];
  city?: string;
  country?: string;
}

/* ================= CLOUDINARY ================= */

const uploadToCloudinary = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);
  formData.append("folder", "creator_profiles"); // ✅ ADDED

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


/* ================= COMPONENT ================= */

export default function CreatorProfilePage() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState<CreatorProfile | null>(null);

  const [formData, setFormData] = useState({
    displayName: "",
    avatarUrl: "",
    coverUrl: "",
    media: [] as string[],
    bio: "",
    languages: "",
    categories: "",
    city: "",
    country: "",
  });

  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  /* ================= FETCH ================= */

  const fetchProfile = async () => {
    try {
      const res = await api.get("/v1/creator/profile");
      const data = res.data;

      setProfile(data);

      setFormData({
        displayName: data.displayName || "",
        avatarUrl: data.avatarUrl || "",
        coverUrl: data.coverUrl || "",
        media: data.media || [],
        bio: data.bio || "",
        languages: data.languages?.join(", ") || "",
        categories: data.categories?.join(", ") || "",
        city: data.city || "",
        country: data.country || "",
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /* ================= FILE HANDLERS ================= */

  const handleAvatarUpload = async (file: File) => {
    const preview = URL.createObjectURL(file);
    setFormData((p) => ({ ...p, avatarUrl: preview }));

    const url = await uploadToCloudinary(file);
    setFormData((p) => ({ ...p, avatarUrl: url }));
  };

  const handleCoverUpload = async (file: File) => {
    const preview = URL.createObjectURL(file);
    setFormData((p) => ({ ...p, coverUrl: preview }));

    const url = await uploadToCloudinary(file);
    setFormData((p) => ({ ...p, coverUrl: url }));
  };

  const handleMediaUpload = async (files: FileList) => {
    const arr = Array.from(files);

    for (const file of arr) {
      const preview = URL.createObjectURL(file);

      setFormData((p) => ({
        ...p,
        media: [...p.media, preview],
      }));

      const url = await uploadToCloudinary(file);

      setFormData((p) => {
        const updated = [...p.media];
        const index = updated.indexOf(preview);
        if (index !== -1) updated[index] = url;
        return { ...p, media: updated };
      });
    }
  };

  const removeMedia = (index: number) => {
    setFormData((p) => ({
      ...p,
      media: p.media.filter((_, i) => i !== index),
    }));
  };

  /* ================= SAVE ================= */

  const handleSave = async () => {
    try {
      await api.patch("/v1/creator/profile", {
        displayName: formData.displayName,
        avatarUrl: formData.avatarUrl,
        coverUrl: formData.coverUrl,
        media: formData.media,
        bio: formData.bio,
        languages: formData.languages.split(",").map(l => l.trim()).filter(Boolean),
        categories: formData.categories.split(",").map(c => c.trim()).filter(Boolean),
        city: formData.city,
        country: formData.country,
      });

      setEditing(false);
      fetchProfile();
    } catch (err) {
      console.error(err);
      alert("Update failed");
    }
  };

  /* ================= UI ================= */

  if (loading) return <div className="p-10 text-white">Loading...</div>;
  if (!profile) return <div className="p-10 text-white">No profile</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#041c1c] via-[#052828] to-[#020617] text-white">

      <div className="max-w-4xl mx-auto px-4 pt-10 pb-20">

        {/* HEADER */}
        <div className="flex justify-between mb-6">
          <button onClick={() => navigate(-1)}>← Back</button>

          <button
            onClick={() => setEditing(!editing)}
            className="bg-teal-500 px-4 py-2 rounded-lg"
          >
            {editing ? "Cancel" : "Edit Profile"}
          </button>
        </div>

        {/* HERO */}
        <div className="relative mb-14">

          {/* COVER */}
          <div className="relative h-[220px] rounded-2xl overflow-hidden">
            <img
              src={formData.coverUrl}
              className="w-full h-full object-cover cursor-pointer"
              onClick={() => setSelectedImage(formData.coverUrl)}
            />
            <div className="absolute inset-0 bg-black/20 pointer-events-none rounded-2xl" />

            {editing && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    document.getElementById("coverUpload")?.click();
                  }}
                  className="absolute top-3 right-3 z-20 px-3 py-1 text-xs bg-black/60 rounded"
                >
                  Change
                </button>

                <input
                  id="coverUpload"
                  type="file"
                  className="hidden"
                  onChange={(e) =>
                    e.target.files && handleCoverUpload(e.target.files[0])
                  }
                />
              </>
            )}
          </div>

          {/* AVATAR */}
          <div className="absolute left-6 -bottom-12 flex items-center gap-4">

            <div className="relative">
              <img
                src={formData.avatarUrl}
                className="w-20 h-20 rounded-full object-cover cursor-pointer border-4 border-[#041c1c]"
                onClick={() => setSelectedImage(formData.avatarUrl)}
              />

              {editing && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      document.getElementById("avatarUpload")?.click();
                    }}
                    className="absolute bottom-0 right-0 z-20 px-2 py-1 text-xs bg-black/70 rounded-full"
                  >
                    ✎
                  </button>

                  <input
                    id="avatarUpload"
                    type="file"
                    className="hidden"
                    onChange={(e) =>
                      e.target.files && handleAvatarUpload(e.target.files[0])
                    }
                  />
                </>
              )}
            </div>

            <div>
              <h1 className="text-xl font-bold">{formData.displayName}</h1>
              <span className="text-xs bg-purple-500 px-2 py-1 rounded">
                Creator
              </span>
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div className="space-y-8 pt-12">

          {/* CREATOR DETAILS */}
          <div className="bg-white/5 border border-white/10 backdrop-blur-lg rounded-xl p-6">

            <h3 className="text-lg font-semibold mb-4">Creator Details</h3>

            <div className="mb-4">
              <p className="text-sm text-gray-400 mb-1">Language</p>
              {editing ? (
                <input
                  value={formData.languages}
                  onChange={(e) =>
                    setFormData({ ...formData, languages: e.target.value })
                  }
                  className="w-full bg-white/5 border border-white/10 p-3 rounded-lg"
                />
              ) : (
                <p>{formData.languages || "Not specified"}</p>
              )}
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-400 mb-1">Category</p>
              {editing ? (
                <input
                  value={formData.categories}
                  onChange={(e) =>
                    setFormData({ ...formData, categories: e.target.value })
                  }
                  className="w-full bg-white/5 border border-white/10 p-3 rounded-lg"
                />
              ) : (
                <p>{formData.categories || "Not specified"}</p>
              )}
            </div>

            <div>
              <p className="text-sm text-gray-400 mb-1">Location</p>
              {editing ? (
                <div className="grid grid-cols-2 gap-3">
                  <input
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                    className="bg-white/5 border border-white/10 p-3 rounded-lg"
                  />
                  <input
                    value={formData.country}
                    onChange={(e) =>
                      setFormData({ ...formData, country: e.target.value })
                    }
                    className="bg-white/5 border border-white/10 p-3 rounded-lg"
                  />
                </div>
              ) : (
                <p>
                  {formData.city && formData.country
                    ? `${formData.city}, ${formData.country}`
                    : "Not specified"}
                </p>
              )}
            </div>

          </div>

          {/* MEDIA */}
          <div className="bg-white/5 border border-white/10 backdrop-blur-lg rounded-xl p-6">
            <h3 className="mb-3">Media</h3>

            {editing && (
              <input
                type="file"
                multiple
                onChange={(e) =>
                  e.target.files && handleMediaUpload(e.target.files)
                }
                className="mb-4"
              />
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {formData.media.map((img, i) => (
                <div key={i} className="relative h-32">
                  <img
                    src={img}
                    className="w-full h-full object-cover rounded cursor-pointer"
                    onClick={() => setSelectedImage(img)}
                  />

                  {editing && (
                    <button
                      onClick={() => removeMedia(i)}
                      className="absolute top-1 right-1 bg-black/70 px-2 text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ABOUT */}
          <div className="bg-white/5 border border-white/10 backdrop-blur-lg rounded-xl p-6">
            {editing ? (
              <textarea
                value={formData.bio}
                onChange={(e) =>
                  setFormData({ ...formData, bio: e.target.value })
                }
                className="w-full bg-white/5 border border-white/10 p-3 rounded-lg"
              />
            ) : (
              <p>{formData.bio}</p>
            )}
          </div>

          {/* SAVE */}
          {editing && (
            <button
              onClick={handleSave}
              className="w-full bg-teal-500 py-3 rounded-lg"
            >
              Save Changes
            </button>
          )}
        </div>
      </div>

      {/* FULLSCREEN */}
      {selectedImage && (
        <div
          onClick={() => setSelectedImage(null)}
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50"
        >
          <img
            src={selectedImage}
            className="max-w-[90%] max-h-[90%] rounded-lg"
          />
        </div>
      )}
    </div>
  );
}
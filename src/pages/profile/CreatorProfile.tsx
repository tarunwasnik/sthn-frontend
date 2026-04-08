// frontend/src/pages/profile/CreatorProfile.tsx

import { useEffect, useState } from "react";
import api from "../../api/axios";

interface CreatorProfile {
  displayName: string;
  avatarUrl: string;
  bio: string;
  languages: string[];
  categories: string[];
  city: string;
  country: string;
  currency: string;
  slug: string;
  media?: string[]; // ✅ ADDED
}

export default function CreatorProfile() {
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  const [newMediaUrl, setNewMediaUrl] = useState(""); // ✅ NEW INPUT

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get("/v1/creator/profile");
      const data = res.data;

      setProfile(data);

      setFormData({
        displayName: data?.displayName || "",
        avatarUrl: data?.avatarUrl || "",
        bio: data?.bio || "",
        languages: Array.isArray(data?.languages)
          ? data.languages.join(", ")
          : "",
        categories: Array.isArray(data?.categories)
          ? data.categories.join(", ")
          : "",
        city: data?.city || "",
        country: data?.country || "",
        media: Array.isArray(data?.media) ? data.media : [], // ✅ INIT
      });
    } catch (err) {
      console.error("Failed to load creator profile", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMedia = () => {
    if (!newMediaUrl.trim()) return;

    setFormData({
      ...formData,
      media: [...(formData.media || []), newMediaUrl.trim()],
    });

    setNewMediaUrl("");
  };

  const handleRemoveMedia = (index: number) => {
    const updated = [...formData.media];
    updated.splice(index, 1);

    setFormData({
      ...formData,
      media: updated,
    });
  };

  const handleSave = async () => {
    if (!formData.displayName) {
      alert("Display name is required");
      return;
    }

    try {
      await api.patch("/v1/creator/profile", {
        displayName: formData.displayName,
        avatarUrl: formData.avatarUrl,
        bio: formData.bio,
        languages: formData.languages
          .split(",")
          .map((l: string) => l.trim())
          .filter(Boolean),
        categories: formData.categories
          .split(",")
          .map((c: string) => c.trim())
          .filter(Boolean),
        city: formData.city,
        country: formData.country,
        media: formData.media || [], // ✅ SEND MEDIA
      });

      alert("Profile updated successfully");

      setEditing(false);

      await fetchProfile();
    } catch (err) {
      console.error("Failed to update creator profile", err);
    }
  };

  if (loading) {
    return <div className="p-8 text-white">Loading...</div>;
  }

  if (!profile) {
    return <div className="p-8 text-white">Profile not found</div>;
  }

  return (
    <div className="min-h-screen bg-[#0B1220] text-white p-8">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* HEADER */}
        <div className="bg-[#0F172A] p-6 rounded-xl border border-gray-800 flex justify-between items-center">

          <div className="flex items-center gap-4">

            {/* AVATAR */}
            <div className="w-16 h-16 rounded-full bg-gray-700 overflow-hidden flex items-center justify-center">
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-lg font-bold">
                  {profile.displayName?.charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            <div>
              <h2 className="text-xl font-bold">
                {profile.displayName}
              </h2>
              <p className="text-sm text-gray-400">
                Creator Profile
              </p>
            </div>
          </div>

          <div className="flex gap-3">

            <button
              onClick={() =>
                window.open(`/creators/${profile.slug}`, "_blank")
              }
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg"
            >
              View Public
            </button>

            <button
              onClick={() => setEditing(!editing)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
            >
              {editing ? "Cancel" : "Edit"}
            </button>

          </div>
        </div>

        {/* FORM */}
        <div className="bg-[#0F172A] p-6 rounded-xl border border-gray-800 space-y-4">

          {/* DISPLAY NAME */}
          <div>
            <label className="text-sm text-gray-400">
              Display Name
            </label>
            <input
              value={formData.displayName}
              disabled={!editing}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  displayName: e.target.value,
                })
              }
              className="w-full bg-[#020617] p-2 rounded"
            />
          </div>

          {/* AVATAR */}
          <div>
            <label className="text-sm text-gray-400">
              Avatar URL
            </label>
            <input
              value={formData.avatarUrl}
              disabled={!editing}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  avatarUrl: e.target.value,
                })
              }
              className="w-full bg-[#020617] p-2 rounded"
            />
          </div>

          {/* 🔥 MEDIA GALLERY */}
          <div>
            <label className="text-sm text-gray-400">
              Media Gallery
            </label>

            {/* ADD MEDIA */}
            {editing && (
              <div className="flex gap-2 mt-2">
                <input
                  placeholder="Enter image URL"
                  value={newMediaUrl}
                  onChange={(e) => setNewMediaUrl(e.target.value)}
                  className="flex-1 bg-[#020617] p-2 rounded"
                />
                <button
                  onClick={handleAddMedia}
                  className="px-4 bg-blue-600 rounded"
                >
                  Add
                </button>
              </div>
            )}

            {/* PREVIEW GRID */}
            {formData.media?.length > 0 && (
              <div className="grid grid-cols-3 gap-3 mt-4">
                {formData.media.map((url: string, index: number) => (
                  <div
                    key={index}
                    className="relative group rounded-lg overflow-hidden border border-gray-700"
                  >
                    <img
                      src={url}
                      className="w-full h-28 object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />

                    {editing && (
                      <button
                        onClick={() => handleRemoveMedia(index)}
                        className="absolute top-1 right-1 bg-red-600 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* BIO */}
          <div>
            <label className="text-sm text-gray-400">
              Bio
            </label>
            <textarea
              value={formData.bio}
              disabled={!editing}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  bio: e.target.value,
                })
              }
              className="w-full bg-[#020617] p-2 rounded"
            />
          </div>

          {/* LANGUAGES */}
          <div>
            <label className="text-sm text-gray-400">
              Languages
            </label>
            <input
              value={formData.languages}
              disabled={!editing}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  languages: e.target.value,
                })
              }
              className="w-full bg-[#020617] p-2 rounded"
            />
          </div>

          {/* CATEGORIES */}
          <div>
            <label className="text-sm text-gray-400">
              Categories
            </label>
            <input
              value={formData.categories}
              disabled={!editing}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  categories: e.target.value,
                })
              }
              className="w-full bg-[#020617] p-2 rounded"
            />
          </div>

          {/* LOCATION */}
          <div className="grid grid-cols-2 gap-4">
            <input
              placeholder="City"
              value={formData.city}
              disabled={!editing}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  city: e.target.value,
                })
              }
              className="bg-[#020617] p-2 rounded"
            />

            <input
              placeholder="Country"
              value={formData.country}
              disabled={!editing}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  country: e.target.value,
                })
              }
              className="bg-[#020617] p-2 rounded"
            />
          </div>

          {/* CURRENCY */}
          <div>
            <label className="text-sm text-gray-400">
              Currency
            </label>
            <input
              value={profile.currency}
              disabled
              className="w-full bg-gray-800 p-2 rounded text-gray-400"
            />
          </div>

          {/* SAVE */}
          {editing && (
            <button
              onClick={handleSave}
              className="w-full bg-green-600 py-3 rounded-lg hover:bg-green-700"
            >
              Save Changes
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
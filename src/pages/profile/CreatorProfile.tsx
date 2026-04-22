// frontend/src/pages/profile/CreatorProfile.tsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";

/* ================= TYPES ================= */

interface CreatorProfile {
  displayName: string;
  bio?: string;
  languages?: string[];
  categories?: string[];
  city?: string;
  country?: string;
  currency: string;
  slug: string;
}

interface UserProfile {
  avatar: string;
  cover: string;
  profilePhotos: string[];
  bio: string;
}

/* ================= COMPONENT ================= */

export default function CreatorProfilePage() {
  const navigate = useNavigate();

  const [creator, setCreator] = useState<CreatorProfile | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);

  const [formData, setFormData] = useState({
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
    fetchData();
  }, []);

  /* ================= FETCH ================= */

  const fetchData = async () => {
    try {
      const [creatorRes, userRes] = await Promise.all([
        api.get("/v1/creator/profile"),
        api.get("/v1/profile/me"),
      ]);

      const creatorData = creatorRes.data;
      const userData = userRes.data;

      setCreator(creatorData);
      setUser(userData);

      setFormData({
        bio: creatorData?.bio || userData?.bio || "",
        languages: creatorData?.languages?.join(", ") || "",
        categories: creatorData?.categories?.join(", ") || "",
        city: creatorData?.city || "",
        country: creatorData?.country || "",
      });

    } catch (err) {
      console.error("Fetch failed", err);
    } finally {
      setLoading(false);
    }
  };

  /* ================= SAVE ================= */

  const handleSave = async () => {
    try {
      await api.patch("/v1/creator/profile", {
        bio: formData.bio,
        languages: formData.languages
          .split(",")
          .map((l) => l.trim())
          .filter(Boolean),
        categories: formData.categories
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean),
        city: formData.city,
        country: formData.country,
      });

      setEditing(false);
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Update failed");
    }
  };

  /* ================= UI ================= */

  if (loading) return <div className="p-10 text-white">Loading...</div>;
  if (!creator || !user) return <div className="p-10 text-white">Profile error</div>;

  const avatar = user.avatar;
  const cover = user.cover;
  const media = user.profilePhotos || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#041c1c] via-[#052828] to-[#020617] text-white">

      <div className="max-w-4xl mx-auto px-4 pt-10 pb-20">

        {/* HEADER */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => navigate(-1)} className="text-sm text-gray-300">
            ← Back
          </button>

          <button
            onClick={() => setEditing(!editing)}
            className="px-4 py-2 bg-teal-500 rounded-lg"
          >
            {editing ? "Cancel" : "Edit Profile"}
          </button>
        </div>

        {/* HERO */}
        <div className="relative mb-14">

          {/* COVER */}
          <div className="h-[220px] rounded-2xl overflow-hidden">
            {cover ? (
              <img
                src={cover}
                className="w-full h-full object-cover cursor-pointer"
                onClick={() => setSelectedImage(cover)}
              />
            ) : (
              <div className="w-full h-full bg-gray-800" />
            )}
            <div className="absolute inset-0 bg-black/40" />
          </div>

          {/* AVATAR */}
          <div className="absolute left-6 -bottom-12 flex items-center gap-4">
            <div className="w-20 h-20 rounded-full border-4 border-[#041c1c] overflow-hidden">
              {avatar && (
                <img
                  src={avatar}
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={() => setSelectedImage(avatar)}
                />
              )}
            </div>

            <div>
              <h1 className="text-xl font-bold">{creator.displayName}</h1>
              <span className="text-xs bg-purple-500 px-2 py-1 rounded">
                Creator
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-8 pt-12">

          {/* CREATOR DETAILS */}
          <div className="bg-[#071c1c] rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4">Creator Details</h3>

            {/* LANGUAGES */}
            <div className="mb-4">
              <p className="text-sm text-gray-400 mb-2">Language</p>
              <div className="flex flex-wrap gap-2">
                {creator.languages?.length ? (
                  creator.languages.map((l, i) => (
                    <span key={i} className="px-3 py-1 bg-white/10 rounded-full text-sm">
                      {l}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-500 text-sm">Not specified</span>
                )}
              </div>
            </div>

            {/* CATEGORY */}
            <div className="mb-4">
              <p className="text-sm text-gray-400 mb-2">Category</p>
              <div className="flex flex-wrap gap-2">
                {creator.categories?.length ? (
                  creator.categories.map((c, i) => (
                    <span key={i} className="px-3 py-1 bg-purple-500/20 rounded-full text-sm">
                      {c}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-500 text-sm">Not specified</span>
                )}
              </div>
            </div>

            {/* LOCATION */}
            <div>
              <p className="text-sm text-gray-400 mb-2">Location</p>
              <p className="text-gray-300">
                {creator.city && creator.country
                  ? `${creator.city}, ${creator.country}`
                  : "Not specified"}
              </p>
            </div>
          </div>

          {/* MEDIA */}
          <div className="bg-[#071c1c] rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4">Media</h3>

            <p className="text-xs text-gray-400 mb-3">
              Media is managed from User Profile
            </p>

            {media.length === 0 ? (
              <p className="text-gray-500">No media uploaded</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {media.map((img, i) => (
                  <div key={i} className="h-32 rounded overflow-hidden">
                    <img
                      src={img}
                      className="w-full h-full object-cover cursor-pointer"
                      onClick={() => setSelectedImage(img)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ABOUT */}
          <div className="bg-[#071c1c] rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-3">About</h3>

            {editing ? (
              <textarea
                value={formData.bio}
                onChange={(e) =>
                  setFormData({ ...formData, bio: e.target.value })
                }
                className="w-full bg-[#020617] p-3 rounded"
              />
            ) : (
              <p className="text-gray-300">
                {formData.bio || "No description added yet"}
              </p>
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

      {/* FULLSCREEN IMAGE */}
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
// frontend/src/pages/profile/UserProfile.tsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";

/* ================= TYPES ================= */

interface UserProfile {
  username: string;
  bio: string;
  interests: string[];
  profilePhotos: string[];
  avatar: string;
  cover: string;
  dateOfBirth: string;
  profileStatus: string;
  age?: number;
}

interface FormState {
  bio: string;
  interests: string;
  dateOfBirth: string;
  previewImages: string[];
}

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

/* ================= COMPONENT ================= */

export default function UserProfilePage() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState<UserProfile | null>(null);

  const [formData, setFormData] = useState<FormState>({
    bio: "",
    interests: "",
    dateOfBirth: "",
    previewImages: [],
  });

  const [avatar, setAvatar] = useState<string | null>(null);
  const [cover, setCover] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  /* ================= FETCH ================= */

  const fetchProfile = async () => {
    try {
      const res = await api.get("/v1/profile/me");
      const data = res.data;

      setProfile(data);

      setFormData({
        bio: data?.bio || "",
        interests: Array.isArray(data?.interests)
          ? data.interests.join(", ")
          : "",
        dateOfBirth:
          typeof data?.dateOfBirth === "string"
            ? data.dateOfBirth.split("T")[0]
            : "",
        previewImages: data?.profilePhotos || [],
      });

      setAvatar(data?.avatar || null);
      setCover(data?.cover || null);

    } catch (err) {
      console.error("Fetch failed", err);
    } finally {
      setLoading(false);
    }
  };

  /* ================= SAVE ================= */

  const handleSave = async () => {
    if (!formData.bio) {
      alert("Bio required");
      return;
    }

    if (!avatar) {
      alert("Avatar required");
      return;
    }

    if (!cover) {
      alert("Cover required");
      return;
    }

    if (formData.previewImages.length < 2 || formData.previewImages.length > 6) {
      alert("Gallery must be 2–6 images");
      return;
    }

    try {
      await api.patch("/v1/profile/me", {
        bio: formData.bio,
        interests: formData.interests
          .split(",")
          .map((i) => i.trim())
          .filter(Boolean),
        profilePhotos: formData.previewImages,
        avatar,
        cover,
        dateOfBirth: formData.dateOfBirth,
      });

      alert("Profile updated");
      setEditing(false);
      fetchProfile();
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.message || "Update failed");
    }
  };

  /* ================= FILE UPLOAD ================= */

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!e.target.files) return;

    const files = Array.from(e.target.files);

    for (const file of files) {
      const preview = URL.createObjectURL(file);

      setFormData((prev) => ({
        ...prev,
        previewImages: [...prev.previewImages, preview],
      }));

      try {
        const url = await uploadToCloudinary(file);

        setFormData((prev) => {
          const updated = [...prev.previewImages];
          const index = updated.indexOf(preview);
          if (index !== -1) updated[index] = url;

          return { ...prev, previewImages: updated };
        });
      } catch (err) {
        console.error("Upload failed", err);
      }
    }
  };

  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      previewImages: prev.previewImages.filter((_, i) => i !== index),
    }));
  };

  /* ================= UI ================= */

  if (loading) return <div className="p-10 text-white">Loading...</div>;
  if (!profile) return <div className="p-10 text-white">No profile</div>;

  const avatarImage = avatar !== null ? avatar : formData.previewImages?.[0];
  const coverImage = cover !== null ? cover : formData.previewImages?.[1];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#041c1c] via-[#052828] to-[#020617] text-white">

      <div className="max-w-4xl mx-auto px-4 pt-10 pb-16">

        {/* HEADER */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => navigate(-1)} className="text-sm text-gray-300 hover:text-white">
            ← Back
          </button>

          <button
            onClick={() => setEditing(!editing)}
            className="px-4 py-2 bg-teal-500 hover:bg-teal-600 rounded-lg"
          >
            {editing ? "Cancel" : "Edit Profile"}
          </button>
        </div>

        {/* HERO */}
        <div className="relative mb-14">
          <div className="h-[220px] rounded-2xl overflow-hidden">
            {coverImage ? (
              <img src={coverImage} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-teal-700/40 to-cyan-500/20" />
            )}
            <div className="absolute inset-0 bg-black/40" />
          </div>

          <div className="absolute left-6 -bottom-12 flex items-center gap-4">
            <div className="w-20 h-20 rounded-full border-4 border-[#041c1c] overflow-hidden">
              {avatarImage && (
                <img src={avatarImage} className="w-full h-full object-cover" />
              )}
            </div>

            <div>
              <h1 className="text-xl font-bold">{profile.username}</h1>
              <span className="text-xs bg-teal-500 px-2 py-1 rounded">
                {profile.profileStatus}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-8 pt-12">

          {/* ABOUT */}
          <div className="bg-[#071c1c] rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-3">About</h3>

            {editing ? (
              <>
                <textarea
                  value={formData.bio}
                  onChange={(e) =>
                    setFormData({ ...formData, bio: e.target.value })
                  }
                  className="w-full bg-[#020617] p-3 rounded"
                />

                <input
                  value={formData.interests}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      interests: e.target.value,
                    })
                  }
                  className="w-full mt-3 bg-[#020617] p-2 rounded"
                />
              </>
            ) : (
              <>
                <p className="text-gray-300">{profile.bio}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {profile.interests.map((i, idx) => (
                    <span key={idx} className="px-3 py-1 bg-white/10 rounded-full text-sm">
                      {i}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* MEDIA */}
<div className="bg-[#071c1c] rounded-xl p-6">
  <h3 className="text-lg font-semibold mb-4">Media</h3>

  {/* AVATAR + COVER (EDIT MODE ONLY) */}
  {editing && (
    <div className="mb-4 space-y-4">

      {/* Avatar */}
      <div>
        <label className="text-sm text-gray-300 mb-1 block">
          Avatar
        </label>

        <input
          type="file"
          accept="image/*"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;

            const preview = URL.createObjectURL(file);
            setAvatar(preview);

            const url = await uploadToCloudinary(file);
            setAvatar(url);
          }}
          className="mb-2"
        />

        {avatar !== null && (
          <div className="relative w-20 h-20">
            <img
              src={avatar}
              className="w-20 h-20 object-cover rounded-full"
            />
            <button
              type="button"
              onClick={() => setAvatar(null)}
              className="absolute top-0 right-0 bg-black/60 text-xs px-1 rounded"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Cover */}
      <div>
        <label className="text-sm text-gray-300 mb-1 block">
          Cover
        </label>

        <input
          type="file"
          accept="image/*"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;

            const preview = URL.createObjectURL(file);
            setCover(preview);

            const url = await uploadToCloudinary(file);
            setCover(url);
          }}
          className="mb-2"
        />

        {cover !== null && (
          <div className="relative">
            <img
              src={cover}
              className="w-full h-24 object-cover rounded-lg"
            />
            <button
              type="button"
              onClick={() => setCover(null)}
              className="absolute top-1 right-1 bg-black/60 text-xs px-1 rounded"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* GALLERY UPLOAD */}
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileChange}
        className="mt-2"
      />
    </div>
  )}

  {/* GALLERY GRID */}
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
    {formData.previewImages.map((img, i) => (
      <div key={i} className="relative h-32 rounded overflow-hidden">

        <img
          src={img}
          className="w-full h-full object-cover cursor-pointer"
          onClick={() => !editing && setSelectedImage(img)}
        />

        {editing && (
          <button
            onClick={() => removeImage(i)}
            className="absolute top-1 right-1 bg-black/60 text-xs px-2 py-1 rounded"
          >
            ✕
          </button>
        )}
      </div>
    ))}
  </div>
</div>

          {/* PERSONAL INFO */}
          <div className="bg-[#071c1c] rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4">Personal Info</h3>

            <div className="flex justify-between">
              <span className="text-gray-400">DOB</span>

              {editing ? (
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      dateOfBirth: e.target.value,
                    })
                  }
                  className="bg-[#020617] p-2 rounded"
                />
              ) : (
                <span>{formData.dateOfBirth}</span>
              )}
            </div>

            <div className="flex justify-between mt-3">
              <span className="text-gray-400">Age</span>
              <span>{profile.age || "-"}</span>
            </div>
          </div>

          {/* SAVE */}
          {editing && (
            <button
              onClick={handleSave}
              className="w-full bg-teal-500 hover:bg-teal-600 py-3 rounded-lg"
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
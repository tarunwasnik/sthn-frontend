// frontend/src/pages/profile/UserProfile.tsx

import { useEffect, useState } from "react";
import api from "../../api/axios";

interface UserProfile {
  username: string;
  bio: string;
  interests: string[];
  profilePhotos: string[];
  dateOfBirth: string;
  profileStatus: string;
  age?: number;
}

export default function UserProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get("/v1/profile/me");
      const data = res.data;

      setProfile(data);

      setFormData({
        username: data?.username || "",
        bio: data?.bio || "",
        interests: Array.isArray(data?.interests)
          ? data.interests.join(", ")
          : "",
        profilePhotos: Array.isArray(data?.profilePhotos)
          ? data.profilePhotos.join(", ")
          : "",
        dateOfBirth:
          typeof data?.dateOfBirth === "string"
            ? data.dateOfBirth.split("T")[0]
            : "",
      });
    } catch (err) {
      console.error("Failed to fetch profile", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.bio) {
      alert("Bio is required");
      return;
    }

    const photos = formData.profilePhotos
      .split(",")
      .map((p: string) => p.trim())
      .filter(Boolean);

    if (photos.length < 2) {
      alert("At least 2 profile photos required");
      return;
    }

    try {
      await api.patch("/v1/profile/me", {
        username: formData.username,
        bio: formData.bio,
        interests: formData.interests
          .split(",")
          .map((i: string) => i.trim())
          .filter(Boolean),
        profilePhotos: photos,
        dateOfBirth: formData.dateOfBirth,
      });

      alert("Profile updated successfully");
      setEditing(false);
      fetchProfile();
    } catch (err) {
      console.error("Failed to save profile", err);
    }
  };

  if (loading) return <div className="p-10 text-white">Loading...</div>;
  if (!profile) return <div className="p-10 text-white">No profile</div>;

  const avatar = profile.profilePhotos?.[0];

  const statusColor =
    profile.profileStatus === "approved"
      ? "bg-green-600"
      : profile.profileStatus === "rejected"
      ? "bg-red-600"
      : "bg-yellow-600";

  return (
    <div className="min-h-screen bg-[#0B1220] text-white p-8">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* HEADER */}
        <div className="bg-[#0F172A] p-6 rounded-xl border border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-4">

            {/* AVATAR */}
            <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-700 flex items-center justify-center">
              {avatar ? (
                <img
                  src={avatar}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-lg font-bold">
                  {profile.username?.charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            <div>
              <h2 className="text-xl font-bold">{profile.username}</h2>

              <span
                className={`text-xs px-2 py-1 rounded ${statusColor}`}
              >
                {profile.profileStatus}
              </span>
            </div>
          </div>

          <button
            onClick={() => setEditing(!editing)}
            className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            {editing ? "Cancel" : "Edit Profile"}
          </button>
        </div>

        {/* ABOUT */}
        <div className="bg-[#0F172A] p-6 rounded-xl border border-gray-800">
          <h3 className="font-semibold mb-3">About</h3>

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
              {profile.bio || "No bio yet"}
            </p>
          )}

          <div className="mt-4">
            <h4 className="text-sm text-gray-400 mb-1">Interests</h4>

            {editing ? (
              <input
                value={formData.interests}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    interests: e.target.value,
                  })
                }
                className="w-full bg-[#020617] p-2 rounded"
              />
            ) : (
              <div className="flex flex-wrap gap-2">
                {profile.interests?.map((i, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 bg-gray-800 rounded text-sm"
                  >
                    {i}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* PHOTOS */}
        <div className="bg-[#0F172A] p-6 rounded-xl border border-gray-800">
          <h3 className="font-semibold mb-3">Profile Photos</h3>

          {editing ? (
            <input
              value={formData.profilePhotos}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  profilePhotos: e.target.value,
                })
              }
              className="w-full bg-[#020617] p-2 rounded"
            />
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {profile.profilePhotos?.map((url, i) => (
                <div
                  key={i}
                  className={`w-full h-28 bg-gray-800 rounded overflow-hidden ${
                    i === 0 ? "ring-2 ring-blue-500" : ""
                  }`}
                >
                  <img
                    src={url}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* PERSONAL INFO */}
        <div className="bg-[#0F172A] p-6 rounded-xl border border-gray-800">
          <h3 className="font-semibold mb-3">Personal Info</h3>

          <div className="flex justify-between">
            <span className="text-gray-400">Date of Birth</span>

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

          <div className="flex justify-between mt-2">
            <span className="text-gray-400">Age</span>
            <span>{profile.age || "-"}</span>
          </div>
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
  );
}
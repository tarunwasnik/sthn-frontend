// frontend/src/pages/PublicUserProfile.tsx

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/axios";

interface UserProfile {
  username: string;
  bio: string;
  interests: string[];
  profilePhotos: string[];
  age?: number;
}

export default function PublicUserProfile() {
  const { userId } = useParams();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) fetchProfile();
  }, [userId]);

  const fetchProfile = async () => {
    try {
      const res = await api.get(`/v1/users/${userId}`); // ✅ FIXED

      setProfile(res.data.profile); // ✅ IMPORTANT
    } catch (err) {
      console.error("Failed to load public profile", err);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-10 text-white">Loading...</div>;
  if (!profile) return <div className="p-10 text-white">Profile not found</div>;

  const avatar = profile.profilePhotos?.[0];

  return (
    <div className="min-h-screen bg-[#0B1220] text-white p-8">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* HEADER */}
        <div className="bg-[#0F172A] p-6 rounded-xl border border-gray-800 flex items-center gap-4">

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
            <p className="text-sm text-gray-400">User Profile</p>
          </div>
        </div>

        {/* ABOUT */}
        <div className="bg-[#0F172A] p-6 rounded-xl border border-gray-800">
          <h3 className="font-semibold mb-3">About</h3>
          <p className="text-gray-300">
            {profile.bio || "No bio provided"}
          </p>

          <div className="mt-4">
            <h4 className="text-sm text-gray-400 mb-1">Interests</h4>
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
          </div>
        </div>

        {/* PHOTOS */}
        <div className="bg-[#0F172A] p-6 rounded-xl border border-gray-800">
          <h3 className="font-semibold mb-3">Photos</h3>

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
        </div>

        {/* PERSONAL */}
        <div className="bg-[#0F172A] p-6 rounded-xl border border-gray-800">
          <h3 className="font-semibold mb-3">Basic Info</h3>

          <div className="flex justify-between">
            <span className="text-gray-400">Age</span>
            <span>{profile.age || "-"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
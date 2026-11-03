// frontend/src/pages/PublicUserProfile.tsx

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/axios";

interface PublicUserProfile {
  id: string;
  username: string;
  avatar: string;
  cover: string;
  bio: string;
  interests: string[];
  country: string | null;
  city: string | null;
  languages: string[];
  profilePhotos: string[];
  age: number | null;
}

export default function PublicUserProfile() {
  const { userId } = useParams();
  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) fetchProfile();
  }, [userId]);

  const fetchProfile = async () => {
    try {
      const res = await api.get<{ profile: PublicUserProfile }>(`/v1/users/${userId}`);

      setProfile(res.data.profile); // ✅ IMPORTANT
    } catch (err) {
      console.error("Failed to load public profile", err);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-theme-bg p-10 text-theme-muted">Loading...</div>;
  if (!profile) return <div className="min-h-screen bg-theme-bg p-10 text-theme-muted">Profile not found</div>;

  const avatar = profile.avatar || profile.profilePhotos?.[0];

  return (
    <div className="min-h-screen bg-theme-bg p-4 text-theme-text sm:p-8">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* HEADER */}
        <div className="overflow-hidden rounded-[var(--radius-card)] border border-theme-border bg-theme-surface">
          <div className="h-44 bg-theme-inset">
            {profile.cover && <img src={profile.cover} alt={`${profile.username} cover`} className="h-full w-full object-cover" />}
          </div>
          <div className="flex items-center gap-4 p-6">

          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-theme-border bg-theme-inset">
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
            <p className="text-sm text-theme-muted">{[profile.city, profile.country].filter(Boolean).join(", ") || "User Profile"}</p>
          </div>
          </div>
        </div>

        {/* ABOUT */}
        <div className="rounded-[var(--radius-card)] border border-theme-border bg-theme-surface p-6">
          <h3 className="font-semibold mb-3">About</h3>
          <p className="text-theme-muted">
            {profile.bio || "No bio provided"}
          </p>

          <div className="mt-4">
            <h4 className="mb-1 text-sm text-theme-muted">Interests</h4>
            <div className="flex flex-wrap gap-2">
              {profile.interests?.map((i, idx) => (
                <span
                  key={idx}
                  className="rounded-full bg-theme-inset px-2 py-1 text-sm text-theme-text"
                >
                  {i}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <h4 className="mb-1 text-sm text-theme-muted">Languages</h4>
            <div className="flex flex-wrap gap-2">
              {profile.languages?.map((language) => <span key={language} className="rounded-full bg-theme-inset px-2 py-1 text-sm text-theme-text">{language}</span>)}
            </div>
          </div>
        </div>

        {/* PHOTOS */}
        <div className="rounded-[var(--radius-card)] border border-theme-border bg-theme-surface p-6">
          <h3 className="font-semibold mb-3">Photos</h3>

          <div className="grid grid-cols-3 gap-3">
            {profile.profilePhotos?.map((url, i) => (
              <div
                key={i}
                className={`h-28 w-full overflow-hidden rounded-[var(--radius-control)] bg-theme-inset ${
                  i === 0 ? "ring-2 ring-theme-accent" : ""
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
        <div className="rounded-[var(--radius-card)] border border-theme-border bg-theme-surface p-6">
          <h3 className="font-semibold mb-3">Basic Info</h3>

          <div className="flex justify-between">
            <span className="text-theme-muted">Age</span>
            <span>{profile.age || "-"}</span>
          </div>
          <div className="mt-3 flex justify-between">
            <span className="text-theme-muted">Location</span>
            <span>{[profile.city, profile.country].filter(Boolean).join(", ") || "-"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

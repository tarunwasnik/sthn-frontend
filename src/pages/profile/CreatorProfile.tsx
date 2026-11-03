// frontend/src/pages/profile/CreatorProfile.tsx

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { imageAdmissionErrorMessage, releaseUserProfileTemporaryImage, submitUserProfileImageAdmission } from "../../api/imageModeration";
import { createProfileMediaSelection, disposeProfileMediaPreview, isCurrentProfileMediaOperation, markProfileMediaModerating, profileMediaStatusClassName, resolveProfileMediaAdmission, temporaryProfileMediaRelease, toProfileMediaClaim, type ProfileMediaItem } from "../../features/profileMedia/profileMedia";

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

/* ================= COMPONENT ================= */

export default function CreatorProfilePage() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [avatar, setAvatar] = useState<ProfileMediaItem | null>(null);
  const [cover, setCover] = useState<ProfileMediaItem | null>(null);
  const [media, setMedia] = useState<ProfileMediaItem[]>([]);
  const mediaRef = useRef({ avatar, cover, media });
  useEffect(() => { mediaRef.current = { avatar, cover, media }; }, [avatar, cover, media]);
  useEffect(() => () => { const current = mediaRef.current; [current.avatar, current.cover, ...current.media].filter((item): item is ProfileMediaItem => item !== null).forEach(disposeProfileMediaPreview); }, []);

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
  const [error, setError] = useState("");
  const mediaMessage = (item: ProfileMediaItem | null) => {
    if (!item || item.state === "EXISTING") return null;
    if (item.state === "APPROVED") return "Image approved.";
    if (item.state === "UPLOADING" || item.state === "MODERATING") return "Image moderation is in progress.";
    if (item.state === "BLOCKED" || item.state === "UNAVAILABLE" || item.state === "FAILED") return item.message;
    return null;
  };
  const mediaMessageClass = (item: ProfileMediaItem | null) => item?.state === "BLOCKED" ? "text-red-300" : item?.state === "UNAVAILABLE" ? "text-amber-300" : item?.state === "FAILED" ? "text-orange-300" : "text-gray-300";

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
      const existing = (reference: string, surface: "CREATOR_PROFILE_AVATAR" | "CREATOR_PROFILE_COVER" | "CREATOR_PROFILE_MEDIA"): ProfileMediaItem => ({ clientId: `creator-profile-${surface}-${reference}`, operationId: 0, state: "EXISTING", surface, reference });
      setAvatar(data.avatarUrl ? existing(data.avatarUrl, "CREATOR_PROFILE_AVATAR") : null);
      setCover(data.coverUrl ? existing(data.coverUrl, "CREATOR_PROFILE_COVER") : null);
      setMedia((data.media ?? []).map((reference: string) => existing(reference, "CREATOR_PROFILE_MEDIA")));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /* ================= FILE HANDLERS ================= */

  const release = (item: ProfileMediaItem, reportFailure = true) => { const temporary = temporaryProfileMediaRelease(item); if (temporary) void releaseUserProfileTemporaryImage(temporary.assetReference, temporary.surface).catch(() => { if (reportFailure) setError("The image was removed, but secure cleanup is pending and will be retried safely."); }); };
  const admitSlot = async (file: File, surface: "CREATOR_PROFILE_AVATAR" | "CREATOR_PROFILE_COVER", setter: React.Dispatch<React.SetStateAction<ProfileMediaItem | null>>) => {
    const selected = createProfileMediaSelection(file, surface); const previous = surface === "CREATOR_PROFILE_AVATAR" ? mediaRef.current.avatar : mediaRef.current.cover;
    if (previous) { release(previous); disposeProfileMediaPreview(previous); } setter(selected);
    try { const moderating = markProfileMediaModerating(selected); setter(current => current && isCurrentProfileMediaOperation(current, selected) ? moderating : current); const resolved = resolveProfileMediaAdmission(moderating, await submitUserProfileImageAdmission(file, surface)); setter(current => { if (current && isCurrentProfileMediaOperation(current, moderating)) return resolved; disposeProfileMediaPreview(resolved); release(resolved, false); return current; }); }
    catch (error) { setter(current => current && isCurrentProfileMediaOperation(current, selected) ? { ...selected, state: "FAILED", message: imageAdmissionErrorMessage(error) } : current); }
  };
  const handleAvatarUpload = (file: File) => admitSlot(file, "CREATOR_PROFILE_AVATAR", setAvatar);
  const handleCoverUpload = (file: File) => admitSlot(file, "CREATOR_PROFILE_COVER", setCover);

  const handleMediaUpload = async (files: FileList) => {
    const arr = Array.from(files);

    for (const file of arr) {
      const selected = createProfileMediaSelection(file, "CREATOR_PROFILE_MEDIA"); setMedia(previous => [...previous, selected]);
      try { const moderating = markProfileMediaModerating(selected); setMedia(previous => previous.map(item => isCurrentProfileMediaOperation(item, selected) ? moderating : item)); const resolved = resolveProfileMediaAdmission(moderating, await submitUserProfileImageAdmission(file, "CREATOR_PROFILE_MEDIA")); setMedia(previous => previous.some(item => isCurrentProfileMediaOperation(item, moderating)) ? previous.map(item => isCurrentProfileMediaOperation(item, moderating) ? resolved : item) : (disposeProfileMediaPreview(resolved), release(resolved, false), previous)); }
      catch (error) { setMedia(previous => previous.map(item => isCurrentProfileMediaOperation(item, selected) ? { ...selected, state: "FAILED", message: imageAdmissionErrorMessage(error) } : item)); }
    }
  };

  const removeMedia = (index: number) => {
    setMedia(previous => { const removed = previous[index]; if (removed) { release(removed); disposeProfileMediaPreview(removed); } return previous.filter((_, i) => i !== index); });
  };

  /* ================= SAVE ================= */

  const handleSave = async () => {
    try {
      const avatarClaim = avatar ? toProfileMediaClaim(avatar) : undefined;
      const coverClaim = cover ? toProfileMediaClaim(cover) : undefined;
      const mediaClaims = media.map(toProfileMediaClaim);
      await api.patch("/v1/creator/profile", {
        displayName: formData.displayName,
        ...(avatarClaim ? { avatar: avatarClaim } : {}),
        ...(coverClaim ? { cover: coverClaim } : {}),
        media: mediaClaims,
        bio: formData.bio,
        languages: formData.languages.split(",").map(l => l.trim()).filter(Boolean),
        categories: formData.categories.split(",").map(c => c.trim()).filter(Boolean),
        city: formData.city,
        country: formData.country,
      });

      setError("");
      setEditing(false);
      fetchProfile();
    } catch (err) {
      setError(imageAdmissionErrorMessage(err, "Creator profile update failed. Please try again."));
    }
  };

  /* ================= UI ================= */

  if (loading) return <div className="min-h-screen bg-theme-bg p-10 text-theme-muted">Loading...</div>;
  if (!profile) return <div className="min-h-screen bg-theme-bg p-10 text-theme-muted">No profile</div>;
  const preview = (item: ProfileMediaItem) => item.state === "EXISTING" ? item.reference : item.previewUrl;
  const avatarUrl = avatar ? preview(avatar) : "";
  const coverUrl = cover ? preview(cover) : "";

  return (
    <div className="min-h-screen bg-theme-bg text-theme-text [&_input:not([type=file])]:border [&_input:not([type=file])]:border-theme-border [&_input:not([type=file])]:bg-theme-inset [&_input:not([type=file])]:text-theme-text [&_textarea]:border [&_textarea]:border-theme-border [&_textarea]:bg-theme-inset [&_textarea]:text-theme-text">

      <div className="max-w-4xl mx-auto px-4 pt-10 pb-20">
        {error && <div className="mb-4 rounded-[var(--radius-card)] border border-theme-warning bg-theme-warning-tint p-3 text-sm text-theme-warning" role="alert">{error}</div>}

        {/* HEADER */}
        <div className="flex justify-between mb-6">
          <button onClick={() => navigate(-1)} className="text-theme-muted hover:text-theme-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent">← Back</button>

          <button
            onClick={() => setEditing(!editing)}
            className="rounded-[var(--radius-control)] bg-theme-primary px-4 py-2 text-theme-primary-text transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent"
          >
            {editing ? "Cancel" : "Edit Profile"}
          </button>
        </div>

        {/* HERO */}
        <div className="relative mb-14">

          {/* COVER */}
          <div className="relative h-[220px] rounded-2xl overflow-hidden">
            <img
              src={coverUrl}
              className={`w-full h-full object-cover cursor-pointer ${profileMediaStatusClassName(cover)}`}
              onClick={() => setSelectedImage(coverUrl)}
            />
            <div className="absolute inset-0 bg-black/20 pointer-events-none rounded-2xl" />

            {editing && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    document.getElementById("coverUpload")?.click();
                  }}
                  className="absolute top-3 right-3 z-20 rounded bg-black/60 px-3 py-1 text-xs text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent"
                >
                  Change
                </button>

                <input
                  id="coverUpload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) =>
                    e.target.files && handleCoverUpload(e.target.files[0])
                  }
                />
              </>
            )}
          </div>
          {mediaMessage(cover) && <p className={`mt-2 text-xs ${mediaMessageClass(cover)}`}>{mediaMessage(cover)}</p>}

          {/* AVATAR */}
          <div className="absolute left-6 -bottom-12 flex items-center gap-4">

            <div className="relative">
              <img
                src={avatarUrl}
                className={`w-20 h-20 rounded-full object-cover cursor-pointer border-4 border-theme-surface ${profileMediaStatusClassName(avatar)}`}
                onClick={() => setSelectedImage(avatarUrl)}
              />

              {editing && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      document.getElementById("avatarUpload")?.click();
                    }}
                    className="absolute bottom-0 right-0 z-20 rounded-full bg-black/70 px-2 py-1 text-xs text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent"
                  >
                    ✎
                  </button>

                  <input
                    id="avatarUpload"
                  type="file"
                  accept="image/*"
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
              <span className="rounded-full bg-theme-accent-tint px-2 py-1 text-xs text-theme-accent">
                Creator
              </span>
            </div>
            {mediaMessage(avatar) && <p className={`mt-2 text-xs ${mediaMessageClass(avatar)}`}>{mediaMessage(avatar)}</p>}
          </div>
        </div>

        {/* CONTENT */}
        <div className="space-y-8 pt-12">

          {/* CREATOR DETAILS */}
          <div className="rounded-[var(--radius-card)] border border-theme-border bg-theme-surface p-6">

            <h3 className="text-lg font-semibold mb-4">Creator Details</h3>

            <div className="mb-4">
              <p className="mb-1 text-sm text-theme-muted">Language</p>
              {editing ? (
                <input
                  value={formData.languages}
                  onChange={(e) =>
                    setFormData({ ...formData, languages: e.target.value })
                  }
                  className="w-full rounded-[var(--radius-control)] p-3"
                />
              ) : (
                <p>{formData.languages || "Not specified"}</p>
              )}
            </div>

            <div className="mb-4">
              <p className="mb-1 text-sm text-theme-muted">Category</p>
              {editing ? (
                <input
                  value={formData.categories}
                  onChange={(e) =>
                    setFormData({ ...formData, categories: e.target.value })
                  }
                  className="w-full rounded-[var(--radius-control)] p-3"
                />
              ) : (
                <p>{formData.categories || "Not specified"}</p>
              )}
            </div>

            <div>
              <p className="mb-1 text-sm text-theme-muted">Location</p>
              {editing ? (
                <div className="grid grid-cols-2 gap-3">
                  <input
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                    className="rounded-[var(--radius-control)] p-3"
                  />
                  <input
                    value={formData.country}
                    onChange={(e) =>
                      setFormData({ ...formData, country: e.target.value })
                    }
                    className="rounded-[var(--radius-control)] p-3"
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
          <div className="rounded-[var(--radius-card)] border border-theme-border bg-theme-surface p-6">
            <h3 className="mb-3">Media</h3>

            {editing && (
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) =>
                  e.target.files && handleMediaUpload(e.target.files)
                }
                className="mb-4"
              />
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {media.map((img, i) => (
                <div key={img.clientId} className="relative h-32">
                  <img
                    src={preview(img)}
                    className={`w-full h-full object-cover rounded cursor-pointer ${profileMediaStatusClassName(img)}`}
                    onClick={() => setSelectedImage(preview(img))}
                  />

                  {editing && (
                    <button
                      onClick={() => removeMedia(i)}
                      className="absolute right-1 top-1 rounded bg-black/70 px-2 text-xs text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent"
                    >
                      ✕
                    </button>
                  )}
                  {mediaMessage(img) && <p className={`mt-1 text-xs ${mediaMessageClass(img)}`}>{mediaMessage(img)}</p>}
                </div>
              ))}
            </div>
          </div>

          {/* ABOUT */}
          <div className="rounded-[var(--radius-card)] border border-theme-border bg-theme-surface p-6">
            {editing ? (
              <textarea
                value={formData.bio}
                onChange={(e) =>
                  setFormData({ ...formData, bio: e.target.value })
                }
                className="w-full rounded-[var(--radius-control)] p-3"
              />
            ) : (
              <p>{formData.bio}</p>
            )}
          </div>

          {/* SAVE */}
          {editing && (
            <button
              onClick={handleSave}
              className="w-full rounded-[var(--radius-control)] bg-theme-primary py-3 text-theme-primary-text transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent"
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

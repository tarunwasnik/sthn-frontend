import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

import api from "../../api/axios";
import { imageAdmissionErrorMessage, releaseUserProfileTemporaryImage, submitUserProfileImageAdmission, type UserProfileImageSurface } from "../../api/imageModeration";
import {
  appendProfileGalleryMedia, createProfileMediaSelection, disposeProfileMediaPreview,
  failProfileMediaSelection, markProfileMediaModerating,
  resolveProfileMediaAdmission, restorePersistedProfileMedia, retryProfileMediaSelection,
  replaceProfileMediaSelection, sharesProfileMediaPreview, temporaryProfileMediaRelease, type ProfileMediaItem, toProfileMediaRequest, updateProfileMediaOperation,
} from "../../features/profileMedia/profileMedia";
import { useLiveTextModeration } from "../../hooks/useLiveTextModeration";

interface UserProfile {
  username: string; realName?: string | null; bio: string; interests: string[]; profilePhotos: string[];
  avatar: string; cover: string; dateOfBirth: string; country?: string | null; city?: string | null;
  languages?: string[]; profileStatus: string; age?: number;
  verification?: { stage: "NOT_SUBMITTED" | "SUBMITTED" | "PROCESSING" | "AI_COMPLETED_AWAITING_ADMIN" | "MANUAL_REVIEW" | "REJECTED" | "VERIFIED"; submittedAt: string | null };
}
interface FormState { realName: string; bio: string; interests: string; dateOfBirth: string; country: string; city: string; languages: string; }

const profileForm = (profile: UserProfile): FormState => ({
  realName: profile.realName || "", bio: profile.bio || "", interests: profile.interests?.join(", ") || "",
  dateOfBirth: profile.dateOfBirth?.split("T")[0] || "", country: profile.country || "", city: profile.city || "", languages: profile.languages?.join(", ") || "",
});
const mediaPreview = (item: ProfileMediaItem | null) => item && item.state !== "EXISTING" ? item.previewUrl : item?.state === "EXISTING" ? item.reference : null;
const mediaMessage = (item: ProfileMediaItem | null) => {
  if (!item) return null;
  if (item.state === "UPLOADING") return "Uploading image…";
  if (item.state === "MODERATING") return "Checking image…";
  if (item.state === "APPROVED") return "Image approved and ready to save.";
  return "message" in item ? item.message : null;
};

export default function UserProfilePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState<FormState>({ realName: "", bio: "", interests: "", dateOfBirth: "", country: "", city: "", languages: "" });
  const [initialForm, setInitialForm] = useState<FormState | null>(null);
  const [avatar, setAvatar] = useState<ProfileMediaItem | null>(null);
  const [cover, setCover] = useState<ProfileMediaItem | null>(null);
  const [gallery, setGallery] = useState<ProfileMediaItem[]>([]);
  const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const [editing, setEditing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null); const [error, setError] = useState("");
  const avatarVersion = useRef(0); const coverVersion = useRef(0);
  const mediaRef = useRef<{ avatar: ProfileMediaItem | null; cover: ProfileMediaItem | null; gallery: ProfileMediaItem[] }>({ avatar: null, cover: null, gallery: [] });
  mediaRef.current = { avatar, cover, gallery };
  const moderatedInterests = useMemo(() => formData.interests.split(",").map((interest) => interest.trim()).filter(Boolean), [formData.interests]);
  const moderationPayload = useMemo(() => editing && formData.bio.trim() ? { domain: "USER_PROFILE" as const, bio: formData.bio, interests: moderatedInterests } : null, [editing, formData.bio, moderatedInterests]);
  const textModeration = useLiveTextModeration(moderationPayload);
  const bioBlocked = textModeration.status === "BLOCK" && textModeration.result?.target?.field === "bio";
  const interestsBlocked = textModeration.status === "BLOCK" && textModeration.result?.target?.field === "interests";

  const applyPersistedProfile = (next: UserProfile) => {
    const restored = restorePersistedProfileMedia(next);
    setAvatar((current) => { if (current) disposeProfileMediaPreview(current); return restored.avatar; });
    setCover((current) => { if (current) disposeProfileMediaPreview(current); return restored.cover; });
    setGallery((current) => { current.forEach(disposeProfileMediaPreview); return restored.profilePhotos; });
    const nextForm = profileForm(next); setProfile(next); setFormData(nextForm); setInitialForm(nextForm);
  };
  useEffect(() => {
    const fetchProfile = async () => {
      try { const { data } = await api.get<UserProfile>("/v1/profile/me"); applyPersistedProfile(data); }
      catch (caught) { console.error("Fetch failed", caught); setError("Unable to load your profile."); }
      finally { setLoading(false); }
    };
    void fetchProfile();
  }, []);
  useEffect(() => () => {
    const media = mediaRef.current;
    if (media.avatar) disposeProfileMediaPreview(media.avatar);
    if (media.cover) disposeProfileMediaPreview(media.cover);
    media.gallery.forEach(disposeProfileMediaPreview);
  }, []);

  const replaceSlot = (setter: React.Dispatch<React.SetStateAction<ProfileMediaItem | null>>, next: ProfileMediaItem) => setter((current) => {
    if (current && current !== next && !sharesProfileMediaPreview(current, next)) disposeProfileMediaPreview(current);
    return next;
  });
  const releaseDiscardedTemporaryMedia = (item: ProfileMediaItem | null, reportFailure = true) => {
    if (!item) return;
    const release = temporaryProfileMediaRelease(item);
    if (!release) return;
    void releaseUserProfileTemporaryImage(release.assetReference, release.surface).catch(() => {
      if (reportFailure) setError("The image was removed, but secure cleanup is pending and will be retried safely.");
    });
  };
  const admitSlot = async (file: File, surface: UserProfileImageSurface, setter: React.Dispatch<React.SetStateAction<ProfileMediaItem | null>>, current: () => boolean) => {
    const selection = createProfileMediaSelection(file, surface); if (current()) replaceSlot(setter, selection);
    try { const moderating = markProfileMediaModerating(selection); if (current()) replaceSlot(setter, moderating); const resolved = resolveProfileMediaAdmission(moderating, await submitUserProfileImageAdmission(file, surface)); if (current()) replaceSlot(setter, resolved); else { disposeProfileMediaPreview(resolved); releaseDiscardedTemporaryMedia(resolved, false); } }
    catch (caught) { const failed = failProfileMediaSelection(selection, imageAdmissionErrorMessage(caught)); if (current()) replaceSlot(setter, failed); else disposeProfileMediaPreview(failed); }
  };
  const admitGallerySelection = (selection: ProfileMediaItem) => {
    if (selection.state !== "UPLOADING") return;
    void (async () => {
      let moderating = selection;
      try { moderating = markProfileMediaModerating(selection); setGallery((current) => updateProfileMediaOperation(current, selection, moderating)); const resolved = resolveProfileMediaAdmission(moderating, await submitUserProfileImageAdmission(selection.sourceFile, "USER_PROFILE_PHOTO")); const current = mediaRef.current.gallery.some((item) => item.clientId === moderating.clientId && item.operationId === moderating.operationId); if (current) setGallery((items) => updateProfileMediaOperation(items, moderating, resolved)); else { disposeProfileMediaPreview(resolved); releaseDiscardedTemporaryMedia(resolved, false); } }
      catch (caught) { const failed = failProfileMediaSelection(moderating, imageAdmissionErrorMessage(caught)); setGallery((current) => updateProfileMediaOperation(current, moderating, failed)); }
    })();
  };
  const admitGallery = (file: File, replacement?: ProfileMediaItem) => {
    const selection = replacement ? replaceProfileMediaSelection(replacement, file) : createProfileMediaSelection(file, "USER_PROFILE_PHOTO");
    if (replacement) releaseDiscardedTemporaryMedia(replacement);
    setGallery((current) => replacement ? updateProfileMediaOperation(current, replacement, selection) : appendProfileGalleryMedia(current, selection));
    if (replacement && !sharesProfileMediaPreview(replacement, selection)) disposeProfileMediaPreview(replacement);
    admitGallerySelection(selection);
  };
  const addGallery = (files: readonly File[]) => {
    if (gallery.length + files.length > 6) { setError("Profile gallery cannot contain more than 6 images."); return; }
    setError(""); files.forEach((file) => admitGallery(file));
  };
  const avatarChanged = avatar?.state !== "EXISTING";
  const coverChanged = cover?.state !== "EXISTING";
  const galleryChanged = gallery.some((item) => item.state !== "EXISTING") || gallery.length !== profile?.profilePhotos.length;
  const textChanged = Boolean(initialForm && (formData.bio !== initialForm.bio || formData.interests !== initialForm.interests));

  const handleSave = async () => {
    if (!profile || !initialForm || profile.profileStatus === "pending_verification" || profile.profileStatus === "rejected") return;
    if (!avatar || !cover) { setError("Avatar and cover are required."); return; }
    let media: ReturnType<typeof toProfileMediaRequest> = {};
    try {
      if (avatarChanged) media = { ...media, ...toProfileMediaRequest({ avatar }) };
      if (coverChanged) media = { ...media, ...toProfileMediaRequest({ cover }) };
      if (galleryChanged) media = { ...media, ...toProfileMediaRequest({ profilePhotos: gallery }) };
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Finish image moderation before saving."); return; }
    const payload: Record<string, unknown> = { ...media };
    (Object.keys(formData) as Array<keyof FormState>).forEach((field) => {
      if (formData[field] === initialForm[field]) return;
      payload[field] = field === "interests" || field === "languages" ? formData[field].split(",").map((value) => value.trim()).filter(Boolean) : formData[field];
    });
    if (Object.keys(payload).length === 0) { setEditing(false); return; }
    if (textChanged) {
      const moderation = await textModeration.checkNow();
      if (moderation?.decision !== "ALLOW" || !moderation.admissionToken) { setError(moderation?.message || "Please check your profile text before saving."); return; }
      payload.textModerationAdmission = moderation.admissionToken;
    }
    setError(""); setSaving(true);
    try { const { data } = await api.patch<{ profile: UserProfile }>("/v1/profile/me", payload); applyPersistedProfile(data.profile); setEditing(false); }
    catch (caught) { setError((axios.isAxiosError(caught) && typeof caught.response?.data?.message === "string" && caught.response.data.message) || "Update failed"); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="p-10 text-white">Loading...</div>;
  if (!profile) return <div className="p-10 text-white">No profile</div>;
  const avatarImage = mediaPreview(avatar) ?? mediaPreview(gallery[0] ?? null); const coverImage = mediaPreview(cover) ?? mediaPreview(gallery[1] ?? null);
  const pending = profile.profileStatus === "pending_verification"; const rejected = profile.profileStatus === "rejected"; const editable = profile.profileStatus === "incomplete" || profile.profileStatus === "verified";
  const pendingMessage = profile.verification?.stage === "PROCESSING" ? "Automated checks are in progress. Your profile cannot be edited until a decision is made." : profile.verification?.stage === "AI_COMPLETED_AWAITING_ADMIN" ? "Automated checks are complete and your verification is awaiting Admin review." : profile.verification?.stage === "MANUAL_REVIEW" ? "Your verification is under manual review. No action is required from you right now." : "Your submitted profile is awaiting verification and cannot be edited until a decision is made.";

  return <div className="min-h-screen bg-gradient-to-br from-[#041c1c] via-[#052828] to-[#020617] text-white"><div className="max-w-4xl mx-auto px-4 pt-10 pb-16">
    <div className="flex items-center justify-between mb-6"><button onClick={() => navigate(-1)} className="text-sm text-gray-300 hover:text-white">← Back</button>{editable && <button onClick={() => { if (editing) applyPersistedProfile(profile); setEditing((value) => !value); setError(""); }} className="px-4 py-2 bg-teal-500 hover:bg-teal-600 rounded-lg">{editing ? "Cancel" : "Edit Profile"}</button>}</div>
    <div className="relative mb-14"><div className="h-[220px] rounded-2xl overflow-hidden">{coverImage ? <img src={coverImage} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gradient-to-r from-teal-700/40 to-cyan-500/20" />}<div className="absolute inset-0 bg-black/40" /></div><div className="absolute left-6 -bottom-12 flex items-center gap-4"><div className="w-20 h-20 rounded-full border-4 border-[#041c1c] overflow-hidden">{avatarImage && <img src={avatarImage} className="w-full h-full object-cover" />}</div><div><h1 className="text-xl font-bold">{profile.username}</h1><span className="text-xs bg-teal-500 px-2 py-1 rounded">{profile.profileStatus}</span></div></div></div>
    <div className="space-y-8 pt-12">{error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>}{pending && <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm text-yellow-200"><p className="font-semibold">Verification in progress</p><p className="mt-1">{pendingMessage}</p></div>}{rejected && <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-100"><p className="font-semibold">Verification needs resubmission</p><p className="mt-1 text-amber-100/80">Your profile details are retained. Complete a fresh live face verification before resubmitting.</p><button type="button" onClick={() => navigate("/onboarding")} className="mt-3 rounded-lg bg-amber-300 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-200">Fix and resubmit verification</button></div>}
      <section className="bg-[#071c1c] rounded-xl p-6"><h3 className="text-lg font-semibold mb-3">About</h3>{editing ? <><textarea value={formData.bio} onChange={(event) => setFormData({ ...formData, bio: event.target.value })} onBlur={() => { void textModeration.checkNow(); }} aria-invalid={bioBlocked} className={`w-full bg-[#020617] p-3 rounded border ${bioBlocked ? "border-red-500" : "border-transparent"}`} />{bioBlocked && <p className="mt-1 text-xs text-red-400">{textModeration.result?.message}</p>}<input value={formData.interests} onChange={(event) => setFormData({ ...formData, interests: event.target.value })} onBlur={() => { void textModeration.checkNow(); }} aria-invalid={interestsBlocked} className={`w-full mt-3 bg-[#020617] p-2 rounded border ${interestsBlocked ? "border-red-500" : "border-transparent"}`} />{interestsBlocked && <p className="mt-1 text-xs text-red-400">{textModeration.result?.message}</p>}{textModeration.status === "UNAVAILABLE" && <p className="mt-2 text-xs text-amber-300">{textModeration.result?.message}</p>}</> : <><p className="text-gray-300">{profile.bio}</p><div className="mt-3 flex flex-wrap gap-2">{profile.interests.map((interest) => <span key={interest} className="px-3 py-1 bg-white/10 rounded-full text-sm">{interest}</span>)}</div></>}</section>
      <section className="bg-[#071c1c] rounded-xl p-6"><h3 className="text-lg font-semibold mb-4">Media</h3>{editing && <div className="mb-4 space-y-4"><MediaSlot label="Avatar" item={avatar} onFile={(file) => { releaseDiscardedTemporaryMedia(mediaRef.current.avatar); const version = ++avatarVersion.current; void admitSlot(file, "USER_PROFILE_AVATAR", setAvatar, () => avatarVersion.current === version); }} onRemove={() => { ++avatarVersion.current; releaseDiscardedTemporaryMedia(avatar); if (avatar) disposeProfileMediaPreview(avatar); setAvatar(null); }} onRetry={() => { if (avatar?.state === "FAILED" || avatar?.state === "UNAVAILABLE") { releaseDiscardedTemporaryMedia(avatar); const version = ++avatarVersion.current; void admitSlot(retryProfileMediaSelection(avatar).sourceFile, "USER_PROFILE_AVATAR", setAvatar, () => avatarVersion.current === version); } }} /><MediaSlot label="Cover" item={cover} onFile={(file) => { releaseDiscardedTemporaryMedia(mediaRef.current.cover); const version = ++coverVersion.current; void admitSlot(file, "USER_PROFILE_COVER", setCover, () => coverVersion.current === version); }} onRemove={() => { ++coverVersion.current; releaseDiscardedTemporaryMedia(cover); if (cover) disposeProfileMediaPreview(cover); setCover(null); }} onRetry={() => { if (cover?.state === "FAILED" || cover?.state === "UNAVAILABLE") { releaseDiscardedTemporaryMedia(cover); const version = ++coverVersion.current; void admitSlot(retryProfileMediaSelection(cover).sourceFile, "USER_PROFILE_COVER", setCover, () => coverVersion.current === version); } }} /><label className="block text-sm text-gray-300">Add gallery photos (2–6)<input type="file" multiple accept="image/*" className="mt-2 block" onChange={(event) => { addGallery(Array.from(event.target.files ?? [])); event.target.value = ""; }} /></label></div>}<div className="grid grid-cols-2 md:grid-cols-4 gap-4">{gallery.map((item, index) => <div key={item.clientId} className="relative h-32 rounded overflow-visible"><img src={mediaPreview(item) ?? ""} className="w-full h-32 object-cover rounded cursor-pointer" onClick={() => !editing && setSelectedImage(mediaPreview(item))} />{editing && <><button type="button" onClick={() => { releaseDiscardedTemporaryMedia(item); setGallery((current) => { const removed = current[index]; if (removed) disposeProfileMediaPreview(removed); return current.filter((_, itemIndex) => itemIndex !== index); }); }} className="absolute top-1 right-1 bg-black/60 text-xs px-2 py-1 rounded">✕</button><label className="mt-1 block text-xs text-teal-300 underline cursor-pointer">Replace<input className="sr-only" type="file" accept="image/*" onChange={(event) => { const file = event.target.files?.[0]; if (file) admitGallery(file, item); event.target.value = ""; }} /></label></>}{mediaMessage(item) && <p className={`mt-1 text-xs ${item.state === "BLOCKED" ? "text-red-400" : "text-gray-400"}`}>{mediaMessage(item)}</p>}{editing && (item.state === "FAILED" || item.state === "UNAVAILABLE") && <button type="button" className="text-xs text-teal-300 underline" onClick={() => { releaseDiscardedTemporaryMedia(item); const retry = retryProfileMediaSelection(item); setGallery((current) => updateProfileMediaOperation(current, item, retry)); admitGallerySelection(retry); }}>Retry image</button>}</div>)}</div></section>
      <section className="bg-[#071c1c] rounded-xl p-6"><h3 className="text-lg font-semibold mb-4">Personal Info</h3><div className="mb-5 grid gap-4 md:grid-cols-2"><EditableField label="Real name" privateField editing={editing} value={formData.realName} onChange={(value) => setFormData({ ...formData, realName: value })} /><EditableField label="Country" editing={editing} value={formData.country} onChange={(value) => setFormData({ ...formData, country: value })} /><EditableField label="City" editing={editing} value={formData.city} onChange={(value) => setFormData({ ...formData, city: value })} /><EditableField label="Languages" editing={editing} value={formData.languages} onChange={(value) => setFormData({ ...formData, languages: value })} wide /></div><div className="flex justify-between"><span className="text-gray-400">DOB</span>{editing ? <input type="date" value={formData.dateOfBirth} onChange={(event) => setFormData({ ...formData, dateOfBirth: event.target.value })} className="bg-[#020617] p-2 rounded" /> : <span>{formData.dateOfBirth}</span>}</div><div className="flex justify-between mt-3"><span className="text-gray-400">Age</span><span>{profile.age || "-"}</span></div></section>
      {editing && <button type="button" disabled={saving} onClick={() => { void handleSave(); }} className="w-full bg-teal-500 hover:bg-teal-600 py-3 rounded-lg disabled:opacity-50">{saving ? "Saving…" : "Save Changes"}</button>}
    </div></div>{selectedImage && <div onClick={() => setSelectedImage(null)} className="fixed inset-0 bg-black/90 flex items-center justify-center z-50"><img src={selectedImage} className="max-w-[90%] max-h-[90%] rounded-lg" /></div>}</div>;
}

function MediaSlot({ label, item, onFile, onRemove, onRetry }: { label: string; item: ProfileMediaItem | null; onFile: (file: File) => void; onRemove: () => void; onRetry: () => void }) {
  const source = mediaPreview(item);
  return <div><label className="text-sm text-gray-300 mb-1 block">{label}</label><input type="file" accept="image/*" onChange={(event) => { const file = event.target.files?.[0]; if (file) onFile(file); event.target.value = ""; }} />{source && <div className="relative mt-2"><img src={source} className={label === "Avatar" ? "w-20 h-20 object-cover rounded-full" : "w-full h-24 object-cover rounded-lg"} /><button type="button" onClick={onRemove} className="absolute top-1 right-1 bg-black/60 text-xs px-1 rounded">✕</button></div>}{mediaMessage(item) && <p className={`mt-1 text-xs ${item?.state === "BLOCKED" ? "text-red-400" : "text-gray-400"}`}>{mediaMessage(item)}</p>}{(item?.state === "FAILED" || item?.state === "UNAVAILABLE") && <button type="button" className="mt-1 text-xs text-teal-300 underline" onClick={onRetry}>Retry {label.toLowerCase()}</button>}</div>;
}
function EditableField({ label, privateField, editing, value, onChange, wide }: { label: string; privateField?: boolean; editing: boolean; value: string; onChange: (value: string) => void; wide?: boolean }) {
  return <div className={wide ? "md:col-span-2" : ""}><span className="text-sm text-gray-400">{label}</span>{editing ? <input value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full bg-[#020617] p-2 rounded" /> : <p>{value || "-"}</p>}<p className="mt-1 text-xs text-gray-500">{privateField ? "Private" : "Public"}</p></div>;
}

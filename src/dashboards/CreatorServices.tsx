// frontend/src/dashboards/CreatorServices.tsx

import { useEffect, useRef, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import api from "../api/axios";
import { imageAdmissionErrorMessage, releaseUserProfileTemporaryImage, submitUserProfileImageAdmission } from "../api/imageModeration";
import {
  createProfileMediaSelection,
  disposeProfileMediaPreview,
  isCurrentProfileMediaOperation,
  markProfileMediaModerating,
  profileMediaStatusClassName,
  resolveProfileMediaAdmission,
  temporaryProfileMediaRelease,
  toProfileMediaClaim,
  type ProfileMediaItem,
} from "../features/profileMedia/profileMedia";

/* ================= TYPES ================= */

interface Service {
  _id: string;
  title: string;
  description: string;
  durationMinutes: number;
  price: number;
  currency: string;
  isActive: boolean;
  media?: string[];
}

type ServiceForm = Readonly<{
  title: string;
  description: string;
  durationMinutes: number;
  price: string | number;
  media: ProfileMediaItem[];
}>;

type EditableServiceForm = ServiceForm & Pick<Service, "_id" | "currency" | "isActive"> & Readonly<{
  /** A temporary candidate; committed media remains in `media` until save. */
  replacement: ProfileMediaItem | null;
}>;

const newServiceForm = (): ServiceForm => ({ title: "", description: "", durationMinutes: 60, price: "", media: [] });
const newEditableServiceForm = (): EditableServiceForm => ({ ...newServiceForm(), _id: "", currency: "", isActive: false, replacement: null });
const existingServiceMedia = (reference: string, index: number): ProfileMediaItem => ({
  clientId: `creator-service-existing-${index}-${reference}`,
  operationId: 0,
  state: "EXISTING",
  surface: "CREATOR_SERVICE_MEDIA",
  reference,
});
const previewUrl = (item: ProfileMediaItem) => item.state === "EXISTING" ? item.reference : item.previewUrl;
const isPending = (item: ProfileMediaItem) => item.state === "UPLOADING" || item.state === "MODERATING";
const mediaMessage = (item: ProfileMediaItem) => {
  if (item.state === "APPROVED") return "Image approved.";
  if (isPending(item)) return "Image moderation is in progress.";
  if (item.state === "BLOCKED" || item.state === "UNAVAILABLE" || item.state === "FAILED") return item.message;
  return null;
};

export default function CreatorServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditableServiceForm>(newEditableServiceForm);
  const [form, setForm] = useState<ServiceForm>(newServiceForm);
  const [error, setError] = useState("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const mediaRef = useRef({ form: form.media, edit: [] as ProfileMediaItem[], replacement: null as ProfileMediaItem | null });
  useEffect(() => { mediaRef.current = { form: form.media, edit: editForm.media, replacement: editForm.replacement }; }, [form.media, editForm.media, editForm.replacement]);
  useEffect(() => () => {
    [...mediaRef.current.form, ...mediaRef.current.edit, mediaRef.current.replacement]
      .filter((item): item is ProfileMediaItem => item !== null)
      .forEach(disposeProfileMediaPreview);
  }, []);
  const createMediaUploading = form.media.some(isPending);
  const editMediaUploading = Boolean(editForm.replacement && isPending(editForm.replacement));

  /* ================= FETCH ================= */

  const fetchServices = async () => {
    try {
      const res = await api.get("/v1/creator/services");
      setServices(res.data.services || []);
    } catch {
      console.error("Failed to fetch services");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  /* ================= CREATE ================= */

  const handleCreate = async () => {
    if (!form.title || !form.description || !form.price) return;
    if (form.media.length !== 1) {
      setError("Select one image and wait for its approval before creating this service.");
      return;
    }

    try {
      const media = [toProfileMediaClaim(form.media[0])];

      await api.post("/v1/creator/services", {
        title: form.title,
        description: form.description,
        durationMinutes: form.durationMinutes,
        price: Number(form.price),
        media,
      });

      form.media.forEach(disposeProfileMediaPreview);
      setForm(newServiceForm());
      setError("");

      // ✅ reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      fetchServices();
    } catch (createError) {
      setError(imageAdmissionErrorMessage(createError, "Failed to create service."));
    }
  };

  /* ================= EDIT ================= */

  const startEdit = (service: Service) => {
    setEditingId(service._id);
    setEditForm({
      ...service,
      price: service.price,
      media: (service.media ?? []).map(existingServiceMedia),
      replacement: null,
    });
  };

  const cancelEdit = () => {
    if (editForm.replacement) { releaseTemporary(editForm.replacement); disposeProfileMediaPreview(editForm.replacement); }
    setEditingId(null);
    setEditForm(newEditableServiceForm());
  };

  const saveEdit = async () => {
    if (!editingId) return;
    try {
      const media = editForm.replacement ? [toProfileMediaClaim(editForm.replacement)] : undefined;

      await api.patch(`/v1/creator/services/${editingId}`, {
        title: editForm.title,
        description: editForm.description,
        durationMinutes: editForm.durationMinutes,
        price: Number(editForm.price),
        ...(media ? { media } : {}),
      });

      if (editForm.replacement) disposeProfileMediaPreview(editForm.replacement);
      setEditingId(null);
      setEditForm(newEditableServiceForm());
      setError("");
      fetchServices();
    } catch (updateError) {
      setError(imageAdmissionErrorMessage(updateError, "Update failed."));
    }
  };

  /* ================= MEDIA ================= */

  const releaseTemporary = (item: ProfileMediaItem, reportFailure = true) => {
    const temporary = temporaryProfileMediaRelease(item);
    if (temporary) void releaseUserProfileTemporaryImage(temporary.assetReference, temporary.surface).catch(() => {
      if (reportFailure) setError("The image was removed, but secure cleanup is pending and will be retried safely.");
    });
  };
  const admitCreateMedia = async (file: File) => {
    const selected = createProfileMediaSelection(file, "CREATOR_SERVICE_MEDIA");
    const previous = mediaRef.current.form[0];
    if (previous) { releaseTemporary(previous); disposeProfileMediaPreview(previous); }
    setForm((current) => ({ ...current, media: [selected] }));
    try {
      const moderating = markProfileMediaModerating(selected);
      setForm((current) => current.media.some((item) => isCurrentProfileMediaOperation(item, selected)) ? { ...current, media: [moderating] } : current);
      const resolved = resolveProfileMediaAdmission(moderating, await submitUserProfileImageAdmission(file, "CREATOR_SERVICE_MEDIA"));
      setForm((current) => current.media.some((item) => isCurrentProfileMediaOperation(item, moderating))
        ? { ...current, media: [resolved] }
        : (disposeProfileMediaPreview(resolved), releaseTemporary(resolved, false), current));
    } catch (admissionError) {
      setForm((current) => current.media.some((item) => isCurrentProfileMediaOperation(item, selected))
        ? { ...current, media: [{ ...selected, state: "FAILED", message: imageAdmissionErrorMessage(admissionError) }] }
        : current);
    }
  };
  const admitEditReplacement = async (file: File) => {
    if (mediaRef.current.edit.length > 1) return;
    const selected = createProfileMediaSelection(file, "CREATOR_SERVICE_MEDIA");
    const previous = mediaRef.current.replacement;
    if (previous) { releaseTemporary(previous); disposeProfileMediaPreview(previous); }
    setEditForm((current) => ({ ...current, replacement: selected }));
    try {
      const moderating = markProfileMediaModerating(selected);
      setEditForm((current) => current.replacement && isCurrentProfileMediaOperation(current.replacement, selected) ? { ...current, replacement: moderating } : current);
      const resolved = resolveProfileMediaAdmission(moderating, await submitUserProfileImageAdmission(file, "CREATOR_SERVICE_MEDIA"));
      setEditForm((current) => current.replacement && isCurrentProfileMediaOperation(current.replacement, moderating)
        ? { ...current, replacement: resolved }
        : (disposeProfileMediaPreview(resolved), releaseTemporary(resolved, false), current));
    } catch (admissionError) {
      setEditForm((current) => current.replacement && isCurrentProfileMediaOperation(current.replacement, selected)
        ? { ...current, replacement: { ...selected, state: "FAILED", message: imageAdmissionErrorMessage(admissionError) } }
        : current);
    }
  };
  const handleMediaUpload = (files: FileList, isEdit = false) => {
    const file = files.item(0);
    if (file) void (isEdit ? admitEditReplacement(file) : admitCreateMedia(file));
  };
  const removeCreateMedia = () => {
    const item = mediaRef.current.form[0];
    if (item) { releaseTemporary(item); disposeProfileMediaPreview(item); }
    setForm((current) => ({ ...current, media: [] }));
  };
  const removeEditReplacement = () => {
    const item = mediaRef.current.replacement;
    if (item) { releaseTemporary(item); disposeProfileMediaPreview(item); }
    setEditForm((current) => ({ ...current, replacement: null }));
  };
  const retryMedia = (isEdit = false) => {
    const item = isEdit ? mediaRef.current.replacement : mediaRef.current.form[0];
    if (!item || item.state === "EXISTING" || item.state === "APPROVED" || isPending(item)) return;
    releaseTemporary(item); disposeProfileMediaPreview(item);
    if (isEdit) setEditForm((current) => ({ ...current, replacement: null }));
    else setForm((current) => ({ ...current, media: [] }));
    void (isEdit ? admitEditReplacement(item.sourceFile) : admitCreateMedia(item.sourceFile));
  };

  /* ================= ACTIONS ================= */

  const handleToggle = async (service: Service) => {
    await api.patch(`/v1/creator/services/${service._id}`, {
      isActive: !service.isActive,
    });
    fetchServices();
  };

  const handleDelete = async (id: string) => {
    await api.delete(`/v1/creator/services/${id}`);
    fetchServices();
  };

  /* ================= UI ================= */

  return (
  <DashboardLayout>
    <div className="px-4 py-6 pb-28 space-y-6">

      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-semibold text-theme-text">
          Your Services
        </h1>

        <p className="mt-1 text-sm text-theme-muted">
          Manage your offerings and pricing
        </p>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_2fr] gap-10">

        {/* LEFT: ADD SERVICE */}
        <div
  className="
    bg-theme-surface
    border border-theme-border
    rounded-[var(--radius-card)]
    p-6
    space-y-5
    h-fit
    lg:sticky
    lg:top-6
  "
>

          <h2 className="text-base font-semibold text-theme-text">
            Add New Service
          </h2>

          <div className="flex flex-col gap-4">

            <input
              type="text"
              aria-label="Service title"
              placeholder="Service Title"
              value={form.title}
              onChange={(e) =>
                setForm({
                  ...form,
                  title: e.target.value,
                })
              }
              className="rounded-[var(--radius-control)] border border-theme-border bg-theme-inset p-3 text-sm text-theme-text placeholder:text-theme-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent"
            />

            <div className="relative">
              <select
                value={form.durationMinutes}
                aria-label="Service duration"
                onChange={(e) =>
                  setForm({
                    ...form,
                    durationMinutes: Number(e.target.value),
                  })
                }
                className="
                  w-full
                  appearance-none
                  bg-theme-inset
                  border border-theme-border
                  rounded-[var(--radius-control)]
                  p-3
                  pr-10
                  text-sm
                  text-theme-text
                  transition-colors
                  focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent
                "
              >
                {[30, 45, 60, 90, 120].map((d) => (
                  <option
                    key={d}
                    value={d}
                    className="
                      bg-theme-surface
                      text-theme-text
                    "
                  >
                    {d} minutes
                  </option>
                ))}
              </select>

              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-theme-muted">
                ▼
              </div>
            </div>

            <textarea
              placeholder="Service Description"
              aria-label="Service description"
              value={form.description}
              onChange={(e) =>
                setForm({
                  ...form,
                  description: e.target.value,
                })
              }
              className="rounded-[var(--radius-control)] border border-theme-border bg-theme-inset p-3 text-sm text-theme-text placeholder:text-theme-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent"
            />

            <input
              type="number"
              aria-label="Service price"
              placeholder="Service Price"
              value={form.price}
              onChange={(e) =>
                setForm({
                  ...form,
                  price: e.target.value,
                })
              }
              className="rounded-[var(--radius-control)] border border-theme-border bg-theme-inset p-3 text-sm text-theme-text placeholder:text-theme-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent"
            />

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => { if (e.target.files) handleMediaUpload(e.target.files); e.target.value = ""; }}
              className="text-xs text-theme-muted file:mr-3 file:rounded-[var(--radius-control)] file:border-0 file:bg-theme-inset file:px-3 file:py-2 file:text-sm file:font-medium file:text-theme-text"
            />

            {error && <p className="rounded-[var(--radius-control)] border border-theme-danger bg-theme-danger-tint p-3 text-xs text-theme-danger" role="alert">{error}</p>}

            {/* PREVIEW */}
            {form.media.length > 0 && (
              <div className="flex gap-2 overflow-x-auto">
                {form.media.map((item, i) => (
                  <div
                    key={item.clientId}
                    className="relative h-20 w-20 min-w-[80px]"
                  >
                    <img
                      src={previewUrl(item)}
                      alt={`Selected service media ${i + 1}`}
                      className={`w-full h-full object-cover rounded-lg ${profileMediaStatusClassName(item)}`}
                    />

                    <button
                      onClick={removeCreateMedia}
                      className="absolute right-1 top-1 rounded-[var(--radius-control)] bg-theme-primary px-1 text-xs text-theme-primary-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent"
                    >
                      ✕
                    </button>
                    {mediaMessage(item) && <p className={`mt-1 text-[10px] ${item.state === "BLOCKED" || item.state === "FAILED" ? "text-theme-danger" : item.state === "UNAVAILABLE" ? "text-theme-warning" : "text-theme-muted"}`}>{mediaMessage(item)}</p>}
                    {(item.state === "FAILED" || item.state === "UNAVAILABLE") && (
                      <button type="button" onClick={() => retryMedia()} className="absolute bottom-1 left-1 rounded-[var(--radius-control)] bg-theme-primary px-1 text-[10px] text-theme-primary-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent">Retry</button>
                    )}
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={handleCreate}
              disabled={createMediaUploading || form.media.length !== 1 || form.media[0]?.state !== "APPROVED"}
              className={`
                w-full
                rounded-[var(--radius-control)]
                py-3
                text-sm
                font-medium
                transition-opacity
                ${
                  createMediaUploading
                    ? `
                      bg-theme-inset
                      text-theme-muted
                      cursor-not-allowed
                    `
                    : `
                      bg-theme-primary text-theme-primary-text
                      hover:opacity-90
                    `
                }
              `}
            >
              {createMediaUploading
                ? "Moderating Media..."
                : "+ Add Service"}
            </button>

          </div>
        </div>

        {/* RIGHT: SERVICES LIST */}
        <div className="space-y-5 lg:pl-6">

          {!loading &&
            services.map((service) => {
              const isEditing =
                editingId === service._id;
              const legacyMultiImage = isEditing && editForm.media.length > 1;
              const editableMedia = editForm.replacement ? [editForm.replacement] : editForm.media;

              return (
                <div
                  key={service._id}
                  className={`
                    group
                    bg-theme-surface
                    border border-theme-border
                    rounded-[var(--radius-card)] px-5 py-4
                    space-y-3
                    relative
                    overflow-hidden
                    transition-colors
                    hover:bg-theme-surface-raised
                  `}
                >

                  {
!isEditing ? (
  <>
    
    {/* MOBILE UI */}
<div className="md:hidden relative z-10 space-y-4">

  {/* TOP */}
  <div className="flex items-start justify-between gap-3">

    {/* LEFT */}
    <div className="flex-1 min-w-0">

      <h2 className="
        text-[24px]
        leading-[0.95]
        font-semibold
        text-theme-text
        break-words
      ">
        {service.title}
      </h2>

      <p className="
        mt-2
        text-[13px]
        text-theme-muted
        leading-relaxed
      ">
        {service.description}
      </p>

    </div>

    {/* STATUS */}
    <span
      className={`
        shrink-0
        text-[10px]
        px-2.5 py-1
        rounded-lg
        whitespace-nowrap
        ${
          service.isActive
            ? "border border-theme-success bg-theme-success-tint text-theme-success"
            : "border border-theme-danger bg-theme-danger-tint text-theme-danger"
        }
      `}
    >
      {service.isActive
        ? "Active"
        : "Disabled"}
    </span>

  </div>

  {/* MEDIA */}
 <div className="w-full">

    {Array.isArray(service.media) &&
    service.media.length > 0 ? (

      <img
        src={service.media[0]}
        alt={service.title}
        className="
          w-full
          h-[150px]
          object-cover
          rounded-[var(--radius-card)]
          border border-theme-border
        "
      />

    ) : (

      <div
        className="
          w-full
          h-[140px]
          rounded-[var(--radius-card)]
          border border-theme-border
          bg-theme-inset
          flex
          items-center
          justify-center
          text-theme-muted
          text-xs
        "
      >
        No media
      </div>

    )}

  </div>

  {/* META */}
  <div className="flex items-end justify-between">

    <div className="flex gap-6">

      <div>
        <p className="text-[10px] text-theme-muted">
          Duration
        </p>

        <p className="
          text-[18px]
          font-semibold
          text-theme-text
          mt-1
          leading-none
        ">
          {service.durationMinutes}
        </p>

        <p className="mt-1 text-[11px] text-theme-muted">
          mins
        </p>
      </div>

      <div>
        <p className="text-[10px] text-theme-muted">
          Price
        </p>

        <p className="
          text-[16px]
          font-semibold
          text-theme-text
          mt-1
          leading-none
        ">
          {service.currency}
        </p>

        <p className="mt-1 text-[13px] text-theme-text">
          {service.price}
        </p>
      </div>

    </div>

  </div>

  {/* ACTIONS */}
  <div className="
    flex
    items-center
    justify-end
    gap-4
    pt-1
  ">

    <button
      onClick={() =>
        startEdit(service)
      }
      className="
        text-[12px]
        text-theme-text
        hover:text-theme-accent
        transition-colors
        focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent
      "
    >
      Edit
    </button>

    <button
      onClick={() =>
        handleToggle(service)
      }
      className={`text-[12px] transition-opacity focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent ${
        service.isActive
          ? "text-theme-warning hover:opacity-75"
          : "text-theme-success hover:opacity-75"
      }`}
    >
      {service.isActive
        ? "Disable"
        : "Enable"}
    </button>

    <button
      onClick={() =>
        handleDelete(service._id)
      }
      className="
        text-[12px]
        text-theme-danger
        hover:opacity-75
        transition-opacity
        focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent
      "
    >
      Delete
    </button>

  </div>

</div>

    {/* DESKTOP UI */}
    <div className="hidden md:flex relative z-10 gap-8 items-center">

      {/* LEFT */}
      <div className="flex-1 min-w-0">

        {/* HEADER */}
        <div className="flex justify-between items-start gap-4">

          <div className="space-y-2">

            <p className="
              text-[22px]
              font-semibold
              text-theme-text
              tracking-tight
              leading-none
            ">
              {service.title}
            </p>

            <p className="
              text-[14px]
              text-theme-muted
              line-clamp-2
              max-w-[420px]
            ">
              {service.description}
            </p>

          </div>

          <span
            className={`
              text-[11px]
              px-3 py-1.5
              rounded-lg
              whitespace-nowrap
              ${
                service.isActive
                  ? "border border-theme-success bg-theme-success-tint text-theme-success"
                  : "border border-theme-danger bg-theme-danger-tint text-theme-danger"
              }
            `}
          >
            {service.isActive
              ? "Active"
              : "Disabled"}
          </span>

        </div>

        {/* META */}
        <div className="
          flex
          items-center
          gap-4
          text-[14px]
          text-theme-muted
          mt-5
        ">

          <span>
            {service.durationMinutes} mins
          </span>

          <span className="h-[4px] w-[4px] rounded-full bg-theme-border-strong" />

          <span>
            {service.currency} {service.price}
          </span>

        </div>

        {/* ACTIONS */}
        <div
          className="
            flex
            items-center
            gap-4
            mt-8
            transition-opacity duration-200
          "
        >

          <button
            onClick={() =>
              startEdit(service)
            }
            className="
              text-[13px]
              text-theme-text
              hover:text-theme-accent
              transition-colors
              focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent
            "
          >
            Edit
          </button>

          <button
            onClick={() =>
              handleToggle(service)
            }
            className={`text-[13px] transition-opacity focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent ${
              service.isActive
                ? "text-theme-warning hover:opacity-75"
                : "text-theme-success hover:opacity-75"
            }`}
          >
            {service.isActive
              ? "Disable"
              : "Enable"}
          </button>

          <button
            onClick={() =>
              handleDelete(service._id)
            }
            className="
              text-[13px]
              text-theme-danger
              hover:opacity-75
              transition-opacity
              focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent
            "
          >
            Delete
          </button>

        </div>

      </div>

      {/* RIGHT MEDIA */}
      <div className="
        flex
        justify-center
        items-center
        w-[220px]
        shrink-0
      ">

        {Array.isArray(service.media) &&
        service.media.length > 0 ? (

          <div className="
            flex
            justify-center
            gap-3
            flex-wrap
          ">

            {service.media.map((img, i) => (

              <img
                key={i}
                src={img}
                className="
                  h-50
                  w-40
                  object-cover
                  rounded-[var(--radius-card)]
                  border border-theme-border
                "
              />

            ))}

          </div>

        ) : (

          <div className="
            h-40
            w-40
            rounded-[var(--radius-card)]
            border border-theme-border
            bg-theme-inset
            flex
            items-center
            justify-center
            text-[13px]
            text-theme-muted
          ">
            No media
          </div>

        )}

      </div>

    </div>

  </>
) : (
                    <>
                      {/* EDIT MODE */}
                      <h3 className="text-sm font-medium text-theme-text">
                        Edit Service
                      </h3>

                      <div className="flex flex-col gap-4">

                        <input
                          value={editForm.title}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              title: e.target.value,
                            })
                          }
                          aria-label="Service title"
                          className="rounded-[var(--radius-control)] border border-theme-border bg-theme-inset p-3 text-theme-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent"
                        />

                       <div className="relative">
  <select
    value={
      editForm.durationMinutes
    }
    aria-label="Service duration"
    onChange={(e) =>
      setEditForm({
        ...editForm,
        durationMinutes: Number(
          e.target.value
        ),
      })
    }
    className="
      w-full
      appearance-none
      bg-theme-inset
      border border-theme-border
      rounded-[var(--radius-control)]
      p-3
      pr-10
      text-sm
      text-theme-text
      transition-colors
      focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent
    "
  >
    {[30, 45, 60, 90, 120].map(
      (d) => (
        <option
          key={d}
          value={d}
          className="
            bg-theme-surface
            text-theme-text
          "
        >
          {d} minutes
        </option>
      )
    )}
  </select>

  <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-theme-muted">
    ▼
  </div>
</div>
                        <textarea
                          value={editForm.description}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              description:
                                e.target.value,
                            })
                          }
                          aria-label="Service description"
                          className="rounded-[var(--radius-control)] border border-theme-border bg-theme-inset p-3 text-theme-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent"
                        />

                        <input
                          type="number"
                          aria-label="Service price"
                          value={editForm.price}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              price: e.target.value,
                            })
                          }
                          className="rounded-[var(--radius-control)] border border-theme-border bg-theme-inset p-3 text-theme-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent"
                        />

                        {/* FILE INPUT */}
                        <input
                          type="file"
                          accept="image/*"
                          disabled={legacyMultiImage}
                          onChange={(e) => { if (e.target.files) handleMediaUpload(e.target.files, true); e.target.value = ""; }}
                          className="text-xs text-theme-muted file:mr-3 file:rounded-[var(--radius-control)] file:border-0 file:bg-theme-inset file:px-3 file:py-2 file:text-sm file:font-medium file:text-theme-text"
                        />

                        {legacyMultiImage && (
                          <p className="text-xs text-theme-warning" role="status">
                            This legacy service has multiple images. Its media is preserved and must be migrated before it can be changed.
                          </p>
                        )}

                        {editForm.replacement && editForm.media.length > 0 && (
                          <p className="text-xs text-theme-muted">Your current service image remains authoritative until this replacement is saved.</p>
                        )}

                        {/* MEDIA PREVIEW */}
                        {editableMedia.length > 0 && (
                          <div className="grid grid-cols-3 gap-2">
                            {editableMedia.map(
                              (item, i) => (
                                <div
                                  key={item.clientId}
                                  className={`relative h-20 rounded-lg overflow-hidden ${profileMediaStatusClassName(item)}`}
                                >
                                  <img
                                    src={previewUrl(item)}
                                    alt={`Service media ${i + 1}`}
                                    className="w-full h-full object-cover"
                                  />

                                  {!legacyMultiImage && editForm.replacement && <button onClick={removeEditReplacement} className="absolute right-1 top-1 rounded-[var(--radius-control)] bg-theme-primary px-1 text-xs text-theme-primary-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent">✕</button>}
                                  {mediaMessage(item) && <p className={`absolute inset-x-0 bottom-0 bg-theme-surface-raised px-1 text-[10px] ${item.state === "BLOCKED" || item.state === "FAILED" ? "text-theme-danger" : item.state === "UNAVAILABLE" ? "text-theme-warning" : "text-theme-muted"}`}>{mediaMessage(item)}</p>}
                                  {(item.state === "FAILED" || item.state === "UNAVAILABLE") && (
                                    <button type="button" onClick={() => retryMedia(true)} className="absolute bottom-0 left-0 rounded-[var(--radius-control)] bg-theme-primary px-1 text-[10px] text-theme-primary-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent">Retry</button>
                                  )}
                                </div>
                              )
                            )}
                          </div>
                        )}

                        {/* ACTION BUTTONS */}
                        <div className="flex gap-2">

                          <button
                            onClick={saveEdit}
                            disabled={editMediaUploading}
                            className="flex-1 rounded-[var(--radius-control)] bg-theme-primary py-3 text-theme-primary-text transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent"
                          >
                            {editMediaUploading ? "Moderating Media..." : "Save Changes"}
                          </button>

                          <button
                            onClick={cancelEdit}
                            className="flex-1 rounded-[var(--radius-control)] border border-theme-border bg-theme-surface py-3 text-theme-text transition-colors hover:bg-theme-inset focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent"
                          >
                            Cancel
                          </button>

                        </div>

                      </div>
                    </>
                  )}

                </div>
              );
            })}

        </div>

      </div>

    </div>
  </DashboardLayout>
);
}

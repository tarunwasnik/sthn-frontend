// frontend/src/dashboards/CreatorServices.tsx

import { useEffect, useState, useRef } from "react"; // ✅ added useRef
import DashboardLayout from "../layouts/DashboardLayout";
import api from "../api/axios";
import { UPLOAD_PRESET } from "../config/cloudinary";

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

/* ================= CLOUDINARY ================= */

const uploadToCloudinary = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);
  formData.append("folder", "creator_services");

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

export default function CreatorServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    durationMinutes: 60,
    price: "",
    media: [] as string[],
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null); // ✅ added

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

    try {
      const cleanMedia = form.media.filter((url) =>
        url.startsWith("http")
      );

      await api.post("/v1/creator/services", {
        title: form.title,
        description: form.description,
        durationMinutes: form.durationMinutes,
        price: Number(form.price),
        media: cleanMedia,
      });

      // ✅ cleanup blob urls
      form.media.forEach((url) => {
        if (url.startsWith("blob:")) {
          URL.revokeObjectURL(url);
        }
      });

      setForm({
        title: "",
        description: "",
        durationMinutes: 60,
        price: "",
        media: [],
      });

      // ✅ reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      fetchServices();
    } catch {
      console.error("Failed to create service");
    }
  };

  /* ================= EDIT ================= */

  const startEdit = (service: Service) => {
    setEditingId(service._id);
    setEditForm({
      ...service,
      media: service.media || [],
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(null);
  };

  const saveEdit = async () => {
    try {
      const cleanMedia = editForm.media.filter((url: string) =>
        url.startsWith("http")
      );

      await api.patch(`/v1/creator/services/${editingId}`, {
        ...editForm,
        media: cleanMedia,
        price: Number(editForm.price),
      });

      setEditingId(null);
      fetchServices();
    } catch {
      console.error("Update failed");
    }
  };

  /* ================= MEDIA ================= */

const handleMediaUpload = async (
  files: FileList,
  isEdit = false
) => {

  setIsUploading(true);

  try {

    const arr = Array.from(files);

    for (const file of arr) {

      const preview =
        URL.createObjectURL(file);

      if (isEdit) {

        setEditForm((p: any) => ({
          ...p,
          media: [...p.media, preview],
        }));

      } else {

        setForm((p) => ({
          ...p,
          media: [...p.media, preview],
        }));

      }

      const url =
        await uploadToCloudinary(file);

      if (isEdit) {

        setEditForm((p: any) => {

          const updated = [...p.media];

          const index =
            updated.indexOf(preview);

          if (index !== -1) {
            updated[index] = url;
          }

          return {
            ...p,
            media: updated,
          };
        });

      } else {

        setForm((p) => {

          const updated = [...p.media];

          const index =
            updated.indexOf(preview);

          if (index !== -1) {
            updated[index] = url;
          }

          return {
            ...p,
            media: updated,
          };
        });

      }
    }

  } finally {

    setIsUploading(false);

  }
};

  const removeMedia = (index: number, isEdit = false) => {
    if (isEdit) {
      setEditForm((p: any) => {
        const removed = p.media[index];

        if (removed?.startsWith("blob:")) {
          URL.revokeObjectURL(removed);
        }

        return {
          ...p,
          media: p.media.filter((_: any, i: number) => i !== index),
        };
      });
    } else {
      setForm((p) => {
        const removed = p.media[index];

        if (removed?.startsWith("blob:")) {
          URL.revokeObjectURL(removed);
        }

        return {
          ...p,
          media: p.media.filter((_, i) => i !== index),
        };
      });
    }
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
        <h1 className="text-2xl font-semibold text-white">
          Your Services
        </h1>

        <p className="text-sm text-gray-400 mt-1">
          Manage your offerings and pricing
        </p>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_2fr] gap-10">

        {/* LEFT: ADD SERVICE */}
        <div
  className="
    bg-white/5
    backdrop-blur-xl
    border border-white/10
    rounded-2xl
    p-6
    space-y-5
    h-fit
    lg:sticky
    lg:top-6
  "
>

          <h2 className="text-base font-semibold text-white">
            Add New Service
          </h2>

          <div className="flex flex-col gap-4">

            <input
              type="text"
              placeholder="Service Title"
              value={form.title}
              onChange={(e) =>
                setForm({
                  ...form,
                  title: e.target.value,
                })
              }
              className="bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white placeholder-gray-400"
            />

            <div className="relative">
              <select
                value={form.durationMinutes}
                onChange={(e) =>
                  setForm({
                    ...form,
                    durationMinutes: Number(e.target.value),
                  })
                }
                className="
                  w-full
                  appearance-none
                  bg-white/5
                  border border-white/10
                  rounded-xl
                  p-3
                  pr-10
                  text-sm
                  text-white
                  outline-none
                  focus:outline-none
                  focus:ring-0
                  transition
                "
              >
                {[30, 45, 60, 90, 120].map((d) => (
                  <option
                    key={d}
                    value={d}
                    className="
                      bg-[#0f0f0f]
                      text-white
                    "
                  >
                    {d} minutes
                  </option>
                ))}
              </select>

              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none">
                ▼
              </div>
            </div>

            <textarea
              placeholder="Service Description"
              value={form.description}
              onChange={(e) =>
                setForm({
                  ...form,
                  description: e.target.value,
                })
              }
              className="bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white placeholder-gray-400"
            />

            <input
              type="number"
              placeholder="Service Price"
              value={form.price}
              onChange={(e) =>
                setForm({
                  ...form,
                  price: e.target.value,
                })
              }
              className="bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white placeholder-gray-400"
            />

            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={(e) =>
                e.target.files &&
                handleMediaUpload(e.target.files)
              }
              className="text-xs text-gray-400"
            />

            {/* PREVIEW */}
            {form.media.length > 0 && (
              <div className="flex gap-2 overflow-x-auto">
                {form.media.map((img, i) => (
                  <div
                    key={i}
                    className="relative h-20 w-20 min-w-[80px]"
                  >
                    <img
                      src={img}
                      className="w-full h-full object-cover rounded-lg border border-white/10"
                    />

                    <button
                      onClick={() => removeMedia(i)}
                      className="absolute top-1 right-1 bg-black/70 text-xs px-1 rounded"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={handleCreate}
              disabled={isUploading}
              className={`
                w-full
                rounded-xl
                py-3
                text-sm
                font-medium
                transition
                ${
                  isUploading
                    ? `
                      bg-white/5
                      text-white/40
                      cursor-not-allowed
                    `
                    : `
                      bg-white/10
                      hover:bg-white/20
                    `
                }
              `}
            >
              {isUploading
                ? "Uploading Media..."
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

              return (
                <div
                  key={service._id}
                  className={`
                    group
                    bg-gradient-to-br from-white/[0.045] to-white/[0.015]
                    border border-white/10
                    rounded-2xl px-5 py-4
                    space-y-3
                    relative
                    overflow-hidden
                    transition-all duration-300
                    hover:shadow-[0_10px_30px_rgba(0,0,0,0.35)]
                    hover:-translate-y-[2px]
                    ${
                      service.isActive
                        ? "shadow-[0_0_20px_rgba(34,197,94,0.08)]"
                        : ""
                    }
                  `}
                >

                  {/* glow layer */}
                  <div className="absolute inset-0 bg-gradient-to-b from-white/[0.05] to-transparent pointer-events-none rounded-2xl" />

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
        font-bold
        text-white
        break-words
      ">
        {service.title}
      </h2>

      <p className="
        mt-2
        text-[13px]
        text-white/55
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
        backdrop-blur
        ${
          service.isActive
            ? "bg-green-500/10 text-green-300 border border-green-500/20"
            : "bg-red-500/10 text-red-300 border border-red-500/20"
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
          rounded-xl
          border border-white/10
        "
      />

    ) : (

      <div
        className="
          w-full
          h-[140px]
          rounded-xl
          border border-white/10
          bg-white/[0.03]
          flex
          items-center
          justify-center
          text-white/25
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
        <p className="text-[10px] text-white/35">
          Duration
        </p>

        <p className="
          text-[18px]
          font-semibold
          text-white
          mt-1
          leading-none
        ">
          {service.durationMinutes}
        </p>

        <p className="text-[11px] text-white/40 mt-1">
          mins
        </p>
      </div>

      <div>
        <p className="text-[10px] text-white/35">
          Price
        </p>

        <p className="
          text-[16px]
          font-semibold
          text-white
          mt-1
          leading-none
        ">
          {service.currency}
        </p>

        <p className="text-[13px] text-white/65 mt-1">
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
        text-white/70
        hover:text-white
        transition
      "
    >
      Edit
    </button>

    <button
      onClick={() =>
        handleToggle(service)
      }
      className={`text-[12px] transition ${
        service.isActive
          ? "text-yellow-300 hover:text-yellow-200"
          : "text-green-300 hover:text-green-200"
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
        text-red-400
        hover:text-red-300
        transition
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
              font-bold
              text-white
              tracking-tight
              leading-none
            ">
              {service.title}
            </p>

            <p className="
              text-[14px]
              text-white/50
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
              backdrop-blur
              ${
                service.isActive
                  ? "bg-green-500/10 text-green-300 border border-green-500/20"
                  : "bg-red-500/10 text-red-300 border border-red-500/20"
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
          text-white/45
          mt-5
        ">

          <span>
            {service.durationMinutes} mins
          </span>

          <span className="w-[4px] h-[4px] bg-white/30 rounded-full" />

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
            opacity-0
            translate-y-1
            group-hover:opacity-100
            group-hover:translate-y-0
            transition-all duration-200
          "
        >

          <button
            onClick={() =>
              startEdit(service)
            }
            className="
              text-[13px]
              text-white/70
              hover:text-white
              transition
            "
          >
            Edit
          </button>

          <button
            onClick={() =>
              handleToggle(service)
            }
            className={`text-[13px] transition ${
              service.isActive
                ? "text-yellow-300 hover:text-yellow-200"
                : "text-green-300 hover:text-green-200"
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
              text-red-400
              hover:text-red-300
              transition
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
                  rounded-2xl
                  border border-white/10
                "
              />

            ))}

          </div>

        ) : (

          <div className="
            h-40
            w-40
            rounded-2xl
            border border-white/10
            bg-white/[0.03]
            flex
            items-center
            justify-center
            text-[13px]
            text-white/25
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
                      <h3 className="text-sm text-gray-300">
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
                          className="bg-white/5 border border-white/10 rounded-xl p-3 text-white"
                        />

                       <div className="relative">
  <select
    value={
      editForm.durationMinutes
    }
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
      bg-white/5
      border border-white/10
      rounded-xl
      p-3
      pr-10
      text-sm
      text-white
      outline-none
      focus:outline-none
      focus:ring-0
      transition
    "
  >
    {[30, 45, 60, 90, 120].map(
      (d) => (
        <option
          key={d}
          value={d}
          className="
            bg-[#0f0f0f]
            text-white
          "
        >
          {d} minutes
        </option>
      )
    )}
  </select>

  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none">
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
                          className="bg-white/5 border border-white/10 rounded-xl p-3 text-white"
                        />

                        <input
                          type="number"
                          value={editForm.price}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              price: e.target.value,
                            })
                          }
                          className="bg-white/5 border border-white/10 rounded-xl p-3 text-white"
                        />

                        {/* FILE INPUT */}
                        <input
                          type="file"
                          multiple
                          onChange={(e) =>
                            e.target.files &&
                            handleMediaUpload(
                              e.target.files,
                              true
                            )
                          }
                          className="text-xs text-gray-400"
                        />

                        {/* MEDIA PREVIEW */}
                        {editForm.media.length > 0 && (
                          <div className="grid grid-cols-3 gap-2">
                            {editForm.media.map(
                              (
                                img: string,
                                i: number
                              ) => (
                                <div
                                  key={i}
                                  className="relative h-20 rounded-lg overflow-hidden border border-white/10"
                                >
                                  <img
                                    src={img}
                                    className="w-full h-full object-cover"
                                  />

                                  <button
                                    onClick={() =>
                                      removeMedia(
                                        i,
                                        true
                                      )
                                    }
                                    className="absolute top-1 right-1 bg-black/70 text-xs px-1 rounded"
                                  >
                                    ✕
                                  </button>
                                </div>
                              )
                            )}
                          </div>
                        )}

                        {/* ACTION BUTTONS */}
                        <div className="flex gap-2">

                          <button
                            onClick={saveEdit}
                            className="flex-1 bg-white/10 hover:bg-white/20 transition py-3 rounded-xl"
                          >
                            Save Changes
                          </button>

                          <button
                            onClick={cancelEdit}
                            className="flex-1 bg-white/10 hover:bg-white/20 transition py-3 rounded-xl"
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
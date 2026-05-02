// frontend/src/dashboards/CreatorServices.tsx

import { useEffect, useState, useRef } from "react"; // ✅ added useRef
import DashboardLayout from "../layouts/DashboardLayout";
import api from "../api/axios";

/* ================= TYPES ================= */

interface Service {
  _id: string;
  title: string;
  description: string;
  durationMinutes: number;
  price: number;
  isActive: boolean;
  media?: string[];
}

/* ================= CLOUDINARY ================= */

const uploadToCloudinary = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "unsigned_preset");
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

  const handleMediaUpload = async (files: FileList, isEdit = false) => {
    const arr = Array.from(files);

    for (const file of arr) {
      const preview = URL.createObjectURL(file);

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

      const url = await uploadToCloudinary(file);

      if (isEdit) {
        setEditForm((p: any) => {
          const updated = [...p.media];
          const index = updated.indexOf(preview);
          if (index !== -1) updated[index] = url;
          return { ...p, media: updated };
        });
      } else {
        setForm((p) => {
          const updated = [...p.media];
          const index = updated.indexOf(preview);
          if (index !== -1) updated[index] = url;
          return { ...p, media: updated };
        });
      }
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

        {/* ADD SERVICE */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 space-y-4 overflow-hidden">

          <h2 className="text-base font-semibold text-white">
            Add New Service
          </h2>

          <div className="flex flex-col gap-4">

            <input
              type="text"
              placeholder="Service Title"
              value={form.title}
              onChange={(e) =>
                setForm({ ...form, title: e.target.value })
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
                className="w-full appearance-none bg-white/5 border border-white/10 rounded-xl p-3 pr-10 text-sm text-white"
              >
                {[30, 45, 60, 90, 120].map((d) => (
                  <option key={d} value={d} className="bg-[#0b0f1a]">
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
                setForm({ ...form, description: e.target.value })
              }
              className="bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white placeholder-gray-400"
            />

            <input
              type="number"
              placeholder="Service Price"
              value={form.price}
              onChange={(e) =>
                setForm({ ...form, price: e.target.value })
              }
              className="bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white placeholder-gray-400"
            />

            <input
              ref={fileInputRef} // ✅ added
              type="file"
              multiple
              onChange={(e) =>
                e.target.files && handleMediaUpload(e.target.files)
              }
              className="text-xs text-gray-400"
            />

            {/* ✅ PREVIEW */}
            {form.media.length > 0 && (
              <div className="flex gap-2 overflow-x-auto">
                {form.media.map((img, i) => (
                  <div key={i} className="relative h-20 w-20">
                    <img
                      src={img}
                      className="w-full h-full object-cover rounded-md"
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
              className="w-full bg-white/10 hover:bg-white/20 transition rounded-xl py-3 text-sm font-medium"
            >
              + Add Service
            </button>

          </div>
        </div>

        {/* SERVICES LIST */}
        <div className="space-y-4">

          {!loading &&
            services.map((service) => {
              const isEditing = editingId === service._id;

              return (
                <div
                  key={service._id}
                  className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 space-y-3"
                >

                  {!isEditing ? (
                    <>
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-white font-semibold">
                            {service.title}
                          </p>
                          <p className="text-xs text-gray-400">
                            {service.description}
                          </p>
                        </div>

                        <span
                          className={`text-xs px-2 py-1 rounded-md ${
                            service.isActive
                              ? "bg-green-500/10 text-green-300"
                              : "bg-red-500/10 text-red-300"
                          }`}
                        >
                          {service.isActive ? "Active" : "Disabled"}
                        </span>
                      </div>

                      {Array.isArray(service.media) &&
                        service.media.length > 0 && (
                          <div className="flex gap-2 overflow-x-auto">
                            {service.media.map((img, i) => (
                              <img
                                key={i}
                                src={img}
                                className="h-16 w-16 object-cover rounded-md"
                              />
                            ))}
                          </div>
                        )}

                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={() => startEdit(service)}
                          className="flex-1 bg-white/10 hover:bg-white/20 py-2 rounded-lg text-xs"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => handleToggle(service)}
                          className="flex-1 bg-white/10 hover:bg-white/20 py-2 rounded-lg text-xs"
                        >
                          {service.isActive ? "Disable" : "Enable"}
                        </button>

                        <button
                          onClick={() => handleDelete(service._id)}
                          className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 py-2 rounded-lg text-xs"
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <h3 className="text-sm text-gray-300">Edit Service</h3>

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
                            value={editForm.durationMinutes}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                durationMinutes: Number(e.target.value),
                              })
                            }
                            className="w-full appearance-none bg-white/5 border border-white/10 rounded-xl p-3 pr-10 text-sm text-white"
                          >
                            {[30, 45, 60, 90, 120].map((d) => (
                              <option key={d} value={d} className="bg-[#0b0f1a]">
                                {d} minutes
                              </option>
                            ))}
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
                              description: e.target.value,
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

                        <input
                          type="file"
                          multiple
                          onChange={(e) =>
                            e.target.files &&
                            handleMediaUpload(e.target.files, true)
                          }
                          className="text-xs text-gray-400"
                        />

                        <div className="grid grid-cols-3 gap-2">
                          {editForm.media.map((img: string, i: number) => (
                            <div key={i} className="relative h-20">
                              <img
                                src={img}
                                className="w-full h-full object-cover rounded-md"
                              />
                              <button
                                onClick={() => removeMedia(i, true)}
                                className="absolute top-1 right-1 bg-black/70 text-xs px-1 rounded"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={saveEdit}
                            className="flex-1 bg-white/10 py-3 rounded-xl"
                          >
                            Save Changes
                          </button>

                          <button
                            onClick={cancelEdit}
                            className="flex-1 bg-white/10 py-3 rounded-xl"
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
    </DashboardLayout>
  );
}
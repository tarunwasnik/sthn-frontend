// frontend/src/dashboards/CreatorServices.tsx

import { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import api from "../api/axios";

interface Service {
  _id: string;
  title: string;
  description: string;
  durationMinutes: number;
  price: number;
  isActive: boolean;
}

export default function CreatorServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    title: "",
    description: "",
    durationMinutes: 60,
    price: "",
  });

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

  const handleCreate = async () => {
    if (!form.title || !form.description || !form.price) return;

    try {
      await api.post("/v1/creator/services", {
        title: form.title,
        description: form.description,
        durationMinutes: form.durationMinutes,
        price: Number(form.price),
      });

      setForm({
        title: "",
        description: "",
        durationMinutes: 60,
        price: "",
      });

      fetchServices();
    } catch {
      console.error("Failed to create service");
    }
  };

  const handleToggle = async (service: Service) => {
    try {
      await api.patch(`/v1/creator/services/${service._id}`, {
        isActive: !service.isActive,
      });

      fetchServices();
    } catch {
      console.error("Failed to update service");
    }
  };

  const handleDelete = async (serviceId: string) => {
    try {
      await api.delete(`/v1/creator/services/${serviceId}`);
      fetchServices();
    } catch {
      console.error("Failed to delete service");
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-10">

        <h1 className="text-2xl font-bold">
          Service Management
        </h1>

        {/* CREATE SERVICE */}

        <div className="bg-[#111827] border border-gray-800 rounded-xl p-6 space-y-6">

          <h2 className="text-lg font-semibold">
            Create Service
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <input
              type="text"
              placeholder="Service Title"
              value={form.title}
              onChange={(e) =>
                setForm({ ...form, title: e.target.value })
              }
              className="bg-[#0F172A] border border-gray-700 rounded-lg p-3 text-white"
            />

            <select
              value={form.durationMinutes}
              onChange={(e) =>
                setForm({
                  ...form,
                  durationMinutes: Number(e.target.value),
                })
              }
              className="bg-[#0F172A] border border-gray-700 rounded-lg p-3 text-white"
            >
              {[30, 45, 60, 90, 120].map((d) => (
                <option key={d} value={d}>
                  {d} minutes
                </option>
              ))}
            </select>

            <textarea
              placeholder="Service Description"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              className="bg-[#0F172A] border border-gray-700 rounded-lg p-3 text-white md:col-span-2"
            />

            <input
              type="number"
              placeholder="Service Price"
              value={form.price}
              onChange={(e) =>
                setForm({ ...form, price: e.target.value })
              }
              className="bg-[#0F172A] border border-gray-700 rounded-lg p-3 text-white md:col-span-2"
            />

          </div>

          <button
            onClick={handleCreate}
            className="bg-blue-600 hover:bg-blue-700 transition px-6 py-2 rounded-lg"
          >
            Create Service
          </button>

        </div>

        {/* SERVICES LIST */}

        <div className="space-y-6">

          {loading && (
            <p className="text-gray-400">
              Loading services...
            </p>
          )}

          {!loading &&
            services.map((service) => (
              <div
                key={service._id}
                className="bg-[#111827] border border-gray-800 rounded-xl p-6"
              >

                <div className="flex justify-between items-start">

                  <div className="space-y-1">
                    <p className="text-lg font-semibold">
                      {service.title}
                    </p>

                    <p className="text-sm text-gray-400">
                      {service.description}
                    </p>

                    <p className="text-sm text-gray-500">
                      Duration: {service.durationMinutes} min
                    </p>

                    <p className="text-sm text-gray-500">
                      Price: {service.price}
                    </p>

                    <p className="text-xs text-gray-400">
                      Status: {service.isActive ? "Active" : "Disabled"}
                    </p>
                  </div>

                  <div className="flex gap-2">

                    <button
                      onClick={() => handleToggle(service)}
                      className="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded-lg text-sm"
                    >
                      {service.isActive ? "Disable" : "Enable"}
                    </button>

                    <button
                      onClick={() => handleDelete(service._id)}
                      className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-sm"
                    >
                      Delete
                    </button>

                  </div>

                </div>

              </div>
            ))}

        </div>

      </div>
    </DashboardLayout>
  );
}
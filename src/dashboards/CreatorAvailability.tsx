// frontend/src/dashboards/CreatorAvailability.tsx

import { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import api from "../api/axios";
import SlotTimeline from "../components/availability/SlotTimeline";
import TimeSelect from "../components/common/TimeSelect";
import { ChevronDown, ChevronUp } from "lucide-react";

interface Availability {
  _id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;

  totalSlots: number;
  availableSlots: number;
  lockedSlots: number;
  bookedSlots: number;
  cancelledSlots: number;
}

interface Service {
  _id: string;
  title: string;
}

interface Slot {
  _id: string;
  startTime: string;
  endTime: string;
  status: string;
}

export default function CreatorAvailability() {

  const [services, setServices] = useState<Service[]>([]);
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [activeAvailability, setActiveAvailability] = useState<string | null>(null);
  const [showCancelled, setShowCancelled] = useState(false);

  const [form, setForm] = useState({
    serviceId: "",
    date: "",
    startTime: "",
    endTime: "",
    slotDurationMinutes: 60,
  });

  const slotDurations = [30,45,60,90,120,180,240,360,480];

  const fetchServices = async () => {
    try {
      const res = await api.get("/v1/creator/services");
      setServices(res.data.services || []);
    } catch {
      console.error("Failed to fetch services");
    }
  };

  const fetchAvailabilities = async () => {
    try {
      const res = await api.get("/v1/creator/availability", {
        params: {
          includeCancelled: showCancelled ? "true" : undefined
        }
      });

      setAvailabilities(res.data.availabilities || []);

    } catch {
      console.error("Failed to fetch availabilities");
    }
  };

  const fetchSlots = async (availabilityId: string) => {
    try {
      const res = await api.get(`/v1/creator/availability/${availabilityId}/slots`);
      setSlots(res.data.slots || []);
      setActiveAvailability(availabilityId);
    } catch {
      console.error("Failed to fetch slots");
    }
  };

  const toggleSlots = (availabilityId: string) => {

    if (activeAvailability === availabilityId) {
      setActiveAvailability(null);
      setSlots([]);
      return;
    }

    fetchSlots(availabilityId);
  };

  const handleCreate = async () => {

    if (!form.serviceId || !form.date || !form.startTime || !form.endTime) {
      return;
    }

    try {

      await api.post("/v1/creator/availability", {
        serviceId: form.serviceId,
        date: form.date,
        startTime: form.startTime,
        endTime: form.endTime,
        slotDurationMinutes: form.slotDurationMinutes
      });

      setForm({
        serviceId: "",
        date: "",
        startTime: "",
        endTime: "",
        slotDurationMinutes: 60,
      });

      fetchAvailabilities();

    } catch {
      console.error("Failed to create availability");
    }
  };

  const cancelAvailability = async (availabilityId: string) => {

    try {
      await api.delete(`/v1/creator/availability/${availabilityId}`);

      if (activeAvailability === availabilityId) {
        setActiveAvailability(null);
        setSlots([]);
      }

      fetchAvailabilities();

    } catch {
      console.error("Failed to cancel availability");
    }
  };

  const disableSlot = async (slotId: string) => {
    try {
      await api.patch(`/v1/creator/slots/${slotId}/disable`);
      if (activeAvailability) fetchSlots(activeAvailability);
    } catch {
      console.error("Failed to disable slot");
    }
  };

  const enableSlot = async (slotId: string) => {
    try {
      await api.patch(`/v1/creator/slots/${slotId}/enable`);
      if (activeAvailability) fetchSlots(activeAvailability);
    } catch {
      console.error("Failed to enable slot");
    }
  };

  const deleteSlot = async (slotId: string) => {
    try {
      await api.delete(`/v1/creator/slots/${slotId}`);
      if (activeAvailability) fetchSlots(activeAvailability);
    } catch {
      console.error("Failed to delete slot");
    }
  };

  useEffect(() => {
    fetchServices();
    fetchAvailabilities();
  }, [showCancelled]);

  return (

    <DashboardLayout>

      <div className="space-y-10">

        <h1 className="text-2xl font-bold">
          Availability Management
        </h1>

        <div className="flex items-center gap-3">

          <input
            type="checkbox"
            checked={showCancelled}
            onChange={() => setShowCancelled(!showCancelled)}
          />

          <span className="text-sm text-gray-400">
            Show Cancelled History
          </span>

        </div>

        <div className="bg-[#111827] border border-gray-800 rounded-xl p-6 space-y-4">

          <h2 className="text-lg font-semibold">
            Create Availability
          </h2>

          <div className="grid grid-cols-5 gap-4">

            <select
              value={form.serviceId}
              onChange={(e) =>
                setForm({ ...form, serviceId: e.target.value })
              }
              className="bg-[#0F172A] border border-gray-700 p-3 rounded-lg"
            >

              <option value="">Select Service</option>

              {services.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.title}
                </option>
              ))}

            </select>

            <input
              type="date"
              value={form.date}
              onChange={(e) =>
                setForm({ ...form, date: e.target.value })
              }
              className="bg-[#0F172A] border border-gray-700 p-3 rounded-lg"
            />

            <TimeSelect
              value={form.startTime}
              onChange={(t) => setForm({ ...form, startTime: t })}
            />

            <TimeSelect
              value={form.endTime}
              onChange={(t) => setForm({ ...form, endTime: t })}
            />

            <select
              value={form.slotDurationMinutes}
              onChange={(e) =>
                setForm({
                  ...form,
                  slotDurationMinutes: Number(e.target.value),
                })
              }
              className="bg-[#0F172A] border border-gray-700 p-3 rounded-lg"
            >

              {slotDurations.map((d) => (
                <option key={d} value={d}>
                  {d} min slots
                </option>
              ))}

            </select>

          </div>

          <button
            onClick={handleCreate}
            className="bg-blue-600 px-6 py-2 rounded-lg"
          >
            Create Availability
          </button>

        </div>

        {availabilities.map((a) => (

          <div
            key={a._id}
            className="bg-[#111827] border border-gray-800 rounded-xl p-6 space-y-6"
          >

            <div className="flex justify-between items-center">

              <div>

                <div className="font-semibold text-lg">
                  {new Date(a.date).toDateString()}
                </div>

                <div className="text-gray-400 text-sm">
                  {a.startTime} - {a.endTime}
                </div>

                <div className="text-xs text-gray-500">
                  Status: {a.status}
                </div>

              </div>

              {a.status === "ACTIVE" && (
                <button
                  onClick={() => cancelAvailability(a._id)}
                  className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-sm"
                >
                  Cancel
                </button>
              )}

            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">

              <Stat label="Total" value={a.totalSlots} />
              <Stat label="Available" value={a.availableSlots} />
              <Stat label="Locked" value={a.lockedSlots} />
              <Stat label="Booked" value={a.bookedSlots} />
              <Stat label="Cancelled" value={a.cancelledSlots} />

            </div>

            {a.status === "ACTIVE" && (

              <div className="flex justify-end">

                <button
                  onClick={() => toggleSlots(a._id)}
                  className="flex items-center gap-2 bg-blue-600 px-3 py-2 rounded-lg"
                >

                  View Slots

                  {activeAvailability === a._id
                    ? <ChevronUp size={18} />
                    : <ChevronDown size={18} />}

                </button>

              </div>

            )}

            {activeAvailability === a._id && (

              <SlotTimeline
                slots={slots}
                disableSlot={disableSlot}
                enableSlot={enableSlot}
                deleteSlot={deleteSlot}
              />

            )}

          </div>

        ))}

      </div>

    </DashboardLayout>

  );
}

function Stat({ label, value }: { label: string; value: number }) {

  return (

    <div className="bg-[#0F172A] border border-gray-800 rounded-lg p-3 text-center">

      <p className="text-gray-400 text-xs">
        {label}
      </p>

      <p className="font-semibold text-white">
        {value}
      </p>

    </div>

  );

}
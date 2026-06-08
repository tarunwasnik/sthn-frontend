// frontend/src/dashboards/CreatorAvailability.tsx

import { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import api from "../api/axios";
import SlotTimeline from "../components/availability/SlotTimeline";
import TimeSelect from "../components/common/TimeSelect";
import { ChevronDown, ChevronUp } from "lucide-react";
import { TIMEZONES } from "../constants/timezones";

interface Availability {
  _id: string;

  serviceId: string;
  serviceTitle?: string;

  date: string;
  timezone: string;

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
  isActive: boolean;
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
  const [message, setMessage] = useState<{
  type: "success" | "error";
  text: string;
} | null>(null);

  const [form, setForm] = useState({
  serviceId: "",
  date: "",
  startTime: "10:00",
  endTime: "18:00",
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
});


  useEffect(() => {
    fetchServices();
    fetchAvailabilities();
  }, [showCancelled]);

  const fetchServices = async () => {
  try {
    const res = await api.get("/v1/creator/services");
    setServices(
      (res.data.services || []).filter((s: Service) => s.isActive)
    );
  } catch {}
};

  const fetchAvailabilities = async () => {
    try {
      const res = await api.get("/v1/creator/availability", {
        params: {
          includeCancelled: showCancelled ? "true" : undefined
        }
      });
      setAvailabilities(res.data.availabilities || []);
    } catch {}
  };

  const fetchSlots = async (availabilityId: string) => {
    try {
      const res = await api.get(`/v1/creator/availability/${availabilityId}/slots`);
      setSlots(res.data.slots || []);
      setActiveAvailability(availabilityId);
    } catch {}
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
  if (!isValid) return;

  try {
    const res = await api.post(
      "/v1/creator/availability",
      form
    );

    setMessage({
      type: "success",
      text:
        res.data?.message ||
        "Availability created successfully",
    });

    setForm({
      serviceId: "",
      date: "",
      startTime: "10:00",
      endTime: "18:00",
      timezone:
        Intl.DateTimeFormat().resolvedOptions().timeZone,
    });

    fetchAvailabilities();

    setTimeout(() => {
      setMessage(null);
    }, 4000);

  } catch (error: any) {

  console.log(
    "CREATE ERROR:",
    error
  );

  console.log(
    "RESPONSE:",
    error?.response
  );

  console.log(
    "DATA:",
    error?.response?.data
  );

  setMessage({
    type: "error",
    text:
      error?.response?.data?.message ||
      "Failed to create availability",
  });

  setTimeout(() => {
    setMessage(null);
  }, 4000);
 }
 };

  const cancelAvailability = async (
  availabilityId: string
) => {
  try {

    const res = await api.delete(
      `/v1/creator/availability/${availabilityId}`
    );

    setMessage({
      type: "success",
      text:
        res.data?.message ||
        "Availability cancelled successfully",
    });

    if (activeAvailability === availabilityId) {
      setActiveAvailability(null);
      setSlots([]);
    }

    await fetchAvailabilities();

  } catch (error: any) {

    setMessage({
      type: "error",
      text:
        error?.response?.data?.message ||
        "Failed to cancel availability",
    });

  } finally {

    setTimeout(() => {
      setMessage(null);
    }, 4000);

  }
};

  const deleteAvailability = async (
  availabilityId: string
) => {

  const confirmed = window.confirm(
    "Permanently delete this availability and all generated slots?"
  );

  if (!confirmed) return;

  try {

    await api.delete(
      `/v1/creator/availability/${availabilityId}/permanent`
    );

    setMessage({
      type: "success",
      text: "Availability deleted successfully",
    });

    if (activeAvailability === availabilityId) {
      setActiveAvailability(null);
      setSlots([]);
    }

    await fetchAvailabilities();

    setTimeout(() => {
      setMessage(null);
    }, 4000);

  } catch (error: any) {

    setMessage({
      type: "error",
      text:
        error?.response?.data?.message ||
        "Failed to delete availability",
    });

    setTimeout(() => {
      setMessage(null);
    }, 4000);
  }
};



  const disableSlot = async (
  slotId: string
) => {
  try {

    const res = await api.patch(
      `/v1/creator/slots/${slotId}/disable`
    );

    setMessage({
      type: "success",
      text:
        res.data?.message ||
        "Slot disabled successfully",
    });

    if (activeAvailability) {
      await fetchSlots(activeAvailability);
    }

    await fetchAvailabilities();

  } catch (error: any) {

    setMessage({
      type: "error",
      text:
        error?.response?.data?.message ||
        "Failed to disable slot",
    });

  } finally {

    setTimeout(() => {
      setMessage(null);
    }, 4000);

  }
};

 const enableSlot = async (
  slotId: string
) => {
  try {

    const res = await api.patch(
      `/v1/creator/slots/${slotId}/enable`
    );

    setMessage({
      type: "success",
      text:
        res.data?.message ||
        "Slot enabled successfully",
    });

    if (activeAvailability) {
      await fetchSlots(activeAvailability);
    }

    await fetchAvailabilities();

  } catch (error: any) {

    setMessage({
      type: "error",
      text:
        error?.response?.data?.message ||
        "Failed to enable slot",
    });

  } finally {

    setTimeout(() => {
      setMessage(null);
    }, 4000);

  }
};

 const deleteSlot = async (
  slotId: string
) => {

  const confirmed = window.confirm(
    "Permanently delete this slot?"
  );

  if (!confirmed) return;

  try {

    const res = await api.delete(
      `/v1/creator/slots/${slotId}`
    );

    setMessage({
      type: "success",
      text:
        res.data?.message ||
        "Slot deleted successfully",
    });

    if (activeAvailability) {
      await fetchSlots(activeAvailability);
    }

    await fetchAvailabilities();

  } catch (error: any) {

    setMessage({
      type: "error",
      text:
        error?.response?.data?.message ||
        "Failed to delete slot",
    });

  } finally {

    setTimeout(() => {
      setMessage(null);
    }, 4000);

  }
};

  const isValid =
    form.serviceId &&
    form.date &&
    form.startTime &&
    form.endTime &&
    form.startTime < form.endTime;

  return (
    <DashboardLayout>
      {message && (
  <div
    className={`
      fixed
      bottom-24
      left-1/2
      -translate-x-1/2
      z-[9999]
      w-[90vw]
      max-w-md
      px-4
      py-3
      rounded-xl
      border
      shadow-2xl
      backdrop-blur-xl
      ${
        message.type === "success"
          ? `
            bg-emerald-500/15
            border-emerald-500/30
            text-emerald-300
          `
          : `
            bg-red-500/15
            border-red-500/30
            text-red-300
          `
      }
    `}
  >
    {message.text}
  </div>
)}

      <div className="max-w-7xl mx-auto px-4 space-y-6 text-white">

        {/* HEADER */}
        <div>
          <h1 className="text-xl font-semibold">Your Availability</h1>
          <p className="text-sm text-white/60">
            Set when you're available for bookings
          </p>
        </div>


        {/* TOGGLE */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={showCancelled}
            onChange={() => setShowCancelled(!showCancelled)}
          />
          <span className="text-sm text-white/60">
            History
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* LEFT PANEL */}
          <div className="lg:col-span-1">

            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 space-y-4 sticky top-6">

              <div>
                <h2 className="text-sm font-semibold">
                  Create Time Slots
                </h2>
                <p className="text-xs text-white/50">
                  Choose a date and time range. Slots will be generated automatically.
                </p>
              </div>

              <div className="space-y-4">

                <div className="space-y-1">
                  <p className="text-xs text-white/40">Service</p>
                  <select
                    value={form.serviceId}
                    onChange={(e) =>
                      setForm({ ...form, serviceId: e.target.value })
                    }
                    className="
  w-full
  bg-white/5
  border border-white/10
  rounded-xl
  p-3
  text-white
  outline-none
  focus:outline-none
  focus:ring-0
  focus:border-white/10
  transition
 "
                  >
                    <option value="" className="bg-[#0b0f1a] text-white">
  Select Service
 </option>

 {services.map((s) => (
  <option
    key={s._id}
    value={s._id}
   className="bg-[#0f0f0f] text-white"
  >
    {s.title}
  </option>
 ))}
    </select>
              </div>

 {/*TIMEZONE*/}

 <div className="space-y-1">
  <p className="text-xs text-white/40">Timezone</p>

  <select
    value={form.timezone}
    onChange={(e) =>
      setForm({
        ...form,
        timezone: e.target.value,
      })
    }
    className="
      w-full
      bg-white/5
      border border-white/10
      rounded-xl
      px-4
      py-3
      text-white
      outline-none
      focus:outline-none
      focus:ring-0
      focus:border-white/10
    "
  >
    {TIMEZONES.map((tz) => (
  <option
    key={tz.value}
    value={tz.value}
    className="bg-[#0f0f0f] text-white"
  >
    {tz.label}
  </option>
 ))}
  </select>

  <p className="text-[11px] text-white/40">
    Users will automatically see these slots in their local timezone.
  </p>
 </div>




                <div className="space-y-1">
                  <p className="text-xs text-white/40">Date</p>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) =>
                      setForm({ ...form, date: e.target.value })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3"
                  />
                </div>


                <div className="space-y-1">
                  <p className="text-xs text-white/40">Time Range</p>
                  <div className="grid grid-cols-2 gap-2">
                    <TimeSelect value={form.startTime} onChange={(t) => setForm({ ...form, startTime: t })} />
                    <TimeSelect value={form.endTime} onChange={(t) => setForm({ ...form, endTime: t })} />
                  </div>
                </div>

                <button
                  onClick={handleCreate}
                  disabled={!isValid}
                  className={`w-full rounded-xl py-3 ${
                    isValid
                      ? "bg-white/10 hover:bg-white/20"
                      : "bg-white/5 text-white/30"
                  }`}
                >
                  Create Availability
                </button>

              </div>

            </div>

          </div>

          {/* RIGHT PANEL */}
          <div className="lg:col-span-2 space-y-4">

            {availabilities.length === 0 ? (

              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center text-white/40">
                No availability created yet
                <p className="text-xs mt-2">
                  Create your first time slots to start accepting bookings
                </p>
              </div>

            ) : (

              availabilities.map((a) => (

                <div
                  key={a._id}
                 className="bg-white/[0.04] border border-white/10 rounded-2xl p-4 space-y-4"
                >

                  <div className="flex justify-between items-start">

  <div>

    <div
      className="
        inline-flex
        items-center
        gap-2
        px-4
        py-2
        rounded-xl
        bg-cyan-500/10
        border
        border-cyan-500/20
        text-cyan-300
        text-sm
        font-medium
        mb-3
      "
    >
      <span>●</span>
      <span>{a.serviceTitle || "Unknown Service"}</span>
    </div>

    <div className="font-semibold">
      {new Date(a.date).toDateString()}
    </div>

    <div className="text-white/60 text-sm">
      {a.startTime} - {a.endTime}
    </div>

    <div className="text-xs text-white/40">
  Status: {
    showCancelled && a.status === "ACTIVE"
      ? "EXPIRED"
      : a.status
  }
</div>

  </div>

  <div className="flex gap-2">

  {!showCancelled && (
    <button
      onClick={() => cancelAvailability(a._id)}
      className="
        bg-amber-500/20
        hover:bg-amber-500/30
        text-amber-300
        px-3
        py-2
        rounded-lg
        text-xs
      "
    >
      Cancel
    </button>
  )}

  {showCancelled && (
    <button
      onClick={() => deleteAvailability(a._id)}
      className="
        bg-red-500/20
        hover:bg-red-500/30
        text-red-300
        px-3
        py-2
        rounded-lg
        text-xs
      "
    >
      Delete
    </button>
  )}

</div>

</div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
                    <Stat label="Total" value={a.totalSlots} />
                    <Stat label="Available" value={a.availableSlots} />
                    <Stat label="Locked" value={a.lockedSlots} />
                    <Stat label="Booked" value={a.bookedSlots} />
                    <Stat label="Disabled" value={a.cancelledSlots} />
                  </div>

                  {a.status === "ACTIVE" && (
                    <button
                      onClick={() => toggleSlots(a._id)}
                      className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 rounded-xl py-2"
                    >
                      View Slots
                      {activeAvailability === a._id
                        ? <ChevronUp size={16} />
                        : <ChevronDown size={16} />}
                    </button>
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

              ))

            )}

          </div>

        </div>

      </div>

    </DashboardLayout>
  );
}

function Stat({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  const colors: Record<string, string> = {
    Total: "text-white/70",
    Available: "text-emerald-300",
    Locked: "text-amber-300",
    Booked: "text-sky-300",
    Disabled: "text-red-300",
  };

  const color =
    colors[label] || "text-white";

  return (
    <div
      className="
        bg-white/5
        border
        border-white/10
        rounded-xl
        p-3
        text-center
      "
    >
      <p
        className={`
          text-[10px]
          ${color}
        `}
      >
        {label}
      </p>

      <p
        className={`
          font-semibold
          text-sm
          mt-1
          ${color}
        `}
      >
        {value}
      </p>
    </div>
  );
}
// frontend/src/dashboards/CreatorAvailability.tsx

import { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import api from "../api/axios";
import { getApiErrorMessage } from "../api/errorMessage";
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
  } catch (error: unknown) {
    setServices([]);
    setMessage({ type: "error", text: getApiErrorMessage(error, "Unable to load services.") });
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
    } catch (error: unknown) {
      setAvailabilities([]);
      setMessage({ type: "error", text: getApiErrorMessage(error, "Unable to load availability.") });
    }
  };

  const fetchSlots = async (availabilityId: string) => {
    try {
      const res = await api.get(`/v1/creator/availability/${availabilityId}/slots`);
      setSlots(res.data.slots || []);
      setActiveAvailability(availabilityId);
    } catch (error: unknown) {
      setSlots([]);
      setActiveAvailability(null);
      setMessage({ type: "error", text: getApiErrorMessage(error, "Unable to load slots.") });
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

    await fetchAvailabilities();

    setTimeout(() => {
      setMessage(null);
    }, 4000);

  } catch (error: unknown) {

  setMessage({
    type: "error",
    text:
      getApiErrorMessage(error, "Failed to create availability"),
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

  } catch (error: unknown) {

    setMessage({
      type: "error",
      text:
      getApiErrorMessage(error, "Failed to cancel availability"),
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

  } catch (error: unknown) {

    setMessage({
      type: "error",
      text:
      getApiErrorMessage(error, "Failed to delete availability"),
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

  } catch (error: unknown) {

    setMessage({
      type: "error",
      text:
      getApiErrorMessage(error, "Failed to disable slot"),
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

  } catch (error: unknown) {

    setMessage({
      type: "error",
      text:
      getApiErrorMessage(error, "Failed to enable slot"),
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

  } catch (error: unknown) {

    setMessage({
      type: "error",
      text:
      getApiErrorMessage(error, "Failed to delete slot"),
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
      rounded-[var(--radius-card)]
      border
      shadow-sm
      ${
        message.type === "success"
          ? `
            bg-theme-success-tint
            border-theme-success
            text-theme-success
          `
          : `
            bg-theme-danger-tint
            border-theme-danger
            text-theme-danger
          `
      }
    `}
  >
    {message.text}
  </div>
)}

      <div className="mx-auto max-w-7xl space-y-6 px-4 text-theme-text">

        {/* HEADER */}
        <div>
          <h1 className="text-xl font-semibold">Your Availability</h1>
          <p className="text-sm text-theme-muted">
            Set when you're available for bookings
          </p>
        </div>


        {/* TOGGLE */}
        <label className="flex items-center gap-3 text-sm text-theme-muted">
          <input
            type="checkbox"
            checked={showCancelled}
            onChange={() => setShowCancelled(!showCancelled)}
            className="h-4 w-4 rounded border-theme-border text-theme-accent focus:ring-theme-accent"
          />
          History
        </label>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* LEFT PANEL */}
          <div className="lg:col-span-1">

            <div className="sticky top-6 space-y-4 rounded-[var(--radius-card)] border border-theme-border bg-theme-surface p-4">

              <div>
                <h2 className="text-sm font-semibold text-theme-text">
                  Create Time Slots
                </h2>
                <p className="text-xs text-theme-muted">
                  Choose a date and time range. Slots will be generated automatically.
                </p>
              </div>

              <div className="space-y-4">

                <div className="space-y-1">
                  <p className="text-xs text-theme-muted">Service</p>
                  <select
                    value={form.serviceId}
                    aria-label="Service"
                    onChange={(e) =>
                      setForm({ ...form, serviceId: e.target.value })
                    }
                    className="
  w-full
  bg-theme-inset
  border border-theme-border
  rounded-[var(--radius-control)]
  p-3
  text-theme-text
  transition-colors
  focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent
 "
                  >
                    <option value="" className="bg-theme-surface text-theme-text">
  Select Service
 </option>

 {services.map((s) => (
  <option
    key={s._id}
    value={s._id}
   className="bg-theme-surface text-theme-text"
  >
    {s.title}
  </option>
 ))}
    </select>
              </div>

 {/*TIMEZONE*/}

 <div className="space-y-1">
  <p className="text-xs text-theme-muted">Timezone</p>

  <select
    value={form.timezone}
    aria-label="Timezone"
    onChange={(e) =>
      setForm({
        ...form,
        timezone: e.target.value,
      })
    }
    className="
      w-full
      bg-theme-inset
      border border-theme-border
      rounded-[var(--radius-control)]
      px-4
      py-3
      text-theme-text
      transition-colors
      focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent
    "
  >
    {TIMEZONES.map((tz) => (
  <option
    key={tz.value}
    value={tz.value}
    className="bg-theme-surface text-theme-text"
  >
    {tz.label}
  </option>
 ))}
  </select>

  <p className="text-[11px] text-theme-muted">
    Users will automatically see these slots in their local timezone.
  </p>
 </div>




                <div className="space-y-1">
                  <p className="text-xs text-theme-muted">Date</p>
                  <input
                    type="date"
                    aria-label="Availability date"
                    value={form.date}
                    onChange={(e) =>
                      setForm({ ...form, date: e.target.value })
                    }
                    className="w-full rounded-[var(--radius-control)] border border-theme-border bg-theme-inset p-3 text-theme-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent"
                  />
                </div>


                <div className="space-y-1">
                  <p className="text-xs text-theme-muted">Time Range</p>
                  <div className="grid grid-cols-2 gap-2">
                    <TimeSelect value={form.startTime} onChange={(t) => setForm({ ...form, startTime: t })} />
                    <TimeSelect value={form.endTime} onChange={(t) => setForm({ ...form, endTime: t })} />
                  </div>
                </div>

                <button
                  onClick={handleCreate}
                  disabled={!isValid}
                  className={`w-full rounded-[var(--radius-control)] py-3 text-sm font-medium transition-opacity focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent ${
                    isValid
                      ? "bg-theme-primary text-theme-primary-text hover:opacity-90"
                      : "cursor-not-allowed bg-theme-inset text-theme-muted"
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

              <div className="rounded-[var(--radius-card)] border border-theme-border bg-theme-surface p-6 text-center text-theme-muted">
                No availability created yet
                <p className="text-xs mt-2">
                  Create your first time slots to start accepting bookings
                </p>
              </div>

            ) : (

              availabilities.map((a) => (

                <div
                  key={a._id}
                 className="space-y-4 rounded-[var(--radius-card)] border border-theme-border bg-theme-surface p-4"
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
        rounded-[var(--radius-control)]
        bg-theme-accent-tint
        border
        border-theme-accent
        text-theme-accent
        text-sm
        font-medium
        mb-3
      "
    >
      <span>●</span>
      <span>{a.serviceTitle || "Unknown Service"}</span>
    </div>

    <div className="font-semibold text-theme-text">
      {new Date(a.date).toDateString()}
    </div>

    <div className="text-sm text-theme-muted">
      {a.startTime} - {a.endTime}
    </div>

    <div className="text-xs text-theme-muted">
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
        border border-theme-warning
        bg-theme-warning-tint
        hover:opacity-85
        text-theme-warning
        px-3
        py-2
        rounded-[var(--radius-control)]
        text-xs
        transition-opacity
        focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent
      "
    >
      Cancel
    </button>
  )}

  {showCancelled && (
    <button
      onClick={() => deleteAvailability(a._id)}
      className="
        border border-theme-danger
        bg-theme-danger-tint
        hover:opacity-85
        text-theme-danger
        px-3
        py-2
        rounded-[var(--radius-control)]
        text-xs
        transition-opacity
        focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent
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
                      className="flex w-full items-center justify-center gap-2 rounded-[var(--radius-control)] border border-theme-border bg-theme-inset py-2 text-theme-text transition-colors hover:bg-theme-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent"
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
    Total: "text-theme-text",
    Available: "text-theme-success",
    Locked: "text-theme-warning",
    Booked: "text-theme-info",
    Disabled: "text-theme-danger",
  };

  const color =
    colors[label] || "text-theme-text";

  return (
    <div
      className="
        bg-theme-inset
        border
        border-theme-border
        rounded-[var(--radius-control)]
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

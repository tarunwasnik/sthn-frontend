// frontend/src/components/availability/SlotTimeline.tsx

interface Slot {
  _id: string;
  startTime: string;
  endTime: string;
  status: string;
}

interface Props {
  slots: Slot[];
  disableSlot: (id: string) => void;
  enableSlot: (id: string) => void;
  deleteSlot: (id: string) => void;
}

const formatTime = (dateStr: string) =>
  new Date(dateStr).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

export default function SlotTimeline({
  slots,
  disableSlot,
  enableSlot,
  deleteSlot,
}: Props) {

  if (!slots.length) {
    return (
      <div className="text-sm text-theme-muted">
        No slots generated
      </div>
    );
  }

  return (
    <div className="space-y-2">

      {slots.map((slot) => {

        const isCancelled = slot.status === "CANCELLED";
        const isAvailable = slot.status === "AVAILABLE";
        const isLockedOrBooked =
          slot.status === "LOCKED" || slot.status === "BOOKED";

        return (
          <div
            key={slot._id}
            className="
              group
              flex justify-between items-center
              px-4 py-3
              rounded-[var(--radius-control)]
              border border-theme-border
              bg-theme-inset
              hover:bg-theme-surface-raised
              transition-colors
            "
          >

            {/* TIME */}
            <div className="text-sm font-medium text-theme-text">
              {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
            </div>

            {/* ACTIONS */}
            <div className="flex items-center gap-3 ">

              {isAvailable && (
                <button
                  onClick={() => disableSlot(slot._id)}
                  className="
                    text-[12px] font-semibold
                    text-theme-warning
                    hover:opacity-75
                    transition-opacity
                    focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent
                  "
                >
                  Disable
                </button>
              )}

              {isCancelled && (
                <button
                  onClick={() => enableSlot(slot._id)}
                  className="
                    text-[12px] font-semibold
                    text-theme-success
                    hover:opacity-75
                    transition-opacity
                    focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent
                  "
                >
                  Enable
                </button>
              )}

              {isAvailable && (
                <button
                  onClick={() => deleteSlot(slot._id)}
                  className="
                    text-[12px] font-semibold
                    text-theme-danger
                    hover:opacity-75
                    transition-opacity
                    focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent
                  "
                >
                  Delete
                </button>
              )}

              {isLockedOrBooked && (
                <span className="text-[11px] text-theme-muted">
                  {slot.status}
                </span>
              )}

            </div>

          </div>
        );
      })}

    </div>
  );
}

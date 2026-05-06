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
      <div className="text-white/40 text-sm">
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
              rounded-lg
              border border-white/10
              bg-white/[0.02]
              hover:bg-white/[0.05]
              transition
            "
          >

            {/* TIME */}
            <div className="font-medium text-white/90 text-sm">
              {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
            </div>

            {/* ACTIONS */}
            <div className="flex items-center gap-3 ">

              {isAvailable && (
                <button
                  onClick={() => disableSlot(slot._id)}
                  className="
                    text-[12px] font-semibold
                    text-yellow-400
                    hover:text-yellow-300
                    relative
                    after:absolute after:left-0 after:-bottom-0.5
                    after:h-[1px] after:w-0
                    after:bg-yellow-400
                    hover:after:w-full
                    after:transition-all
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
                    text-green-400
                    hover:text-green-300
                    relative
                    after:absolute after:left-0 after:-bottom-0.5
                    after:h-[1px] after:w-0
                    after:bg-green-400
                    hover:after:w-full
                    after:transition-all
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
                    text-red-400
                    hover:text-red-300
                    relative
                    after:absolute after:left-0 after:-bottom-0.5
                    after:h-[1px] after:w-0
                    after:bg-red-400
                    hover:after:w-full
                    after:transition-all
                  "
                >
                  Delete
                </button>
              )}

              {isLockedOrBooked && (
                <span className="text-[11px] text-white/40">
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
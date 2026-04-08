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
      <div className="text-gray-400 text-sm">
        No slots generated
      </div>
    );
  }

  return (
    <div className="space-y-3">

      {slots.map((slot) => {

        const isCancelled = slot.status === "CANCELLED";
        const isAvailable = slot.status === "AVAILABLE";
        const isLockedOrBooked =
          slot.status === "LOCKED" || slot.status === "BOOKED";

        return (
          <div
            key={slot._id}
            className={`flex justify-between items-center p-4 rounded-lg border 
            ${
              isCancelled
                ? "bg-red-900/30 border-red-700"
                : isLockedOrBooked
                ? "bg-gray-800 border-gray-600"
                : "bg-[#0F172A] border-gray-700"
            }`}
          >

            <div className="font-medium">
              {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
            </div>

            <div className="flex gap-2">

              {isAvailable && (
                <button
                  onClick={() => disableSlot(slot._id)}
                  className="text-xs bg-yellow-600 px-3 py-1 rounded"
                >
                  Disable
                </button>
              )}

              {isCancelled && (
                <button
                  onClick={() => enableSlot(slot._id)}
                  className="text-xs bg-green-600 px-3 py-1 rounded"
                >
                  Enable
                </button>
              )}

              {isAvailable && (
                <button
                  onClick={() => deleteSlot(slot._id)}
                  className="text-xs bg-red-600 px-3 py-1 rounded"
                >
                  Delete
                </button>
              )}

              {isLockedOrBooked && (
                <span className="text-xs text-gray-400">
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
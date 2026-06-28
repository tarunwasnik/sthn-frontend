//frontend/src/components/chat/MapPickerModal.tsx


interface MapPickerModalProps {
  open: boolean;
  onClose: () => void;
  latitude: number;
  longitude: number;
}

export default function MapPickerModal({
  open,
  onClose,
  latitude,
  longitude,
}: MapPickerModalProps) {
  if (!open) return null;

  const openMap = (type: string) => {
    let url = "";

    switch (type) {
      case "google":
        url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
        break;

      case "apple":
        url = `https://maps.apple.com/?daddr=${latitude},${longitude}`;
        break;

      case "osm":
        url = `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=17/${latitude}/${longitude}`;
        break;

      case "waze":
        url = `https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes`;
        break;

      default:
        return;
    }

    window.open(url, "_blank");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60">

      <div className="w-[90vw] max-w-sm rounded-2xl bg-[#1F1F1F] border border-white/10 p-5">

        <h2 className="text-lg font-semibold text-white mb-4">
          Open in Maps
        </h2>

        <div className="space-y-3">

          <button
            onClick={() => openMap("google")}
            className="w-full rounded-lg bg-white/5 hover:bg-white/10 py-3 text-left px-4"
          >
            🟢 Google Maps
          </button>

          <button
            onClick={() => openMap("apple")}
            className="w-full rounded-lg bg-white/5 hover:bg-white/10 py-3 text-left px-4"
          >
            🍎 Apple Maps
          </button>

          <button
            onClick={() => openMap("osm")}
            className="w-full rounded-lg bg-white/5 hover:bg-white/10 py-3 text-left px-4"
          >
            🗺️ OpenStreetMap
          </button>

          <button
            onClick={() => openMap("waze")}
            className="w-full rounded-lg bg-white/5 hover:bg-white/10 py-3 text-left px-4"
          >
            🚗 Waze
          </button>

        </div>

        <button
          onClick={onClose}
          className="mt-5 w-full rounded-lg bg-red-500 hover:bg-red-600 py-3"
        >
          Cancel
        </button>

      </div>

    </div>
  );
}
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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4">

      <div className="w-full max-w-sm rounded-[var(--radius-dialog)] border border-theme-border bg-theme-surface p-5 text-theme-text">

        <h2 className="mb-4 text-lg font-semibold">
          Open in Maps
        </h2>

        <div className="space-y-3">

          <button
            onClick={() => openMap("google")}
            className="w-full rounded-[var(--radius-control)] border border-theme-border bg-theme-inset px-4 py-3 text-left transition-colors hover:bg-theme-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent"
          >
            🟢 Google Maps
          </button>

          <button
            onClick={() => openMap("apple")}
            className="w-full rounded-[var(--radius-control)] border border-theme-border bg-theme-inset px-4 py-3 text-left transition-colors hover:bg-theme-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent"
          >
            🍎 Apple Maps
          </button>

          <button
            onClick={() => openMap("osm")}
            className="w-full rounded-[var(--radius-control)] border border-theme-border bg-theme-inset px-4 py-3 text-left transition-colors hover:bg-theme-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent"
          >
            🗺️ OpenStreetMap
          </button>

          <button
            onClick={() => openMap("waze")}
            className="w-full rounded-[var(--radius-control)] border border-theme-border bg-theme-inset px-4 py-3 text-left transition-colors hover:bg-theme-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent"
          >
            🚗 Waze
          </button>

        </div>

        <button
          onClick={onClose}
          className="mt-5 w-full rounded-[var(--radius-control)] border border-theme-danger bg-theme-danger-tint py-3 text-theme-danger transition-opacity hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent"
        >
          Cancel
        </button>

      </div>

    </div>
  );
}

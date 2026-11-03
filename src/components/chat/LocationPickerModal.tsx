// frontend/src/components/chat/LocationPickerModal.tsx

import { useState } from "react";
import { createPortal } from "react-dom";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

interface SelectedLocation {
  latitude: number;
  longitude: number;
  name: string;
  address: string;
  placeId?: string;
}

interface LocationPickerModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (location: SelectedLocation) => void;
}

interface LocationMarkerProps {
  position: [number, number] | null;
  onSelect: (lat: number, lng: number) => void;
}

function LocationMarker({
  position,
  onSelect,
}: LocationMarkerProps) {
  useMapEvents({
    click(e) {
      console.log("MAP CLICK");
      console.log(e.latlng);

      onSelect(e.latlng.lat, e.latlng.lng);
    },
  });

  if (!position) return null;

  return <Marker position={position} />;
}

export default function LocationPickerModal({
  open,
  onClose,
  onConfirm,
}: LocationPickerModalProps) {
  if (!open) return null;

  return (
    <LocationPickerModalContent
      onClose={onClose}
      onConfirm={onConfirm}
    />
  );
}

function LocationPickerModalContent({
  onClose,
  onConfirm,
}: Omit<LocationPickerModalProps, "open">) {

  const [selectedPosition, setSelectedPosition] =
    useState<[number, number] | null>(null);

  const [locationName, setLocationName] =
    useState("");

  const [locationAddress, setLocationAddress] =
    useState("");

  const [loadingLocation, setLoadingLocation] =
    useState(false);

  const fetchLocationDetails = async (
    lat: number,
    lng: number
  ) => {
    try {
      setLoadingLocation(true);

      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`
      );

      const data = await response.json();

      setLocationName(
        data.name ||
          data.display_name?.split(",")[0] ||
          "Selected Location"
      );

      setLocationAddress(
        data.display_name || ""
      );
    } catch (error) {
      console.error(error);

      setLocationName("Selected Location");
      setLocationAddress("");
    } finally {
      setLoadingLocation(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4">
      <div className="flex h-[80vh] w-full max-w-4xl flex-col overflow-hidden rounded-[var(--radius-dialog)] border border-theme-border bg-theme-surface text-theme-text shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-theme-border px-4 py-3">
          <h2 className="text-lg font-semibold">
            Select Meeting Location
          </h2>

          <button
            onClick={onClose}
            className="rounded text-xl leading-none text-theme-muted hover:text-theme-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent"
          >
            ✕
          </button>
        </div>

        {/* Map */}
        <div className="flex-1 relative">
          <MapContainer
            center={[23.2599, 77.4126]}
            zoom={13}
            className="h-full w-full"
          >
            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <LocationMarker
              position={selectedPosition}
              onSelect={(lat, lng) => {
                console.log("Selected:", lat, lng);
                setSelectedPosition([lat, lng]);
                fetchLocationDetails(lat, lng);
              }}
            />
          </MapContainer>
          {/* Selected Location Card */}
{selectedPosition && (
  <div
    className="
      absolute
      left-4
      right-4
      bottom-4
      rounded-xl
      bg-theme-surface
      shadow-xl
      border border-theme-border
      p-4
      space-y-3
      z-[1000]
    "
  >
    {loadingLocation ? (
      <p className="text-sm text-theme-muted">
        Loading location...
      </p>
    ) : (
      <>
        <div>
          <h3 className="font-semibold text-theme-text">
            {locationName}
          </h3>

          <p className="mt-1 text-sm text-theme-muted">
            {locationAddress}
          </p>
        </div>

        <button
          onClick={() => {
            if (!selectedPosition) return;

            onConfirm({
              latitude: selectedPosition[0],
              longitude: selectedPosition[1],
              name: locationName,
              address: locationAddress,
            });

            onClose();
          }}
          className="
            w-full
            rounded-[var(--radius-control)]
            bg-theme-primary
            hover:opacity-90
            text-theme-primary-text
            py-2
            font-medium
            transition-opacity
            focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent
          "
        >
          Confirm Location
        </button>
      </>
    )}
  </div>
)}
        </div>
      </div>
    </div>,
    document.body
  );
}

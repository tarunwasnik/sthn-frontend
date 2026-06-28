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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60">
      <div className="bg-white rounded-xl shadow-xl w-[95vw] max-w-4xl h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-lg font-semibold">
            Select Meeting Location
          </h2>

          <button
            onClick={onClose}
            className="text-gray-500 hover:text-black text-xl leading-none"
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
      bg-white
      shadow-xl
      border
      p-4
      space-y-3
      z-[1000]
    "
  >
    {loadingLocation ? (
      <p className="text-sm text-gray-500">
        Loading location...
      </p>
    ) : (
      <>
        <div>
          <h3 className="font-semibold text-gray-900">
            {locationName}
          </h3>

          <p className="text-sm text-gray-600 mt-1">
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
            rounded-lg
            bg-blue-600
            hover:bg-blue-700
            text-white
            py-2
            font-medium
            transition
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
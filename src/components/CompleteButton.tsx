// frontend/src/components/CompleteButton.tsx

import { useState } from "react";
import api from "../api/axios";

interface Props {
  bookingId: string;
  onCompleted: (updatedBooking: any) => void;
  disabled?: boolean;

  // ✅ NEW
  role?: "creator" | "user";
}

export default function CompleteButton({
  bookingId,
  onCompleted,
  disabled,
  role = "creator",
}: Props) {
  const [loading, setLoading] = useState(false);

  const handleComplete = async () => {
    if (loading || disabled) return;

    try {
      setLoading(true);

      // ✅ MATCH BACKEND ROUTES
      const endpoint =
        role === "creator"
          ? `/v1/bookings/${bookingId}/complete/creator`
          : `/v1/bookings/${bookingId}/complete/user`;

      const res = await api.post(endpoint);

      onCompleted(res.data.booking);
    } catch (err: any) {
      console.error("COMPLETE ERROR:", err);

      alert(
        err?.response?.data?.message ||
          "Failed to complete booking"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleComplete}
      disabled={loading || disabled}
      className="px-4 py-2 bg-green-600 rounded-lg disabled:opacity-50 hover:bg-green-700 transition"
    >
      {loading ? "Completing..." : "End Session"}
    </button>
  );
}
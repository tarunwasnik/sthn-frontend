// frontend/src/components/CompleteButton.tsx

import { useState } from "react";
import api from "../api/axios";

interface Props {
  bookingId: string;
  onCompleted: (updatedBooking: any) => void;
  disabled?: boolean;
}

export default function CompleteButton({
  bookingId,
  onCompleted,
  disabled,
}: Props) {
  const [loading, setLoading] = useState(false);

  const handleComplete = async () => {
    if (loading || disabled) return;

    try {
      setLoading(true);

      const res = await api.post(
        `/api/v1/bookings/complete/${bookingId}`
      );

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
      className="px-4 py-2 bg-green-600 rounded-lg disabled:opacity-50"
    >
      {loading ? "Completing..." : "End Session"}
    </button>
  );
}
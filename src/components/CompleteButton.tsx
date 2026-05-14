// frontend/src/components/CompleteButton.tsx

import { useState } from "react";
import api from "../api/axios";

interface Props {
  bookingId: string;
  onCompleted: (updatedBooking: any) => void;
  disabled?: boolean;

  role?: "creator" | "user";
}

export default function CompleteButton({
  bookingId,
  onCompleted,
  disabled,
  role = "creator",
}: Props) {
  const [loading, setLoading] =
    useState(false);

  const handleComplete =
    async () => {
      if (
        loading ||
        disabled
      )
        return;

      try {
        setLoading(true);

        const endpoint =
          role === "creator"
            ? `/v1/bookings/${bookingId}/complete/creator`
            : `/v1/bookings/${bookingId}/complete/user`;

        const res =
          await api.post(
            endpoint
          );

        onCompleted(
          res.data.booking
        );
      } catch (err: any) {
        console.error(
          "COMPLETE ERROR:",
          err
        );

        alert(
          err?.response?.data
            ?.message ||
            "Failed to complete booking"
        );
      } finally {
        setLoading(false);
      }
    };

  return (
    <button
      onClick={handleComplete}
      disabled={
        loading || disabled
      }
      className="
        w-full
        flex items-center justify-center gap-2
        rounded-[18px]
        border border-emerald-400/25
        bg-gradient-to-r
        from-emerald-500
        to-green-500
        px-4 py-4
        text-[12px]
        font-semibold
        text-white
        transition-all duration-200
        hover:brightness-110
        hover:shadow-[0_0_30px_rgba(34,197,94,0.20)]
        disabled:opacity-60
      "
    >
      {/* ICON */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M5 13l4 4L19 7"
        />
      </svg>

      {loading
        ? "Completing..."
        : "End Session"}
    </button>
  );
}
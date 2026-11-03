// frontend/src/components/CompleteButton.tsx

import { useState } from "react";
import api from "../api/axios";
import { getApiErrorMessage } from "../api/errorMessage";

interface CompletionResponse<T> {
  booking: T;
}

interface Props<T> {
  bookingId: string;
  onCompleted: (updatedBooking: T) => void;
  disabled?: boolean;

  role?: "creator" | "user";
}

export default function CompleteButton<T>({
  bookingId,
  onCompleted,
  disabled,
  role = "creator",
}: Props<T>) {
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
          await api.post<CompletionResponse<T>>(
            endpoint
          );

        onCompleted(
          res.data.booking
        );
      } catch (err: unknown) {
        console.error(
          "COMPLETE ERROR:",
          err
        );

        alert(
          getApiErrorMessage(err, "Failed to complete booking")
        );
      } finally {
        setLoading(false);
      }
    };

  return (
    <button
      type="button"
      onClick={handleComplete}
      disabled={
        loading || disabled
      }
      className="
        w-full
        flex items-center justify-center gap-2
        rounded-[var(--radius-control)]
        border border-theme-success
        bg-theme-success-tint
        px-4 py-4
        text-[12px]
        font-semibold
        text-theme-success
        transition-opacity
        hover:opacity-80
        disabled:cursor-not-allowed disabled:opacity-60
        focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent
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

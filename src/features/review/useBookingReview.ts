import { useCallback, useEffect, useState } from "react";
import axios from "axios";

import { getMyBookingReviewState } from "./api";
import type { BookingReviewState } from "./types";

function safeErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (typeof message === "string") return message;
  }
  return "Review status is unavailable right now.";
}

export function useBookingReview(bookingId?: string) {
  const [reviewState, setReviewState] = useState<BookingReviewState | null>(null);
  const [loading, setLoading] = useState(Boolean(bookingId));
  const [error, setError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    if (!bookingId) {
      setReviewState(null);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const state = await getMyBookingReviewState(bookingId);
        if (!cancelled) setReviewState(state);
      } catch (loadError) {
        if (!cancelled) {
          setReviewState(null);
          setError(safeErrorMessage(loadError));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [bookingId, refreshToken]);

  const refresh = useCallback(() => {
    setRefreshToken((value) => value + 1);
  }, []);

  return { reviewState, loading, error, refresh };
}

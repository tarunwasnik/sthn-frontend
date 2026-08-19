import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { getBookingDisputeState } from "./api";
import type { BookingDisputeState } from "./types";

function messageFor(error: unknown) {
  if (axios.isAxiosError(error) && typeof error.response?.data?.message === "string") return error.response.data.message;
  return "Dispute status is unavailable right now.";
}

export function useBookingDispute(bookingId?: string) {
  const [state, setState] = useState<BookingDisputeState | null>(null);
  const [loading, setLoading] = useState(Boolean(bookingId));
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  useEffect(() => {
    if (!bookingId) { setState(null); setLoading(false); setError(null); return; }
    let cancelled = false;
    async function load() {
      setLoading(true); setError(null);
      try { const next = await getBookingDisputeState(bookingId); if (!cancelled) setState(next); }
      catch (loadError) { if (!cancelled) { setState(null); setError(messageFor(loadError)); } }
      finally { if (!cancelled) setLoading(false); }
    }
    void load();
    return () => { cancelled = true; };
  }, [bookingId, version]);
  const refresh = useCallback(() => setVersion((value) => value + 1), []);
  return { disputeState: state, loading, error, refresh };
}

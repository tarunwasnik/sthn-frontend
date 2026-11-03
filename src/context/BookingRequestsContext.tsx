import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import api from "../api/axios";
import { useAuth } from "../hooks/useAuth";
import { socket } from "../lib/socket";
import { BookingRequestsContext } from "./bookingRequests.context";

export function BookingRequestsProvider({ children }: { children: ReactNode }) {
  const { role, userId } = useAuth();
  const [pendingRequestCount, setPendingRequestCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const revision = useRef(0);
  const refreshInFlight = useRef(false);
  const refreshQueued = useRef(false);

  const refreshPendingRequestCount = useCallback(async () => {
    if (!userId || role !== "creator") return;
    if (refreshInFlight.current) {
      refreshQueued.current = true;
      return;
    }
    refreshInFlight.current = true;
    const current = revision.current;
    try {
      const response = await api.get<{ pendingRequestCount?: unknown }>("/v1/creator/bookings/pending-count");
      const count = Number(response.data?.pendingRequestCount);
      if (current === revision.current) {
        setPendingRequestCount(Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0);
        setError(null);
      }
    } catch {
      if (current === revision.current) setError("Unable to refresh booking request count.");
    } finally {
      refreshInFlight.current = false;
      if (refreshQueued.current) {
        refreshQueued.current = false;
        void refreshPendingRequestCount();
      }
    }
  }, [role, userId]);

  useEffect(() => {
    revision.current += 1;
    refreshQueued.current = false;
    setPendingRequestCount(0);
    setError(null);
    if (!userId || role !== "creator") return;
    void refreshPendingRequestCount();
    const refresh = () => void refreshPendingRequestCount();
    socket.on("notification:created", refresh);
    socket.on("booking:requests-changed", refresh);
    socket.on("connect", refresh);
    return () => { socket.off("notification:created", refresh); socket.off("booking:requests-changed", refresh); socket.off("connect", refresh); };
  }, [refreshPendingRequestCount, role, userId]);

  const value = useMemo(() => ({ pendingRequestCount, error, refreshPendingRequestCount }), [error, pendingRequestCount, refreshPendingRequestCount]);
  return <BookingRequestsContext.Provider value={value}>{children}</BookingRequestsContext.Provider>;
}

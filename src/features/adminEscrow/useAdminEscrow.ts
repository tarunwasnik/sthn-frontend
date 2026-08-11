import axios from "axios";
import { useCallback, useEffect, useState } from "react";

import { getAdminEscrow, getAdminEscrowQueue, releaseAdminEscrow } from "./api";
import type { AdminEscrowDto, AdminEscrowState } from "./types";

type LoadState = "loading" | "ready" | "error";

function safeMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 403) return "You do not have access to escrow operations.";
    if (error.response?.status === 404) return "This escrow record no longer exists.";
    if (error.response?.status === 409) return "The escrow state changed while you were working. It has been refreshed.";
    const message = error.response?.data && typeof error.response.data === "object" && "message" in error.response.data
      ? String(error.response.data.message) : undefined;
    if (message) return message;
    if (!error.response) return "Network error. Check your connection and try again.";
  }
  return fallback;
}

export function useAdminEscrow(bookingReference?: string) {
  const [state, setState] = useState<AdminEscrowState | undefined>();
  const [queueState, setQueueState] = useState<LoadState>("loading");
  const [queue, setQueue] = useState<AdminEscrowDto[]>([]);
  const [queueError, setQueueError] = useState<string | null>(null);
  const [detailState, setDetailState] = useState<LoadState>("loading");
  const [detail, setDetail] = useState<AdminEscrowDto | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionPending, setActionPending] = useState(false);
  const [reloadTick, setReloadTick] = useState(0);
  const refresh = useCallback(() => setReloadTick((value) => value + 1), []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setQueueState("loading"); setQueueError(null);
      try {
        const result = await getAdminEscrowQueue(state);
        if (!cancelled) { setQueue(result.items); setQueueState("ready"); }
      } catch (error) {
        if (!cancelled) { setQueueError(safeMessage(error, "Could not load escrow operations.")); setQueueState("error"); }
      }
    })();
    return () => { cancelled = true; };
  }, [reloadTick, state]);

  useEffect(() => {
    if (!bookingReference) return;
    let cancelled = false;
    void (async () => {
      setDetailState("loading"); setDetailError(null);
      try {
        const result = await getAdminEscrow(bookingReference);
        if (!cancelled) { setDetail(result); setDetailState("ready"); }
      } catch (error) {
        if (!cancelled) { setDetailError(safeMessage(error, "Could not load this escrow record.")); setDetailState("error"); }
      }
    })();
    return () => { cancelled = true; };
  }, [bookingReference, reloadTick]);

  const release = useCallback(async (reason?: string) => {
    if (!bookingReference || actionPending) return false;
    setActionPending(true); setActionError(null);
    try { await releaseAdminEscrow(bookingReference, reason); refresh(); return true; }
    catch (error) { setActionError(safeMessage(error, "Settlement release could not be completed.")); refresh(); return false; }
    finally { setActionPending(false); }
  }, [actionPending, bookingReference, refresh]);

  return { state, setState, queueState, queue, queueError, detailState, detail, detailError, actionError, actionPending, refresh, release };
}

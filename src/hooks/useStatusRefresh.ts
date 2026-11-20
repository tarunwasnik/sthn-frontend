import { useEffect, useRef } from "react";

const POLL_INTERVAL_MS = 15_000;
const MAX_POLLS = 40;

/** Revalidate authoritative status on return to the page; poll only while pending. */
export function useStatusRefresh(refresh: () => Promise<void>, pending: boolean, enabled = true) {
  const refreshRef = useRef(refresh);
  const inFlight = useRef(false);
  refreshRef.current = refresh;

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    let timer: number | undefined;
    let attempts = 0;
    const schedule = () => {
      if (active && pending && document.visibilityState === "visible" && attempts < MAX_POLLS) {
        timer = window.setTimeout(() => { attempts += 1; void run(); }, POLL_INTERVAL_MS);
      }
    };
    const run = async () => {
      if (!active || inFlight.current || document.visibilityState !== "visible") return;
      if (timer !== undefined) window.clearTimeout(timer);
      timer = undefined;
      inFlight.current = true;
      try { await refreshRef.current(); } catch { /* Keep the last authoritative state on a transient failure. */ }
      finally { inFlight.current = false; schedule(); }
    };
    const onReturn = () => { if (document.visibilityState === "visible") void run(); };
    window.addEventListener("focus", onReturn);
    document.addEventListener("visibilitychange", onReturn);
    schedule();
    return () => {
      active = false;
      if (timer !== undefined) window.clearTimeout(timer);
      window.removeEventListener("focus", onReturn);
      document.removeEventListener("visibilitychange", onReturn);
    };
  }, [enabled, pending]);
}

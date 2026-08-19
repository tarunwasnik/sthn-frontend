import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import { getAdminFxRates, refreshAdminFxRate } from "./api";
import type { AdminFxReadDto } from "./types";

function message(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 403) return "You do not have access to FX operations.";
    if (!error.response) return "We could not confirm the FX refresh. Current authoritative FX state was reloaded; do not retry automatically.";
    const data = error.response.data;
    if (data && typeof data === "object" && "message" in data) return String(data.message);
  }
  return "FX state could not be loaded or refreshed.";
}

export function useAdminFx() {
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [data, setData] = useState<AdminFxReadDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [tick, setTick] = useState(0);
  const reload = useCallback(() => setTick((value) => value + 1), []);
  useEffect(() => { let cancelled = false; void getAdminFxRates().then((value) => { if (!cancelled) { setData(value); setError(null); setState("ready"); } }).catch((reason: unknown) => { if (!cancelled) { setError(message(reason)); setState("error"); } }); return () => { cancelled = true; }; }, [tick]);
  const refreshRate = useCallback(async (baseCurrency: string, quoteCurrency: string) => {
    if (refreshing) return false;
    setRefreshing(true); setError(null);
    try { await refreshAdminFxRate(baseCurrency, quoteCurrency); reload(); return true; }
    catch (reason) { setError(message(reason)); reload(); return false; }
    finally { setRefreshing(false); }
  }, [refreshing, reload]);
  return { state, data, error, refreshing, reload, refreshRate };
}

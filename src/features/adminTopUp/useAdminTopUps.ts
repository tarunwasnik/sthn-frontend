import axios from "axios";
import { useCallback, useEffect, useState } from "react";

import { getAdminTopUpQueue } from "./api";
import type { AdminTopUpRequestDto } from "./types";

export interface UseAdminTopUpsResult {
  state: "loading" | "ready" | "error";
  requests: AdminTopUpRequestDto[];
  errorMessage: string | null;
  refresh: () => void;
}

function queueError(error: unknown): string {
  if (axios.isAxiosError(error) && error.response?.status === 403) {
    return "You do not have access to top-up operations.";
  }
  if (axios.isAxiosError(error) && !error.response) {
    return "Network error. Check your connection and try again.";
  }
  return "Could not load pending top-up requests.";
}

export function useAdminTopUps(): UseAdminTopUpsResult {
  const [state, setState] = useState<UseAdminTopUpsResult["state"]>("loading");
  const [requests, setRequests] = useState<AdminTopUpRequestDto[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadTick, setReloadTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setState("loading");
      setErrorMessage(null);
      try {
        const queue = await getAdminTopUpQueue();
        if (cancelled) return;
        setRequests(queue);
        setState("ready");
      } catch (error) {
        if (cancelled) return;
        setErrorMessage(queueError(error));
        setState("error");
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [reloadTick]);

  const refresh = useCallback(() => setReloadTick((tick) => tick + 1), []);
  return { state, requests, errorMessage, refresh };
}

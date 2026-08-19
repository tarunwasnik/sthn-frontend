import axios from "axios";
import { useCallback, useEffect, useState } from "react";

import {
  getAdminTopUpQueue,
  repairAdminTopUpReconciliation,
  retryAdminTopUpReconciliation,
  updateAdminTopUpReconciliationStatus,
} from "./api";
import type {
  AdminTopUpRequestDto,
  WalletTopUpRepairAction,
  WalletTopUpRetryAction,
  WalletTopUpReconciliationStatusAction,
  TopUpStatus,
} from "./types";

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

export function useAdminTopUps(status: TopUpStatus): UseAdminTopUpsResult {
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
        const queue = await getAdminTopUpQueue(status);
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
  }, [reloadTick, status]);

  const refresh = useCallback(() => setReloadTick((tick) => tick + 1), []);
  return { state, requests, errorMessage, refresh };
}

function operationError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) return "We could not confirm this recovery operation. The authoritative state was refreshed; do not retry automatically.";
    if (error.response.status === 409) return "The reconciliation changed before this operation. The authoritative state was refreshed.";
    const data = error.response.data;
    if (data && typeof data === "object" && "message" in data) return String(data.message);
  }
  return "The recovery operation could not be completed. The authoritative state was refreshed.";
}

export function useAdminTopUpOperations(
  refreshAuthoritative: (topUpReference: string) => Promise<void>,
) {
  const [operationLoading, setOperationLoading] = useState<string | null>(null);
  const [operationErrorMessage, setOperationErrorMessage] = useState<string | null>(null);

  const run = useCallback(async (
    topUpReference: string,
    reconciliationReference: string,
    action: WalletTopUpRetryAction | WalletTopUpRepairAction,
  ) => {
    setOperationLoading(action);
    setOperationErrorMessage(null);
    try {
      if (action === "RETRY_ACCOUNTING" || action === "RETRY_COMPLETION") {
        await retryAdminTopUpReconciliation(reconciliationReference, action);
      } else {
        await repairAdminTopUpReconciliation(reconciliationReference, action);
      }
      await refreshAuthoritative(topUpReference);
    } catch (error) {
      setOperationErrorMessage(operationError(error));
      try {
        await refreshAuthoritative(topUpReference);
      } catch {
        // The original bounded error is more useful than a second refresh failure.
      }
    } finally {
      setOperationLoading(null);
    }
  }, [refreshAuthoritative]);

  const runStatus = useCallback(async (
    topUpReference: string,
    reconciliationReference: string,
    action: WalletTopUpReconciliationStatusAction,
    resolutionCode: string,
    resolutionNote?: string,
  ) => {
    setOperationLoading(action);
    setOperationErrorMessage(null);
    try {
      await updateAdminTopUpReconciliationStatus(reconciliationReference, {
        action,
        resolutionCode,
        ...(resolutionNote ? { resolutionNote } : {}),
      });
      await refreshAuthoritative(topUpReference);
    } catch (error) {
      setOperationErrorMessage(operationError(error));
      try {
        await refreshAuthoritative(topUpReference);
      } catch {
        // The original bounded error is more useful than a second refresh failure.
      }
    } finally {
      setOperationLoading(null);
    }
  }, [refreshAuthoritative]);

  return { operationLoading, operationErrorMessage, run, runStatus };
}

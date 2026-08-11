import axios from "axios";
import { useCallback, useEffect, useState } from "react";

import { getSupportedCurrencies } from "../wallet/api";
import type { CurrencyMetadataDto } from "../wallet/types";

import {
  completeAdminWalletConversionAccounting,
  decideAdminWalletConversion,
  executeAdminWalletConversionProvider,
  getAdminWalletConversion,
  getAdminWalletConversionQueue,
  inspectAdminWalletConversion,
  repairAdminWalletConversion,
  retryAdminWalletConversion,
} from "./api";
import type {
  AdminWalletConversionRequestDto,
  ConversionReconciliationDto,
  WalletConversionRejectionCode,
  WalletConversionRepairAction,
  WalletConversionStatus,
} from "./types";

type LoadState = "loading" | "ready" | "error";

function safeMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 403) return "You do not have access to conversion operations.";
    if (error.response?.status === 404) return "This conversion request no longer exists.";
    if (error.response?.status === 409) return "This conversion changed while you were working. It has been refreshed.";
    const message = error.response?.data && typeof error.response.data === "object" && "message" in error.response.data
      ? String(error.response.data.message) : null;
    if (message) return message;
    if (!error.response) return "Network error. Check your connection and try again.";
  }
  return fallback;
}

export function useAdminWalletConversions(conversionReference?: string) {
  const [status, setStatus] = useState<WalletConversionStatus>("PENDING");
  const [queueState, setQueueState] = useState<LoadState>("loading");
  const [queue, setQueue] = useState<AdminWalletConversionRequestDto[]>([]);
  const [queueError, setQueueError] = useState<string | null>(null);
  const [currencies, setCurrencies] = useState<CurrencyMetadataDto[]>([]);
  const [detailState, setDetailState] = useState<LoadState>("loading");
  const [detail, setDetail] = useState<AdminWalletConversionRequestDto | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [reconciliation, setReconciliation] = useState<ConversionReconciliationDto | null>(null);
  const [reconciliationError, setReconciliationError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionPending, setActionPending] = useState(false);
  const [reloadTick, setReloadTick] = useState(0);

  const refresh = useCallback(() => setReloadTick((tick) => tick + 1), []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setQueueState("loading");
      setQueueError(null);
      try {
        const [requests, metadata] = await Promise.all([
          getAdminWalletConversionQueue(status), getSupportedCurrencies(),
        ]);
        if (!cancelled) { setQueue(requests); setCurrencies(metadata); setQueueState("ready"); }
      } catch (error) {
        if (!cancelled) { setQueueError(safeMessage(error, "Could not load conversion requests.")); setQueueState("error"); }
      }
    })();
    return () => { cancelled = true; };
  }, [reloadTick, status]);

  const loadDetail = useCallback(async () => {
    if (!conversionReference) return;
    setDetailState("loading");
    setDetailError(null);
    try {
      const request = await getAdminWalletConversion(conversionReference);
      setDetail(request);
      setDetailState("ready");
    } catch (error) {
      setDetailError(safeMessage(error, "Could not load this conversion request."));
      setDetailState("error");
    }
  }, [conversionReference]);

  useEffect(() => { void loadDetail(); }, [loadDetail, reloadTick]);

  const run = useCallback(async (operation: () => Promise<unknown>) => {
    if (actionPending) return false;
    setActionPending(true);
    setActionError(null);
    try { await operation(); refresh(); return true; }
    catch (error) { setActionError(safeMessage(error, "The operation could not be completed. The authoritative state has been refreshed.")); refresh(); return false; }
    finally { setActionPending(false); }
  }, [actionPending, refresh]);

  const decide = useCallback((decision: "APPROVE" | "REJECT", rejectionCode?: WalletConversionRejectionCode, rejectionReason?: string) => {
    if (!conversionReference) return Promise.resolve(false);
    return run(() => decideAdminWalletConversion(conversionReference, decision === "APPROVE" ? { decision } : { decision, rejectionCode: rejectionCode!, ...(rejectionReason ? { rejectionReason } : {}) }));
  }, [conversionReference, run]);

  const executeProvider = useCallback((outcome: "SUCCESS" | "FAILURE", failureCode?: string, failureReason?: string) => {
    if (!conversionReference) return Promise.resolve(false);
    return run(() => executeAdminWalletConversionProvider(conversionReference, outcome === "SUCCESS" ? { outcome } : { outcome, ...(failureCode ? { failureCode } : {}), ...(failureReason ? { failureReason } : {}) }));
  }, [conversionReference, run]);

  const completeAccounting = useCallback(() => {
    if (!conversionReference) return Promise.resolve(false);
    return run(() => completeAdminWalletConversionAccounting(conversionReference));
  }, [conversionReference, run]);

  const inspectReconciliation = useCallback(async () => {
    if (!conversionReference || actionPending) return;
    setActionPending(true); setReconciliationError(null); setActionError(null);
    try { setReconciliation(await inspectAdminWalletConversion(conversionReference)); }
    catch (error) { setReconciliationError(safeMessage(error, "Could not inspect conversion reconciliation.")); }
    finally { setActionPending(false); }
  }, [actionPending, conversionReference]);

  const retryReconciliation = useCallback(async () => {
    if (!reconciliation || !reconciliation.allowedActions.includes("RETRY")) return false;
    const completed = await run(async () => {
      const result = await retryAdminWalletConversion(
        reconciliation.reconciliationReference,
      );
      setReconciliation(result);
    });
    if (completed && conversionReference) {
      await inspectReconciliation();
    }
    return completed;
  }, [conversionReference, inspectReconciliation, reconciliation, run]);

  const repairReconciliation = useCallback(async (
    action: WalletConversionRepairAction,
  ) => {
    if (!reconciliation || !reconciliation.allowedActions.includes(action)) return false;
    const completed = await run(async () => {
      const result = await repairAdminWalletConversion(
        reconciliation.reconciliationReference, action,
      );
      setReconciliation(result);
    });
    if (completed && conversionReference) {
      await inspectReconciliation();
    }
    return completed;
  }, [conversionReference, inspectReconciliation, reconciliation, run]);

  return { status, setStatus, queueState, queue, queueError, currencies, detailState, detail, detailError, reconciliation, reconciliationError, actionError, actionPending, refresh, decide, executeProvider, completeAccounting, inspectReconciliation, retryReconciliation, repairReconciliation };
}

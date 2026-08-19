import axios from "axios";
import { useCallback, useEffect, useState } from "react";

import { getAdminPayment, getAdminPaymentFinancialDetail, getAdminPayments, syncAdminPayment } from "./api";
import type { AdminPaymentDto, AdminPaymentFilters, AdminPaymentFinancialDetailDto, AdminPaymentListDto } from "./types";

type LoadState = "loading" | "ready" | "error";

function safeMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 403) return "You do not have access to payment operations.";
    if (error.response?.status === 404) return "This payment no longer exists.";
    if (!error.response) return "We could not confirm the operation. Authoritative payment data was refreshed; do not retry automatically.";
    const payload = error.response.data;
    if (payload && typeof payload === "object" && "message" in payload) return String(payload.message);
  }
  return fallback;
}

export function useAdminPayments(paymentReference?: string) {
  const [filters, setFilters] = useState<AdminPaymentFilters>({ page: 1, limit: 25 });
  const [listState, setListState] = useState<LoadState>("loading");
  const [list, setList] = useState<AdminPaymentListDto | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [detailState, setDetailState] = useState<LoadState>("loading");
  const [detail, setDetail] = useState<AdminPaymentDto | null>(null);
  const [financialDetail, setFinancialDetail] = useState<AdminPaymentFinancialDetailDto | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [syncPending, setSyncPending] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [reloadTick, setReloadTick] = useState(0);
  const refresh = useCallback(() => setReloadTick((value) => value + 1), []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setListState("loading"); setListError(null);
      try { const result = await getAdminPayments(filters); if (!cancelled) { setList(result); setListState("ready"); } }
      catch (error) { if (!cancelled) { setListError(safeMessage(error, "Could not load payments.")); setListState("error"); } }
    })();
    return () => { cancelled = true; };
  }, [filters, reloadTick]);

  useEffect(() => {
    if (!paymentReference) return;
    let cancelled = false;
    void (async () => {
      setDetailState("loading"); setDetailError(null);
      try {
        const [payment, financial] = await Promise.all([getAdminPayment(paymentReference), getAdminPaymentFinancialDetail(paymentReference)]);
        if (!cancelled) { setDetail(payment); setFinancialDetail(financial); setDetailState("ready"); }
      } catch (error) { if (!cancelled) { setDetailError(safeMessage(error, "Could not load this payment.")); setDetailState("error"); } }
    })();
    return () => { cancelled = true; };
  }, [paymentReference, reloadTick]);

  const sync = useCallback(async () => {
    if (!paymentReference || syncPending) return false;
    setSyncPending(true); setActionError(null);
    try { await syncAdminPayment(paymentReference); refresh(); return true; }
    catch (error) { setActionError(safeMessage(error, "Payment synchronization could not be completed.")); refresh(); return false; }
    finally { setSyncPending(false); }
  }, [paymentReference, refresh, syncPending]);

  const setStatus = useCallback((status: AdminPaymentFilters["status"]) => setFilters((current) => ({ ...current, status, page: 1 })), []);
  const setCurrency = useCallback((currency: string | undefined) => setFilters((current) => ({ ...current, currency, page: 1 })), []);
  const setPage = useCallback((page: number) => setFilters((current) => ({ ...current, page })), []);

  return { filters, setStatus, setCurrency, setPage, listState, list, listError, detailState, detail, financialDetail, detailError, actionError, syncPending, refresh, sync };
}

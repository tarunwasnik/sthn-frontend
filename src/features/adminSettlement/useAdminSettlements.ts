import axios from "axios";
import { useCallback, useEffect, useState } from "react";

import {
  getAdminSettlement,
  getAdminSettlements,
  recheckAdminSettlement,
} from "./api";
import type {
  AdminSettlementDto,
  AdminSettlementFilters,
  AdminSettlementListDto,
} from "./types";

type LoadState = "loading" | "ready" | "error";

function safeMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 403) return "You do not have access to settlement operations.";
    if (error.response?.status === 404) return "This settlement no longer exists.";
    if (error.response?.status === 409) return "The settlement changed while you were working. The authoritative state was refreshed.";
    if (!error.response) return "We could not confirm this operation. The authoritative state was refreshed; do not retry automatically.";
    const data = error.response.data;
    if (data && typeof data === "object" && "message" in data) return String(data.message);
  }
  return fallback;
}

export function useAdminSettlements(settlementReference?: string) {
  const [filters, setFilters] = useState<AdminSettlementFilters>({ page: 1, limit: 25 });
  const [listState, setListState] = useState<LoadState>("loading");
  const [list, setList] = useState<AdminSettlementListDto | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [detailState, setDetailState] = useState<LoadState>("loading");
  const [detail, setDetail] = useState<AdminSettlementDto | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [recheckPending, setRecheckPending] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [reloadTick, setReloadTick] = useState(0);
  const refresh = useCallback(() => setReloadTick((value) => value + 1), []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setListState("loading"); setListError(null);
      try {
        const result = await getAdminSettlements(filters);
        if (!cancelled) { setList(result); setListState("ready"); }
      } catch (error) {
        if (!cancelled) { setListError(safeMessage(error, "Could not load settlements.")); setListState("error"); }
      }
    })();
    return () => { cancelled = true; };
  }, [filters, reloadTick]);

  useEffect(() => {
    if (!settlementReference) return;
    let cancelled = false;
    void (async () => {
      setDetailState("loading"); setDetailError(null);
      try {
        const result = await getAdminSettlement(settlementReference);
        if (!cancelled) { setDetail(result); setDetailState("ready"); }
      } catch (error) {
        if (!cancelled) { setDetailError(safeMessage(error, "Could not load this settlement.")); setDetailState("error"); }
      }
    })();
    return () => { cancelled = true; };
  }, [settlementReference, reloadTick]);

  const recheck = useCallback(async () => {
    if (!settlementReference || recheckPending) return false;
    setRecheckPending(true); setActionError(null);
    try {
      await recheckAdminSettlement(settlementReference);
      refresh();
      return true;
    } catch (error) {
      setActionError(safeMessage(error, "Settlement recheck could not be completed."));
      refresh();
      return false;
    } finally { setRecheckPending(false); }
  }, [recheckPending, refresh, settlementReference]);

  const setStatus = useCallback((status: AdminSettlementFilters["status"]) => {
    setFilters((current) => ({ ...current, status, page: 1 }));
  }, []);
  const setPage = useCallback((page: number) => {
    setFilters((current) => ({ ...current, page }));
  }, []);
  const setCurrency = useCallback((currency: string | undefined) => {
    setFilters((current) => ({ ...current, currency, page: 1 }));
  }, []);

  return { filters, setStatus, setCurrency, setPage, listState, list, listError, detailState, detail, detailError, actionError, recheckPending, refresh, recheck };
}

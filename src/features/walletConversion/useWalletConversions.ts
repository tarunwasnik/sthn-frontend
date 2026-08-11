import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { createWalletConversion, getMyWalletConversions } from "./api";
import type {
  WalletConversionCreateInput,
  WalletConversionRequestDto,
  WalletConversionStatus,
} from "./types";

const ACTIVE_STATUSES: ReadonlySet<WalletConversionStatus> = new Set([
  "PENDING",
  "APPROVED",
]);

export type ConversionSubmitState = "idle" | "submitting" | "success" | "error";

export interface UseWalletConversionsResult {
  conversions: WalletConversionRequestDto[];
  listLoading: boolean;
  listError: string | null;
  refresh: () => Promise<void>;
  submitState: ConversionSubmitState;
  submitError: string | null;
  lastCreated: WalletConversionRequestDto | null;
  submit: (input: WalletConversionCreateInput) => Promise<WalletConversionRequestDto | null>;
  resetSubmission: () => void;
}

function newIdempotencyKey(): string {
  return crypto.randomUUID();
}

function safeMessage(error: unknown, fallback: string): string {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (error as { response?: { data?: unknown } }).response;
    if (response?.data && typeof response.data === "object" && "message" in response.data) {
      return String(response.data.message);
    }
  }
  return fallback;
}

/** Owner-scoped conversion lifecycle. Wallet changes are observed only by refetch. */
export function useWalletConversions(
  onCompleted?: () => void,
): UseWalletConversionsResult {
  const [conversions, setConversions] = useState<WalletConversionRequestDto[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [submitState, setSubmitState] = useState<ConversionSubmitState>("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [lastCreated, setLastCreated] = useState<WalletConversionRequestDto | null>(null);
  const idempotencyKeyRef = useRef<string | null>(null);
  const intentSignatureRef = useRef<string | null>(null);
  const completedNotifiedRef = useRef<Set<string>>(new Set());
  const inFlightRef = useRef(false);
  const onCompletedRef = useRef(onCompleted);
  onCompletedRef.current = onCompleted;

  const notifyCompletedIfNeeded = useCallback((list: WalletConversionRequestDto[]) => {
    for (const conversion of list) {
      if (conversion.status === "COMPLETED" && !completedNotifiedRef.current.has(conversion.conversionReference)) {
        completedNotifiedRef.current.add(conversion.conversionReference);
        onCompletedRef.current?.();
      }
    }
  }, []);

  const refresh = useCallback(async () => {
    setListError(null);
    try {
      const list = await getMyWalletConversions();
      setConversions(list);
      notifyCompletedIfNeeded(list);
    } catch (error) {
      setListError(safeMessage(error, "Could not load conversion requests."));
    } finally {
      setListLoading(false);
    }
  }, [notifyCompletedIfNeeded]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const hasActive = useMemo(
    () => conversions.some((conversion) => ACTIVE_STATUSES.has(conversion.status)),
    [conversions],
  );

  useEffect(() => {
    if (!hasActive) return undefined;
    const intervalId = window.setInterval(() => void refresh(), 8000);
    return () => window.clearInterval(intervalId);
  }, [hasActive, refresh]);

  const submit = useCallback(async (input: WalletConversionCreateInput) => {
    if (inFlightRef.current) return null;
    const signature = `${input.sourceCurrency}|${input.targetCurrency}|${input.sourceAmount}`;
    if (intentSignatureRef.current !== signature) {
      intentSignatureRef.current = signature;
      idempotencyKeyRef.current = newIdempotencyKey();
    }
    if (!idempotencyKeyRef.current) idempotencyKeyRef.current = newIdempotencyKey();

    inFlightRef.current = true;
    setSubmitState("submitting");
    setSubmitError(null);
    try {
      const created = await createWalletConversion(input, idempotencyKeyRef.current);
      setLastCreated(created);
      setSubmitState("success");
      idempotencyKeyRef.current = null;
      intentSignatureRef.current = null;
      await refresh();
      return created;
    } catch (error) {
      setSubmitError(safeMessage(
        error,
        "We couldn't confirm whether the conversion request was created. Retry safely.",
      ));
      setSubmitState("error");
      return null;
    } finally {
      inFlightRef.current = false;
    }
  }, [refresh]);

  const resetSubmission = useCallback(() => {
    setSubmitState("idle");
    setSubmitError(null);
    setLastCreated(null);
    idempotencyKeyRef.current = null;
    intentSignatureRef.current = null;
  }, []);

  return {
    conversions, listLoading, listError, refresh, submitState, submitError,
    lastCreated, submit, resetSubmission,
  };
}

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { createTopUpRequest, getMyTopUps } from "./api";
import type { TopUpRequestDto, TopUpStatus } from "./types";

const ACTIVE_STATUSES: ReadonlySet<TopUpStatus> = new Set([
  "PENDING",
  "APPROVED",
  "PROCESSING",
]);

export type SubmitState = "idle" | "submitting" | "success" | "error";

export interface UseTopUpsResult {
  requests: TopUpRequestDto[];
  listLoading: boolean;
  listError: string | null;
  refresh: () => Promise<void>;
  submitState: SubmitState;
  submitError: string | null;
  lastCreated: TopUpRequestDto | null;
  submit: (amountMinor: number, currency: string) => Promise<TopUpRequestDto | null>;
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

export function useTopUps(onCompleted?: () => void): UseTopUpsResult {
  const [requests, setRequests] = useState<TopUpRequestDto[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [lastCreated, setLastCreated] = useState<TopUpRequestDto | null>(null);
  const idempotencyKeyRef = useRef<string | null>(null);
  const intentSignatureRef = useRef<string | null>(null);
  const completedNotifiedRef = useRef<Set<string>>(new Set());
  const inFlightRef = useRef(false);
  const onCompletedRef = useRef(onCompleted);
  onCompletedRef.current = onCompleted;

  const notifyCompletedIfNeeded = useCallback((list: TopUpRequestDto[]) => {
    for (const request of list) {
      if (request.status === "COMPLETED" && !completedNotifiedRef.current.has(request.topUpReference)) {
        completedNotifiedRef.current.add(request.topUpReference);
        onCompletedRef.current?.();
      }
    }
  }, []);

  const refresh = useCallback(async () => {
    setListError(null);
    try {
      const list = await getMyTopUps();
      setRequests(list);
      notifyCompletedIfNeeded(list);
    } catch (error) {
      setListError(safeMessage(error, "Could not load top-up requests."));
    } finally {
      setListLoading(false);
    }
  }, [notifyCompletedIfNeeded]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const hasActive = useMemo(
    () => requests.some((request) => ACTIVE_STATUSES.has(request.status)),
    [requests],
  );

  useEffect(() => {
    if (!hasActive) return undefined;
    const intervalId = window.setInterval(() => void refresh(), 8000);
    return () => window.clearInterval(intervalId);
  }, [hasActive, refresh]);

  const submit = useCallback(async (amountMinor: number, currency: string) => {
    if (inFlightRef.current) return null;
    const signature = `${currency}|${amountMinor}`;
    if (intentSignatureRef.current !== signature) {
      intentSignatureRef.current = signature;
      idempotencyKeyRef.current = newIdempotencyKey();
    }
    if (!idempotencyKeyRef.current) idempotencyKeyRef.current = newIdempotencyKey();

    inFlightRef.current = true;
    setSubmitState("submitting");
    setSubmitError(null);
    try {
      const created = await createTopUpRequest({
        amount: amountMinor,
        currency,
        idempotencyKey: idempotencyKeyRef.current,
      });
      setLastCreated(created);
      setSubmitState("success");
      idempotencyKeyRef.current = null;
      intentSignatureRef.current = null;
      await refresh();
      return created;
    } catch (error) {
      setSubmitError(safeMessage(error, "We couldn't confirm whether the request was created. Retry safely."));
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

  return { requests, listLoading, listError, refresh, submitState, submitError, lastCreated, submit, resetSubmission };
}

export default useTopUps;

import axios from "axios";
import { useCallback, useEffect, useState } from "react";

import { getParticipantInvestigation, submitParticipantInvestigation, uploadParticipantDirectEvidence } from "./api";
import type { ParticipantInvestigation, ParticipantSubmissionPayload } from "./types";

function messageFor(error: unknown, fallback: string) {
  if (axios.isAxiosError(error) && typeof error.response?.data?.message === "string") return error.response.data.message;
  return fallback;
}

export function useParticipantInvestigation(disputeId?: string) {
  const [investigation, setInvestigation] = useState<ParticipantInvestigation | null>(null);
  const [loading, setLoading] = useState(Boolean(disputeId));
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [version, setVersion] = useState(0);

  const refresh = useCallback(() => setVersion((value) => value + 1), []);

  useEffect(() => {
    if (!disputeId) {
      setInvestigation(null);
      setLoading(false);
      setError("Invalid dispute reference.");
      return;
    }
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const next = await getParticipantInvestigation(disputeId);
        if (!cancelled) setInvestigation(next);
      } catch (requestError) {
        if (!cancelled) {
          setInvestigation(null);
          setError(messageFor(requestError, "This dispute investigation is unavailable right now."));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [disputeId, version]);

  const mutate = useCallback(async (action: () => Promise<unknown>, fallback: string) => {
    if (!disputeId || pending) return false;
    setPending(true);
    setError(null);
    try {
      await action();
      refresh();
      return true;
    } catch (requestError) {
      setError(messageFor(requestError, fallback));
      refresh();
      return false;
    } finally {
      setPending(false);
    }
  }, [disputeId, pending, refresh]);

  return {
    investigation,
    loading,
    error,
    pending,
    refresh,
    submit: (payload: ParticipantSubmissionPayload) => disputeId
      ? mutate(() => submitParticipantInvestigation(disputeId, payload), "Your response was not submitted. Authoritative investigation data was refreshed.")
      : Promise.resolve(false),
    upload: (type: "IMAGE" | "DOCUMENT", file: File, note: string) => disputeId
      ? mutate(() => uploadParticipantDirectEvidence(disputeId, type, file, note), "Your evidence was not uploaded. Authoritative investigation data was refreshed.")
      : Promise.resolve(false),
  };
}

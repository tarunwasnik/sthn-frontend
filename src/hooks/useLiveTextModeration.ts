import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";

import {
  requestTextModeration,
  type TextModerationRequest,
  type TextModerationResponse,
} from "../api/textModeration";

type LiveModerationStatus = "IDLE" | "CHECKING" | "ALLOW" | "BLOCK" | "UNAVAILABLE";

export interface LiveTextModerationState {
  status: LiveModerationStatus;
  result: TextModerationResponse | null;
}

const initialState: LiveTextModerationState = { status: "IDLE", result: null };
type StoredModerationState = LiveTextModerationState & { payloadIdentity: string };

export const useLiveTextModeration = (payload: TextModerationRequest | null, debounceMs = 600) => {
  const [storedState, setStoredState] = useState<StoredModerationState>({ ...initialState, payloadIdentity: "" });
  const currentRequest = useRef(0);
  const controller = useRef<AbortController | null>(null);
  const payloadIdentity = payload ? JSON.stringify(payload) : "";
  const state = storedState.payloadIdentity === payloadIdentity ? storedState : initialState;

  const check = useCallback(async (requestedPayload?: TextModerationRequest): Promise<TextModerationResponse | null> => {
    const candidate = requestedPayload ?? payload;
    if (!candidate) {
      return null;
    }
    const candidateIdentity = JSON.stringify(candidate);
    const requestId = ++currentRequest.current;
    controller.current?.abort();
    const nextController = new AbortController();
    controller.current = nextController;
    setStoredState({ status: "CHECKING", result: null, payloadIdentity: candidateIdentity });
    try {
      const result = await requestTextModeration(candidate, nextController.signal);
      if (requestId !== currentRequest.current) return null;
      setStoredState({ status: result.decision, result, payloadIdentity: candidateIdentity });
      return result;
    } catch (error) {
      if (axios.isCancel(error) || nextController.signal.aborted || requestId !== currentRequest.current) return null;
      const result: TextModerationResponse = {
        decision: "UNAVAILABLE",
        message: "Text moderation is temporarily unavailable. Please try again.",
        fingerprint: "",
      };
      setStoredState({ status: "UNAVAILABLE", result, payloadIdentity: candidateIdentity });
      return result;
    }
  }, [payload]);

  useEffect(() => {
    currentRequest.current += 1;
    controller.current?.abort();
    if (!payload) return;
    const timer = window.setTimeout(() => { void check(payload); }, debounceMs);
    return () => window.clearTimeout(timer);
  }, [check, debounceMs, payload]);

  useEffect(() => () => controller.current?.abort(), []);

  return { ...state, checkNow: check };
};

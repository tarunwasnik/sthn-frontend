// frontend/src/features/wallet/useWallets.ts
//
// Shared Wallet data hook used by BOTH the User Wallet page and the
// Creator Wallet page. Both consume the SAME User-owned Wallet backend
// authority (GET /v1/wallet/all + GET /v1/wallet/currencies).
//
// No financial authority lives here — this only fetches and formats.
// No optimistic mutation, no balance calculation, no FX.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";

import { getSupportedCurrencies, getWallets } from "./api";
import type { CurrencyMetadataDto, WalletListItemDto } from "./types";
import { formatMinorAmount } from "../walletConversion/money";

export type WalletLoadState = "loading" | "ready" | "error";

export interface WalletViewBucket extends WalletListItemDto {
  /** Backend currency metadata (authoritative for display) */
  meta?: CurrencyMetadataDto;
}

export interface UseWalletsResult {
  state: WalletLoadState;
  wallets: WalletViewBucket[];
  /** Backend currency metadata; used by bounded Wallet sub-features. */
  currencies: CurrencyMetadataDto[];
  errorMessage: string | null;
  /** true only for HTTP 403 (access) — we do NOT log the user out */
  isForbidden: boolean;
  refresh: () => void;
  /** Format a minor-unit amount using backend metadata. */
  format: (minorAmount: number, currencyCode: string) => string;
}

function safeMessage(err: unknown): { message: string; forbidden: boolean } {
  if (axios.isAxiosError(err)) {
    const status = err.response?.status;
    if (status === 403) {
      return {
        message: "You do not have access to view this wallet.",
        forbidden: true,
      };
    }
    if (status === 404) {
      return { message: "Wallet not found.", forbidden: false };
    }
    if (status && status >= 500) {
      return {
        message: "Wallet service is temporarily unavailable. Please try again.",
        forbidden: false,
      };
    }
    if (!status) {
      return {
        message: "Network error. Check your connection and try again.",
        forbidden: false,
      };
    }
    return {
      message: "Could not load your wallet right now.",
      forbidden: false,
    };
  }
  return {
    message: "Something went wrong loading your wallet.",
    forbidden: false,
  };
}

export function useWallets(): UseWalletsResult {
  const [state, setState] = useState<WalletLoadState>("loading");
  const [wallets, setWallets] = useState<WalletViewBucket[]>([]);
  const [currencies, setCurrencies] = useState<CurrencyMetadataDto[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isForbidden, setIsForbidden] = useState(false);
  const currenciesRef = useRef<Map<string, CurrencyMetadataDto>>(new Map());
  const [reloadTick, setReloadTick] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setState("loading");
      setErrorMessage(null);
      setIsForbidden(false);
      try {
        const [walletList, currencyList] = await Promise.all([
          getWallets(),
          getSupportedCurrencies(),
        ]);
        if (cancelled) return;

        const metaMap = new Map<string, CurrencyMetadataDto>();
        for (const c of currencyList) metaMap.set(c.code, c);
        currenciesRef.current = metaMap;
        setCurrencies(currencyList);

        setWallets(
          walletList.map((w) => ({ ...w, meta: metaMap.get(w.currency) })),
        );
        setState("ready");
      } catch (err) {
        if (cancelled) return;
        const { message, forbidden } = safeMessage(err);
        setErrorMessage(message);
        setIsForbidden(forbidden);
        setState("error");
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [reloadTick]);

  const refresh = useCallback(() => setReloadTick((t) => t + 1), []);

  const format = useCallback(
    (minorAmount: number, currencyCode: string): string => {
      const meta = currenciesRef.current.get(currencyCode);
      return formatMinorAmount(minorAmount, currencyCode, meta);
    },
    [],
  );

  return useMemo(
    () => ({ state, wallets, currencies, errorMessage, isForbidden, refresh, format }),
    [state, wallets, currencies, errorMessage, isForbidden, refresh, format],
  );
}

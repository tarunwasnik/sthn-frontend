// frontend/src/features/wallet/api.ts
//
// Feature-level Wallet API module.
// Uses the canonical Axios client (frontend/src/api/axios.ts).
// Backend is the single Wallet authority; this layer only maps HTTP → typed DTOs.

import type {
  CurrencyListResponse,
  CurrencyMetadataDto,
  WalletListItemDto,
  WalletListResponse,
} from "./types";
import api from "../../api/axios";

/**
 * GET /v1/wallet/all
 * Returns every wallet currency bucket owned by the authenticated User.
 * Identity comes from the auth token (req.user); NO user id is sent.
 */
export async function getWallets(): Promise<WalletListItemDto[]> {
  const res = await api.get<WalletListResponse>("/v1/wallet/all");
  return res.data.data;
}

/**
 * GET /v1/wallet/currencies
 * Returns backend-enabled currency metadata (symbol, displayName, minorUnits,
 * walletEnabled, topUpEnabled). This is the authority for formatting.
 */
export async function getSupportedCurrencies(): Promise<CurrencyMetadataDto[]> {
  const res = await api.get<CurrencyListResponse>("/v1/wallet/currencies");
  return res.data.data;
}


// frontend/src/features/wallet/types.ts
//
// Frontend-safe Wallet DTO types.
// These mirror the backend response DTOs exactly (backend is authority).
// Amounts are in MINOR UNITS (per backend money.type.ts).

/** One wallet bucket, from GET /v1/wallet/all (toWalletListItemResponseDto) */
export interface WalletListItemDto {
  currency: string;
  available: number;
  reserved: number;
  locked: number;
  current: number;
  createdAt: string;
}

/** Currency metadata, from GET /v1/wallet/currencies (CurrencyMetadataResponseDto) */
export interface CurrencyMetadataDto {
  code: string;
  displayName: string;
  symbol: string;
  minorUnits: number;
  walletEnabled: boolean;
  topUpEnabled: boolean;
}

/** Envelope returned by the backend wallet read endpoints. */
export interface WalletListResponse {
  success: boolean;
  data: WalletListItemDto[];
}

export interface CurrencyListResponse {
  success: boolean;
  data: CurrencyMetadataDto[];
}

/** Safe DTOs exposed by the Wallet conversion and FX snapshot endpoints. */
export type WalletConversionStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "COMPLETED"
  | "FAILED";

export type ProviderConversionStatus =
  | "INITIALIZED"
  | "PROCESSING"
  | "SUCCEEDED"
  | "FAILED";

export type ProviderConversionOutcome = "SUCCESS" | "FAILURE";

export interface FxRateSnapshotDto {
  snapshotReference: string;
  provider: string;
  baseCurrency: string;
  quoteCurrency: string;
  rate: string;
  inverseRate: string;
  effectiveDate: string;
  providerPublishedAt?: string;
  fetchedAt: string;
  validFrom: string;
  expiresAt: string;
  isCurrent: boolean;
  isStale: boolean;
  cached: boolean;
  cachedFallback: boolean;
  baseMinorUnits: number;
  quoteMinorUnits: number;
}

export interface WalletConversionRequestDto {
  conversionReference: string;
  status: WalletConversionStatus;
  decision?: "APPROVE" | "REJECT";
  sourceCurrency: string;
  targetCurrency: string;
  sourceAmount: number;
  targetAmount: number;
  fxSnapshotReference: string;
  fxProvider: string;
  fxEffectiveDate: string;
  rate: string;
  inverseRate: string;
  requestedAt: string;
  decidedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  rejectionCode?: string;
  rejectionReason?: string;
  providerStatus?: ProviderConversionStatus;
  providerOutcome?: ProviderConversionOutcome;
  providerProcessingAt?: string;
  providerCompletedAt?: string;
  completedAt?: string;
}

export interface WalletConversionCreateInput {
  sourceCurrency: string;
  targetCurrency: string;
  sourceAmount: number;
}

export interface FinancialEnvelope<T> {
  success: boolean;
  data: T;
}

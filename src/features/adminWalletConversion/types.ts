export type WalletConversionStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "COMPLETED"
  | "FAILED";

export type WalletConversionDecision = "APPROVE" | "REJECT";
export type WalletConversionRejectionCode =
  | "ADMIN_DECLINED"
  | "INVALID_REQUEST"
  | "FX_SNAPSHOT_NOT_ACCEPTABLE"
  | "INSUFFICIENT_SOURCE_FUNDS"
  | "SIMULATION_REJECTED"
  | "OTHER";
export type WalletConversionProviderStatus =
  | "INITIALIZED"
  | "PROCESSING"
  | "SUCCEEDED"
  | "FAILED";
export type WalletConversionProviderOutcome = "SUCCESS" | "FAILURE";

/** Deliberately restricted to the safe Admin request/detail DTO. */
export interface AdminWalletConversionRequestDto {
  conversionReference: string;
  status: WalletConversionStatus;
  decision?: WalletConversionDecision;
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
  rejectionCode?: WalletConversionRejectionCode;
  rejectionReason?: string;
  providerStatus?: WalletConversionProviderStatus;
  providerOutcome?: WalletConversionProviderOutcome;
  providerProcessingAt?: string;
  providerCompletedAt?: string;
  completedAt?: string;
}

export interface ProviderExecutionDto {
  conversionReference: string;
  providerStatus: WalletConversionProviderStatus;
  providerOutcome?: WalletConversionProviderOutcome;
  processingAt?: string;
  completedAt?: string;
}

export interface ConversionAccountingDto {
  conversionReference: string;
  status: WalletConversionStatus;
  sourceCurrency: string;
  targetCurrency: string;
  sourceAmount: number;
  targetAmount: number;
  completedAt?: string;
}

export interface ConversionReconciliationDto {
  /** Opaque Admin operational reference returned by the backend. */
  reconciliationReference: string;
  conversionReference: string;
  classification:
    | "HEALTHY"
    | "REPLAY_REQUIRED"
    | "PENDING"
    | "CORRUPTED_LEDGER"
    | "CORRUPTED_PROJECTION"
    | "CORRUPTED_REQUEST"
    | "CORRUPTED_PROVIDER"
    | "CORRUPTED_SNAPSHOT"
    | "MISSING_AUDIT"
    | "INTEGRITY_FAILURE"
    | "UNKNOWN";
  severity: "INFO" | "WARNING" | "CRITICAL";
  issues: string[];
  retryPerformed: boolean;
  repairPerformed: boolean;
  /** Exact backend-computed, state-guarded operations; never client-derived. */
  allowedActions: ConversionOperationalAction[];
}

export type WalletConversionRepairAction =
  | "RESTORE_MISSING_AUDIT"
  | "RESTORE_LEDGER_REFERENCES"
  | "RESTORE_PROJECTION_REFERENCES"
  | "RESTORE_ACCOUNTING_REFERENCES";
export type ConversionOperationalAction = "RETRY" | WalletConversionRepairAction;

export interface DataResponse<T> {
  success: boolean;
  data: T;
}

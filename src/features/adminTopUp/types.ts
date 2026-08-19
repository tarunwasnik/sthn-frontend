import type { TopUpRequestDto } from "../topUp/types";

export type { TopUpStatus } from "../topUp/types";

export type AdminTopUpDecision = "APPROVE" | "REJECT";
export type TopUpRejectionCode =
  | "ADMIN_DECLINED"
  | "INVALID_REQUEST"
  | "SIMULATION_REJECTED"
  | "OTHER";
export type ProviderFundingOutcome = "SUCCESS" | "FAILURE";
export type ProviderFundingStatus =
  | "CREATED"
  | "PROCESSING"
  | "SUCCEEDED"
  | "FAILED";
export type ProviderFundingFailureCode =
  | "SIMULATED_DECLINE"
  | "SIMULATED_PROVIDER_ERROR";
export type WalletTopUpOperationalAction =
  | "INSPECT"
  | "FINALIZE_PROVIDER_FAILURE"
  | "RETRY_ACCOUNTING"
  | "RETRY_COMPLETION"
  | "MARK_RECONCILIATION_REQUIRED"
  | "REPAIR_REQUEST_LINKS"
  | "REPAIR_PROJECTION_LINK"
  | "REPAIR_LEDGER_LINK"
  | "ACKNOWLEDGE_CORRUPTION"
  | "RESOLVE_RECONCILIATION";
export type WalletTopUpRetryAction =
  | "RETRY_ACCOUNTING"
  | "RETRY_COMPLETION";
export type WalletTopUpRepairAction =
  | "REPAIR_REQUEST_LINKS"
  | "REPAIR_PROJECTION_LINK"
  | "REPAIR_LEDGER_LINK";
export type WalletTopUpReconciliationStatusAction =
  | "ACKNOWLEDGE_CORRUPTION"
  | "RESOLVE_RECONCILIATION";

export type AdminTopUpRequestDto = TopUpRequestDto;

export interface ProviderFundingResultDto {
  topUpReference: string;
  topUpStatus: "PROCESSING";
  amount: number;
  currency: string;
  providerFundingReference: string;
  providerStatus: ProviderFundingStatus;
  processingStartedAt?: string;
  providerSucceededAt?: string;
  providerFailedAt?: string;
  failureCode?: ProviderFundingFailureCode;
  failureReason?: string;
}

export interface TopUpReconciliationDto {
  reconciliationReference: string;
  topUpReference: string;
  classification: string;
  status: string;
  severity: string;
  providerFundingReference?: string;
  ledgerReference?: string;
  projectionOperationReference?: string;
  accountingTransactionId?: string;
  requestStatus?: string;
  providerStatus?: ProviderFundingStatus;
  amount?: number;
  currency?: string;
  issueCodes: string[];
  recommendedAction?: WalletTopUpOperationalAction;
  allowedActions: WalletTopUpOperationalAction[];
  retry: {
    count: number;
    max: number;
    nextRetryAt?: string;
    lastRetryAt?: string;
    lastRetryCode?: string;
  };
  resolution?: {
    action?: WalletTopUpOperationalAction;
    code?: string;
    note?: string;
    resolvedAt?: string;
  };
  detectedAt: string;
  lastInspectedAt: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TopUpRepairResultDto {
  reconciliation: TopUpReconciliationDto;
  repair: {
    operationReference: string;
    action: WalletTopUpRepairAction;
    status: "STARTED" | "APPLIED" | "REJECTED";
    repairedFields: string[];
    appliedAt?: string;
  };
}

export interface AccountingCompletionDto {
  topUpReference: string;
  topUpStatus: "COMPLETED";
  amount: number;
  currency: string;
  providerFundingReference: string;
  providerStatus: "SUCCEEDED";
  completedAt: string;
}

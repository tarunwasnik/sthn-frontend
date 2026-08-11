import type { TopUpRequestDto } from "../topUp/types";

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
  requestStatus?: string;
  providerStatus?: ProviderFundingStatus;
  amount?: number;
  currency?: string;
  issueCodes: string[];
  recommendedAction?: string;
  allowedActions: string[];
  detectedAt: string;
  lastInspectedAt: string;
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

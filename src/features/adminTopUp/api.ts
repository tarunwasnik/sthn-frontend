import api from "../../api/axios";
import type {
  AccountingCompletionDto,
  AdminTopUpRequestDto,
  ProviderFundingFailureCode,
  ProviderFundingResultDto,
  TopUpRepairResultDto,
  TopUpReconciliationDto,
  TopUpRejectionCode,
  TopUpStatus,
  WalletTopUpRepairAction,
  WalletTopUpReconciliationStatusAction,
  WalletTopUpRetryAction,
} from "./types";

interface DataResponse<T> {
  success: boolean;
  data: T;
}

export async function getAdminTopUpQueue(
  status: TopUpStatus = "PENDING",
): Promise<AdminTopUpRequestDto[]> {
  const response = await api.get<DataResponse<AdminTopUpRequestDto[]>>(
    "/v1/admin/financial/wallet-top-up-requests",
    { params: { status } },
  );
  return response.data.data;
}

export async function getAdminTopUpRequest(
  topUpReference: string,
): Promise<AdminTopUpRequestDto> {
  const response = await api.get<DataResponse<AdminTopUpRequestDto>>(
    `/v1/admin/financial/wallet-top-up-requests/${encodeURIComponent(topUpReference)}`,
  );
  return response.data.data;
}

export async function decideAdminTopUp(
  topUpReference: string,
  input:
    | { decision: "APPROVE" }
    | {
        decision: "REJECT";
        rejectionCode: TopUpRejectionCode;
        rejectionReason?: string;
      },
): Promise<AdminTopUpRequestDto> {
  const response = await api.patch<DataResponse<AdminTopUpRequestDto>>(
    `/v1/admin/financial/wallet-top-up-requests/${encodeURIComponent(topUpReference)}/decision`,
    input,
  );
  return response.data.data;
}

export async function startAdminTopUpProcessing(
  topUpReference: string,
  input:
    | { outcome: "SUCCESS" }
    | {
        outcome: "FAILURE";
        failureCode: ProviderFundingFailureCode;
        failureReason?: string;
      },
): Promise<ProviderFundingResultDto> {
  const response = await api.post<DataResponse<ProviderFundingResultDto>>(
    `/v1/admin/financial/wallet-top-up-requests/${encodeURIComponent(topUpReference)}/start-processing`,
    input,
  );
  return response.data.data;
}

export async function inspectAdminTopUp(
  topUpReference: string,
): Promise<TopUpReconciliationDto> {
  const response = await api.get<DataResponse<TopUpReconciliationDto>>(
    `/v1/admin/financial/wallet-top-up-requests/${encodeURIComponent(topUpReference)}/reconciliation`,
  );
  return response.data.data;
}

export async function finalizeAdminProviderFailure(
  topUpReference: string,
): Promise<TopUpReconciliationDto> {
  const response = await api.post<DataResponse<TopUpReconciliationDto>>(
    `/v1/admin/financial/wallet-top-up-requests/${encodeURIComponent(topUpReference)}/finalize-provider-failure`,
    {},
  );
  return response.data.data;
}

export async function completeAdminTopUpAccounting(
  topUpReference: string,
): Promise<AccountingCompletionDto> {
  const response = await api.post<DataResponse<AccountingCompletionDto>>(
    `/v1/admin/financial/wallet-top-up-requests/${encodeURIComponent(topUpReference)}/complete-accounting`,
    {},
  );
  return response.data.data;
}

export async function retryAdminTopUpReconciliation(
  reconciliationReference: string,
  action: WalletTopUpRetryAction,
): Promise<TopUpReconciliationDto> {
  const response = await api.post<DataResponse<TopUpReconciliationDto>>(
    `/v1/admin/financial/wallet-top-up-reconciliations/${encodeURIComponent(reconciliationReference)}/retry`,
    { action },
  );
  return response.data.data;
}

export async function repairAdminTopUpReconciliation(
  reconciliationReference: string,
  action: WalletTopUpRepairAction,
): Promise<TopUpRepairResultDto> {
  const response = await api.post<DataResponse<TopUpRepairResultDto>>(
    `/v1/admin/financial/wallet-top-up-reconciliations/${encodeURIComponent(reconciliationReference)}/repair`,
    { action },
  );
  return response.data.data;
}

export async function updateAdminTopUpReconciliationStatus(
  reconciliationReference: string,
  input: {
    action: WalletTopUpReconciliationStatusAction;
    resolutionCode: string;
    resolutionNote?: string;
  },
): Promise<TopUpReconciliationDto> {
  const response = await api.patch<DataResponse<TopUpReconciliationDto>>(
    `/v1/admin/financial/wallet-top-up-reconciliations/${encodeURIComponent(reconciliationReference)}/status`,
    input,
  );
  return response.data.data;
}

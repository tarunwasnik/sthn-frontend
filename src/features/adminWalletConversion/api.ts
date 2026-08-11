import api from "../../api/axios";
import type {
  AdminWalletConversionRequestDto,
  ConversionAccountingDto,
  ConversionReconciliationDto,
  DataResponse,
  ProviderExecutionDto,
  WalletConversionRejectionCode,
  WalletConversionRepairAction,
  WalletConversionStatus,
} from "./types";

const basePath = "/v1/admin/financial/wallet-conversion-requests";

export async function getAdminWalletConversionQueue(
  status: WalletConversionStatus,
): Promise<AdminWalletConversionRequestDto[]> {
  const response = await api.get<DataResponse<AdminWalletConversionRequestDto[]>>(
    basePath,
    { params: { status } },
  );
  return response.data.data;
}

export async function getAdminWalletConversion(
  conversionReference: string,
): Promise<AdminWalletConversionRequestDto> {
  const response = await api.get<DataResponse<AdminWalletConversionRequestDto>>(
    `${basePath}/${encodeURIComponent(conversionReference)}`,
  );
  return response.data.data;
}

export async function decideAdminWalletConversion(
  conversionReference: string,
  input: { decision: "APPROVE" } | {
    decision: "REJECT";
    rejectionCode: WalletConversionRejectionCode;
    rejectionReason?: string;
  },
): Promise<AdminWalletConversionRequestDto> {
  const response = await api.patch<DataResponse<AdminWalletConversionRequestDto>>(
    `${basePath}/${encodeURIComponent(conversionReference)}/decision`,
    input,
  );
  return response.data.data;
}

export async function executeAdminWalletConversionProvider(
  conversionReference: string,
  input: { outcome: "SUCCESS" } | {
    outcome: "FAILURE";
    failureCode?: string;
    failureReason?: string;
  },
): Promise<ProviderExecutionDto> {
  const response = await api.post<DataResponse<ProviderExecutionDto>>(
    `${basePath}/${encodeURIComponent(conversionReference)}/execute-provider`,
    input,
  );
  return response.data.data;
}

export async function completeAdminWalletConversionAccounting(
  conversionReference: string,
): Promise<ConversionAccountingDto> {
  const response = await api.post<DataResponse<ConversionAccountingDto>>(
    `${basePath}/${encodeURIComponent(conversionReference)}/complete-accounting`,
    {},
  );
  return response.data.data;
}

export async function inspectAdminWalletConversion(
  conversionReference: string,
): Promise<ConversionReconciliationDto> {
  const response = await api.get<DataResponse<ConversionReconciliationDto>>(
    `${basePath}/${encodeURIComponent(conversionReference)}/reconciliation`,
  );
  return response.data.data;
}

export async function retryAdminWalletConversion(
  reconciliationReference: string,
): Promise<ConversionReconciliationDto> {
  const response = await api.post<DataResponse<ConversionReconciliationDto>>(
    `/v1/admin/financial/wallet-conversion-reconciliations/${encodeURIComponent(reconciliationReference)}/retry`,
    {},
  );
  return response.data.data;
}

export async function repairAdminWalletConversion(
  reconciliationReference: string,
  action: WalletConversionRepairAction,
): Promise<ConversionReconciliationDto> {
  const response = await api.post<DataResponse<ConversionReconciliationDto>>(
    `/v1/admin/financial/wallet-conversion-reconciliations/${encodeURIComponent(reconciliationReference)}/repair`,
    { action },
  );
  return response.data.data;
}

import api from "../../api/axios";
import type { AdminPaymentDto, AdminPaymentFilters, AdminPaymentFinancialDetailDto, AdminPaymentListDto, DataResponse } from "./types";

const basePath = "/v1/admin/financial/payments";

export async function getAdminPayments(filters: AdminPaymentFilters): Promise<AdminPaymentListDto> {
  const response = await api.get<DataResponse<AdminPaymentListDto>>(basePath, { params: filters });
  return response.data.data;
}

export async function getAdminPayment(paymentReference: string): Promise<AdminPaymentDto> {
  const response = await api.get<DataResponse<AdminPaymentDto>>(`${basePath}/${encodeURIComponent(paymentReference)}`);
  return response.data.data;
}

export async function getAdminPaymentFinancialDetail(paymentReference: string): Promise<AdminPaymentFinancialDetailDto> {
  const response = await api.get<DataResponse<AdminPaymentFinancialDetailDto>>(`${basePath}/${encodeURIComponent(paymentReference)}/financial-detail`);
  return response.data.data;
}

export async function syncAdminPayment(paymentReference: string): Promise<{ result: string; resource: AdminPaymentDto }> {
  const response = await api.post<DataResponse<{ result: string; resource: AdminPaymentDto }>>(`${basePath}/${encodeURIComponent(paymentReference)}/sync`, {});
  return response.data.data;
}

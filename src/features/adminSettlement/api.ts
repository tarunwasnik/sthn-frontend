import api from "../../api/axios";
import type {
  AdminSettlementDto,
  AdminSettlementFilters,
  AdminSettlementListDto,
  DataResponse,
} from "./types";

const basePath = "/v1/admin/financial/settlements";

export async function getAdminSettlements(
  filters: AdminSettlementFilters,
): Promise<AdminSettlementListDto> {
  const response = await api.get<DataResponse<AdminSettlementListDto>>(basePath, {
    params: filters,
  });
  return response.data.data;
}

export async function getAdminSettlement(
  settlementReference: string,
): Promise<AdminSettlementDto> {
  const response = await api.get<DataResponse<AdminSettlementDto>>(
    `${basePath}/${encodeURIComponent(settlementReference)}`,
  );
  return response.data.data;
}

export async function recheckAdminSettlement(
  settlementReference: string,
): Promise<AdminSettlementDto> {
  const response = await api.post<DataResponse<{ resource: AdminSettlementDto }>>(
    `${basePath}/${encodeURIComponent(settlementReference)}/recheck`,
    {},
  );
  return response.data.data.resource;
}

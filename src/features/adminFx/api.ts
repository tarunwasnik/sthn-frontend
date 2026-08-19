import api from "../../api/axios";
import type { AdminFxReadDto, AdminFxSnapshotDto, DataResponse } from "./types";

const basePath = "/v1/admin/financial/fx-rates";

export async function getAdminFxRates(): Promise<AdminFxReadDto> {
  const response = await api.get<DataResponse<AdminFxReadDto>>(basePath);
  return response.data.data;
}

export async function refreshAdminFxRate(baseCurrency: string, quoteCurrency: string): Promise<AdminFxSnapshotDto> {
  const response = await api.post<DataResponse<AdminFxSnapshotDto>>(`${basePath}/refresh`, { baseCurrency, quoteCurrency, force: true });
  return response.data.data;
}

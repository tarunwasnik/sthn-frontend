import api from "../../api/axios";
import type { AdminEscrowDto, AdminEscrowListDto, AdminEscrowState, DataResponse } from "./types";

const basePath = "/v1/admin/financial/booking-escrow";

export async function getAdminEscrowQueue(state?: AdminEscrowState): Promise<AdminEscrowListDto> {
  const response = await api.get<DataResponse<AdminEscrowListDto>>(basePath, {
    params: state ? { state } : undefined,
  });
  return response.data.data;
}

export async function getAdminEscrow(bookingReference: string): Promise<AdminEscrowDto> {
  const response = await api.get<DataResponse<AdminEscrowDto>>(
    `${basePath}/${encodeURIComponent(bookingReference)}`,
  );
  return response.data.data;
}

export async function releaseAdminEscrow(
  bookingReference: string,
  reason?: string,
): Promise<unknown> {
  const response = await api.post<DataResponse<unknown>>(
    `${basePath}/${encodeURIComponent(bookingReference)}/release`,
    reason ? { reason } : {},
  );
  return response.data.data;
}

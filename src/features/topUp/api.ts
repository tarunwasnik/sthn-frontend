import api from "../../api/axios";
import type {
  TopUpListResponse,
  TopUpRequestDto,
  TopUpRequestResponse,
} from "./types";

/** POST /v1/wallet/top-up-requests — authenticated owner only. */
export async function createTopUpRequest(input: {
  amount: number;
  currency: string;
  idempotencyKey: string;
}): Promise<TopUpRequestDto> {
  const response = await api.post<TopUpRequestResponse>(
    "/v1/wallet/top-up-requests",
    { amount: input.amount, currency: input.currency },
    { headers: { "Idempotency-Key": input.idempotencyKey } },
  );
  return response.data.data;
}

/** GET /v1/wallet/top-up-requests — authenticated owner's own history. */
export async function getMyTopUps(): Promise<TopUpRequestDto[]> {
  const response = await api.get<TopUpListResponse>(
    "/v1/wallet/top-up-requests",
  );
  return response.data.data;
}

/** GET /v1/wallet/top-up-requests/:topUpReference — owner-scoped detail. */
export async function getTopUpRequest(
  topUpReference: string,
): Promise<TopUpRequestDto> {
  const response = await api.get<TopUpRequestResponse>(
    `/v1/wallet/top-up-requests/${encodeURIComponent(topUpReference)}`,
  );
  return response.data.data;
}

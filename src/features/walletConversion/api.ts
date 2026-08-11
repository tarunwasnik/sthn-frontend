import api from "../../api/axios";
import type {
  FinancialEnvelope,
  FxRateSnapshotDto,
  WalletConversionCreateInput,
  WalletConversionRequestDto,
} from "./types";

/** Current informative backend FX authority for an enabled directed pair. */
export async function getCurrentFxSnapshot(
  baseCurrency: string,
  quoteCurrency: string,
): Promise<FxRateSnapshotDto> {
  const response = await api.get<FinancialEnvelope<FxRateSnapshotDto>>(
    `/v1/wallet/fx-rates/${encodeURIComponent(baseCurrency)}/${encodeURIComponent(quoteCurrency)}`,
  );
  return response.data.data;
}

/**
 * Creates a User-owned conversion request. The server selects and binds the
 * current eligible snapshot and calculates targetAmount; no user id, quote id,
 * target amount, or rate is sent by React.
 */
export async function createWalletConversion(
  input: WalletConversionCreateInput,
  idempotencyKey: string,
): Promise<WalletConversionRequestDto> {
  const response = await api.post<FinancialEnvelope<WalletConversionRequestDto>>(
    "/v1/wallet/conversion-requests",
    input,
    { headers: { "Idempotency-Key": idempotencyKey } },
  );
  return response.data.data;
}

export async function getMyWalletConversions(): Promise<
  WalletConversionRequestDto[]
> {
  const response = await api.get<FinancialEnvelope<WalletConversionRequestDto[]>>(
    "/v1/wallet/conversion-requests",
  );
  return response.data.data;
}

export async function getMyWalletConversion(
  conversionReference: string,
): Promise<WalletConversionRequestDto> {
  const response = await api.get<FinancialEnvelope<WalletConversionRequestDto>>(
    `/v1/wallet/conversion-requests/${encodeURIComponent(conversionReference)}`,
  );
  return response.data.data;
}

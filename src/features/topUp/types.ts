/** Backend WalletTopUpRequestStatus values. */
export type TopUpStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED";

/** Safe owner-scoped WalletTopUpRequest DTO. Amounts are integer minor units. */
export interface TopUpRequestDto {
  topUpReference: string;
  amount: number;
  currency: string;
  status: TopUpStatus;
  requestedAt: string;
  decidedAt?: string;
  rejectionCode?: string;
  rejectionReason?: string;
  completedAt?: string;
}

export interface TopUpRequestResponse {
  success: boolean;
  data: TopUpRequestDto;
}

export interface TopUpListResponse {
  success: boolean;
  data: TopUpRequestDto[];
}

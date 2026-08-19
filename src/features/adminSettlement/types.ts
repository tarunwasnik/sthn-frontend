export type AdminSettlementStatus =
  | "CREATED"
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED"
  | "EXPIRED";

/** Exact safe Admin settlement DTO. Amounts are integer minor units. */
export interface AdminSettlementDto {
  settlementReference: string;
  bookingId?: string;
  paymentId?: string;
  creatorId?: string;
  status: AdminSettlementStatus;
  amount: number;
  currency: string;
  serviceAmount?: number;
  customerFeeAmount?: number;
  creatorNetAmount?: number;
  platformCommissionAmount?: number;
  settlementEligibleAt?: string;
  settledAt?: string;
  ledgerTransactionReference?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminSettlementListDto {
  items: AdminSettlementDto[];
  pagination: { page: number; limit: number; total: number };
}

export interface AdminSettlementFilters {
  status?: AdminSettlementStatus;
  currency?: string;
  page: number;
  limit: number;
}

export interface DataResponse<T> {
  success: boolean;
  data: T;
}

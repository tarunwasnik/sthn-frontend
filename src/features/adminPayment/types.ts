export type AdminPaymentStatus =
  | "CREATED" | "INITIALIZING" | "PENDING" | "AUTHORIZED" | "CAPTURED"
  | "SETTLED" | "REFUNDED" | "PARTIALLY_REFUNDED" | "FAILED" | "EXPIRED" | "CANCELLED";

export interface AdminPaymentDto {
  paymentReference: string;
  bookingId?: string;
  userId?: string;
  creatorId?: string;
  status: AdminPaymentStatus;
  amount: number;
  currency: string;
  serviceAmount?: number;
  customerFeeAmount?: number;
  provider?: string;
  providerReference?: string;
  escrowRecognized: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminPaymentFinancialDetailDto {
  payment: AdminPaymentDto;
  booking?: {
    bookingReference?: string;
    status?: string;
    paymentMethod?: string;
    completedAt?: string;
    settlementEligibleAt?: string;
  };
  reservation?: {
    reservationReference: string;
    status: "PENDING" | "ACTIVE" | "RELEASED" | "CAPTURED" | "FAILED";
    amount: number;
    currency: string;
    authorizedAt?: string;
    releasedAt?: string;
    releaseReference?: string;
    releaseCause?: string;
    capturedAt?: string;
    captureReference?: string;
    captureCause?: string;
  };
  escrow?: { allocationReference: string; status: string; allocatedAt?: string };
  settlement?: { settlementReference: string; status: string; settledAt?: string };
}

export interface AdminPaymentListDto {
  items: AdminPaymentDto[];
  pagination: { page: number; limit: number; total: number };
}

export interface AdminPaymentFilters {
  status?: AdminPaymentStatus;
  currency?: string;
  page: number;
  limit: number;
}

export interface DataResponse<T> { success: boolean; data: T; }

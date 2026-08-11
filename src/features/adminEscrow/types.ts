export type AdminEscrowState = "HELD" | "ELIGIBLE" | "SETTLED" | "BLOCKED";

export interface AdminEscrowAllocationDto {
  reference: string;
  status?: string;
  allocatedAt?: string;
}

export interface AdminEscrowSettlementDto {
  reference: string;
  status?: string;
  settledAt?: string;
}

/** Exact safe Admin escrow DTO. Amounts are backend minor units. */
export interface AdminEscrowDto {
  bookingReference: string;
  paymentReference?: string;
  currency: string;
  capturedGrossAmount: number;
  serviceAmount: number;
  customerFeeAmount: number;
  creatorCommissionAmount: number;
  creatorNetAmount: number;
  capturedAt?: string;
  settlementEligibleAt?: string;
  escrowState: AdminEscrowState;
  paymentStatus?: string;
  reservationStatus?: string;
  allocation?: AdminEscrowAllocationDto;
  settlement?: AdminEscrowSettlementDto;
  hasOpenDispute: boolean;
  isFinancialLocked: boolean;
  manualReleaseAllowed: boolean;
  manualReleaseBlockedReason?: string;
}

export interface AdminEscrowListDto {
  items: AdminEscrowDto[];
}

export interface DataResponse<T> {
  success: boolean;
  data: T;
}

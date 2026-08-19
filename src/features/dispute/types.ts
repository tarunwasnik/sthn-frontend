export type DisputeStatus = "OPEN" | "RESOLVED" | "REJECTED";

export interface ParticipantDispute {
  disputeId: string;
  bookingId: string;
  status: DisputeStatus;
  raisedByMe: boolean;
  raisedByRole: "USER" | "CREATOR";
  reason: string;
  escalationLevel: "NONE" | "SOFT" | "HARD";
  createdAt: string;
  updatedAt: string;
  resolution: { action: "REFUND_USER" | "PAY_CREATOR" | "NO_ACTION"; resolvedAt: string } | null;
}

export interface BookingDisputeState {
  hasDispute: boolean;
  canOpenDispute: boolean;
  ineligibilityReason: string | null;
  dispute: ParticipantDispute | null;
}

export interface DisputeListItem extends ParticipantDispute {
  booking: {
    bookingId: string;
    bookingReference?: string;
    status: string;
    serviceTitle: string;
  } | null;
}

export interface OpenDisputePayload {
  bookingId: string;
  reason: string;
}

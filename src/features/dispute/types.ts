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
  finalDecision?: {
    outcome: "NO_ADVERSE_FINDING" | "ADVERSE_FINDING" | "MIXED" | "INCONCLUSIVE";
    summary: string;
    financialReviewRequired: boolean;
    governanceReviewRequired: boolean;
    finalizedAt: string;
  };
  input?: { state: "OPEN" | "CLOSED" };
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

export interface ParticipantInvestigationSubmission {
  submissionReference: string;
  branch: "CUSTOMER" | "CREATOR";
  kind: "STATEMENT" | "CLARIFICATION" | "EVIDENCE";
  text: string | null;
  evidence: Array<{
    evidenceReference: string;
    type: "IMAGE" | "DOCUMENT";
    url: string;
    fileName: string;
    mimeType: string;
    fileSize: number;
    caption: string | null;
  }>;
  createdAt: string;
  sharedWithCounterpartyAt: string | null;
}

export interface ParticipantDirectEvidence {
  evidenceReference: string;
  source: "CUSTOMER" | "CREATOR" | "ADMIN";
  type: "IMAGE" | "DOCUMENT";
  url: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  note: string | null;
  createdAt: string;
}

export interface ParticipantAdminRequest {
  requestReference: string;
  target: "CUSTOMER" | "CREATOR" | "BOTH";
  text: string;
  createdAt: string;
}

export interface ParticipantInvestigation {
  dispute: {
    disputeId: string;
    status: DisputeStatus;
    input: { state: "OPEN" | "CLOSED" };
  };
  submissions: ParticipantInvestigationSubmission[];
  directEvidence: ParticipantDirectEvidence[];
  adminRequests: ParticipantAdminRequest[];
  pagination: { page: number; limit: number; total: number };
}

export interface ParticipantSubmissionPayload {
  kind: "STATEMENT" | "CLARIFICATION" | "EVIDENCE";
  text?: string;
}

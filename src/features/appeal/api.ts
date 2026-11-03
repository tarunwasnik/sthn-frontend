import api from "../../api/axios";

export type ParticipantAppeal = {
  appealId: string;
  disputeId: string;
  bookingId: string;
  raisedByRole: "USER" | "CREATOR";
  status: "OPEN" | "UPHELD" | "REJECTED";
  reason: string;
  evidence: string[];
  createdAt: string;
  updatedAt: string;
  decision: { action: "REVERSE_DECISION" | "CONFIRM_DECISION"; decidedAt: string } | null;
};

export async function getMyAppealForDispute(disputeId: string): Promise<ParticipantAppeal | null> {
  try {
    const response = await api.get<{ appeal: ParticipantAppeal }>(`/v1/appeals/${encodeURIComponent(disputeId)}`);
    return response.data.appeal;
  } catch (error: unknown) {
    if (typeof error === "object" && error !== null && "response" in error && (error as { response?: { status?: number } }).response?.status === 404) return null;
    throw error;
  }
}

import api from "../../api/axios";
import type { BookingDisputeState, DisputeListItem, OpenDisputePayload, ParticipantInvestigation, ParticipantSubmissionPayload } from "./types";

export async function openDispute(payload: OpenDisputePayload) {
  const response = await api.post("/v1/disputes/open", payload);
  return response.data;
}

export async function getBookingDisputeState(bookingId: string): Promise<BookingDisputeState> {
  const response = await api.get<BookingDisputeState>(`/v1/disputes/booking/${bookingId}`);
  return response.data;
}

export async function getMyDisputes(): Promise<DisputeListItem[]> {
  const response = await api.get<{ disputes: DisputeListItem[] }>("/v1/disputes/my");
  return response.data.disputes;
}

export async function getParticipantInvestigation(disputeId: string): Promise<ParticipantInvestigation> {
  const response = await api.get<ParticipantInvestigation>(`/v1/disputes/${encodeURIComponent(disputeId)}/investigation`);
  return response.data;
}

export async function submitParticipantInvestigation(disputeId: string, payload: ParticipantSubmissionPayload) {
  return api.post(`/v1/disputes/${encodeURIComponent(disputeId)}/submissions`, payload);
}

export async function uploadParticipantDirectEvidence(disputeId: string, type: "IMAGE" | "DOCUMENT", file: File, note: string) {
  const body = new FormData();
  body.set("file", file);
  if (note.trim()) body.set("note", note.trim());
  const suffix = type === "IMAGE" ? "images" : "documents";
  return api.post(`/v1/disputes/${encodeURIComponent(disputeId)}/evidence/${suffix}`, body);
}

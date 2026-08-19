import api from "../../api/axios";
import type { BookingDisputeState, DisputeListItem, OpenDisputePayload } from "./types";

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

import api from "../../api/axios";
import type {
  BookingReviewState,
  SubmitReviewPayload,
  SubmitReviewResponse,
} from "./types";

export async function getMyBookingReviewState(
  bookingId: string,
): Promise<BookingReviewState> {
  const response = await api.get<BookingReviewState>(
    `/v1/reviews/booking/${bookingId}/me`,
  );
  return response.data;
}

export async function submitReview(
  bookingId: string,
  payload: SubmitReviewPayload,
): Promise<SubmitReviewResponse> {
  const response = await api.post<SubmitReviewResponse>(
    `/v1/reviews/${bookingId}`,
    payload,
  );
  return response.data;
}

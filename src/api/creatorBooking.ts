//frontend/src/api/creatorBooking.ts

import api from "./axios";

export const decideBookingAPI = async (
  bookingId: string,
  decision: "ACCEPT" | "REJECT"
) => {
  const res = await api.post(
    `/v1/creator/bookings/${bookingId}/decision`,
    {
      bookingId, // ✅ REQUIRED (backend uses body)
      decision,
    }
  );

  return res.data;
};
// frontend/src/api/userBooking.ts

import api from "./axios";

export const getUserBookingsAPI = async () => {
  const res = await api.get("/v1/bookings/user"); // ✅ FIXED

  return res.data;
};

export const getUserBookingAPI = async (bookingId: string) => {
  const res = await api.get(`/v1/bookings/${encodeURIComponent(bookingId)}`);
  return res.data;
};

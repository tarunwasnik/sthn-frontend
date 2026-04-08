// frontend/src/api/userBooking.ts

import api from "./axios";

export const getUserBookingsAPI = async () => {
  const res = await api.get("/v1/bookings/user"); // ✅ FIXED

  return res.data;
};
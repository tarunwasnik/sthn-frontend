import { useContext } from "react";
import { BookingRequestsContext, type BookingRequestsContextValue } from "../context/bookingRequests.context";

export function useBookingRequests(): BookingRequestsContextValue {
  const context = useContext(BookingRequestsContext);
  if (!context) throw new Error("useBookingRequests must be used within BookingRequestsProvider");
  return context;
}

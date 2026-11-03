import { createContext } from "react";

export interface BookingRequestsContextValue {
  pendingRequestCount: number;
  error: string | null;
  refreshPendingRequestCount: () => Promise<void>;
}

export const BookingRequestsContext = createContext<BookingRequestsContextValue | undefined>(undefined);

import { useCallback, useEffect, useState } from "react";
import axios from "axios";

import api from "../api/axios";

interface CreatorProfile {
  id: string;
  displayName: string;
  slug: string;
  primaryCategory: string;
  status: string;
  rating: number;
  reviewCount: number;
}

interface DashboardStats {
  totalBookings: number;
  completedBookings: number;
}

export interface RecentActivity {
  id: string;
  status: string;
  paymentStatus: string;
  createdAt: string;
}

export interface CreatorBooking {
  _id: string;
  status: "REQUESTED" | "CONFIRMED" | "REJECTED" | "CANCELLED" | "EXPIRED" | "COMPLETED";
  createdAt?: string;
  service?: { title?: string };
  user?: { displayName?: string };
  slots?: Array<{ startTime: string; endTime: string }>;
}

interface DashboardResponse {
  creatorProfile: CreatorProfile;
  stats: DashboardStats;
  recentActivity: RecentActivity[];
}

interface DashboardData extends DashboardResponse {
  pendingRequestCount: number;
  activeServiceCount: number;
  bookings: CreatorBooking[];
}

const getErrorMessage = (error: unknown) => {
  if (axios.isAxiosError(error) && typeof error.response?.data?.message === "string") return error.response.data.message;
  return "Unable to load the Creator dashboard right now.";
};

export function useCreatorDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorCode, setErrorCode] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setErrorCode(null);
    setErrorMessage(null);
    setData(null);

    try {
      const [dashboardResponse, bookingsResponse, servicesResponse, pendingResponse] = await Promise.all([
        api.get<DashboardResponse>("/v1/creator/dashboard"),
        api.get<{ bookings?: CreatorBooking[] }>("/v1/creator/bookings"),
        api.get<{ services?: Array<{ isActive?: boolean }> }>("/v1/creator/services"),
        api.get<{ pendingRequestCount?: unknown }>("/v1/creator/bookings/pending-count"),
      ]);
      const pendingRequestCount = Number(pendingResponse.data.pendingRequestCount);
      setData({
        ...dashboardResponse.data,
        bookings: Array.isArray(bookingsResponse.data.bookings) ? bookingsResponse.data.bookings : [],
        activeServiceCount: (servicesResponse.data.services ?? []).filter((service) => service.isActive).length,
        pendingRequestCount: Number.isFinite(pendingRequestCount) ? Math.max(0, Math.floor(pendingRequestCount)) : 0,
      });
    } catch (error) {
      setErrorCode(axios.isAxiosError(error) ? error.response?.status ?? null : null);
      setErrorMessage(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void reload(); }, [reload]);

  return { data, loading, errorCode, errorMessage, reload };
}

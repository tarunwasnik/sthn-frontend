// frontend/src/hooks/useCreatorDashboard.ts

import { useEffect, useState } from "react";
import axios from "../api/axios";

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
  pendingBookings: number;
  completedBookings: number;
}

export interface RecentActivity {
  id: string;
  status: string;
  paymentStatus: string;
  earning: number;
  createdAt: string;
}

interface DashboardResponse {
  creatorProfile: CreatorProfile;
  stats: DashboardStats;
  recentActivity: RecentActivity[];
}

export function useCreatorDashboard() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorCode, setErrorCode] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await axios.get("/v1/creator/dashboard");
        setData(response.data);
      } catch (err: any) {
        if (err.response) {
          setErrorCode(err.response.status);
          setErrorMessage(
            err.response.data?.message || "Something went wrong"
          );
        } else {
          setErrorMessage("Network error");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  return { data, loading, errorCode, errorMessage };
}
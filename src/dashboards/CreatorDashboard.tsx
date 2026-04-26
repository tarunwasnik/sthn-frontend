// frontend/src/dashboards/CreatorDashboard.tsx

import DashboardLayout from "../layouts/DashboardLayout";
import { useCreatorDashboard } from "../hooks/useCreatorDashboard";
import {
  TrendingUp,
  CalendarCheck,
  Star,
  Search,
  Clock,
  Calendar,
  Megaphone,
  User,
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

/* COMPONENTS */
import StatCard from "../components/common/StatCard";
import SectionCard from "../components/common/SectionCard";
import ActionButton from "../components/common/ActionButton";
import EmptyState from "../components/common/EmptyState";
import SkeletonCard from "../components/common/SkeletonCard";

export default function CreatorDashboard() {
  const { data, loading, errorCode, errorMessage } =
    useCreatorDashboard();

  const navigate = useNavigate();

  /* ACCESS CONTROL */
  useEffect(() => {
    if (!loading) {
      if (!data || errorCode) {
        navigate("/dashboard/user");
      }
    }
  }, [loading, data, errorCode, navigate]);

  /* LOADING */
  if (loading) {
    return (
      <DashboardLayout>
        <div className="px-4 sm:px-6 lg:px-8 py-6 pb-20 space-y-4">
          <SkeletonCard className="h-24" />
          <SkeletonCard className="h-40" />
        </div>
      </DashboardLayout>
    );
  }

  if (!data) return null;

  return (
    <DashboardLayout>
      <div className="px-4 sm:px-6 lg:px-8 py-6 pb-20 max-w-7xl mx-auto">

        {/* HEADER */}
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex items-start justify-between gap-4">
            <div className="max-w-xl">
              <h1 className="text-2xl sm:text-3xl font-semibold text-white">
                Welcome, {data.creatorProfile.displayName}
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                Here's what's happening with your experiences today.
              </p>
            </div>

            <button
              onClick={() => navigate("/creator/profile")}
              className="px-4 py-2 rounded-xl bg-white/10 border border-white/10 backdrop-blur-md hover:bg-white/20 active:scale-[0.97] transition text-sm text-white flex items-center gap-2"
            >
              <User size={16} />
              Profile
            </button>
          </div>
        </div>

        {/* ERROR */}
        {errorCode && (
          <div className="mb-6">
            <SectionCard title="Error">
              <p className="text-red-400 text-sm">{errorMessage}</p>
            </SectionCard>
          </div>
        )}

        {/* STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
          <StatCard
            label="Total Bookings"
            value={data.stats.totalBookings}
            icon={<CalendarCheck size={18} />}
          />

          <StatCard
            label="Pending"
            value={data.stats.pendingBookings}
            icon={<TrendingUp size={18} />}
          />

          <StatCard
            label="Rating"
            value={`${data.creatorProfile.rating} ⭐`}
            icon={<Star size={18} />}
          />
        </div>

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* LEFT */}
          <div className="lg:col-span-2 space-y-6">

            {/* ACTIVITY */}
            <SectionCard title="Latest Activity">
              <div className="min-h-[140px]">
                {data.recentActivity.length === 0 ? (
                  <div className="py-4">
                    <p className="text-sm text-gray-400">
                      No recent bookings yet
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {data.recentActivity.map((activity) => (
                      <div
                        key={activity.id}
                        className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-sm text-white">
                              {activity.status}
                            </p>
                            <p className="text-xs text-gray-400">
                              {new Date(
                                activity.createdAt
                              ).toLocaleString()}
                            </p>
                          </div>

                          {activity.earning > 0 && (
                            <span className="text-green-400 text-sm font-medium">
                              +₹{activity.earning}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </SectionCard>
          </div>

          {/* RIGHT */}
          <div className="space-y-6">

            {/* QUICK ACTIONS */}
            <SectionCard title="Quick Actions">
              <div className="grid grid-cols-2 gap-3">
                <ActionButton
                  icon={<Search size={18} />}
                  label="Browse Creators"
                  onClick={() =>
                    navigate("/dashboard/creator/browse")
                  }
                />

                <ActionButton
                  icon={<Calendar size={18} />}
                  label="Availability"
                  onClick={() =>
                    navigate("/dashboard/creator/availability")
                  }
                />

                <ActionButton
                  icon={<Clock size={18} />}
                  label="Requests"
                  onClick={() =>
                    navigate("/dashboard/creator/requests")
                  }
                />

                <ActionButton
                  icon={<Megaphone size={18} />}
                  label="Services"
                  onClick={() =>
                    navigate("/dashboard/creator/services")
                  }
                />
              </div>
            </SectionCard>

            {/* NEXT 24 HOURS */}
            <SectionCard title="Next 24 Hours">
              <EmptyState text="No upcoming sessions" />
            </SectionCard>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
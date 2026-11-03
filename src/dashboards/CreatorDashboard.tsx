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
              <h1 className="text-2xl sm:text-3xl font-semibold text-theme-text">
                Welcome, {data.creatorProfile.displayName}
              </h1>

              <p className="mt-1 text-sm text-theme-muted">
                Here's what's happening with your experiences today.
              </p>
            </div>

            <button
              onClick={() => navigate("/creator/profile")}
              className="flex items-center gap-2 rounded-[var(--radius-control)] border border-theme-border bg-theme-surface px-4 py-2 text-sm font-medium text-theme-text transition-colors hover:border-theme-border-strong hover:bg-theme-inset focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent"
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
              <p className="text-sm text-theme-danger">
                {errorMessage}
              </p>
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
                    <p className="text-sm text-theme-muted">
                      No recent bookings yet
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {data.recentActivity.map((activity) => (
                      <div
                        key={activity.id}
                        className="
                          p-4
                          rounded-[var(--radius-card)]
                          bg-theme-inset
                          border
                          border-theme-border
                          hover:bg-theme-surface-raised
                          transition-colors
                        "
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-sm text-theme-text">
                              {activity.status}
                            </p>

                            <p className="text-xs text-theme-muted">
                              {new Date(
                                activity.createdAt
                              ).toLocaleString()}
                            </p>
                          </div>

                          {activity.earning > 0 && (
                            <span className="text-sm font-medium text-theme-success">
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
                <ActionButton icon={<TrendingUp size={18} />} label="Payout Destinations" onClick={() => navigate("/dashboard/creator/payout-destinations")} />
                <ActionButton icon={<TrendingUp size={18} />} label="Entitlements" onClick={() => navigate("/dashboard/creator/earnings")} />
              </div>
            </SectionCard>

            {/* UPCOMING SESSION */}
<SectionCard title="Upcoming Session">
  {!data.nextUpcomingBooking ? (
    <EmptyState text="No upcoming bookings" />
  ) : (
    <div
      className="
        p-4
        rounded-[var(--radius-card)]
        bg-theme-inset
        border
        border-theme-border
      "
    >
      <p className="mb-2 text-xs text-theme-muted">
        Next Booking
      </p>

      <h4 className="text-sm font-medium text-theme-text">
        {data.nextUpcomingBooking.serviceTitle}
      </h4>

      <div className="mt-2">
        <p className="text-xs text-theme-muted">
          {new Date(
            data.nextUpcomingBooking.startTime
          ).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </p>

        <p className="mt-1 text-sm text-theme-text">
          {new Date(
            data.nextUpcomingBooking.startTime
          ).toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
          })}
        </p>
      </div>

      <div className="mt-3">
        <span
          className={`px-2 py-1 rounded-full text-xs ${
            data.nextUpcomingBooking.status ===
            "REQUESTED"
              ? "bg-theme-warning-tint text-theme-warning"
              : data.nextUpcomingBooking.status ===
                "CONFIRMED"
              ? "bg-theme-success-tint text-theme-success"
              : "bg-theme-surface-raised text-theme-muted"
          }`}
        >
          {data.nextUpcomingBooking.status}
        </span>
      </div>
    </div>
  )}
</SectionCard>

          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

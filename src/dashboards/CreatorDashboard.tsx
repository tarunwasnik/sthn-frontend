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
import type { ReactNode } from "react";

export default function CreatorDashboard() {
  const { data, loading, errorCode, errorMessage } =
    useCreatorDashboard();

  const navigate = useNavigate();

  return (
    <DashboardLayout>
      {loading && (
        <div className="p-6">
          <p className="text-gray-400">Loading your dashboard...</p>
        </div>
      )}

      {!loading && errorCode && (
        <div className="p-6">
          <h3 className="text-xl font-semibold mb-2">Error</h3>
          <p className="text-red-400">{errorMessage}</p>
        </div>
      )}

      {!loading && data && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* LEFT COLUMN */}
          <div className="lg:col-span-2 space-y-10">

            {/* HEADER */}
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold mb-2">
                  Welcome, {data.creatorProfile.displayName}
                </h1>
                <p className="text-gray-400">
                  Here's what's happening with your experiences today.
                </p>
              </div>

              {/* ✅ PROFILE BUTTON */}
              <button
                onClick={() => navigate("/creator/profile")}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
              >
                <User size={16} />
                Profile
              </button>
            </div>

            {/* METRICS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <MetricCard
                title="Total Bookings"
                value={data.stats.totalBookings}
                icon={<CalendarCheck size={20} />}
              />
              <MetricCard
                title="Pending Bookings"
                value={data.stats.pendingBookings}
                icon={<TrendingUp size={20} />}
              />
              <MetricCard
                title="Average Rating"
                value={`${data.creatorProfile.rating} ⭐`}
                icon={<Star size={20} />}
              />
            </div>

            {/* ACTIVITY */}
            <div className="bg-[#111827] border border-gray-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-6">
                Latest Activity
              </h2>

              {data.recentActivity.length === 0 ? (
                <p className="text-gray-500 text-sm">
                  No recent bookings yet.
                </p>
              ) : (
                <div className="space-y-4">
                  {data.recentActivity.map((activity) => (
                    <ActivityItem
                      key={activity.id}
                      status={activity.status}
                      earning={activity.earning}
                      createdAt={activity.createdAt}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-8">

            {/* QUICK ACTIONS */}
            <div className="bg-[#111827] border border-gray-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-6">
                Quick Actions
              </h2>

              <div className="grid grid-cols-2 gap-4">

                <QuickAction
                  icon={<Search size={18} />}
                  label="Browse Creators"
                  onClick={() =>
                    navigate("/dashboard/creator/browse")
                  }
                />

                <QuickAction
                  icon={<Calendar size={18} />}
                  label="Availability"
                  onClick={() =>
                    navigate("/dashboard/creator/availability")
                  }
                />

                <QuickAction
                  icon={<Clock size={18} />}
                  label="Requests"
                  onClick={() =>
                    navigate("/dashboard/creator/requests")
                  }
                />

                <QuickAction
                  icon={<Megaphone size={18} />}
                  label="Services"
                  onClick={() =>
                    navigate("/dashboard/creator/services")
                  }
                />
              </div>
            </div>

            {/* NEXT 24 HOURS */}
            <div className="bg-[#111827] border border-gray-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-6">
                Next 24 Hours
              </h2>
              <p className="text-gray-500 text-sm">
                No upcoming sessions.
              </p>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

/* ------------------------------------ */

function MetricCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string | number;
  icon: ReactNode;
}) {
  return (
    <div className="bg-[#111827] border border-gray-800 rounded-xl p-6 hover:border-blue-500 transition">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm text-gray-400">{title}</h3>
        <div className="text-blue-400">{icon}</div>
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}

/* ------------------------------------ */

function ActivityItem({
  status,
  earning,
  createdAt,
}: {
  status: string;
  earning: number;
  createdAt: string;
}) {
  return (
    <div className="flex justify-between items-center bg-[#0F172A] p-4 rounded-lg border border-gray-800">
      <div>
        <p className="text-sm font-medium">{status}</p>
        <p className="text-xs text-gray-400">
          {new Date(createdAt).toLocaleString()}
        </p>
      </div>

      {earning > 0 && (
        <div className="text-green-400 font-semibold">
          +${earning}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------ */

function QuickAction({
  icon,
  label,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="bg-[#0F172A] border border-gray-800 rounded-lg p-4 flex flex-col items-center justify-center hover:border-blue-500 transition cursor-pointer"
    >
      <div className="text-blue-400 mb-2">{icon}</div>
      <span className="text-sm">{label}</span>
    </div>
  );
}
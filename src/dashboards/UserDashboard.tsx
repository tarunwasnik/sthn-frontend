// frontend/src/dashboards/UserDashboard.ts

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import UserDashboardLayout from "../layouts/UserDashboardLayout";
import DashboardCard from "../components/common/DashboardCard";
import api from "../api/axios";

type User = {
  id: string;
  email: string;
  role: string;
  creatorStatus: "none" | "pending" | "approved" | "rejected";
};

type Profile = {
  profileStatus:
    | "pending_verification" 
    | "verified"
    | "rejected";

  username?: string;
};

export default function UserDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      try {
        /* ================= AUTH ================= */
        const userRes = await api.get("/auth/me");
        const userData = userRes.data;

        /* ================= PROFILE ================= */
        const profileRes = await api.get(`/v1/users/${userData.id}`);

        console.log("PROFILE DATA:", profileRes.data);

        setUser(userData);

        setProfile({
  profileStatus:
    profileRes.data.profile?.profileStatus,

  username:
    profileRes.data.profile?.username,
});

      } catch (err) {
        console.error("Dashboard load failed", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <UserDashboardLayout>
        <div className="text-gray-400 px-4">Loading...</div>
      </UserDashboardLayout>
    );
  }

  if (!user || !profile) {
    return (
      <UserDashboardLayout>
        <div className="text-red-400 px-4">Failed to load dashboard</div>
      </UserDashboardLayout>
    );
  }

  const role = user.role?.toUpperCase();
  const creatorStatus = user.creatorStatus?.toLowerCase();
  const profileStatus = profile.profileStatus?.toLowerCase();

  /* ================= LOGIC ================= */
  const isVerified = profileStatus === "verified";

  const showCreatorCard =
    role === "USER" && isVerified;

  return (
  <UserDashboardLayout>
    <div className="max-w-7xl mx-auto space-y-8 md:space-y-10">

      {/* HERO */}
      <DashboardCard className="p-6 md:p-7">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">

          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
              Welcome back{profile.username ? `, ${profile.username}` : ""}
            </h1>

            <p className="text-white/60 mt-3 max-w-2xl">
              Browse creators, discover experiences, and manage your bookings from one place.
            </p>

            <div className="flex flex-wrap gap-3 mt-5">

              <div
                className={`px-3 py-1.5 rounded-full text-sm border ${
                  profileStatus === "verified"
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : profileStatus === "pending_verification"
                    ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                    : "bg-red-500/10 text-red-400 border-red-500/20"
                }`}
              >
                {profileStatus === "verified"
                  ? "Verified"
                  : profileStatus === "pending_verification"
                  ? "Pending Verification"
                  : "Rejected"}
              </div>

              <div className="px-3 py-1.5 rounded-full text-sm border border-white/10 bg-white/5 text-white/70">
                Creator: {creatorStatus}
              </div>

            </div>
          </div>

          <div className="flex flex-wrap gap-3">

            <button
              onClick={() => navigate("/explore")}
              className="
                px-5
                py-3
                rounded-xl
                bg-emerald-400
                hover:bg-emerald-300
                transition
                text-black
                font-semibold
              "
            >
              Browse Creators
            </button>

            <button
              onClick={() => navigate("/profile")}
              className="
                px-5
                py-3
                rounded-xl
                bg-white/5
                border
                border-white/10
                hover:bg-white/10
                transition
                text-white
                font-medium
              "
            >
              My Profile
            </button>

          </div>

        </div>
      </DashboardCard>

      {/* CREATOR JOURNEY */}
      {showCreatorCard && (
        <DashboardCard className="p-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            Creator Journey
          </h2>

          {creatorStatus === "none" && (
            <>
              <p className="text-white/60">
                Start offering experiences and become a creator.
              </p>

              <button
                onClick={() =>
                  navigate("/creator-application")
                }
                className="
                  mt-5
                  px-5
                  py-2.5
                  rounded-xl
                  bg-emerald-400
                  hover:bg-emerald-300
                  transition
                  text-black
                  font-semibold
                "
              >
                Apply Now
              </button>
            </>
          )}

          {creatorStatus === "pending" && (
            <div className="text-yellow-400">
              Your creator application is under review.
            </div>
          )}

          {creatorStatus === "approved" && (
            <>
              <p className="text-emerald-400">
                Creator access approved.
              </p>

              <button
                onClick={() =>
                  navigate("/creator-dashboard")
                }
                className="
                  mt-5
                  px-5
                  py-2.5
                  rounded-xl
                  bg-white/5
                  border
                  border-white/10
                  hover:bg-white/10
                  transition
                "
              >
                Open Creator Dashboard
              </button>
            </>
          )}

          {creatorStatus === "rejected" && (
            <>
              <p className="text-red-400">
                Your creator application was rejected.
              </p>

              <button
                onClick={() =>
                  navigate("/creator-application")
                }
                className="
                  mt-5
                  px-5
                  py-2.5
                  rounded-xl
                  border
                  border-white/10
                  hover:bg-white/5
                  transition
                "
              >
                Apply Again
              </button>
            </>
          )}
        </DashboardCard>
      )}

      {/* UPCOMING BOOKINGS */}
      <DashboardCard className="p-6">
        <h2 className="text-xl font-semibold text-white mb-4">
          Upcoming Bookings
        </h2>

        <div className="text-center py-10">
          <p className="text-white/70">
            No upcoming bookings yet
          </p>

          <p className="text-white/50 text-sm mt-2">
            Browse creators and schedule your first experience.
          </p>

          <button
            onClick={() => navigate("/explore")}
            className="
              mt-5
              px-5
              py-2.5
              rounded-xl
              bg-emerald-400
              hover:bg-emerald-300
              transition
              text-black
              font-semibold
            "
          >
            Explore Creators
          </button>
        </div>
      </DashboardCard>

    </div>
  </UserDashboardLayout>
);
}
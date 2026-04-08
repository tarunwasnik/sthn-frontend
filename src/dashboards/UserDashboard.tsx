// frontend/src/dashboards/UserDashboard.ts

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import UserDashboardLayout from "../layouts/UserDashboardLayout";
import api from "../api/axios";

type User = {
  id: string;
  email: string;
  role: string;
  creatorStatus: "none" | "pending" | "approved" | "rejected";
};

type Profile = {
  profileStatus: "pending_verification" | "verified" | "rejected";
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

        /* ✅ CORRECT FIELD */
        setProfile({
          profileStatus: profileRes.data.profile?.profileStatus,
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
        <div className="text-gray-400">Loading...</div>
      </UserDashboardLayout>
    );
  }

  if (!user || !profile) {
    return (
      <UserDashboardLayout>
        <div className="text-red-400">Failed to load dashboard</div>
      </UserDashboardLayout>
    );
  }

  const role = user.role?.toUpperCase();
  const creatorStatus = user.creatorStatus?.toLowerCase();
  const profileStatus = profile.profileStatus?.toLowerCase();

  /* ================= LOGIC ================= */
  const isVerified = profileStatus === "verified";

  const showBecomeCreator =
    role === "USER" &&
    isVerified &&
    (creatorStatus === "none" || creatorStatus === "rejected");

  const showCreatorPending =
    role === "USER" &&
    creatorStatus === "pending";

  return (
    <UserDashboardLayout>
      <div className="space-y-8">

        {/* HEADER */}
        <div>
          <h1 className="text-3xl font-bold">
            Welcome back
          </h1>
          <p className="text-gray-400 mt-2">
            Browse creators, manage bookings, and explore experiences.
          </p>
        </div>

        {/* ================= ACCOUNT STATUS ================= */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h2 className="font-semibold text-lg mb-4">
            Account Status
          </h2>

          {!profileStatus && (
            <div className="px-4 py-3 bg-gray-500/10 text-gray-400 rounded-lg">
              Unable to determine status.
            </div>
          )}

          {profileStatus === "pending_verification" && (
            <div className="px-4 py-3 bg-yellow-500/10 text-yellow-400 rounded-lg">
              Your profile is under verification.
            </div>
          )}

          {profileStatus === "rejected" && (
            <div className="px-4 py-3 bg-red-500/10 text-red-400 rounded-lg">
              Your profile was rejected. Please update it.
            </div>
          )}

          {profileStatus === "verified" && (
            <div className="px-4 py-3 bg-green-500/10 text-green-400 rounded-lg">
              Your account is verified.
            </div>
          )}

          {showCreatorPending && (
            <div className="px-4 py-3 bg-yellow-500/10 text-yellow-400 rounded-lg mt-3">
              Creator application under review.
            </div>
          )}
        </div>

        {/* ================= GRID SECTION ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* PROFILE CARD */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col justify-between min-h-[160px]">
            <div>
              <h3 className="font-semibold text-lg mb-1">
                Your Profile
              </h3>
              <p className="text-gray-400 text-sm">
                View and manage your details.
              </p>
            </div>

            <button
              onClick={() => navigate("/profile")}
              className="mt-6 bg-gray-800 hover:bg-gray-700 transition rounded-lg py-2"
            >
              My Profile
            </button>
          </div>

          {/* CREATOR CARD */}
          {showBecomeCreator && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col justify-between min-h-[160px]">
              <div>
                <h3 className="font-semibold text-lg mb-1">
                  Become a Creator
                </h3>
                <p className="text-gray-400 text-sm">
                  Start offering experiences.
                </p>
              </div>

              <button
                onClick={() => navigate("/creator-application")}
                className="mt-6 bg-teal-400 text-black font-semibold py-2 rounded-lg hover:bg-teal-300 transition"
              >
                Apply Now
              </button>
            </div>
          )}

        </div>

        {/* ================= BOOKINGS ================= */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">

          <h3 className="text-lg font-semibold mb-2">
            No bookings yet
          </h3>

          <p className="text-gray-400 mb-4">
            Explore creators and book your first experience.
          </p>

          <button
            onClick={() => navigate("/explore")}
            className="bg-teal-400 text-black px-6 py-2 rounded-lg font-semibold hover:bg-teal-300 transition"
          >
            Explore Creators
          </button>

        </div>

      </div>
    </UserDashboardLayout>
  );
}
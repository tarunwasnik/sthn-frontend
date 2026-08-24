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
  profileStatus: "pending_verification" | "verified" | "rejected";

  username?: string;
  rejectionReason?: string;
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
        const profileRes = await api.get("/v1/profile/me");

        console.log("PROFILE DATA:", profileRes.data);

        setUser(userData);

        setProfile({
          profileStatus: profileRes.data.profileStatus,

          username: profileRes.data.username,
          rejectionReason: profileRes.data.rejectionReason,
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

  const showCreatorCta = role === "USER" && isVerified && (creatorStatus === "none" || creatorStatus === "rejected");

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
                Browse creators, discover experiences, and manage your bookings
                from one place.
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

        {/* PROFILE VERIFICATION */}
        {(profileStatus === "pending_verification" ||
          profileStatus === "rejected") && (
          <DashboardCard className="p-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              Profile Verification
            </h2>

            {profileStatus === "pending_verification" && (
              <div className="space-y-3">
                <p className="text-yellow-400 font-medium">
                  Your profile is currently under review.
                </p>

                <p className="text-white/60">
                  Our team is reviewing your profile. No action is required at
                  this time.
                </p>
              </div>
            )}

            {profileStatus === "rejected" && (
              <div className="space-y-5">
                <p className="text-red-400 font-medium">
                  Your profile verification was rejected.
                </p>

                {profile.rejectionReason && (
                  <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                    <p className="text-sm font-semibold text-red-300 mb-2">
                      Administrator Feedback
                    </p>

                    <p className="text-white/80 leading-relaxed">
                      {profile.rejectionReason}
                    </p>
                  </div>
                )}

                <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4">
                  <p className="text-yellow-300 font-semibold mb-2">
                    Next Steps
                  </p>

                  <p className="text-white/70 leading-relaxed">
                    Update your profile according to the administrator's
                    feedback. Once you save your changes, your profile will be
                    automatically resubmitted for verification.
                  </p>
                </div>

                <button
                  onClick={() => navigate("/profile")}
                  className="
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
                  Edit Profile
                </button>
              </div>
            )}
          </DashboardCard>
        )}

        {showCreatorCta && (
          <DashboardCard className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div><h2 className="text-xl font-semibold text-white">Become a Creator</h2><p className="mt-1 text-sm text-white/60">Manage your Creator application from Settings.</p></div>
              <button onClick={() => navigate("/dashboard/user/settings/creator")} className="rounded-xl bg-emerald-400 px-5 py-2.5 font-semibold text-black transition hover:bg-emerald-300">Become a Creator</button>
            </div>
          </DashboardCard>
        )}

        {/* UPCOMING BOOKINGS */}
        <DashboardCard className="p-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            Upcoming Bookings
          </h2>

          <div className="text-center py-10">
            <p className="text-white/70">No upcoming bookings yet</p>

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

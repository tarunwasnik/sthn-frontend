// frontend/src/dashboards/UserDashboard.ts

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import UserDashboardLayout from "../layouts/UserDashboardLayout";
import DashboardCard from "../components/common/DashboardCard";
import api from "../api/axios";
import { getUserBookingsAPI } from "../api/userBooking";

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

type UpcomingBooking = {
  _id: string;
  status: string;
  service?: { title?: string };
  creator?: { profile?: { displayName?: string } };
  slots?: Array<{ startTime: string }>;
};

export default function UserDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [upcomingBookings, setUpcomingBookings] = useState<UpcomingBooking[]>([]);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      try {
        /* ================= AUTH ================= */
        const [userRes, profileRes, bookingsRes] = await Promise.all([
          api.get("/auth/me"),
          api.get("/v1/profile/me"),
          getUserBookingsAPI(),
        ]);
        const userData = userRes.data;

        setUser(userData);

        setProfile({
          profileStatus: profileRes.data.profileStatus,

          username: profileRes.data.username,
          rejectionReason: profileRes.data.rejectionReason,
        });
        const now = Date.now();
        const eligible = (bookingsRes.bookings ?? [])
          .filter((booking: UpcomingBooking) => ["REQUESTED", "CONFIRMED"].includes(booking.status))
          .map((booking: UpcomingBooking) => ({ booking, startTime: booking.slots?.map((slot) => new Date(slot.startTime).getTime()).filter(Number.isFinite).sort((a, b) => a - b)[0] }))
          .filter(({ startTime }: { startTime: number | undefined }) => startTime !== undefined && startTime >= now)
          .sort((left: { startTime: number }, right: { startTime: number }) => left.startTime - right.startTime)
          .map(({ booking }: { booking: UpcomingBooking }) => booking);
        setUpcomingBookings(eligible);
        setBookingError(null);

      } catch (err) {
        console.error("Dashboard load failed", err);
        setBookingError("Upcoming bookings are unavailable right now.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <UserDashboardLayout>
        <div className="px-4 text-theme-muted">Loading...</div>
      </UserDashboardLayout>
    );
  }

  if (!user || !profile) {
    return (
      <UserDashboardLayout>
        <div className="px-4 text-theme-danger">Failed to load dashboard</div>
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
              <h1 className="text-3xl font-semibold tracking-tight text-theme-text md:text-4xl">
                Welcome back{profile.username ? `, ${profile.username}` : ""}
              </h1>

              <p className="mt-3 max-w-2xl text-theme-muted">
                Browse creators, discover experiences, and manage your bookings
                from one place.
              </p>

              <div className="flex flex-wrap gap-3 mt-5">
                <div
                  className={`px-3 py-1.5 rounded-full text-sm border ${
                    profileStatus === "verified"
                      ? "border-theme-success bg-theme-success-tint text-theme-success"
                      : profileStatus === "pending_verification"
                        ? "border-theme-warning bg-theme-warning-tint text-theme-warning"
                        : "border-theme-danger bg-theme-danger-tint text-theme-danger"
                  }`}
                >
                  {profileStatus === "verified"
                    ? "Verified"
                    : profileStatus === "pending_verification"
                      ? "Pending Verification"
                      : "Rejected"}
                </div>

                <div className="rounded-full border border-theme-border bg-theme-inset px-3 py-1.5 text-sm text-theme-text">
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
                rounded-[var(--radius-control)]
                bg-theme-primary
                hover:opacity-90
                transition-opacity
                text-theme-primary-text
                font-semibold
                focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent
              "
              >
                Browse Creators
              </button>

              <button
                onClick={() => navigate("/profile")}
                className="
                px-5
                py-3
                rounded-[var(--radius-control)]
                bg-theme-surface
                border
                border-theme-border
                hover:bg-theme-inset
                transition-colors
                text-theme-text
                font-medium
                focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent
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
            <h2 className="mb-4 text-xl font-semibold text-theme-text">
              Profile Verification
            </h2>

            {profileStatus === "pending_verification" && (
              <div className="space-y-3">
                <p className="font-medium text-theme-warning">
                  Your profile is currently under review.
                </p>

                <p className="text-theme-muted">
                  Our team is reviewing your profile. No action is required at
                  this time.
                </p>
              </div>
            )}

            {profileStatus === "rejected" && (
              <div className="space-y-5">
                <p className="font-medium text-theme-danger">
                  Your profile verification was rejected.
                </p>

                {profile.rejectionReason && (
                  <div className="rounded-[var(--radius-card)] border border-theme-danger bg-theme-danger-tint p-4">
                    <p className="mb-2 text-sm font-semibold text-theme-danger">
                      Administrator Feedback
                    </p>

                    <p className="leading-relaxed text-theme-text">
                      {profile.rejectionReason}
                    </p>
                  </div>
                )}

                <div className="rounded-[var(--radius-card)] border border-theme-warning bg-theme-warning-tint p-4">
                  <p className="mb-2 font-semibold text-theme-warning">
                    Next Steps
                  </p>

                  <p className="leading-relaxed text-theme-text">
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
            rounded-[var(--radius-control)]
            bg-theme-primary
            hover:opacity-90
            transition-opacity
            text-theme-primary-text
            font-semibold
            focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent
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
              <div><h2 className="text-xl font-semibold text-theme-text">Become a Creator</h2><p className="mt-1 text-sm text-theme-muted">Manage your Creator application from Settings.</p></div>
              <button onClick={() => navigate("/dashboard/user/settings/creator")} className="rounded-[var(--radius-control)] bg-theme-primary px-5 py-2.5 font-semibold text-theme-primary-text transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent">Become a Creator</button>
            </div>
          </DashboardCard>
        )}

        {/* UPCOMING BOOKINGS */}
        <DashboardCard className="p-6">
          <h2 className="mb-4 text-xl font-semibold text-theme-text">
            Upcoming Bookings
          </h2>

          {bookingError ? <div className="rounded-[var(--radius-card)] border border-theme-danger bg-theme-danger-tint p-4 text-sm text-theme-danger">{bookingError}</div> : upcomingBookings.length > 0 ? <div className="space-y-3">
            {upcomingBookings.map((booking) => {
              const startTime = booking.slots?.map((slot) => new Date(slot.startTime)).sort((a, b) => a.getTime() - b.getTime())[0];
              return <button key={booking._id} type="button" onClick={() => navigate(`/dashboard/user/bookings/${booking._id}`)} className="w-full rounded-[var(--radius-card)] border border-theme-border bg-theme-inset p-4 text-left transition-colors hover:bg-theme-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent">
                <div className="flex items-center justify-between gap-4"><div><p className="font-semibold text-theme-text">{booking.service?.title ?? "Booking"}</p><p className="mt-1 text-sm text-theme-muted">{booking.creator?.profile?.displayName ?? "Creator"}{startTime ? ` · ${startTime.toLocaleString()}` : ""}</p></div><span className={`rounded-full px-3 py-1 text-xs font-semibold ${booking.status === "CONFIRMED" ? "bg-theme-success-tint text-theme-success" : "bg-theme-warning-tint text-theme-warning"}`}>{booking.status}</span></div>
              </button>;
            })}
          </div> : <div className="text-center py-10">
            <p className="text-theme-text">No upcoming bookings yet</p>

            <p className="mt-2 text-sm text-theme-muted">
              Browse creators and schedule your first experience.
            </p>

            <button
              onClick={() => navigate("/explore")}
              className="
              mt-5
              px-5
              py-2.5
              rounded-[var(--radius-control)]
              bg-theme-primary
              hover:opacity-90
              transition-opacity
              text-theme-primary-text
              font-semibold
              focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent
            "
            >
              Explore Creators
            </button>
          </div>}
        </DashboardCard>
      </div>
    </UserDashboardLayout>
  );
}

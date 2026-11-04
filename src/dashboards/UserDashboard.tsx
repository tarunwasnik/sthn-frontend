import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../api/axios";
import { getUserBookingsAPI } from "../api/userBooking";
import DashboardCard from "../components/common/DashboardCard";
import UserDashboardLayout from "../layouts/UserDashboardLayout";

type User = { id: string; email: string; role: string; creatorStatus: "none" | "pending" | "approved" | "rejected" };
type Profile = { profileStatus: "pending_verification" | "verified" | "rejected"; username?: string; rejectionReason?: string };
type BookingStatus = "REQUESTED" | "CONFIRMED" | "REJECTED" | "CANCELLED" | "EXPIRED" | "COMPLETED";
type Booking = { _id: string; status: BookingStatus; createdAt?: string; service?: { title?: string }; creator?: { profile?: { displayName?: string } }; slots?: Array<{ startTime: string }> };
type BookingSummary = Record<BookingStatus, number>;

const bookingStatuses: BookingStatus[] = ["REQUESTED", "CONFIRMED", "COMPLETED", "CANCELLED", "REJECTED", "EXPIRED"];
const emptySummary = (): BookingSummary => ({ REQUESTED: 0, CONFIRMED: 0, COMPLETED: 0, CANCELLED: 0, REJECTED: 0, EXPIRED: 0 });
const firstSlotTime = (booking: Booking): number | null => {
  const times = (booking.slots ?? []).map((slot) => new Date(slot.startTime).getTime()).filter(Number.isFinite);
  return times.length ? Math.min(...times) : null;
};
const formatStatus = (status: BookingStatus) => status.charAt(0) + status.slice(1).toLowerCase();
const statusClass = (status: BookingStatus) => {
  switch (status) {
    case "CONFIRMED": return "bg-theme-success-tint text-theme-success";
    case "REQUESTED": return "bg-theme-warning-tint text-theme-warning";
    case "COMPLETED": return "bg-theme-info-tint text-theme-info";
    case "REJECTED": return "bg-theme-danger-tint text-theme-danger";
    case "CANCELLED": return "bg-theme-warning-tint text-theme-warning";
    default: return "bg-theme-inset text-theme-muted";
  }
};

function BookingRow({ booking, onOpen }: { booking: Booking; onOpen: () => void }) {
  const slotTime = firstSlotTime(booking);
  const timestamp = slotTime ?? (booking.createdAt ? new Date(booking.createdAt).getTime() : null);
  return <button type="button" onClick={onOpen} className="w-full rounded-[var(--radius-card)] border border-theme-border bg-theme-inset p-4 text-left transition-colors hover:bg-theme-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent"><div className="flex items-start justify-between gap-4"><div className="min-w-0"><p className="truncate font-semibold text-theme-text">{booking.service?.title ?? "Booking"}</p><p className="mt-1 text-sm text-theme-muted">{booking.creator?.profile?.displayName ?? "Creator"}{timestamp ? ` · ${new Date(timestamp).toLocaleString()}` : ""}</p></div><span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${statusClass(booking.status)}`}>{formatStatus(booking.status)}</span></div></button>;
}

export default function UserDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const loadData = useCallback(async () => {
    setLoading(true); setBookingError(null);
    try {
      const [userRes, profileRes, bookingsRes] = await Promise.all([api.get("/auth/me"), api.get("/v1/profile/me"), getUserBookingsAPI()]);
      setUser(userRes.data);
      setProfile({ profileStatus: profileRes.data.profileStatus, username: profileRes.data.username, rejectionReason: profileRes.data.rejectionReason });
      setBookings(Array.isArray(bookingsRes.bookings) ? bookingsRes.bookings : []);
    } catch (error) {
      console.error("Dashboard load failed", error);
      setUser(null); setProfile(null); setBookings([]);
      setBookingError("Your dashboard is unavailable right now. Please try again.");
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { void loadData(); }, [loadData]);

  if (loading) return <UserDashboardLayout><div className="px-4 text-theme-muted">Loading your dashboard…</div></UserDashboardLayout>;
  if (!user || !profile) return <UserDashboardLayout><div className="rounded-[var(--radius-card)] border border-theme-danger bg-theme-danger-tint p-5 text-theme-danger"><p>{bookingError ?? "Failed to load dashboard."}</p><button type="button" onClick={() => void loadData()} className="mt-3 rounded font-semibold underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent">Retry</button></div></UserDashboardLayout>;

  const now = Date.now();
  const summary = bookings.reduce<BookingSummary>((counts, booking) => { if (bookingStatuses.includes(booking.status)) counts[booking.status] += 1; return counts; }, emptySummary());
  const upcomingBookings = bookings.filter((booking) => ["REQUESTED", "CONFIRMED"].includes(booking.status)).map((booking) => ({ booking, startTime: firstSlotTime(booking) })).filter((item): item is { booking: Booking; startTime: number } => item.startTime !== null && item.startTime >= now).sort((left, right) => left.startTime - right.startTime).map(({ booking }) => booking);
  const upcomingConfirmed = upcomingBookings.filter((booking) => booking.status === "CONFIRMED").length;
  const recentBookings = [...bookings].sort((left, right) => (new Date(right.createdAt ?? 0).getTime() || 0) - (new Date(left.createdAt ?? 0).getTime() || 0)).slice(0, 4);
  const role = user.role?.toUpperCase();
  const creatorStatus = user.creatorStatus?.toLowerCase();
  const profileStatus = profile.profileStatus?.toLowerCase();
  const showCreatorCta = role === "USER" && profileStatus === "verified" && (creatorStatus === "none" || creatorStatus === "rejected");

  return <UserDashboardLayout><div className="mx-auto max-w-7xl space-y-8 md:space-y-10">
    <DashboardCard className="p-6 md:p-7"><div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between"><div><h1 className="text-3xl font-semibold tracking-tight text-theme-text md:text-4xl">Welcome back{profile.username ? `, ${profile.username}` : ""}</h1><p className="mt-3 max-w-2xl text-theme-muted">Browse creators, discover experiences, and manage your bookings from one place.</p><div className="mt-5 flex flex-wrap gap-3"><div className={`rounded-full border px-3 py-1.5 text-sm ${profileStatus === "verified" ? "border-theme-success bg-theme-success-tint text-theme-success" : profileStatus === "pending_verification" ? "border-theme-warning bg-theme-warning-tint text-theme-warning" : "border-theme-danger bg-theme-danger-tint text-theme-danger"}`}>{profileStatus === "verified" ? "Verified" : profileStatus === "pending_verification" ? "Pending Verification" : "Rejected"}</div><div className="rounded-full border border-theme-border bg-theme-inset px-3 py-1.5 text-sm text-theme-text">Creator: {creatorStatus}</div></div></div><div className="flex flex-wrap gap-3"><button type="button" onClick={() => navigate("/explore")} className="rounded-[var(--radius-control)] bg-theme-primary px-5 py-3 font-semibold text-theme-primary-text transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent">Browse Creators</button><button type="button" onClick={() => navigate("/profile")} className="rounded-[var(--radius-control)] border border-theme-border bg-theme-surface px-5 py-3 font-medium text-theme-text transition-colors hover:border-theme-border-strong hover:bg-theme-inset focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent">My Profile</button></div></div></DashboardCard>

    {bookingError && <div role="alert" className="rounded-[var(--radius-card)] border border-theme-danger bg-theme-danger-tint p-4 text-sm text-theme-danger">{bookingError}<button type="button" onClick={() => void loadData()} className="ml-3 rounded font-semibold underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent">Retry</button></div>}
    <section aria-labelledby="booking-overview-heading"><div className="mb-4 flex flex-wrap items-end justify-between gap-2"><div><h2 id="booking-overview-heading" className="text-xl font-semibold text-theme-text">Booking overview</h2><p className="mt-1 text-sm text-theme-muted">All of your current booking records.</p></div><button type="button" onClick={() => navigate("/dashboard/user/bookings")} className="text-sm font-semibold text-theme-accent underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent">View all bookings</button></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{[["Awaiting Creator", summary.REQUESTED, "Requests awaiting a Creator decision"], ["Upcoming confirmed", upcomingConfirmed, "Confirmed bookings with a future scheduled slot"], ["Completed", summary.COMPLETED, "Completed booking records"], ["Closed", summary.CANCELLED + summary.REJECTED + summary.EXPIRED, "Cancelled, rejected, or expired records"]].map(([label, value, description]) => <DashboardCard key={String(label)} className="p-4"><p className="text-sm text-theme-muted">{label}</p><p className="mt-2 text-3xl font-semibold text-theme-text">{value}</p><p className="mt-1 text-xs text-theme-muted">{description}</p></DashboardCard>)}</div></section>

    {(profileStatus === "pending_verification" || profileStatus === "rejected" || summary.REQUESTED > 0 || showCreatorCta) && <DashboardCard className="p-6"><h2 className="text-xl font-semibold text-theme-text">Pending items</h2><div className="mt-4 space-y-3">{profileStatus === "pending_verification" && <p className="rounded-[var(--radius-control)] border border-theme-warning bg-theme-warning-tint p-4 text-sm text-theme-warning">Your profile is under review. No action is required right now.</p>}{profileStatus === "rejected" && <div className="rounded-[var(--radius-control)] border border-theme-danger bg-theme-danger-tint p-4"><p className="text-sm font-semibold text-theme-danger">Your profile verification was rejected.</p>{profile.rejectionReason && <p className="mt-1 text-sm text-theme-text">{profile.rejectionReason}</p>}<button type="button" onClick={() => navigate("/profile")} className="mt-3 rounded-[var(--radius-control)] bg-theme-primary px-4 py-2 text-sm font-semibold text-theme-primary-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent">Edit Profile</button></div>}{summary.REQUESTED > 0 && <p className="rounded-[var(--radius-control)] border border-theme-warning bg-theme-warning-tint p-4 text-sm text-theme-warning">{summary.REQUESTED} booking {summary.REQUESTED === 1 ? "request is" : "requests are"} awaiting a Creator decision. You do not need to take action right now.</p>}{showCreatorCta && <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-control)] border border-theme-border bg-theme-inset p-4"><div><p className="font-semibold text-theme-text">Become a Creator</p><p className="mt-1 text-sm text-theme-muted">Your verified profile can use the existing Creator application flow.</p></div><button type="button" onClick={() => navigate("/dashboard/user/settings/creator")} className="rounded-[var(--radius-control)] bg-theme-primary px-4 py-2 text-sm font-semibold text-theme-primary-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent">Manage application</button></div>}</div></DashboardCard>}

    <DashboardCard className="p-6"><div className="flex items-center justify-between gap-4"><h2 className="text-xl font-semibold text-theme-text">Upcoming bookings</h2><span className="text-sm text-theme-muted">{upcomingBookings.length} scheduled</span></div>{upcomingBookings.length > 0 ? <div className="mt-4 space-y-3">{upcomingBookings.map((booking) => <BookingRow key={booking._id} booking={booking} onOpen={() => navigate(`/dashboard/user/bookings/${booking._id}`)} />)}</div> : <div className="py-10 text-center"><p className="text-theme-text">No upcoming bookings yet</p><p className="mt-2 text-sm text-theme-muted">Browse creators and schedule your first experience.</p><button type="button" onClick={() => navigate("/explore")} className="mt-5 rounded-[var(--radius-control)] bg-theme-primary px-5 py-2.5 font-semibold text-theme-primary-text transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent">Explore Creators</button></div>}</DashboardCard>
    <DashboardCard className="p-6"><div className="flex items-center justify-between gap-4"><h2 className="text-xl font-semibold text-theme-text">Recent bookings</h2><button type="button" onClick={() => navigate("/dashboard/user/bookings")} className="text-sm font-semibold text-theme-accent underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent">View all</button></div>{recentBookings.length > 0 ? <div className="mt-4 space-y-3">{recentBookings.map((booking) => <BookingRow key={booking._id} booking={booking} onOpen={() => navigate(`/dashboard/user/bookings/${booking._id}`)} />)}</div> : <div className="py-10 text-center text-sm text-theme-muted">Your recently created booking records will appear here.</div>}</DashboardCard>
  </div></UserDashboardLayout>;
}

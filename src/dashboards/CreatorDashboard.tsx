import { ArrowRight, Briefcase, Calendar, CalendarCheck, Clock, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

import ActionButton from "../components/common/ActionButton";
import EmptyState from "../components/common/EmptyState";
import SectionCard from "../components/common/SectionCard";
import SkeletonCard from "../components/common/SkeletonCard";
import StatCard from "../components/common/StatCard";
import { type CreatorBooking, useCreatorDashboard } from "../hooks/useCreatorDashboard";
import DashboardLayout from "../layouts/DashboardLayout";

const firstSlot = (booking: CreatorBooking) => {
  const slots = (booking.slots ?? [])
    .map((slot) => ({ ...slot, start: new Date(slot.startTime).getTime(), end: new Date(slot.endTime).getTime() }))
    .filter((slot) => Number.isFinite(slot.start) && Number.isFinite(slot.end))
    .sort((left, right) => left.start - right.start);
  return slots[0] ?? null;
};

const statusClass = (status: CreatorBooking["status"]) => {
  if (status === "CONFIRMED") return "bg-theme-success-tint text-theme-success";
  if (status === "REQUESTED") return "bg-theme-warning-tint text-theme-warning";
  if (status === "COMPLETED") return "bg-theme-info-tint text-theme-info";
  if (status === "REJECTED") return "bg-theme-danger-tint text-theme-danger";
  return "bg-theme-inset text-theme-muted";
};

function BookingRow({ booking, onOpen }: { booking: CreatorBooking; onOpen: () => void }) {
  const slot = firstSlot(booking);
  return <button type="button" onClick={onOpen} className="w-full rounded-[var(--radius-card)] border border-theme-border bg-theme-inset p-4 text-left transition-colors hover:bg-theme-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent"><div className="flex items-start justify-between gap-4"><div className="min-w-0"><p className="truncate font-semibold text-theme-text">{booking.service?.title ?? "Booking"}</p><p className="mt-1 text-sm text-theme-muted">{booking.user?.displayName ?? "Customer"}{slot ? ` · ${new Date(slot.start).toLocaleString()}` : ""}</p></div><span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${statusClass(booking.status)}`}>{booking.status.charAt(0) + booking.status.slice(1).toLowerCase()}</span></div></button>;
}

export default function CreatorDashboard() {
  const { data, loading, errorMessage, reload } = useCreatorDashboard();
  const navigate = useNavigate();

  if (loading) return <DashboardLayout><div className="space-y-4 px-4 py-6 pb-20 sm:px-6 lg:px-8"><SkeletonCard className="h-24" /><SkeletonCard className="h-40" /></div></DashboardLayout>;
  if (!data) return <DashboardLayout><div className="mx-auto max-w-2xl px-4 py-6 pb-20 sm:px-6 lg:px-8"><SectionCard title="Creator dashboard unavailable"><p className="text-sm text-theme-danger">{errorMessage ?? "Unable to load the Creator dashboard."}</p><button type="button" onClick={() => void reload()} className="mt-4 rounded-[var(--radius-control)] bg-theme-primary px-4 py-2 text-sm font-semibold text-theme-primary-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent">Retry</button></SectionCard></div></DashboardLayout>;

  const now = Date.now();
  const upcomingBookings = data.bookings
    .filter((booking) => booking.status === "CONFIRMED")
    .map((booking) => ({ booking, slot: firstSlot(booking) }))
    .filter((item): item is { booking: CreatorBooking; slot: NonNullable<ReturnType<typeof firstSlot>> } => item.slot !== null && item.slot.start >= now)
    .sort((left, right) => left.slot.start - right.slot.start)
    .map(({ booking }) => booking);
  const activeBookings = data.bookings.filter((booking) => booking.status === "CONFIRMED" && (booking.slots ?? []).some((slot) => {
    const start = new Date(slot.startTime).getTime();
    const end = new Date(slot.endTime).getTime();
    return Number.isFinite(start) && Number.isFinite(end) && start <= now && now < end;
  }));

  return <DashboardLayout><div className="mx-auto max-w-7xl px-4 py-6 pb-20 sm:px-6 lg:px-8">
    <div className="mb-8 flex flex-col gap-4"><div className="flex items-start justify-between gap-4"><div className="max-w-xl"><h1 className="text-2xl font-semibold text-theme-text sm:text-3xl">Welcome, {data.creatorProfile.displayName}</h1><p className="mt-1 text-sm text-theme-muted">Manage your services, booking requests, and scheduled experiences.</p><span className="mt-3 inline-flex rounded-full border border-theme-success bg-theme-success-tint px-3 py-1 text-xs font-semibold text-theme-success">Profile {data.creatorProfile.status}</span></div><button type="button" onClick={() => navigate("/creator/profile")} className="flex items-center gap-2 rounded-[var(--radius-control)] border border-theme-border bg-theme-surface px-4 py-2 text-sm font-medium text-theme-text transition-colors hover:border-theme-border-strong hover:bg-theme-inset focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent"><User size={16} />Profile</button></div></div>

    <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4"><StatCard label="Active services" value={data.activeServiceCount} icon={<Briefcase size={18} />} /><StatCard label="Booking requests" value={data.pendingRequestCount} icon={<Clock size={18} />} /><StatCard label="Upcoming confirmed" value={upcomingBookings.length} icon={<CalendarCheck size={18} />} /><StatCard label="In progress" value={activeBookings.length} icon={<Calendar size={18} />} /></div>

    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3"><div className="space-y-6 lg:col-span-2">
      <SectionCard title="Upcoming bookings">{upcomingBookings.length ? <div className="space-y-3">{upcomingBookings.slice(0, 4).map((booking) => <BookingRow key={booking._id} booking={booking} onOpen={() => navigate(`/dashboard/creator/bookings/${booking._id}`)} />)}<button type="button" onClick={() => navigate("/dashboard/creator/bookings")} className="inline-flex items-center gap-1 text-sm font-semibold text-theme-accent hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent">View all bookings <ArrowRight size={15} /></button></div> : <EmptyState text="No upcoming confirmed bookings" />}</SectionCard>
      <SectionCard title="Latest activity">{data.recentActivity.length ? <div className="space-y-3">{data.recentActivity.map((activity) => <div key={activity.id} className="rounded-[var(--radius-card)] border border-theme-border bg-theme-inset p-4"><div className="flex items-center justify-between gap-4"><p className="text-sm font-medium text-theme-text">{activity.status.charAt(0) + activity.status.slice(1).toLowerCase()} booking</p><time className="text-xs text-theme-muted">{new Date(activity.createdAt).toLocaleString()}</time></div><p className="mt-1 text-xs text-theme-muted">Payment status: {activity.paymentStatus}</p></div>)}</div> : <EmptyState text="No recent booking activity" />}</SectionCard>
    </div><div className="space-y-6">
      <SectionCard title="Action items"><div className="space-y-3">{data.pendingRequestCount > 0 ? <button type="button" onClick={() => navigate("/dashboard/creator/requests")} className="w-full rounded-[var(--radius-control)] border border-theme-warning bg-theme-warning-tint p-4 text-left text-theme-warning transition-opacity hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent"><span className="block text-sm font-semibold">{data.pendingRequestCount} booking {data.pendingRequestCount === 1 ? "request" : "requests"} need a decision</span><span className="mt-1 block text-xs">Accept or reject each request before it expires.</span></button> : <p className="rounded-[var(--radius-control)] border border-theme-border bg-theme-inset p-4 text-sm text-theme-muted">No booking requests need a decision.</p>}<button type="button" onClick={() => navigate("/dashboard/creator/availability")} className="w-full rounded-[var(--radius-control)] border border-theme-border bg-theme-surface p-4 text-left text-theme-text transition-colors hover:bg-theme-inset focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent"><span className="block text-sm font-semibold">Manage availability</span><span className="mt-1 block text-xs text-theme-muted">Add and adjust the bookable slots for your services.</span></button></div></SectionCard>
      <SectionCard title="Quick actions"><div className="grid grid-cols-2 gap-3"><ActionButton icon={<Briefcase size={18} />} label="Services" onClick={() => navigate("/dashboard/creator/services")} /><ActionButton icon={<Calendar size={18} />} label="Availability" onClick={() => navigate("/dashboard/creator/availability")} /><ActionButton icon={<Clock size={18} />} label="Requests" onClick={() => navigate("/dashboard/creator/requests")} /><ActionButton icon={<CalendarCheck size={18} />} label="Bookings" onClick={() => navigate("/dashboard/creator/bookings")} /></div><button type="button" onClick={() => navigate("/dashboard/creator/earnings")} className="mt-3 w-full rounded-[var(--radius-control)] border border-theme-border bg-theme-surface px-4 py-2 text-sm font-medium text-theme-text transition-colors hover:bg-theme-inset focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent">View entitlements</button></SectionCard>
    </div></div>
  </div></DashboardLayout>;
}

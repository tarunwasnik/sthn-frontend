import { useEffect, useState } from "react";
import { Bell, CheckCheck, LoaderCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useNotifications } from "../hooks/useNotifications";
import { useAuth } from "../hooks/useAuth";
import UserDashboardLayout from "../layouts/UserDashboardLayout";
import DashboardLayout from "../layouts/DashboardLayout";
import AdminLayout from "../components/admin/layout/AdminLayout";

const safePath = (value: string | undefined): value is string => Boolean(value && value.startsWith("/") && !value.startsWith("//") && !value.includes("\\") && ![...value].some((character) => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127));
const timestamp = (value: string) => new Date(value).toLocaleString();

function NotificationHistory() {
  const navigate = useNavigate();
  const { notifications, unreadCount, loading, loadingMore, error, hasMore, loadHistory, loadMore, markOneRead, markAllRead } = useNotifications();
  const [mutation, setMutation] = useState<string | null>(null);
  useEffect(() => { void loadHistory(); }, [loadHistory]);
  const open = async (notification: NotificationRecord) => {
    if (mutation) return;
    if (!notification.readAt) { setMutation(notification.id); await markOneRead(notification.id); setMutation(null); }
    if (safePath(notification.navigationPath)) navigate(notification.navigationPath);
  };
  const readAll = async () => { if (mutation) return; setMutation("all"); await markAllRead(); setMutation(null); };
  return (
    <section className="mx-auto max-w-3xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-theme-text">Notifications</h1>
          <p className="mt-1 text-sm text-theme-muted">{unreadCount ? `${unreadCount} unread` : "You're all caught up."}</p>
        </div>
        <button type="button" disabled={!unreadCount || !!mutation} onClick={() => void readAll()} className="inline-flex items-center gap-2 rounded-[var(--radius-control)] border border-theme-border bg-theme-surface px-3 py-2 text-sm font-medium text-theme-text transition-colors hover:border-theme-border-strong hover:bg-theme-inset disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent">
          <CheckCheck size={16} />Mark all read
        </button>
      </div>
      {error && <div role="alert" className="rounded-[var(--radius-control)] border border-theme-danger bg-theme-danger-tint p-3 text-sm text-theme-danger">{error} <button type="button" className="underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent" onClick={() => void loadHistory()}>Retry</button></div>}
      {loading ? <div className="flex justify-center py-16 text-theme-muted"><LoaderCircle className="animate-spin" /></div> : notifications.length === 0 ? <div className="rounded-[var(--radius-card)] border border-dashed border-theme-border bg-theme-inset py-16 text-center text-theme-muted"><Bell className="mx-auto mb-3" />No notifications yet.</div> : <div className="space-y-2">{notifications.map((notification) => <button type="button" disabled={!!mutation} key={notification.id} onClick={() => void open(notification)} aria-label={`${notification.readAt ? "Read" : "Unread"} notification: ${notification.title}`} className={`w-full rounded-[var(--radius-card)] border p-4 text-left transition-colors disabled:cursor-wait disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent ${notification.readAt ? "border-theme-border bg-theme-surface hover:bg-theme-inset" : "border-theme-accent bg-theme-accent-tint hover:border-theme-border-strong"}`}><div className="flex items-start justify-between gap-4"><div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-wide text-theme-accent">{notification.category.replaceAll("_", " ")}</p><h2 className="mt-1 font-medium text-theme-text">{notification.title}</h2><p className="mt-1 text-sm text-theme-muted">{notification.body}</p></div><time className="shrink-0 text-xs text-theme-muted">{timestamp(notification.createdAt)}</time></div><span className="sr-only">{notification.readAt ? "Read" : "Unread"}</span></button>)}</div>}
      {hasMore && <button type="button" disabled={loadingMore || !!mutation} onClick={() => void loadMore()} className="w-full rounded-[var(--radius-control)] border border-theme-border bg-theme-surface px-4 py-2 text-sm font-medium text-theme-text transition-colors hover:border-theme-border-strong hover:bg-theme-inset disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent">{loadingMore ? "Loading…" : "Load more"}</button>}
      {!hasMore && notifications.length > 0 && <p className="text-center text-xs text-theme-muted">End of notification history</p>}
    </section>
  );
}

export default function NotificationsPage() {
  const { role } = useAuth();
  if (role === "admin") return <AdminLayout workspace="operations"><NotificationHistory /></AdminLayout>;
  if (role === "creator") return <DashboardLayout><NotificationHistory /></DashboardLayout>;
  return <UserDashboardLayout><NotificationHistory /></UserDashboardLayout>;
}

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";

import { getNotificationUnreadCount, getNotifications, markAllNotificationsRead, markNotificationRead, type NotificationRecord } from "../api/notifications";
import { socket } from "../lib/socket";
import { useAuth } from "../hooks/useAuth";
import { NotificationContext } from "./notification.context";

const isDate = (value: unknown): value is string => typeof value === "string" && !Number.isNaN(new Date(value).getTime());
const isNotification = (value: unknown): value is NotificationRecord => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const item = value as Record<string, unknown>;
  return typeof item.id === "string" && Boolean(item.id) && typeof item.category === "string" && typeof item.type === "string" &&
    typeof item.title === "string" && item.title.length <= 160 && typeof item.body === "string" && item.body.length <= 2000 &&
    (item.readAt === null || isDate(item.readAt)) && isDate(item.createdAt) && isDate(item.expiresAt) && new Date(item.expiresAt).getTime() > Date.now();
};

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { userId } = useAuth();
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const sessionRevision = useRef(0);
  const historyLoadedRef = useRef(false);
  const connectedOnce = useRef(false);

  const refreshUnreadCount = useCallback(async () => {
    if (!userId) return;
    const revision = sessionRevision.current;
    try {
      const count = await getNotificationUnreadCount();
      if (revision === sessionRevision.current) setUnreadCount(Math.max(0, count));
    } catch {
      if (revision === sessionRevision.current) setError("Unable to refresh notification count.");
    }
  }, [userId]);

  const loadHistory = useCallback(async () => {
    if (!userId) return;
    const revision = sessionRevision.current;
    setLoading(true); setError(null);
    try {
      const result = await getNotifications();
      if (revision !== sessionRevision.current) return;
      setNotifications(result.notifications); setNextCursor(result.nextCursor); historyLoadedRef.current = true;
    } catch {
      if (revision === sessionRevision.current) setError("Unable to load notifications.");
    } finally {
      if (revision === sessionRevision.current) setLoading(false);
    }
  }, [userId]);

  const loadMore = useCallback(async () => {
    if (!userId || !nextCursor || loadingMore) return;
    const revision = sessionRevision.current;
    setLoadingMore(true); setError(null);
    try {
      const result = await getNotifications(nextCursor);
      if (revision !== sessionRevision.current) return;
      setNotifications((current) => [...current, ...result.notifications.filter((item) => !current.some((existing) => existing.id === item.id))]);
      setNextCursor(result.nextCursor);
    } catch {
      if (revision === sessionRevision.current) setError("Unable to load more notifications.");
    } finally {
      if (revision === sessionRevision.current) setLoadingMore(false);
    }
  }, [loadingMore, nextCursor, userId]);

  const markOneRead = useCallback(async (notificationId: string) => {
    if (!userId) return null;
    try {
      const updated = await markNotificationRead(notificationId);
      setNotifications((current) => current.map((item) => item.id === updated.id ? updated : item));
      void refreshUnreadCount();
      return updated;
    } catch {
      setError("Unable to mark notification as read.");
      return null;
    }
  }, [refreshUnreadCount, userId]);

  const markAllRead = useCallback(async () => {
    if (!userId) return false;
    try {
      const result = await markAllNotificationsRead();
      const readAt = new Date().toISOString();
      setNotifications((current) => current.map((item) => item.readAt ? item : { ...item, readAt }));
      setUnreadCount(Math.max(0, result.unreadCount));
      return true;
    } catch {
      setError("Unable to mark all notifications as read.");
      return false;
    }
  }, [userId]);

  useEffect(() => {
    sessionRevision.current += 1; historyLoadedRef.current = false; connectedOnce.current = socket.connected;
    setNotifications([]); setUnreadCount(0); setNextCursor(null); setError(null); setLoading(false); setLoadingMore(false);
    if (!userId) return;
    void refreshUnreadCount();

    const handleCreated = (event: unknown) => {
      if (!isNotification(event)) return;
      if (historyLoadedRef.current) setNotifications((current) => current.some((item) => item.id === event.id) ? current : [event, ...current]);
      void refreshUnreadCount();
    };
    const handleConnect = () => {
      const reconnect = connectedOnce.current;
      connectedOnce.current = true;
      if (!reconnect) return;
      void refreshUnreadCount();
      if (historyLoadedRef.current) void loadHistory();
    };
    socket.on("notification:created", handleCreated);
    socket.on("connect", handleConnect);
    return () => { socket.off("notification:created", handleCreated); socket.off("connect", handleConnect); };
  }, [loadHistory, refreshUnreadCount, userId]);

  const value = useMemo(() => ({ notifications, unreadCount, loading, loadingMore, error, hasMore: nextCursor !== null, loadHistory, loadMore, refreshUnreadCount, markOneRead, markAllRead }), [error, loadHistory, loadMore, loading, loadingMore, markAllRead, markOneRead, nextCursor, notifications, refreshUnreadCount, unreadCount]);
  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

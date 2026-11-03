import { createContext } from "react";
import type { NotificationRecord } from "../api/notifications";

export interface NotificationContextValue {
  notifications: NotificationRecord[];
  unreadCount: number;
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  loadHistory: () => Promise<void>;
  loadMore: () => Promise<void>;
  refreshUnreadCount: () => Promise<void>;
  markOneRead: (notificationId: string) => Promise<NotificationRecord | null>;
  markAllRead: () => Promise<boolean>;
}

export const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

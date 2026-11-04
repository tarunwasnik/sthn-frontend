import api from "./axios";

export interface NotificationRecord {
  id: string;
  category: string;
  type: string;
  title: string;
  body: string;
  navigationPath?: string;
  metadata?: { entityType?: string; entityId?: string; reference?: string };
  readAt: string | null;
  createdAt: string;
  expiresAt: string;
}

export interface NotificationHistoryResponse {
  notifications: NotificationRecord[];
  nextCursor: string | null;
  hasMore: boolean;
}

export const getNotifications = async (cursor?: string): Promise<NotificationHistoryResponse> => {
  const response = await api.get<NotificationHistoryResponse>("/v1/notifications", { params: { limit: 20, ...(cursor ? { cursor } : {}) } });
  return response.data;
};

export const getNotificationUnreadCount = async (): Promise<number> => (await api.get<{ unreadCount: number }>("/v1/notifications/unread-count")).data.unreadCount;
export const markNotificationRead = async (notificationId: string): Promise<NotificationRecord> => (await api.patch<{ notification: NotificationRecord }>(`/v1/notifications/${encodeURIComponent(notificationId)}/read`)).data.notification;
export const markAllNotificationsRead = async (): Promise<{ modifiedCount: number; unreadCount: number }> => (await api.patch<{ modifiedCount: number; unreadCount: number }>("/v1/notifications/read-all")).data;

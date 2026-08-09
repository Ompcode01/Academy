import api from "./auth.service";

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  metadata: Record<string, any> | null;
  roleTarget: string | null;
  createdAt: string;
}

export interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export const getNotifications = async (
  limit: number = 20,
  unreadOnly: boolean = false,
  page: number = 1
) => {
  try {
    const response = await api.get("/notifications", {
      params: { limit, unreadOnly, page },
    });
    return response.data;
  } catch (err) {
    console.error("Failed to fetch notifications:", err);
    return {
      success: true,
      data: [],
      pagination: { total: 0, page: 1, limit, hasMore: false },
    };
  }
};

export const getUnreadCount = async (): Promise<{ success: boolean; data: { count: number } }> => {
  try {
    const response = await api.get("/notifications/unread-count");
    return response.data;
  } catch (err) {
    console.error("Failed to fetch unread notification count:", err);
    return { success: true, data: { count: 0 } };
  }
};

export const markNotificationAsRead = async (id: string) => {
  const response = await api.patch(`/notifications/${id}/read`);
  return response.data;
};

export const markAllNotificationsAsRead = async () => {
  const response = await api.patch("/notifications/read-all");
  return response.data;
};

export const deleteNotification = async (id: string) => {
  const response = await api.delete(`/notifications/${id}`);
  return response.data;
};

import api from "./auth.service";

export interface Notification {
  id: string;
  userId: string;
  actorId?: string | null;
  type: string;
  category?: string;
  priority?: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  title: string;
  message: string;
  link: string | null;
  entityType?: string | null;
  entityId?: string | null;
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
  page: number = 1,
  category: string = "ALL"
) => {
  try {
    const params: any = { limit, unreadOnly, page };
    if (category && category !== "ALL") {
      params.category = category;
    }
    const response = await api.get("/notifications", { params });
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

export const createAnnouncement = async (data: {
  title: string;
  message: string;
  targetRole?: string;
  courseId?: string;
  departmentId?: string;
  priority?: string;
}) => {
  const response = await api.post("/notifications/announcements", data);
  return response.data;
};

export const createEscalation = async (data: {
  title: string;
  message: string;
  courseId?: string;
  accusedTeacherId?: string;
  priority?: string;
}) => {
  const response = await api.post("/notifications/escalate", data);
  return response.data;
};

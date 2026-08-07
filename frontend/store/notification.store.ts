import { create } from "zustand";
import {
  getNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  type Notification,
} from "@/services/api/notification.service";

type FilterMode = "all" | "unread";

interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;
  isOpen: boolean;
  isLoading: boolean;
  filter: FilterMode;

  // Actions
  togglePanel: () => void;
  closePanel: () => void;
  setFilter: (filter: FilterMode) => void;
  fetchNotifications: (limit?: number) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isOpen: false,
  isLoading: false,
  filter: "all",

  togglePanel: () => {
    const wasOpen = get().isOpen;
    set({ isOpen: !wasOpen });
    // Fetch fresh data when opening
    if (!wasOpen) {
      get().fetchNotifications();
    }
  },

  closePanel: () => set({ isOpen: false }),

  setFilter: (filter: FilterMode) => {
    set({ filter });
    get().fetchNotifications();
  },

  fetchNotifications: async (limit = 30) => {
    try {
      set({ isLoading: true });
      const unreadOnly = get().filter === "unread";
      const res = await getNotifications(limit, unreadOnly);
      if (res?.success) {
        set({ notifications: res.data || [] });
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchUnreadCount: async () => {
    try {
      const res = await getUnreadCount();
      if (res?.success) {
        set({ unreadCount: res.data.count });
      }
    } catch (err) {
      console.error("Failed to fetch unread count:", err);
    }
  },

  markRead: async (id: string) => {
    try {
      await markNotificationAsRead(id);
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, isRead: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  },

  markAllRead: async () => {
    try {
      await markAllNotificationsAsRead();
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
        unreadCount: 0,
      }));
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  },

  remove: async (id: string) => {
    try {
      await deleteNotification(id);
      set((state) => {
        const removed = state.notifications.find((n) => n.id === id);
        return {
          notifications: state.notifications.filter((n) => n.id !== id),
          unreadCount:
            removed && !removed.isRead
              ? Math.max(0, state.unreadCount - 1)
              : state.unreadCount,
        };
      });
    } catch (err) {
      console.error("Failed to delete notification:", err);
    }
  },
}));

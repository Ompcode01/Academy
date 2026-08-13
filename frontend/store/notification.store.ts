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

/**
 * Web Audio API Notification Chime / Ringtone Generator
 * Plays a pleasant crystal-clear 3-note chime (E5 -> B5 -> E6)
 */
export function playNotificationChime() {
  if (typeof window === "undefined") return;

  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    if (ctx.state === "suspended") {
      ctx.resume();
    }

    const now = ctx.currentTime;
    const notes = [659.25, 987.77, 1318.51]; // E5, B5, E6 frequencies

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      // Attack & decay envelope
      gain.gain.setValueAtTime(0, now + idx * 0.08);
      gain.gain.linearRampToValueAtTime(0.25, now + idx * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.35);
    });
  } catch (err) {
    console.debug("Notification chime audio playback skipped:", err);
  }
}

interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;
  isOpen: boolean;
  isLoading: boolean;
  filter: FilterMode;
  categoryFilter: string;
  soundEnabled: boolean;

  // Actions
  togglePanel: () => void;
  closePanel: () => void;
  setFilter: (filter: FilterMode) => void;
  setCategoryFilter: (category: string) => void;
  toggleSound: () => void;
  playSoundPreview: () => void;
  fetchNotifications: (limit?: number) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  unreadCount: -1, // Initialized to -1 so first fetch doesn't trigger chime on page load
  isOpen: false,
  isLoading: false,
  filter: "all",
  categoryFilter: "ALL",
  soundEnabled: true,

  togglePanel: () => {
    const wasOpen = get().isOpen;
    set({ isOpen: !wasOpen });
    if (!wasOpen) {
      get().fetchNotifications();
    }
  },

  closePanel: () => set({ isOpen: false }),

  setFilter: (filter: FilterMode) => {
    set({ filter });
    get().fetchNotifications();
  },

  setCategoryFilter: (categoryFilter: string) => {
    set({ categoryFilter });
    get().fetchNotifications();
  },

  toggleSound: () => {
    const newSoundState = !get().soundEnabled;
    set({ soundEnabled: newSoundState });
    if (newSoundState) {
      playNotificationChime();
    }
  },

  playSoundPreview: () => {
    playNotificationChime();
  },

  fetchNotifications: async (limit = 30) => {
    try {
      set({ isLoading: true });
      const unreadOnly = get().filter === "unread";
      const category = get().categoryFilter;
      const res = await getNotifications(limit, unreadOnly, 1, category);
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
      if (res?.success && res.data) {
        const newCount = res.data.count || 0;
        const prevCount = get().unreadCount;

        // If unread count increased while browsing, ring the notification chime!
        if (prevCount >= 0 && newCount > prevCount && get().soundEnabled) {
          playNotificationChime();
        }

        set({ unreadCount: newCount });
      }
    } catch {
      // Ignore background notification polling errors silently
    }
  },

  markRead: async (id: string) => {
    try {
      await markNotificationAsRead(id);
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  },

  markAllRead: async () => {
    try {
      await markAllNotificationsAsRead();
      set(() => ({
        notifications: [],
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

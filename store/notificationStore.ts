import { create } from "zustand";
import { API_URL } from "@/lib/constants";
import type { Notification } from "@/types";

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;

  fetchNotifications: () => Promise<void>;
  markAllRead: () => Promise<void>;
  markRead: (id: string) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  fetchNotifications: async () => {
    set({ isLoading: true });
    try {
      const res = await fetch(`${API_URL}/api/notifications`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      console.log("notifications response:", JSON.stringify(data));

      const notifications: Notification[] = data.notifications ?? [];

      set({
        notifications,
        unreadCount: notifications.filter(
          (notification) => !notification.isRead,
        ).length,
        isLoading: false,
      });
    } catch (err) {
      console.error("fetchNotifications failed:", err);
      set({ isLoading: false, notifications: [], unreadCount: 0 });
    }
  },

  markAllRead: async () => {
    await fetch(`${API_URL}/api/notifications/read`, { method: "POST" }).catch(
      () => undefined,
    );
    set((state) => ({
      notifications: state.notifications.map((notification) => ({
        ...notification,
        isRead: true,
      })),
      unreadCount: 0,
    }));
  },

  markRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((notification) =>
        notification.id === id
          ? { ...notification, isRead: true }
          : notification,
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    })),
}));

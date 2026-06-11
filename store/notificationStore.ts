import { create } from 'zustand';
import { API_URL } from '@/lib/constants';
import type { Notification } from '@/types';

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
    const res = await fetch(`${API_URL}/api/notifications`);
    const data = await res.json();
    set({
      notifications: data.notifications,
      unreadCount: data.notifications.filter(
        (notification: Notification) => !notification.isRead,
      ).length,
      isLoading: false,
    });
  },

  markAllRead: async () => {
    await fetch(`${API_URL}/api/notifications/read`, { method: 'POST' });
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
        notification.id === id ? { ...notification, isRead: true } : notification,
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    })),
}));

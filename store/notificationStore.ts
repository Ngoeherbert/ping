import { create } from 'zustand';

type NotificationState = {
  isLoading: boolean;
  setLoading: (isLoading: boolean) => void;
};

export const useNotificationStore = create<NotificationState>((set) => ({
  isLoading: false,
  setLoading: (isLoading) => set({ isLoading }),
}));

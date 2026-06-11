import { create } from 'zustand';

type MessagingState = {
  isLoading: boolean;
  setLoading: (isLoading: boolean) => void;
};

export const useMessagingStore = create<MessagingState>((set) => ({
  isLoading: false,
  setLoading: (isLoading) => set({ isLoading }),
}));

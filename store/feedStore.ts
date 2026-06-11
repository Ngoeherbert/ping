import { create } from 'zustand';

type FeedState = {
  isLoading: boolean;
  setLoading: (isLoading: boolean) => void;
};

export const useFeedStore = create<FeedState>((set) => ({
  isLoading: false,
  setLoading: (isLoading) => set({ isLoading }),
}));

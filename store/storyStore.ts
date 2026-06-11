import { create } from 'zustand';

type StoryState = {
  isLoading: boolean;
  setLoading: (isLoading: boolean) => void;
};

export const useStoryStore = create<StoryState>((set) => ({
  isLoading: false,
  setLoading: (isLoading) => set({ isLoading }),
}));

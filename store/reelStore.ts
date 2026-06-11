import { create } from 'zustand';

type ReelState = {
  isLoading: boolean;
  setLoading: (isLoading: boolean) => void;
};

export const useReelStore = create<ReelState>((set) => ({
  isLoading: false,
  setLoading: (isLoading) => set({ isLoading }),
}));

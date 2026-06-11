import { create } from 'zustand';

type ProfileState = {
  isLoading: boolean;
  setLoading: (isLoading: boolean) => void;
};

export const useProfileStore = create<ProfileState>((set) => ({
  isLoading: false,
  setLoading: (isLoading) => set({ isLoading }),
}));

import { create } from 'zustand';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  image?: string | null;
};

type AuthState = {
  user: AuthUser | null;
  isInitializing: boolean;
  isAuthenticated: boolean;
  initialize: () => Promise<void>;
  setUser: (user: AuthUser | null) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isInitializing: false,
  isAuthenticated: false,
  initialize: async () => {
    set({ isInitializing: true });

    // TODO: hydrate the Better Auth session from secure storage.
    set({ isInitializing: false });
  },
  setUser: (user) => set({ user, isAuthenticated: Boolean(user) }),
}));

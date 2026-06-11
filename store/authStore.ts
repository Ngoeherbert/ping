import { create } from 'zustand';
import { authClient } from '@/lib/authClient';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;

  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterPayload) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

interface RegisterPayload {
  name: string;
  username: string;
  email: string;
  password: string;
}

type SessionResult = {
  user?: unknown;
  data?: {
    user?: unknown;
  } | null;
};

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function getSessionUser(session: unknown) {
  const result = session as SessionResult | null;

  return result?.user ?? result?.data?.user ?? null;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,

  initialize: async () => {
    try {
      set({ isLoading: true });
      const session = await authClient.getSession();
      const user = getSessionUser(session);
      if (user) {
        set({ user: user as User, isAuthenticated: true });
      }
    } catch {
      set({ user: null, isAuthenticated: false });
    } finally {
      set({ isLoading: false });
    }
  },

  login: async (email, password) => {
    try {
      set({ isLoading: true, error: null });
      const result = await authClient.signIn.email({ email, password });
      if (result.error) throw new Error(result.error.message);
      set({ user: result.data?.user as User, isAuthenticated: true });
    } catch (error) {
      set({ error: getErrorMessage(error, 'Login failed') });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  register: async ({ name, username, email, password }) => {
    try {
      set({ isLoading: true, error: null });
      const result = await authClient.signUp.email({
        name,
        email,
        password,
        fetchOptions: {
          body: { username },
        },
      });
      if (result.error) throw new Error(result.error.message);
      set({ user: result.data?.user as User, isAuthenticated: true });
    } catch (error) {
      set({ error: getErrorMessage(error, 'Registration failed') });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  loginWithGoogle: async () => {
    try {
      set({ isLoading: true, error: null });
      const { signInWithGoogle } = await import('@/lib/googleAuth');
      await signInWithGoogle();
      const session = await authClient.getSession();
      const user = getSessionUser(session);
      if (user) {
        set({ user: user as User, isAuthenticated: true });
      }
    } catch (error) {
      set({ error: getErrorMessage(error, 'Google sign-in failed') });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    await authClient.signOut();
    set({ user: null, isAuthenticated: false });
  },

  clearError: () => set({ error: null }),
}));

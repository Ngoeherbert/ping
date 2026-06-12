import { create } from 'zustand';
import { authClient } from '@/lib/authClient';
import { apiFetch } from '@/lib/apiFetch';
import { API_URL } from '@/lib/constants';
import { signInWithGoogle } from '@/lib/googleAuth';
import { clearSessionToken, getSessionToken, saveSessionToken } from '@/lib/session';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  needsProfileSetup: boolean;

  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterPayload) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  setUser: (user: User) => void;
}

interface RegisterPayload {
  name: string;
  username: string;
  email: string;
  password: string;
}

type SessionResult = {
  user?: unknown;
  token?: string | null;
  data?: {
    user?: unknown;
    token?: string | null;
  } | null;
};

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function getSessionUser(session: unknown) {
  const result = session as SessionResult | null;

  return result?.user ?? result?.data?.user ?? null;
}

function getSessionTokenFromResult(session: unknown) {
  const result = session as SessionResult | null;

  return result?.token ?? result?.data?.token ?? null;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,
  needsProfileSetup: false,

  initialize: async () => {
    try {
      set({ isLoading: true });
      const session = await authClient.getSession();
      const user = getSessionUser(session);
      if (user) {
        await saveSessionToken(getSessionTokenFromResult(session));
        set({ user: user as User, isAuthenticated: true, needsProfileSetup: false });
      } else if (await getSessionToken()) {
        const res = await apiFetch(`${API_URL}/api/users/me`);
        if (!res.ok) throw new Error('Stored session expired');
        const profile = await res.json();
        set({ user: profile as User, isAuthenticated: true, needsProfileSetup: false });
      } else {
        set({ user: null, isAuthenticated: false, needsProfileSetup: false });
      }
    } catch {
      await clearSessionToken();
      set({ user: null, isAuthenticated: false, needsProfileSetup: false });
    } finally {
      set({ isLoading: false });
    }
  },

  login: async (email, password) => {
    try {
      set({ isLoading: true, error: null });
      const result = await authClient.signIn.email({ email, password });
      if (result.error) throw new Error(result.error.message);
      await saveSessionToken(getSessionTokenFromResult(result));
      set({ user: result.data?.user as unknown as User, isAuthenticated: true, needsProfileSetup: false });
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
      await saveSessionToken(getSessionTokenFromResult(result));
      set({ user: result.data?.user as unknown as User, isAuthenticated: true, needsProfileSetup: true });
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
      const socialResult = await signInWithGoogle();
      await saveSessionToken(getSessionTokenFromResult(socialResult));
      const session = await authClient.getSession();
      const user = getSessionUser(session);
      if (user) {
        await saveSessionToken(getSessionTokenFromResult(session));
        set({ user: user as User, isAuthenticated: true, needsProfileSetup: true });
      } else {
        set({ user: null, isAuthenticated: false, needsProfileSetup: false });
        throw new Error('Google sign-in did not create a session.');
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
    await clearSessionToken();
    set({ user: null, isAuthenticated: false, needsProfileSetup: false });
  },

  clearError: () => set({ error: null }),
  setUser: (user) => set({ user, isAuthenticated: true, needsProfileSetup: false }),
}));

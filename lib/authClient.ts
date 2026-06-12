import { createAuthClient } from 'better-auth/react';
import * as SecureStore from 'expo-secure-store';
import { API_URL } from './constants';

const expoSecureStorePlugin = {
  id: 'expo-secure-store',
  getItem: async (key: string) => SecureStore.getItemAsync(key),
  setItem: async (key: string, value: string) =>
    SecureStore.setItemAsync(key, value),
  deleteItem: async (key: string) => SecureStore.deleteItemAsync(key),
};

export const authClient = createAuthClient({
  baseURL: `${API_URL}/api/auth`,
  storage: expoSecureStorePlugin,
});

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  getSession,
  resetPassword,
} = authClient;

type ForgetPasswordPayload = { email: string; redirectTo?: string };

type PasswordResetClient = {
  forgetPassword?: (payload: ForgetPasswordPayload) => Promise<unknown>;
  requestPasswordReset?: (payload: ForgetPasswordPayload) => Promise<unknown>;
};

export const forgetPassword = (payload: ForgetPasswordPayload) => {
  const client = authClient as PasswordResetClient;

  return client.forgetPassword
    ? client.forgetPassword(payload)
    : client.requestPasswordReset?.(payload);
};

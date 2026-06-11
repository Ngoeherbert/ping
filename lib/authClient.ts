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
  forgetPassword,
  resetPassword,
} = authClient;

import { createAuthClient } from 'better-auth/react';
import { expoClient } from '@better-auth/expo/client';
import * as SecureStore from 'expo-secure-store';
import { API_URL } from '@/lib/constants';

export const authClient = createAuthClient({
  baseURL: API_URL,
  plugins: [
    expoClient({
      scheme: 'ping',
      storagePrefix: 'ping',
      storage: SecureStore,
    }),
  ],
});

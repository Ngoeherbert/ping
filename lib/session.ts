import * as SecureStore from 'expo-secure-store';

const SESSION_TOKEN_KEY = 'ping.session-token';

export async function saveSessionToken(token?: string | null) {
  if (!token) return;
  await SecureStore.setItemAsync(SESSION_TOKEN_KEY, token);
}

export async function getSessionToken() {
  return SecureStore.getItemAsync(SESSION_TOKEN_KEY);
}

export async function clearSessionToken() {
  await SecureStore.deleteItemAsync(SESSION_TOKEN_KEY);
}

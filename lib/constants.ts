import Constants from 'expo-constants';

export const API_URL =
  Constants.expoConfig?.extra?.apiUrl ??
  process.env.EXPO_PUBLIC_API_URL ??
  'http://localhost:8081';

export const GOOGLE_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ?? '';

export const BRAND_COLORS = {
  primary: '#FF6B35',
  background: '#FFFFFF',
  surface: '#F8F8F8',
  text: '#1A1A1A',
  mutedText: '#666666',
} as const;

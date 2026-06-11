import Constants from 'expo-constants';

export const API_URL =
  Constants.expoConfig?.extra?.apiUrl ??
  process.env.EXPO_PUBLIC_API_URL ??
  'http://localhost:8081';

export const GOOGLE_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ?? '';

export const COLORS = {
  primary: '#FF6B35',
  background: '#FFFFFF',
  surface: '#F8F8F8',
  text: '#1A1A1A',
  textSecondary: '#666666',
  border: '#E5E5E5',
  muted: '#999999',
  error: '#E53E3E',
  errorBackground: '#FFF0EC',
} as const;

export const BRAND_COLORS = {
  primary: COLORS.primary,
  background: COLORS.background,
  surface: COLORS.surface,
  text: COLORS.text,
  mutedText: COLORS.textSecondary,
} as const;

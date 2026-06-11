import Constants from 'expo-constants';

export const API_URL =
  Constants.expoConfig?.extra?.apiUrl ??
  process.env.EXPO_PUBLIC_API_URL ??
  'http://localhost:8081';

export const GOOGLE_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ?? '';

export const COLORS = {
  primary: '#FF6B35',
  primaryLight: '#FFF0EC',
  primaryDark: '#E85A24',

  background: '#FFFFFF',
  backgroundSecondary: '#F8F8F8',
  surface: '#FAFAFA',

  text: '#1A1A1A',
  textSecondary: '#666666',
  textTertiary: '#999999',
  textDisabled: '#BBBBBB',

  border: '#E5E5E5',
  borderLight: '#F0F0F0',

  error: '#E53E3E',
  errorLight: '#FFF5F5',
  success: '#38A169',
  warning: '#D69E2E',

  black: '#000000',
  white: '#FFFFFF',

  // Backwards-compatible aliases used by existing screens/components.
  muted: '#999999',
  errorBackground: '#FFF0EC',
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const BORDER_RADIUS = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  pill: 999,
  circle: 9999,
} as const;

export const FONT_SIZE = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const FONT_WEIGHT = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
} as const;

export const SHADOW = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
} as const;

export const BRAND_COLORS = {
  primary: COLORS.primary,
  background: COLORS.background,
  surface: COLORS.backgroundSecondary,
  text: COLORS.text,
  mutedText: COLORS.textSecondary,
} as const;

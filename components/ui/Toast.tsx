import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { COLORS, FONT_SIZE, FONT_WEIGHT, SHADOW, SPACING } from '@/lib/constants';

type ToastType = 'success' | 'error' | 'info';
type ToastPayload = { title: string; message?: string; type?: ToastType; duration?: number };

type ToastContextValue = { showToast: (payload: ToastPayload) => void };

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastPayload | null>(null);

  const showToast = useCallback((payload: ToastPayload) => {
    setToast({ type: 'info', duration: 3000, ...payload });
    setTimeout(() => setToast(null), payload.duration ?? 3000);
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? <ToastBanner toast={toast} /> : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside ToastProvider');
  return context;
}

function ToastBanner({ toast }: { toast: ToastPayload }) {
  const color = toast.type === 'error' ? COLORS.error : toast.type === 'success' ? COLORS.success : COLORS.primary;

  return (
    <Animated.View style={[styles.banner, { borderLeftColor: color }]}> 
      <Text style={styles.title}>{toast.title}</Text>
      {toast.message ? <Text style={styles.message}>{toast.message}</Text> : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 58,
    left: SPACING.lg,
    right: SPACING.lg,
    zIndex: 1000,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderLeftWidth: 4,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    ...SHADOW.md,
  },
  title: { color: COLORS.text, fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.bold },
  message: { color: COLORS.textSecondary, fontSize: FONT_SIZE.sm, marginTop: 3, lineHeight: 18 },
});

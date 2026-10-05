import { useCallback, useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet, ActivityIndicator, useWindowDimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  useReducedMotion,
} from "react-native-reanimated";
import Backdrop from "./Backdrop";
import { useOverlayTheme } from "./overlayTheme";
import { FADE_DURATION, MENU_SPRING } from "./animations";
import { useBackHandler } from "./useBackHandler";
import { haptic } from "../../utils/haptics";

const DIALOG_MAX_WIDTH = 320;

/**
 * Centred confirm card with dimmed backdrop, scale+fade animation.
 *
 * Works declaratively (`visible`, `onConfirm`, `onCancel`) and through
 * `useConfirm()`, which returns a promise resolving to true/false.
 */
export default function ConfirmDialog({
  visible = false,
  onConfirm,
  onCancel,
  title = "",
  message = "",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  loading = false,
  enableBackdropDismiss = true,
  dismissable = true,
  testID,
}) {
  const theme = useOverlayTheme();
  const { colors, spacing, radius, fontSize } = theme;
  const { width: screenWidth } = useWindowDimensions();
  const reducedMotion = useReducedMotion();
  const [mounted, setMounted] = useState(visible);
  const progress = useSharedValue(0);

  const cancel = useCallback(() => {
    if (!dismissable) return;
    haptic.light();
    onCancel?.();
  }, [dismissable, onCancel]);

  const confirm = useCallback(() => {
    if (loading) return;
    haptic.medium();
    onConfirm?.();
  }, [loading, onConfirm]);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      const t = setTimeout(() => {
        progress.value = withTiming(1, { duration: FADE_DURATION });
      }, 20);
      return () => clearTimeout(t);
    }
    if (mounted) {
      progress.value = withTiming(0, { duration: 140 });
      const t = setTimeout(() => setMounted(false), 150);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [visible, mounted, progress]);

  useBackHandler(mounted && visible, () => {
    cancel();
    return true;
  });

  const cardStyle = useAnimatedStyle(() => {
    if (reducedMotion) return { opacity: progress.value };
    return {
      opacity: progress.value,
      transform: [{ scale: 0.9 + progress.value * 0.1 }],
    };
  });

  if (!mounted) return null;

  const confirmColor = destructive ? colors.destructive : colors.primary;

  return (
    <View style={styles.root} accessibilityViewIsModal testID={testID}>
      <Backdrop progress={progress} maxOpacity={0.4} onPress={enableBackdropDismiss ? cancel : null} />
      <View style={styles.center} pointerEvents="box-none">
        <Animated.View
          style={[
            {
              width: Math.min(DIALOG_MAX_WIDTH, screenWidth - spacing.xl * 2),
              backgroundColor: colors.elevated,
              borderRadius: radius.xl,
              padding: spacing.xl,
              shadowColor: "#000",
              shadowOpacity: 0.2,
              shadowRadius: 20,
              shadowOffset: { width: 0, height: 10 },
              elevation: 10,
            },
            cardStyle,
          ]}
          accessibilityRole="alert"
        >
          {title ? (
            <Text style={{ fontSize: fontSize.lg, fontWeight: "700", color: colors.text, textAlign: "center" }}>
              {title}
            </Text>
          ) : null}
          {message ? (
            <Text style={{ fontSize: fontSize.md, color: colors.textMuted, textAlign: "center", marginTop: 8 }}>
              {message}
            </Text>
          ) : null}
          <View style={{ flexDirection: "row", marginTop: spacing.lg }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={cancelLabel}
              onPress={cancel}
              style={({ pressed }) => ({
                flex: 1,
                minHeight: 48,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: radius.md,
                backgroundColor: colors.surface,
                marginEnd: spacing.sm,
                opacity: pressed ? 0.6 : 1,
              })}
            >
              <Text style={{ fontSize: fontSize.md, fontWeight: "600", color: colors.text }}>
                {cancelLabel}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={confirmLabel}
              accessibilityState={{ busy: loading, disabled: loading }}
              disabled={loading}
              onPress={confirm}
              style={({ pressed }) => ({
                flex: 1,
                minHeight: 48,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: radius.md,
                backgroundColor: confirmColor,
                opacity: pressed || loading ? 0.7 : 1,
              })}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={{ fontSize: fontSize.md, fontWeight: "700", color: "#FFFFFF" }}>
                  {confirmLabel}
                </Text>
              )}
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { ...StyleSheet.absoluteFillObject, zIndex: 1003 },
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
});

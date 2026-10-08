import { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CopyIcon, ReplyIcon, ForwardIcon, TrashIcon } from "./Icons";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

export const REACTION_EMOJIS = [
  "🔥",
  "🙌🏻",
  "😭",
  "🙈",
  "🙏🏻",
  "😖",
  "👍🏻",
  "❤️",
  "😂",
  "😮",
];

const OPEN_MS = 240;
const CLOSE_MS = 180;
const SLIDE = 60; // px the card travels while opening/closing

// Floating card shown on long press: message preview, reaction row, actions.
// `message` is the long-pressed message (or null to hide the sheet).
export default function MessageActionSheet({
  message,
  preview,
  colors,
  onClose,
  onReact,
  onCopy,
  onReply,
  onForward,
  onDelete,
}) {
  const insets = useSafeAreaInsets();
  const progress = useSharedValue(0); // 0 = hidden, 1 = fully shown
  const [mounted, setMounted] = useState(!!message);
  // Keep the last message around so the content doesn't blank out while closing
  const [shown, setShown] = useState({ message, preview });

  useEffect(() => {
    if (message) {
      setShown({ message, preview });
      setMounted(true);
      progress.value = withTiming(1, {
        duration: OPEN_MS,
        easing: Easing.out(Easing.cubic),
      });
    } else {
      progress.value = withTiming(
        0,
        { duration: CLOSE_MS, easing: Easing.in(Easing.quad) },
        (finished) => {
          if (finished) runOnJS(setMounted)(false);
        },
      );
    }
  }, [message]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: progress.value }));
  const cardStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * SLIDE }],
  }));

  // Close first, then run the action
  const run = (fn) => () => {
    onClose();
    fn?.(shown.message);
  };

  const rows = [
    { key: "copy", label: "Copy", Icon: CopyIcon, onPress: onCopy },
    { key: "reply", label: "Reply", Icon: ReplyIcon, onPress: onReply },
    {
      key: "forward",
      label: "Forward",
      Icon: ForwardIcon,
      onPress: onForward,
    },
    {
      key: "delete",
      label: "Delete",
      Icon: TrashIcon,
      onPress: onDelete,
      danger: true,
    },
  ];

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View
        style={[styles.root, { paddingBottom: Math.max(insets.bottom, 12) }]}
      >
        {/* Tap anywhere outside the card to close */}
        <Animated.View
          style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}
        >
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close message options"
          />
        </Animated.View>

        <Animated.View
          style={[styles.sheet, { backgroundColor: colors.surface }, cardStyle]}
        >
          <View
            style={[
              styles.handle,
              { backgroundColor: colors.border ?? "#DADADA" },
            ]}
          />

          {/* Message preview */}
          <View
            style={[styles.preview, { backgroundColor: colors.background }]}
          >
            <Text
              style={[styles.previewText, { color: colors.text }]}
              numberOfLines={3}
            >
              {shown.preview}
            </Text>
          </View>

          {/* Reactions */}
          <Text style={[styles.sectionLabel, { color: colors.text }]}>
            React
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.emojiRow}
          >
            {REACTION_EMOJIS.map((emoji) => (
              <Pressable
                key={emoji}
                onPress={run((m) => onReact?.(m, emoji))}
                accessibilityRole="button"
                accessibilityLabel={`React with ${emoji}`}
                style={({ pressed }) => [
                  styles.emojiBtn,
                  pressed && { transform: [{ scale: 1.2 }] },
                ]}
              >
                <Text style={styles.emoji}>{emoji}</Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Actions */}
          <View>
            {rows.map((row, i) => {
              const color = row.danger ? "#E5484D" : colors.text;
              const Icon = row.Icon;
              if (__DEV__ && !Icon) {
                console.warn(
                  `Icons.jsx has no export for the "${row.label}" icon - fix the import at the top of this file`,
                );
              }
              return (
                <Pressable
                  key={row.key}
                  onPress={run(row.onPress)}
                  accessibilityRole="button"
                  accessibilityLabel={row.label}
                  style={({ pressed }) => [
                    styles.row,
                    i > 0 && {
                      borderTopWidth: StyleSheet.hairlineWidth,
                      borderTopColor: colors.border ?? "#E6E6E6",
                    },
                    pressed && { opacity: 0.55 },
                  ]}
                >
                  <Text style={[styles.rowLabel, { color }]}>{row.label}</Text>
                  {Icon ? <Icon color={color} size={20} /> : null}
                </Pressable>
              );
            })}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: "flex-end", alignItems: "center" },
  backdrop: { backgroundColor: "rgba(0,0,0,0.45)" },
  // floating card: never full width, capped on tablets
  sheet: {
    width: "92%",
    maxWidth: 420,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  handle: {
    alignSelf: "center",
    width: 32,
    height: 4,
    borderRadius: 2,
    marginBottom: 14,
  },
  preview: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  previewText: { fontSize: 16, lineHeight: 22 },
  sectionLabel: {
    fontSize: 15,
    fontWeight: "600",
    marginTop: 20,
    marginBottom: 8,
  },
  emojiRow: { gap: 6, paddingRight: 8, alignItems: "center" },
  emojiBtn: { paddingHorizontal: 6, paddingVertical: 6 },
  emoji: { fontSize: 30 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 15,
  },
  rowLabel: { fontSize: 15, fontWeight: "500" },
});

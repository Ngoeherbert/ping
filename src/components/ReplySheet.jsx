import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useReanimatedKeyboardAnimation } from "react-native-keyboard-controller";
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
  useAnimatedStyle,
} from "react-native-reanimated";
import Icon from "./icons";

const SHEET_RADIUS = 28;
export const REACTIONS = ["🔥", "🙌🏻", "😭", "🙈", "🙏🏻", "😡", "✌🏻"];

// Shared bottom sheet: quoted preview, quick emoji reactions, comment bar.
// Render it inside a full-screen container (a screen's root view, or a <Modal>).
export default function ReplySheet({
  colors,
  title = "Reply",
  placeholder = "Comment",
  quote,
  draft,
  setDraft,
  onClose,
  onSend,
  onReact,
  onCamera,
  onMic,
}) {
  const hasText = draft.trim().length > 0;
  const soft = "rgba(128,128,128,0.14)";

  // Keyboard height as a Reanimated shared value: when the user taps the input
  // the sheet lifts by exactly the keyboard height and tracks it smoothly.
  const { height } = useReanimatedKeyboardAnimation();
  // `height` is a shared value and is negative while the keyboard is open, so
  // it is applied directly (never negated) to lift the sheet above the keyboard.
  // It must be read inside a worklet — applying `-` to the object itself would
  // produce an invalid `NaN` transform and hide the sheet.
  const liftStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: height.value }],
  }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View
        entering={FadeIn.duration(180)}
        exiting={FadeOut.duration(150)}
        style={[StyleSheet.absoluteFill, styles.backdrop]}
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityLabel="Close"
        />
      </Animated.View>

      <View style={styles.sheetWrap} pointerEvents="box-none">
        <Animated.View style={liftStyle}>
          <Animated.View
            entering={SlideInDown.duration(220)}
            exiting={SlideOutDown.duration(180)}
            style={[styles.sheet, { backgroundColor: colors.surface }]}
          >
          <View style={styles.handle} />

          {quote ? (
            <View style={[styles.quote, { backgroundColor: soft }]}>
              <Text
                style={[styles.quoteText, { color: colors.text }]}
                numberOfLines={2}
              >
                {quote}
              </Text>
            </View>
          ) : null}

          <Text style={[styles.sheetTitle, { color: colors.text }]}>
            {title}
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.reactions}
          >
            {REACTIONS.map((emoji) => (
              <Pressable
                key={emoji}
                onPress={() => onReact?.(emoji)}
                hitSlop={6}
                accessibilityRole="button"
                accessibilityLabel={`React ${emoji}`}
                style={({ pressed }) => [
                  styles.reaction,
                  pressed && { transform: [{ scale: 0.88 }] },
                ]}
              >
                <Text style={styles.reactionEmoji}>{emoji}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <View style={styles.commentRow}>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder={placeholder}
              placeholderTextColor={colors.textMuted}
              returnKeyType="send"
              onSubmitEditing={onSend}
              style={[
                styles.commentInput,
                { backgroundColor: soft, color: colors.text },
              ]}
            />
            {hasText ? (
              <Pressable
                onPress={onSend}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Send"
                style={[styles.iconBtn, { backgroundColor: colors.primary }]}
              >
                <Icon name="send" color="#fff" size={18} />
              </Pressable>
            ) : (
              <>
                <Pressable
                  onPress={onCamera}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Add a photo"
                  style={styles.iconBtn}
                >
                  <Icon name="camera" color={colors.text} size={22} />
                </Pressable>
                <Pressable
                  onPress={onMic}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Add a voice note"
                  style={styles.iconBtn}
                >
                  <Icon name="mic" color={colors.text} size={22} />
                </Pressable>
              </>
            )}
          </View>
        </Animated.View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: "rgba(0,0,0,0.35)" },
  sheetWrap: { flex: 1, justifyContent: "flex-end" },
  sheet: {
    borderRadius: SHEET_RADIUS,
    marginHorizontal: 12,
    marginBottom: 12,
    paddingTop: 8,
    paddingBottom: 14,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  handle: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(128,128,128,0.4)",
    marginBottom: 14,
  },
  quote: { borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12 },
  quoteText: { fontSize: 14, lineHeight: 19 },
  sheetTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginTop: 16,
    marginBottom: 8,
  },
  reactions: { gap: 6, paddingRight: 8 },
  reaction: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  reactionEmoji: { fontSize: 28 },
  commentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 10,
  },
  commentInput: {
    flex: 1,
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 22,
    fontSize: 15,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
});

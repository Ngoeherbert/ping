import { Pressable, TextInput, View, StyleSheet } from "react-native";
import { useTheme } from "../theme/useTheme";
import { glassColors } from "../theme/chatTheme";
import { SendIcon } from "./Icons";
import { StickerGlyph, CameraGlyph, PlusGlyph, MicGlyph } from "./ChatIcons";

// WhatsApp-style composer:
//   [+]  [ input ............ sticker ]  [camera]  (mic | send)
// The round button is a mic until there is text, then it becomes Send, and the
// camera hides while typing. `onMic` is where voice-note recording plugs in.
export default function ChatComposer({
  draft,
  onChangeDraft,
  onSend,
  onMic,
  onGlass = false,
}) {
  const { colors } = useTheme();
  const canSend = draft.trim().length > 0;

  const surface = onGlass ? glassColors.surface : colors.surface;
  const border = onGlass ? glassColors.border : colors.border;
  const textColor = onGlass ? glassColors.text : colors.text;
  const muted = onGlass ? glassColors.muted : colors.textMuted;

  return (
    <View style={styles.wrap}>
      <Pressable
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Add"
        style={styles.side}
      >
        <PlusGlyph color={textColor} size={26} />
      </Pressable>

      <View style={[styles.pill, { backgroundColor: surface, borderColor: border }]}>
        <TextInput
          value={draft}
          onChangeText={onChangeDraft}
          placeholder="Type here"
          placeholderTextColor={muted}
          style={[styles.input, { color: textColor }]}
          multiline
        />
        <Pressable hitSlop={8} accessibilityRole="button" accessibilityLabel="Stickers">
          <StickerGlyph color={muted} size={24} />
        </Pressable>
      </View>

      {!canSend && (
        <Pressable
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Camera"
          style={styles.side}
        >
          <CameraGlyph color={textColor} size={26} />
        </Pressable>
      )}

      <Pressable
        onPress={canSend ? onSend : onMic}
        accessibilityRole="button"
        accessibilityLabel={canSend ? "Send" : "Record voice message"}
        style={[styles.round, { backgroundColor: colors.primary }]}
      >
        {canSend ? (
          <SendIcon color={colors.onPrimary} size={22} />
        ) : (
          <MicGlyph color={colors.onPrimary} size={22} />
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    marginHorizontal: 12,
    marginBottom: 10,
    marginTop: 4,
  },
  side: { width: 36, height: 48, alignItems: "center", justifyContent: "center" },
  pill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 48,
    paddingLeft: 16,
    paddingRight: 12,
    paddingVertical: 2,
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
  },
  input: { flex: 1, fontSize: 16, maxHeight: 110, paddingVertical: 10 },
  round: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
});

import { Pressable, TextInput, View, StyleSheet } from "react-native";
import { useTheme } from "../theme/useTheme";
import { glassColors } from "../theme/chatTheme";
import { SendIcon } from "./Icons";
import { StickerGlyph, CameraGlyph, PlusGlyph, MicGlyph } from "./ChatIcons";
import GlassSurface from "./GlassSurface";
import GlassButton from "./GlassButton";

const SIZE = 46;

// WhatsApp-style layout on glass:
//   (+)  [ input ............ sticker ]  (camera)  (mic | send)
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

  const scheme = onGlass ? "dark" : undefined;
  const textColor = onGlass ? glassColors.text : colors.text;
  const muted = onGlass ? glassColors.muted : colors.textMuted;

  return (
    <View style={styles.wrap}>
      <GlassButton size={SIZE} scheme={scheme} label="Add">
        <PlusGlyph color={textColor} size={26} />
      </GlassButton>

      <GlassSurface scheme={scheme} style={styles.pill}>
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
      </GlassSurface>

      {!canSend && (
        <GlassButton size={SIZE} scheme={scheme} label="Camera">
          <CameraGlyph color={textColor} size={26} />
        </GlassButton>
      )}

      <GlassButton
        size={SIZE}
        tint={colors.primary}
        label={canSend ? "Send" : "Record voice message"}
        onPress={canSend ? onSend : onMic}
      >
        {canSend ? (
          <SendIcon color={colors.onPrimary} size={22} />
        ) : (
          <MicGlyph color={colors.onPrimary} size={22} />
        )}
      </GlassButton>
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
  pill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: SIZE,
    paddingLeft: 16,
    paddingRight: 12,
    borderRadius: SIZE / 2,
  },
  input: { flex: 1, fontSize: 16, maxHeight: 110, paddingVertical: 10 },
});

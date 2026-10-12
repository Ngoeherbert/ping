import { useRef } from "react";
import { Pressable, TextInput, View, StyleSheet } from "react-native";
import { useTheme } from "../theme/useTheme";
import { glassColors } from "../theme/chatTheme";
import Icon from "./icons";
import GlassSurface from "./GlassSurface";
import GlassButton from "./GlassButton";
import ComposerPanel, { useComposerPanel } from "./ComposerPanels";

const SIZE = 46;

// WhatsApp-style layout on glass:
//   (+)  [ input ............ sticker ]  (camera)  (mic | send)
// - "+" opens the attach panel (photo, camera, files, games, location, contact)
//   in place of the keyboard, and turns into a keyboard icon while open.
// - The sticker icon opens the GIF / Sticker panel and toggles the same way.
// - The round button is a mic until there is text, then it becomes Send, and the
//   camera hides while typing. `onMic` is where voice-note recording plugs in.
export default function ChatComposer({
  draft,
  onChangeDraft,
  onSend,
  onMic,
  onAttach, // (key) => photo | camera | files | games | location | contact
  onSendSticker, // ({ type: "gif" | "sticker", id, uri?, source? }) => void
  stickers, // optional [{ id, uri } | { id, source }]
  gifs, // optional [{ id, uri, title }]
  onGlass = false,
}) {
  const { colors } = useTheme();
  const inputRef = useRef(null);
  const { panel, panelHeight, toggle, close } = useComposerPanel(inputRef);
  const canSend = draft.trim().length > 0;

  const scheme = onGlass ? "dark" : undefined;
  const textColor = onGlass ? glassColors.text : colors.text;
  const muted = onGlass ? glassColors.muted : colors.textMuted;

  return (
    <View>
      <View style={styles.wrap}>
        <GlassButton
          size={SIZE}
          scheme={scheme}
          label={panel === "attach" ? "Show keyboard" : "Add"}
          onPress={() => toggle("attach")}
        >
          <Icon
            name={panel === "attach" ? "keyboard" : "add"}
            color={textColor}
            size={26}
          />
        </GlassButton>

        <GlassSurface scheme={scheme} style={styles.pill}>
          <TextInput
            ref={inputRef}
            value={draft}
            onChangeText={onChangeDraft}
            onFocus={close} // tapping the input brings the keyboard back
            placeholder="Type here"
            placeholderTextColor={muted}
            style={[styles.input, { color: textColor }]}
            multiline
          />
          <Pressable
            onPress={() => toggle("sticker")}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={
              panel === "sticker" ? "Show keyboard" : "Stickers"
            }
          >
            <Icon
              name={panel === "sticker" ? "keyboard" : "sticker"}
              color={muted}
              size={24}
            />
          </Pressable>
        </GlassSurface>

        {!canSend && (
          <GlassButton
            size={SIZE}
            scheme={scheme}
            label="Camera"
            onPress={() => onAttach?.("camera")}
          >
            <Icon name="camera" color={textColor} size={26} />
          </GlassButton>
        )}

        <GlassButton
          size={SIZE}
          tint={colors.primary}
          label={canSend ? "Send" : "Record voice message"}
          onPress={canSend ? onSend : onMic}
        >
          {canSend ? (
            <Icon name="send" color={colors.onPrimary} size={22} />
          ) : (
            <Icon name="mic" color={colors.onPrimary} size={22} />
          )}
        </GlassButton>
      </View>

      {/* Sits where the keyboard was. Renders nothing when `panel` is null. */}
      <ComposerPanel
        mode={panel}
        height={panelHeight}
        stickers={stickers}
        gifs={gifs}
        onAttach={(key) => {
          close();
          onAttach?.(key);
        }}
        onSend={(item) => {
          onSendSticker?.(item);
        }}
      />
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

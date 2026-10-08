import { View, StyleSheet } from "react-native";
import Svg, { Path } from "react-native-svg";
import { useTheme } from "../theme/useTheme";

// Tail shape, drawn for the right side (sent). Mirrored for the left (received).
const TAIL_PATH =
  "M0 0H5C5.5 8 10 14.5 18 20.5C12 22 6.5 20.5 3 18C1 16.5 0 14 0 11V0Z";

export function useBubbleColors(isMine) {
  const { colors } = useTheme();
  return {
    bg: isMine ? colors.bubbleSent : colors.bubbleReceived,
    fg: isMine ? colors.bubbleSentText : colors.bubbleReceivedText,
    colors,
  };
}

// Aligns any message to the right (mine) or left (theirs)
export function ChatRow({ isMine, children }) {
  return (
    <View style={[styles.row, isMine ? styles.rowMine : styles.rowTheirs]}>
      {children}
    </View>
  );
}

// Coloured bubble with optional tail. Used by text, voice note and view-once.
export default function BubbleShell({ isMine = true, showTail = true, style, children }) {
  const { bg } = useBubbleColors(isMine);
  return (
    <ChatRow isMine={isMine}>
      <View style={[styles.bubble, { backgroundColor: bg }, style]}>
        {children}
        {showTail && (
          <Svg
            width={18}
            height={22}
            viewBox="0 0 18 22"
            style={[
              styles.tail,
              isMine ? { right: -5 } : { left: -5, transform: [{ scaleX: -1 }] },
            ]}
          >
            <Path d={TAIL_PATH} fill={bg} />
          </Svg>
        )}
      </View>
    </ChatRow>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", paddingHorizontal: 20, marginVertical: 4 },
  rowMine: { justifyContent: "flex-end" },
  rowTheirs: { justifyContent: "flex-start" },
  bubble: {
    maxWidth: "78%",
    minHeight: 40,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 9,
    justifyContent: "center",
  },
  tail: { position: "absolute", bottom: 0 },
});

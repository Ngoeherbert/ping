import { Pressable, Text, StyleSheet } from "react-native";
import Svg, { Circle } from "react-native-svg";
import BubbleShell, { useBubbleColors } from "./BubbleShell";

// "View once" photo/video. Shows a dashed "1" until opened, then "Opened".
export default function ViewOnceBubble({
  kind = "photo", // "photo" | "video"
  opened = false,
  isMine = true,
  showTail = true,
  onPress,
}) {
  const { fg } = useBubbleColors(isMine);
  const label = opened ? "Opened" : kind === "video" ? "Video" : "Photo";

  return (
    <BubbleShell isMine={isMine} showTail={showTail}>
      <Pressable
        onPress={onPress}
        disabled={opened}
        accessibilityRole="button"
        accessibilityLabel={opened ? "Opened" : `View once ${kind}`}
        style={[styles.content, opened && { opacity: 0.65 }]}
      >
        <Svg width={28} height={28} viewBox="0 0 28 28">
          <Circle
            cx="14"
            cy="14"
            r="12"
            fill="none"
            stroke={fg}
            strokeWidth="2"
            strokeDasharray={opened ? undefined : "3.2 3.2"}
          />
        </Svg>
        <Text style={[styles.one, { color: fg }]}>{opened ? "" : "1"}</Text>
        <Text style={[styles.label, { color: fg }]}>{label}</Text>
      </Pressable>
    </BubbleShell>
  );
}

const styles = StyleSheet.create({
  content: { flexDirection: "row", alignItems: "center", gap: 10 },
  one: {
    position: "absolute",
    left: 0,
    width: 28,
    textAlign: "center",
    fontSize: 13,
    fontWeight: "700",
  },
  label: { fontSize: 16, fontWeight: "500" },
});

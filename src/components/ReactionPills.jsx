import { Text, View, StyleSheet } from "react-native";
import { useTheme } from "../theme/useTheme";
import { glassBubbles } from "../theme/chatTheme";
import { useBubbleColors } from "./BubbleShell";
import GlassSurface from "./GlassSurface";

// One glass capsule holding every reaction: [{ emoji: "🔥", count: 3 }, ...]
export default function ReactionPills({ reactions = [], style }) {
  const { colors } = useTheme();
  const { bg } = useBubbleColors(false);
  if (!reactions.length) return null;

  // Inside a wallpaper chat the bubble colours are overridden, so use dark glass.
  const dark = bg === glassBubbles.received;
  const color = dark ? "#ffffff" : colors.text;

  return (
    <GlassSurface scheme={dark ? "dark" : undefined} style={[styles.pill, style]}>
      {reactions.map((r) => (
        <View key={r.emoji} style={styles.item}>
          <Text style={styles.emoji}>{r.emoji}</Text>
          <Text style={[styles.count, { color }]}>{r.count}</Text>
        </View>
      ))}
    </GlassSurface>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
  },
  item: { flexDirection: "row", alignItems: "center", gap: 3 },
  emoji: { fontSize: 12 },
  count: { fontSize: 12, fontWeight: "600" },
});

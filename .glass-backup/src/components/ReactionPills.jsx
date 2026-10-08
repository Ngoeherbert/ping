import { Text, View, StyleSheet } from "react-native";
import { useBubbleColors } from "./BubbleShell";

// One capsule holding every reaction: [{ emoji: "🔥", count: 3 }, ...]
export default function ReactionPills({ reactions = [], isMine = false, style }) {
  const { bg, fg } = useBubbleColors(isMine);
  if (!reactions.length) return null;

  return (
    <View style={[styles.pill, { backgroundColor: bg }, style]}>
      {reactions.map((r) => (
        <View key={r.emoji} style={styles.item}>
          <Text style={styles.emoji}>{r.emoji}</Text>
          <Text style={[styles.count, { color: fg }]}>{r.count}</Text>
        </View>
      ))}
    </View>
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
    borderWidth: 1,
    borderColor: "rgba(128,128,128,0.25)",
  },
  item: { flexDirection: "row", alignItems: "center", gap: 3 },
  emoji: { fontSize: 12 },
  count: { fontSize: 12, fontWeight: "600" },
});

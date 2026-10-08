import { View, Text, Image, StyleSheet } from "react-native";
import { useTheme } from "../theme/useTheme";

// Photo avatar with initials fallback and optional online dot.
export default function Avatar({ uri, name = "", size = 48, online = false }) {
  const { colors } = useTheme();
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const dot = Math.max(10, size * 0.26);

  return (
    <View style={{ width: size, height: size }}>
      <View
        style={[
          styles.circle,
          { width: size, height: size, borderRadius: size / 2, backgroundColor: colors.primarySoft },
        ]}
      >
        <Text style={[styles.initials, { color: colors.primary, fontSize: size * 0.36 }]}>{initials}</Text>
        {uri ? <Image source={{ uri }} style={StyleSheet.absoluteFill} /> : null}
      </View>
      {online && (
        <View
          style={[
            styles.dot,
            {
              width: dot,
              height: dot,
              borderRadius: dot / 2,
              borderColor: colors.background,
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { alignItems: "center", justifyContent: "center", overflow: "hidden" },
  initials: { fontWeight: "700" },
  dot: {
    position: "absolute",
    right: 0,
    top: 0,
    backgroundColor: "#22c55e",
    borderWidth: 2,
  },
});

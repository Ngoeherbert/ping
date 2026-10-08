import { Pressable, Text, View, StyleSheet } from "react-native";
import { router } from "expo-router";
import { useTheme } from "../theme/useTheme";
import { glassColors } from "../theme/chatTheme";
import Avatar from "./Avatar";
import GlassSurface from "./GlassSurface";
import GlassButton from "./GlassButton";
import { BackIcon, PhoneIcon, VideoCallIcon } from "./Icons";
import { MoreVerticalGlyph } from "./ChatIcons";

// Three floating glass pieces: back button, title capsule, actions capsule.
// `onGlass` (chat has a wallpaper) forces the dark glass look with white text.
export default function ChatHeader({ conversation, onGlass = false }) {
  const { colors } = useTheme();
  const scheme = onGlass ? "dark" : undefined;
  const text = onGlass ? glassColors.text : colors.text;
  const muted = onGlass ? glassColors.muted : colors.textMuted;
  const action = onGlass ? glassColors.text : colors.primary;

  const subtitle =
    conversation.isGroup && conversation.members?.length
      ? conversation.members.map((m) => m.name.split(" ")[0]).join(", ")
      : conversation.status;

  return (
    <View style={styles.header}>
      <GlassButton size={46} scheme={scheme} label="Back" onPress={() => router.back()}>
        <BackIcon color={text} size={24} />
      </GlassButton>

      <GlassSurface scheme={scheme} style={styles.titlePill}>
        <Avatar
          uri={conversation.avatar}
          name={conversation.name}
          size={36}
          online={conversation.online}
        />
        <View style={styles.headerText}>
          <Text style={[styles.name, { color: text }]} numberOfLines={1}>
            {conversation.name}
          </Text>
          <Text style={[styles.status, { color: muted }]} numberOfLines={1}>
            {subtitle}
          </Text>
        </View>
      </GlassSurface>

      <GlassSurface scheme={scheme} style={styles.actions}>
        <Pressable hitSlop={8} accessibilityRole="button" accessibilityLabel="Video call">
          <VideoCallIcon color={action} size={24} />
        </Pressable>
        <Pressable hitSlop={8} accessibilityRole="button" accessibilityLabel="Voice call">
          <PhoneIcon color={action} size={22} />
        </Pressable>
      </GlassSurface>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  titlePill: {
    flex: 1,
    height: 46,
    borderRadius: 23,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingLeft: 5,
    paddingRight: 12,
  },
  headerText: { flex: 1 },
  name: { fontSize: 15.5, fontWeight: "700" },
  status: { fontSize: 12, marginTop: 1 },
  actions: {
    height: 46,
    borderRadius: 23,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 14,
  },
});

import { Pressable, Text, View, StyleSheet } from "react-native";
import { router } from "expo-router";
import { useTheme } from "../theme/useTheme";
import { glassColors } from "../theme/chatTheme";
import Avatar from "./Avatar";
import { BackIcon, PhoneIcon, VideoCallIcon } from "./Icons";
import { MoreVerticalGlyph } from "./ChatIcons";

// Back, avatar, title + member names, then video / call / more.
// `onGlass` switches to white text for chats with a wallpaper.
export default function ChatHeader({ conversation, onGlass = false }) {
  const { colors } = useTheme();
  const text = onGlass ? glassColors.text : colors.text;
  const muted = onGlass ? glassColors.muted : colors.textMuted;
  const action = onGlass ? glassColors.text : colors.primary;

  const subtitle =
    conversation.isGroup && conversation.members?.length
      ? conversation.members.map((m) => m.name.split(" ")[0]).join(", ")
      : conversation.status;

  return (
    <View
      style={[
        styles.header,
        !onGlass && {
          borderBottomColor: colors.border,
          borderBottomWidth: StyleSheet.hairlineWidth,
        },
      ]}
    >
      <Pressable
        onPress={() => router.back()}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel="Back"
      >
        <BackIcon color={text} size={26} />
      </Pressable>

      {onGlass ? (
        <View style={styles.ring}>
          <Avatar uri={conversation.avatar} name={conversation.name} size={40} />
        </View>
      ) : (
        <Avatar
          uri={conversation.avatar}
          name={conversation.name}
          size={44}
          online={conversation.online}
        />
      )}

      <View style={styles.headerText}>
        <Text style={[styles.name, { color: text }]} numberOfLines={1}>
          {conversation.name}
        </Text>
        <Text style={[styles.status, { color: muted }]} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>

      <Pressable hitSlop={10} accessibilityRole="button" accessibilityLabel="Video call">
        <VideoCallIcon color={action} size={24} />
      </Pressable>
      <Pressable hitSlop={10} accessibilityRole="button" accessibilityLabel="Voice call">
        <PhoneIcon color={action} size={22} />
      </Pressable>
      <Pressable hitSlop={10} accessibilityRole="button" accessibilityLabel="More options">
        <MoreVerticalGlyph color={action} size={22} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  ring: {
    padding: 2,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: glassColors.ring,
  },
  headerText: { flex: 1 },
  name: { fontSize: 17, fontWeight: "700" },
  status: { fontSize: 13, marginTop: 1 },
});

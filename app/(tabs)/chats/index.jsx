import { FlatList, Pressable, Text, View, StyleSheet } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useTheme } from "../../../src/theme/useTheme";
import Avatar from "../../../src/components/Avatar";
import GlassButton from "../../../src/components/GlassButton";
import { SearchIcon } from "../../../src/components/Icons";
import { CONVERSATIONS } from "../../../src/data/chats";
import { messagePreview } from "../../../src/utils/messagePreview";

function ConversationRow({ item }) {
  const { colors } = useTheme();
  const last = item.messages[item.messages.length - 1];
  const hasUnread = item.unread > 0;

  return (
    <Pressable
      onPress={() => router.push(`/chats/${item.id}`)}
      accessibilityRole="button"
      accessibilityLabel={`Open chat with ${item.name}`}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.surface }]}
    >
      <Avatar uri={item.avatar} name={item.name} size={54} online={item.online} />

      <View style={styles.middle}>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
          {item.name}
        </Text>
        <Text
          style={[
            styles.preview,
            { color: hasUnread ? colors.text : colors.textMuted },
            hasUnread && { fontWeight: "600" },
          ]}
          numberOfLines={1}
        >
          {messagePreview(last)}
        </Text>
      </View>

      <View style={styles.right}>
        <Text style={[styles.time, { color: hasUnread ? colors.primary : colors.textMuted }]}>
          {last.time}
        </Text>
        {hasUnread ? (
          <View style={[styles.badge, { backgroundColor: colors.primary }]}>
            <Text style={[styles.badgeText, { color: colors.onPrimary }]}>{item.unread}</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

export default function ChatsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Chats</Text>
        <GlassButton size={44} label="Search chats">
          <SearchIcon color={colors.text} size={22} />
        </GlassButton>
      </View>

      <FlatList
        data={CONVERSATIONS}
        keyExtractor={(c) => c.id}
        renderItem={({ item }) => <ConversationRow item={item} />}
        // room for the floating glass tab bar
        contentContainerStyle={{ paddingBottom: insets.bottom + 110 }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  title: { fontSize: 26, fontWeight: "700" },
  row: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 20, paddingVertical: 12 },
  middle: { flex: 1, gap: 3 },
  name: { fontSize: 16.5, fontWeight: "600" },
  preview: { fontSize: 14.5 },
  right: { alignItems: "flex-end", gap: 6, minWidth: 48 },
  time: { fontSize: 12.5, fontWeight: "500" },
  badge: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { fontSize: 12, fontWeight: "700" },
});

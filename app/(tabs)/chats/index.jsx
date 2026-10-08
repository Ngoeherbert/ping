import { useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  ScrollView,
  Text,
  View,
  StyleSheet,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { router } from "expo-router";
import { useTheme } from "../../../src/theme/useTheme";
import Avatar from "../../../src/components/Avatar";
import GlassButton from "../../../src/components/GlassButton";
import {
  SearchIcon,
  addChat as AddChatIcon,
} from "../../../src/components/Icons";
import { CONVERSATIONS } from "../../../src/data/chats";
import { messagePreview } from "../../../src/utils/messagePreview";

// Works with either `type: "direct" | "group" | "channel"` or isGroup / isChannel flags.
// Adjust this one function if your data model differs.
function getKind(c) {
  if (c.type) return c.type;
  if (c.isChannel) return "channel";
  if (c.isGroup) return "group";
  return "direct";
}

const TABS = [
  { key: "all", label: "All", match: () => true },
  { key: "unread", label: "Unread", match: (c) => c.unread > 0 },
  { key: "groups", label: "Groups", match: (c) => getKind(c) === "group" },
  {
    key: "channels",
    label: "Channels",
    match: (c) => getKind(c) === "channel",
  },
];

function FilterTabs({ active, onChange, unreadCount }) {
  const { colors } = useTheme();

  return (
    <View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabs}
      >
        {TABS.map((tab) => {
          const selected = tab.key === active;
          const showCount = tab.key === "unread" && unreadCount > 0;
          return (
            <Pressable
              key={tab.key}
              onPress={() => onChange(tab.key)}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              accessibilityLabel={
                showCount ? `${tab.label}, ${unreadCount} chats` : tab.label
              }
              style={[
                styles.tab,
                {
                  backgroundColor: selected ? colors.primary : colors.surface,
                },
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: selected ? colors.onPrimary : colors.textMuted },
                  selected && { fontWeight: "700" },
                ]}
              >
                {tab.label}
              </Text>
              {showCount ? (
                <View
                  style={[
                    styles.tabCount,
                    {
                      backgroundColor: selected
                        ? colors.onPrimary
                        : colors.primary,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.tabCountText,
                      { color: selected ? colors.primary : colors.onPrimary },
                    ]}
                  >
                    {unreadCount}
                  </Text>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

function ConversationRow({ item }) {
  const { colors } = useTheme();
  const last = item.messages[item.messages.length - 1];
  const hasUnread = item.unread > 0;

  return (
    <Pressable
      onPress={() => router.push(`/chats/${item.id}`)}
      accessibilityRole="button"
      accessibilityLabel={`Open chat with ${item.name}`}
      style={({ pressed }) => [
        styles.row,
        pressed && { backgroundColor: colors.surface },
      ]}
    >
      <Avatar
        uri={item.avatar}
        name={item.name}
        size={54}
        online={item.online}
      />

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
        <Text
          style={[
            styles.time,
            { color: hasUnread ? colors.primary : colors.textMuted },
          ]}
        >
          {last.time}
        </Text>
        {hasUnread ? (
          <View style={[styles.badge, { backgroundColor: colors.primary }]}>
            <Text style={[styles.badgeText, { color: colors.onPrimary }]}>
              {item.unread}
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

function EmptyState({ tab }) {
  const { colors } = useTheme();
  const copy = {
    unread: {
      title: "You're all caught up",
      body: "New unread chats will show up here.",
    },
    groups: {
      title: "No groups yet",
      body: "Tap the new chat button to start a group.",
    },
    channels: {
      title: "No channels yet",
      body: "Channels you join or create will show up here.",
    },
    all: {
      title: "No chats yet",
      body: "Tap the new chat button to start one.",
    },
  }[tab];

  return (
    <View style={styles.empty}>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        {copy.title}
      </Text>
      <Text style={[styles.emptyBody, { color: colors.textMuted }]}>
        {copy.body}
      </Text>
    </View>
  );
}

export default function ChatsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState("all");

  const unreadCount = useMemo(
    () => CONVERSATIONS.filter((c) => c.unread > 0).length,
    [],
  );

  const data = useMemo(() => {
    const tab = TABS.find((t) => t.key === activeTab) ?? TABS[0];
    return CONVERSATIONS.filter(tab.match);
  }, [activeTab]);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Chats</Text>
        <GlassButton size={44} label="Search chats">
          <SearchIcon color={colors.text} size={22} />
        </GlassButton>
      </View>

      <FilterTabs
        active={activeTab}
        onChange={setActiveTab}
        unreadCount={unreadCount}
      />

      <FlatList
        data={data}
        keyExtractor={(c) => c.id}
        renderItem={({ item }) => <ConversationRow item={item} />}
        ListEmptyComponent={<EmptyState tab={activeTab} />}
        // room for the floating glass tab bar and the FAB
        contentContainerStyle={{
          paddingBottom: insets.bottom + 170,
          flexGrow: 1,
        }}
      />

      <Pressable
        onPress={() => router.push("/chats/new")}
        accessibilityRole="button"
        accessibilityLabel="Start a new chat"
        style={({ pressed }) => [
          styles.fab,
          {
            backgroundColor: colors.primary,
            bottom: insets.bottom + 92, // sits above the floating tab bar
            transform: [{ scale: pressed ? 0.94 : 1 }],
          },
        ]}
      >
        <AddChatIcon color={colors.onPrimary} size={26} />
      </Pressable>
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

  tabs: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 10, gap: 8 },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 36,
    paddingHorizontal: 16,
    borderRadius: 18,
  },
  tabText: { fontSize: 14, fontWeight: "600" },
  tabCount: {
    minWidth: 18,
    height: 18,
    paddingHorizontal: 5,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  tabCountText: { fontSize: 11, fontWeight: "700" },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
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

  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    gap: 6,
  },
  emptyTitle: { fontSize: 17, fontWeight: "700" },
  emptyBody: { fontSize: 14.5, textAlign: "center" },

  fab: {
    position: "absolute",
    right: 20,
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
});

import React, { useState } from "react";
import {
  StyleSheet,
  StatusBar,
  ScrollView,
  View,
  Pressable,
  Image,
  Text,
  Modal,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { router } from "expo-router";

import Icon from "../../../src/components/Icon";

const YELLOW = "#F5C400";

const items = [
  {
    id: "1",
    type: "direct",
    img: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=facearea&facepad=2.5&w=256&h=256&q=80",
    name: "Nick Miller",
    message: "Please help me find a good monitor for the design",
    time: "02:11",
    unread: 2,
  },
  {
    id: "2",
    type: "direct",
    img: "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=987&q=80",
    name: "Ashley",
    message: "Amazing!! 🔥🔥🔥",
    time: "02:11",
    status: "read",
  },
  {
    id: "3",
    type: "group",
    img: "https://images.unsplash.com/photo-1507591064344-4c6ce005b128?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2340&q=80",
    name: "Max",
    sender: "Bima",
    message: "No one can come today?",
    time: "02:11",
    unread: 2,
  },
  {
    id: "4",
    type: "direct",
    img: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=988&q=80",
    name: "Schmidt",
    message: "Let's bring creativity to the forefront of our discussions.",
    time: "01:45",
    status: "delivered",
  },
  {
    id: "5",
    type: "channel",
    img: "https://images.unsplash.com/photo-1553240799-36bbf332a5c3?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2340&q=80",
    name: "Dwight",
    message: "Excited to explore opportunities for collaboration.",
    time: "Yesterday",
    unread: 3,
  },
  {
    id: "6",
    type: "group",
    img: "https://images.unsplash.com/photo-1573497019236-17f8177b81e8?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2340&q=80",
    name: "Amy",
    message: "You're now an admin",
    time: "Yesterday",
    unread: 1,
  },
  {
    id: "7",
    type: "channel",
    img: "https://images.unsplash.com/photo-1553240799-36bbf332a5c3?ixlib=rb-4.0.3&auto=format&fit=crop&w=2340&q=80",
    name: "Ping Updates",
    message: "Mini games are now live",
    time: "Mon",
  },
];

const menu = [
  {
    key: "chat",
    icon: "message",
    title: "New Chat",
    sub: "Send a message to your contact",
  },
  {
    key: "contact",
    icon: "newContact",
    title: "New Contact",
    sub: "Add a contact to be able to send messages",
  },
  {
    key: "community",
    icon: "community",
    title: "New Community",
    sub: "Join the community around you",
  },
];

const FILTERS = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
  { key: "groups", label: "Groups" },
  { key: "channels", label: "Channels" },
];

const matches = (chat, filter) => {
  if (filter === "unread") return !!chat.unread;
  if (filter === "groups") return chat.type === "group";
  if (filter === "channels") return chat.type === "channel";
  return true;
};

const EMPTY = {
  all: "No chats yet",
  unread: "You're all caught up",
  groups: "No groups yet",
  channels: "No channels yet",
};

function ChatFilters({ value, onChange, unreadCount }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.filtersScroll}
      contentContainerStyle={styles.filters}
    >
      {FILTERS.map(({ key, label }) => {
        const active = key === value;
        return (
          <Pressable
            key={key}
            onPress={() => onChange(key)}
            style={[styles.pill, active && styles.pillActive]}
          >
            <Text style={[styles.pillText, active && styles.pillTextActive]}>
              {label}
            </Text>
            {key === "unread" && unreadCount > 0 && (
              <View style={styles.pillBadge}>
                <Text style={styles.pillBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function StoryItem({ story }) {
  return (
    <View style={styles.story}>
      {story.add ? (
        <View style={styles.storyAdd}>
          <Icon name="plus" size={22} color="#111" />
        </View>
      ) : (
        <Image source={{ uri: story.img }} style={styles.storyImg} />
      )}
      <Text numberOfLines={1} style={styles.storyName}>
        {story.name}
      </Text>
    </View>
  );
}

function ChatRow({ chat, first }) {
  const { id, img, name, sender, message, time, unread, status } = chat;
  const hasUnread = !!unread;
  const preview = sender ? `${sender} : ${message}` : message;

  return (
    <View>
      {!first && <View style={styles.divider} />}
      <Pressable
        onPress={() => router.push(`/(tabs)/(chats)/${id}`)}
        style={({ pressed }) => [
          styles.row,
          pressed && { backgroundColor: "#E6E6E6" },
        ]}
      >
        <Image source={{ uri: img }} style={styles.avatar} />

        <View style={styles.rowBody}>
          <View style={styles.rowTop}>
            <Text numberOfLines={1} style={styles.name}>
              {name}
            </Text>
            <Text style={styles.time}>{time}</Text>
          </View>

          <View style={styles.rowBottom}>
            <View style={styles.previewWrap}>
              {status && (
                <Icon
                  name="checks"
                  size={16}
                  color={status === "read" ? "#007AFF" : "#8E8E93"}
                />
              )}
              <Text
                numberOfLines={1}
                style={[styles.preview, hasUnread && styles.previewUnread]}
              >
                {preview}
              </Text>
            </View>

            {hasUnread && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {unread > 99 ? "99+" : unread}
                </Text>
              </View>
            )}
          </View>
        </View>
      </Pressable>
    </View>
  );
}

export default function Example() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [filter, setFilter] = useState("all");
  const insets = useSafeAreaInsets();

  const visible = items.filter((c) => matches(c, filter));
  const unreadCount = items.filter((c) => c.unread).length;

  const stories = [
    { id: "add", add: true, name: "Add story" },
    ...items
      .slice(0, 5)
      .map((c) => ({ id: c.id, img: c.img, name: c.name.split(" ")[0] })),
  ];

  const onMenuPress = (key) => {
    setMenuOpen(false);
    if (key === "chat") router.push("/(tabs)/(chats)/new");
    // New Contact and New Community: connect their routes when those screens exist
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.safe}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chats</Text>
        <View style={styles.headerActions}>
          <Pressable onPress={() => {}} style={styles.headerAction} hitSlop={6}>
            <Icon name="search" size={24} color="#111" />
          </Pressable>
          <Pressable
            onPress={() => setMenuOpen(true)}
            style={styles.headerAction}
            hitSlop={6}
          >
            <Icon name="compose" size={24} color="#111" />
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 90 }}
        showsVerticalScrollIndicator={false}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.storiesScroll}
          contentContainerStyle={styles.storiesRow}
        >
          {stories.map((s) => (
            <StoryItem key={s.id} story={s} />
          ))}
        </ScrollView>

        <ChatFilters
          value={filter}
          onChange={setFilter}
          unreadCount={unreadCount}
        />

        {visible.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>{EMPTY[filter]}</Text>
          </View>
        ) : (
          visible.map((chat, index) => (
            <ChatRow key={chat.id} chat={chat} first={index === 0} />
          ))
        )}
      </ScrollView>

      <Modal
        transparent
        visible={menuOpen}
        animationType="fade"
        onRequestClose={() => setMenuOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setMenuOpen(false)}>
          <View style={styles.sheet} onStartShouldSetResponder={() => true}>
            {menu.map((m, i) => (
              <Pressable
                key={m.key}
                onPress={() => onMenuPress(m.key)}
                style={({ pressed }) => [
                  styles.menuRow,
                  i > 0 && styles.menuRowBorder,
                  pressed && { backgroundColor: "#F7F7F7" },
                ]}
              >
                <Icon name={m.icon} size={26} color="#111" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.menuTitle}>{m.title}</Text>
                  <Text style={styles.menuSub}>{m.sub}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#EFEFEF" },

  /** Header */
  header: {
    paddingTop: 12,
    paddingBottom: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: { fontSize: 30, fontWeight: "700", color: "#111" },
  headerActions: { flexDirection: "row", alignItems: "center" },
  headerAction: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  /** Stories */
  storiesScroll: { flexGrow: 0 },
  storiesRow: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 12,
    gap: 14,
  },
  story: { width: 56, alignItems: "center" },
  storyImg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#E5E5EA",
  },
  storyAdd: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#BDBDBD",
    alignItems: "center",
    justifyContent: "center",
  },
  storyName: { marginTop: 6, fontSize: 11, color: "#111" },

  /** Filters */
  filtersScroll: { flexGrow: 0 },
  filters: { paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 34,
    paddingHorizontal: 16,
    borderRadius: 17,
    backgroundColor: "#fff",
  },
  pillActive: { backgroundColor: "#111" },
  pillText: { fontSize: 14, fontWeight: "500", color: "#6B6B6B" },
  pillTextActive: { color: "#fff" },
  pillBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 5,
    backgroundColor: YELLOW,
    alignItems: "center",
    justifyContent: "center",
  },
  pillBadgeText: { fontSize: 11, fontWeight: "600", color: "#111" },

  /** Chat rows */
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  divider: { height: 1, backgroundColor: "#E2E2E2", marginLeft: 76 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#E5E5EA",
  },
  rowBody: { flex: 1, minWidth: 0 },
  rowTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  name: { flex: 1, fontSize: 16, fontWeight: "500", color: "#111" },
  time: { fontSize: 12, color: "#6B6B6B" },
  rowBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 3,
    gap: 8,
  },
  previewWrap: { flex: 1, flexDirection: "row", alignItems: "center", gap: 4 },
  preview: { flexShrink: 1, fontSize: 13, color: "#8E8E93" },
  previewUnread: { color: "#111", fontWeight: "500" },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    backgroundColor: YELLOW,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { fontSize: 12, fontWeight: "600", color: "#111" },

  /** Empty state */
  empty: { paddingVertical: 48, alignItems: "center" },
  emptyText: { fontSize: 15, color: "#8E8E93" },

  /** New chat menu */
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#fff",
    borderRadius: 20,
    margin: 12,
    overflow: "hidden",
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  menuRowBorder: { borderTopWidth: 1, borderTopColor: "#F0F0F0" },
  menuTitle: { fontSize: 16, fontWeight: "500", color: "#111" },
  menuSub: { fontSize: 14, color: "#6B6B6B", marginTop: 2 },
});

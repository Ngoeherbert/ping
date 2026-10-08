import { useMemo, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  View,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { router, useLocalSearchParams } from "expo-router";
import { useTheme } from "../../../src/theme/useTheme";
import { glassBubbles, glassColors, DEFAULT_WALLPAPER } from "../../../src/theme/chatTheme";
import Avatar from "../../../src/components/Avatar";
import ChatMessage from "../../../src/components/ChatMessage";
import ChatHeader from "../../../src/components/ChatHeader";
import ChatComposer from "../../../src/components/ChatComposer";
import ChatBackground from "../../../src/components/ChatBackground";
import ReactionPills from "../../../src/components/ReactionPills";
import { BubbleStyleProvider } from "../../../src/components/BubbleShell";
import { getConversation } from "../../../src/data/chats";

const AVATAR = 34;
const GUTTER = 40; // room on the left of received group messages for the avatar

const sameSender = (a, b) =>
  a.isMine === b.isMine && (a.sender ?? "") === (b.sender ?? "");

// Per message: tail on the last of a run from the same sender, and a time
// label above each run. Group chats also get the sender name on the first
// message of a run.
function decorate(messages, isGroup) {
  return messages.map((m, i) => {
    const prev = messages[i - 1];
    const next = messages[i + 1];
    const firstOfRun = !prev || !sameSender(prev, m);
    const lastOfRun = !next || !sameSender(next, m);
    return {
      ...m,
      showTail: lastOfRun,
      showTime: lastOfRun,
      showName: isGroup && !m.isMine && firstOfRun,
      showDate: firstOfRun && (!prev || prev.time !== m.time),
    };
  });
}

export default function ChatThreadScreen() {
  const { id } = useLocalSearchParams();
  const conversation = getConversation(id);
  const { colors } = useTheme();
  const [messages, setMessages] = useState(conversation?.messages ?? []);
  const [draft, setDraft] = useState("");

  const isGroup = !!conversation?.isGroup;
  // Every chat gets the glass look. Give a chat its own `wallpaper` URL, or
  // set `wallpaper: false` on it to fall back to the plain theme background.
  const wallpaper =
    conversation?.wallpaper === false ? null : conversation?.wallpaper ?? DEFAULT_WALLPAPER;
  const hasWallpaper = !!wallpaper;

  // Inverted list: newest message at the bottom, stays pinned there
  const items = useMemo(() => decorate(messages, isGroup).reverse(), [messages, isGroup]);

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    setMessages((prev) => [
      ...prev,
      { id: String(Date.now()), type: "text", text, isMine: true, time: "Now" },
    ]);
    setDraft("");
  };

  if (!conversation) {
    return (
      <SafeAreaView style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text, fontSize: 16 }}>Chat not found</Text>
        <Pressable onPress={() => router.back()} style={{ padding: 12 }}>
          <Text style={{ color: colors.primary, fontWeight: "600" }}>Go back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const avatarFor = (name) => conversation.members?.find((m) => m.name === name)?.avatar;
  const labelColor = hasWallpaper ? glassColors.muted : colors.textMuted;

  const renderItem = ({ item }) => {
    const theirsInGroup = isGroup && !item.isMine;
    const side = item.isMine ? styles.timeMine : styles.timeTheirs;

    return (
      <View>
        <View style={theirsInGroup ? { paddingLeft: GUTTER } : null}>
          {item.showDate && (
            <Text style={[styles.time, styles.dateAbove, { color: labelColor }, side]}>
              {item.time}
            </Text>
          )}

          {item.showName && item.type !== "text" && (
            <Text style={[styles.senderAbove, { color: labelColor }]} numberOfLines={1}>
              {item.sender}
            </Text>
          )}

          <ChatMessage message={item} />

          {item.type !== "photos" && item.reactions?.length ? (
            <View
              style={[
                styles.reactionRow,
                item.isMine ? styles.reactionMine : styles.reactionTheirs,
              ]}
            >
              <ReactionPills reactions={item.reactions} isMine={item.isMine} />
            </View>
          ) : null}

        </View>

        {theirsInGroup && item.showTail && (
          <View style={styles.avatarSlot}>
            <Avatar uri={avatarFor(item.sender)} name={item.sender} size={AVATAR} />
          </View>
        )}
      </View>
    );
  };

  const body = (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <FlatList
        data={items}
        inverted
        keyExtractor={(m) => m.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingVertical: 12 }}
        renderItem={renderItem}
      />

      <ChatComposer
        draft={draft}
        onChangeDraft={setDraft}
        onSend={send}
        onGlass={hasWallpaper}
      />
    </KeyboardAvoidingView>
  );

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: hasWallpaper ? glassColors.base : colors.background },
      ]}
    >
      {hasWallpaper && <ChatBackground uri={wallpaper} />}
      {hasWallpaper && <StatusBar style="light" />}

      <SafeAreaView style={styles.flex} edges={["top", "bottom"]}>
        <ChatHeader conversation={conversation} onGlass={hasWallpaper} />
        {hasWallpaper ? (
          <BubbleStyleProvider value={glassBubbles}>{body}</BubbleStyleProvider>
        ) : (
          body
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  center: { alignItems: "center", justifyContent: "center" },
  time: { fontSize: 12, marginTop: 2, marginBottom: 6 },
  dateAbove: { marginTop: 8, marginBottom: 2 },
  timeMine: { textAlign: "right", paddingRight: 22 },
  timeTheirs: { textAlign: "left", paddingLeft: 22 },
  senderAbove: { fontSize: 12.5, paddingLeft: 22, marginTop: 4, marginBottom: 2 },
  reactionRow: { flexDirection: "row", paddingHorizontal: 24, marginTop: -6, marginBottom: 4 },
  reactionMine: { justifyContent: "flex-end" },
  reactionTheirs: { justifyContent: "flex-start" },
  avatarSlot: { position: "absolute", left: 14, bottom: 4 },
});

import { useMemo, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { useTheme } from "../../../src/theme/useTheme";
import Avatar from "../../../src/components/Avatar";
import ChatMessage from "../../../src/components/ChatMessage";
import {
  BackIcon,
  PhoneIcon,
  VideoCallIcon,
  PlusCircleIcon,
  SendIcon,
} from "../../../src/components/Icons";
import { getConversation } from "../../../src/data/chats";

// Tail + time only on the last message of a run from the same sender
function decorate(messages) {
  return messages.map((m, i) => {
    const next = messages[i + 1];
    const lastOfRun = !next || next.isMine !== m.isMine;
    return { ...m, showTail: lastOfRun, showTime: lastOfRun };
  });
}

export default function ChatThreadScreen() {
  const { id } = useLocalSearchParams();
  const conversation = getConversation(id);
  const { colors } = useTheme();
  const [messages, setMessages] = useState(conversation?.messages ?? []);
  const [draft, setDraft] = useState("");

  // Inverted list: newest message at the bottom, stays pinned there
  const items = useMemo(() => decorate(messages).reverse(), [messages]);

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

  const canSend = draft.trim().length > 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <BackIcon color={colors.text} size={26} />
        </Pressable>

        <Avatar uri={conversation.avatar} name={conversation.name} size={44} online={conversation.online} />

        <View style={styles.headerText}>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
            {conversation.name}
          </Text>
          <Text style={[styles.status, { color: colors.textMuted }]} numberOfLines={1}>
            {conversation.status}
          </Text>
        </View>

        <Pressable hitSlop={10} accessibilityRole="button" accessibilityLabel="Voice call">
          <PhoneIcon color={colors.primary} size={24} />
        </Pressable>
        <Pressable hitSlop={10} accessibilityRole="button" accessibilityLabel="Video call">
          <VideoCallIcon color={colors.primary} size={26} />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Messages */}
        <FlatList
          data={items}
          inverted
          keyExtractor={(m) => m.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingVertical: 12 }}
          renderItem={({ item }) => (
            <View>
              <ChatMessage message={item} />
              {item.showTime && (
                <Text
                  style={[
                    styles.time,
                    { color: colors.textMuted },
                    item.isMine ? styles.timeMine : styles.timeTheirs,
                  ]}
                >
                  {item.time}
                </Text>
              )}
            </View>
          )}
        />

        {/* Composer */}
        <View style={[styles.composer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Pressable hitSlop={8} accessibilityRole="button" accessibilityLabel="Attach">
            <PlusCircleIcon color={colors.textMuted} size={26} />
          </Pressable>

          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Write your message"
            placeholderTextColor={colors.textMuted}
            style={[styles.input, { color: colors.text }]}
            multiline
          />

          <Pressable
            onPress={send}
            disabled={!canSend}
            accessibilityRole="button"
            accessibilityLabel="Send"
            style={[styles.sendButton, { backgroundColor: colors.primary, opacity: canSend ? 1 : 0.45 }]}
          >
            <SendIcon color={colors.onPrimary} size={22} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  center: { alignItems: "center", justifyContent: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerText: { flex: 1 },
  name: { fontSize: 17, fontWeight: "700" },
  status: { fontSize: 13, marginTop: 1 },
  time: { fontSize: 12, marginTop: 2, marginBottom: 6 },
  timeMine: { textAlign: "right", paddingRight: 22 },
  timeTheirs: { textAlign: "left", paddingLeft: 22 },
  composer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 14,
    marginBottom: 10,
    marginTop: 4,
    paddingLeft: 14,
    paddingRight: 6,
    paddingVertical: 6,
    minHeight: 54,
    borderRadius: 28,
    borderWidth: StyleSheet.hairlineWidth,
  },
  input: { flex: 1, fontSize: 16, maxHeight: 110, paddingVertical: 8 },
  sendButton: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
});

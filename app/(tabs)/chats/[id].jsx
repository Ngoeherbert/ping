import { useEffect, useMemo, useRef, useState } from "react";
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
import * as Haptics from "expo-haptics";
import * as Clipboard from "expo-clipboard";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useTheme } from "../../../src/theme/useTheme";
import {
  glassBubbles,
  glassColors,
  DEFAULT_WALLPAPER,
} from "../../../src/theme/chatTheme";
import Avatar from "../../../src/components/Avatar";
import ChatMessage from "../../../src/components/ChatMessage";
import ChatHeader from "../../../src/components/ChatHeader";
import ChatComposer from "../../../src/components/ChatComposer";
import ChatBackground from "../../../src/components/ChatBackground";
import ReactionPills from "../../../src/components/ReactionPills";
import MessageActionSheet from "../../../src/components/Messageactionsheet";
import EmojiBurst, { detectBurst } from "../../../src/components/EmojiBurst";
import { BackIcon } from "../../../src/components/Icons";
import { BubbleStyleProvider } from "../../../src/components/BubbleShell";
import { getConversation } from "../../../src/data/chats";

const AVATAR = 34;
const GUTTER = 40; // room on the left of received group messages for the avatar

// Swipe-to-reply tuning
const REPLY_THRESHOLD = 56; // px the row must travel before a release counts as a reply
const MAX_SWIPE = 84;
const EDGE_GUARD = 32; // px at each screen edge reserved for the system back gesture

// Message types that draw their own time (and ticks) inside the bubble, so the
// time label above the run would just repeat it.
const OWN_TIME_TYPES = new Set(["viewOnce"]);

const TYPE_LABEL = {
  image: "Photo",
  video: "Video",
  voice: "Voice message",
  viewOnce: "View once",
  photos: "Photos",
};

// Short text shown in the reply bar, the quoted line and the action sheet
const previewOf = (m) =>
  !m.type || m.type === "text"
    ? m.text
    : m.caption || TYPE_LABEL[m.type] || "Message";

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

// Add an emoji to a message's reactions, or remove it if it's already there.
// Assumes reactions look like [{ emoji: "🔥", count: 1 }] - adjust to match
// whatever ReactionPills expects.
function toggleReaction(reactions = [], emoji) {
  const has = reactions.some((r) => r.emoji === emoji);
  return has
    ? reactions.filter((r) => r.emoji !== emoji)
    : [...reactions, { emoji, count: 1 }];
}

// Haptics must run on the JS thread, so gesture worklets call these via runOnJS
const lightTick = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

// Wraps one message: drag toward the centre to reply (right for received,
// left for sent), press and hold for the action sheet.
function SwipeRow({
  children,
  isMine,
  onReply,
  onLongPress,
  iconColor,
  iconBg,
}) {
  const dir = isMine ? -1 : 1;
  const x = useSharedValue(0);
  const armed = useSharedValue(false);

  const pan = Gesture.Pan()
    // don't start in the edge strips, so the back swipe never triggers a reply
    .hitSlop({ left: -EDGE_GUARD, right: -EDGE_GUARD })
    .activeOffsetX(isMine ? [-14, 9999] : [-9999, 14]) // only start in our direction
    .failOffsetY([-10, 10]) // let the list scroll vertically
    .onUpdate((e) => {
      const raw = Math.max(0, dir * e.translationX);
      // rubber-band once past the threshold
      const t =
        raw <= REPLY_THRESHOLD
          ? raw
          : REPLY_THRESHOLD + (raw - REPLY_THRESHOLD) * 0.3;
      x.value = dir * Math.min(t, MAX_SWIPE);

      const dist = Math.abs(x.value);
      if (dist >= REPLY_THRESHOLD && !armed.value) {
        armed.value = true;
        runOnJS(lightTick)(); // buzz once when the reply is "armed"
      } else if (dist < REPLY_THRESHOLD - 8 && armed.value) {
        armed.value = false;
      }
    })
    .onEnd((_e, success) => {
      if (success && armed.value) runOnJS(onReply)();
    })
    .onFinalize(() => {
      armed.value = false;
      x.value = withSpring(0, { damping: 18, stiffness: 220 });
    });

  const hold = Gesture.LongPress()
    .minDuration(380)
    .onStart(() => {
      runOnJS(onLongPress)();
    });

  const gesture = Gesture.Race(pan, hold);

  const rowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }],
  }));
  const iconStyle = useAnimatedStyle(() => {
    const dist = Math.abs(x.value);
    return {
      opacity: interpolate(
        dist,
        [10, REPLY_THRESHOLD],
        [0, 1],
        Extrapolation.CLAMP,
      ),
      transform: [
        {
          scale: interpolate(
            dist,
            [10, REPLY_THRESHOLD],
            [0.4, 1],
            Extrapolation.CLAMP,
          ),
        },
      ],
    };
  });

  return (
    <GestureDetector gesture={gesture}>
      <View>
        <Animated.View
          pointerEvents="none"
          style={[
            styles.replyIcon,
            isMine ? styles.replyIconRight : styles.replyIconLeft,
            { backgroundColor: iconBg },
            iconStyle,
          ]}
        >
          <BackIcon color={iconColor} size={18} />
        </Animated.View>
        <Animated.View style={rowStyle}>{children}</Animated.View>
      </View>
    </GestureDetector>
  );
}

// Shown above the composer once a reply is started
function ReplyBar({ reply, glass, colors, onClear }) {
  return (
    <View
      style={[
        styles.replyBar,
        { backgroundColor: glass ? "rgba(0,0,0,0.35)" : colors.surface },
      ]}
    >
      <View style={[styles.replyAccent, { backgroundColor: colors.primary }]} />
      <View style={styles.flex}>
        <Text
          style={[styles.replyName, { color: colors.primary }]}
          numberOfLines={1}
        >
          {reply.sender}
        </Text>
        <Text
          style={[
            styles.replyText,
            { color: glass ? glassColors.muted : colors.textMuted },
          ]}
          numberOfLines={1}
        >
          {reply.text}
        </Text>
      </View>
      <Pressable
        onPress={onClear}
        accessibilityRole="button"
        accessibilityLabel="Cancel reply"
        hitSlop={10}
      >
        <Text
          style={[styles.closeText, { color: glass ? "#fff" : colors.text }]}
        >
          ✕
        </Text>
      </Pressable>
    </View>
  );
}

export default function ChatThreadScreen() {
  const { id } = useLocalSearchParams();
  const conversation = getConversation(id);
  const { colors } = useTheme();
  const [messages, setMessages] = useState(conversation?.messages ?? []);
  const [draft, setDraft] = useState("");
  const [actionMsg, setActionMsg] = useState(null); // message shown in the action sheet
  const [replyTo, setReplyTo] = useState(null);
  const [burst, setBurst] = useState(null); // { id, emojis } while an emoji burst plays

  const playBurst = (text) => {
    const emojis = detectBurst(text);
    if (emojis) setBurst({ id: Date.now(), emojis });
  };

  // Also celebrate when a matching message arrives from the other side
  const prevCount = useRef(messages.length);
  useEffect(() => {
    const last = messages[messages.length - 1];
    if (messages.length > prevCount.current && last && !last.isMine) {
      playBurst(last.text ?? last.caption);
    }
    prevCount.current = messages.length;
  }, [messages]);

  const isGroup = !!conversation?.isGroup;
  // Every chat gets the glass look. Give a chat its own `wallpaper` URL, or
  // set `wallpaper: false` on it to fall back to the plain theme background.
  const wallpaper =
    conversation?.wallpaper === false
      ? null
      : (conversation?.wallpaper ?? DEFAULT_WALLPAPER);
  const hasWallpaper = !!wallpaper;

  // Inverted list: newest message at the bottom, stays pinned there
  const items = useMemo(
    () => decorate(messages, isGroup).reverse(),
    [messages, isGroup],
  );

  const nameOf = (m) =>
    m.isMine ? "You" : (m.sender ?? conversation?.name ?? "");

  const startReply = (m) => {
    setReplyTo({ id: m.id, sender: nameOf(m), text: previewOf(m) });
  };

  const openActions = (m) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setActionMsg(m);
  };

  const reactTo = (m, emoji) => {
    Haptics.selectionAsync();
    setMessages((prev) =>
      prev.map((x) =>
        x.id === m.id
          ? { ...x, reactions: toggleReaction(x.reactions, emoji) }
          : x,
      ),
    );
  };

  const copyMessage = async (m) => {
    await Clipboard.setStringAsync(previewOf(m) ?? "");
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const forwardMessage = (m) => {
    // TODO: open your contact picker, e.g. router.push({ pathname: "/forward", params: { id: m.id } })
  };

  const deleteMessage = (m) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setMessages((prev) => prev.filter((x) => x.id !== m.id));
    if (replyTo?.id === m.id) setReplyTo(null);
  };

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    setMessages((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        type: "text",
        text,
        isMine: true,
        time: "Now",
        status: "sent", // "sent" | "delivered" | "read"
        ...(replyTo ? { replyTo } : null),
      },
    ]);
    playBurst(text);
    setDraft("");
    setReplyTo(null);
  };

  if (!conversation) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          styles.center,
          { backgroundColor: colors.background },
        ]}
      >
        <Text style={{ color: colors.text, fontSize: 16 }}>Chat not found</Text>
        <Pressable onPress={() => router.back()} style={{ padding: 12 }}>
          <Text style={{ color: colors.primary, fontWeight: "600" }}>
            Go back
          </Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const avatarFor = (name) =>
    conversation.members?.find((m) => m.name === name)?.avatar;
  const labelColor = hasWallpaper ? glassColors.muted : colors.textMuted;
  const replyIconColor = hasWallpaper ? "#fff" : colors.text;
  const replyIconBg = hasWallpaper ? "rgba(255,255,255,0.18)" : colors.surface;

  const renderItem = ({ item }) => {
    const theirsInGroup = isGroup && !item.isMine;
    const side = item.isMine ? styles.timeMine : styles.timeTheirs;
    const showDateLabel = item.showDate && !OWN_TIME_TYPES.has(item.type);

    return (
      <SwipeRow
        isMine={item.isMine}
        onReply={() => startReply(item)}
        onLongPress={() => openActions(item)}
        iconColor={replyIconColor}
        iconBg={replyIconBg}
      >
        <View>
          <View style={theirsInGroup ? { paddingLeft: GUTTER } : null}>
            {showDateLabel && (
              <Text
                style={[
                  styles.time,
                  styles.dateAbove,
                  { color: labelColor },
                  side,
                ]}
              >
                {item.time}
              </Text>
            )}

            {item.showName && item.type !== "text" && (
              <Text
                style={[styles.senderAbove, { color: labelColor }]}
                numberOfLines={1}
              >
                {item.sender}
              </Text>
            )}

            {item.replyTo ? (
              <View
                style={[
                  styles.quote,
                  item.isMine ? styles.quoteMine : styles.quoteTheirs,
                  { borderLeftColor: colors.primary },
                ]}
              >
                <Text
                  style={[styles.quoteName, { color: colors.primary }]}
                  numberOfLines={1}
                >
                  {item.replyTo.sender}
                </Text>
                <Text
                  style={[styles.quoteText, { color: labelColor }]}
                  numberOfLines={1}
                >
                  {item.replyTo.text}
                </Text>
              </View>
            ) : null}

            <ChatMessage message={item} />

            {item.type !== "photos" && item.reactions?.length ? (
              <View
                style={[
                  styles.reactionRow,
                  item.isMine ? styles.reactionMine : styles.reactionTheirs,
                ]}
              >
                <ReactionPills
                  reactions={item.reactions}
                  isMine={item.isMine}
                />
              </View>
            ) : null}
          </View>

          {theirsInGroup && item.showTail && (
            <View style={styles.avatarSlot}>
              <Avatar
                uri={avatarFor(item.sender)}
                name={item.sender}
                size={AVATAR}
              />
            </View>
          )}
        </View>
      </SwipeRow>
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

      {replyTo ? (
        <ReplyBar
          reply={replyTo}
          glass={hasWallpaper}
          colors={colors}
          onClear={() => setReplyTo(null)}
        />
      ) : null}
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
        {
          backgroundColor: hasWallpaper ? glassColors.base : colors.background,
        },
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

      <EmojiBurst burst={burst} onDone={() => setBurst(null)} />

      <MessageActionSheet
        message={actionMsg}
        preview={actionMsg ? previewOf(actionMsg) : ""}
        colors={colors}
        onClose={() => setActionMsg(null)}
        onReact={reactTo}
        onCopy={copyMessage}
        onReply={startReply}
        onForward={forwardMessage}
        onDelete={deleteMessage}
      />
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
  senderAbove: {
    fontSize: 12.5,
    paddingLeft: 22,
    marginTop: 4,
    marginBottom: 2,
  },
  reactionRow: {
    flexDirection: "row",
    paddingHorizontal: 24,
    marginTop: -6,
    marginBottom: 4,
  },
  reactionMine: { justifyContent: "flex-end" },
  reactionTheirs: { justifyContent: "flex-start" },
  avatarSlot: { position: "absolute", left: 14, bottom: 4 },

  // swipe to reply
  replyIcon: {
    position: "absolute",
    top: "50%",
    marginTop: -16,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  replyIconLeft: { left: 14 },
  replyIconRight: { right: 14 },
  closeText: { fontSize: 18, fontWeight: "600" },

  // reply bar above the composer
  replyBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 12,
    marginBottom: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  replyAccent: { width: 3, alignSelf: "stretch", borderRadius: 2 },
  replyName: { fontSize: 13, fontWeight: "700" },
  replyText: { fontSize: 13.5, marginTop: 1 },

  // quoted line above a reply in the thread
  quote: {
    maxWidth: "70%",
    borderLeftWidth: 3,
    paddingLeft: 8,
    marginTop: 4,
    marginBottom: 2,
  },
  quoteMine: { alignSelf: "flex-end", marginRight: 22 },
  quoteTheirs: { alignSelf: "flex-start", marginLeft: 22 },
  quoteName: { fontSize: 12, fontWeight: "700" },
  quoteText: { fontSize: 12.5 },
});

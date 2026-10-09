import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  BackHandler,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
} from "react-native-reanimated";
import { useTheme } from "../../../src/theme/useTheme";
import Avatar from "../../../src/components/Avatar";
import GlassButton from "../../../src/components/GlassButton";
import {
  BackIcon,
  SearchIcon,
  addChat as AddChatIcon,
} from "../../../src/components/Icons";
import { CONVERSATIONS } from "../../../src/data/chats";
import { messagePreview } from "../../../src/utils/messagePreview";

const MAX_PINS = 3;

// Swipe action colors (iMessage style)
const ACTION_BLUE = "#0A84FF";
const ACTION_GRAY = "#8E8E93";
const ACTION_RED = "#FF3B30";
const SEEN_BLUE = "#34B7F1";
const NOTICE_MS = 4000;

// Two 76px action cells on the right (archive + delete)
const RIGHT_ACTIONS_WIDTH = 152;
// How far past the open actions you must drag before it counts as a "full swipe"
const FULL_SWIPE_EXTRA = 70;

// Works with either `type: "direct" | "group" | "channel"` or isGroup / isChannel flags.
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

/* ---------- Small View-built glyphs ---------- */

function PinGlyph({ color, size = 1 }) {
  return (
    <View
      style={{
        width: 14 * size,
        height: 14 * size,
        alignItems: "center",
        justifyContent: "center",
        transform: [{ rotate: "45deg" }],
      }}
    >
      <View
        style={{
          width: 8 * size,
          height: 5 * size,
          borderRadius: 2,
          backgroundColor: color,
        }}
      />
      <View
        style={{
          width: 11 * size,
          height: 2 * size,
          borderRadius: 1,
          backgroundColor: color,
        }}
      />
      <View
        style={{
          width: 1.6 * size,
          height: 5 * size,
          backgroundColor: color,
        }}
      />
    </View>
  );
}

function MuteGlyph({ color, size = 1 }) {
  return (
    <View
      style={{
        width: 15 * size,
        height: 15 * size,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <View
        style={{
          width: 10 * size,
          height: 9 * size,
          borderWidth: 1.5,
          borderColor: color,
          borderTopLeftRadius: 6,
          borderTopRightRadius: 6,
          borderBottomLeftRadius: 1,
          borderBottomRightRadius: 1,
        }}
      />
      <View
        style={{
          width: 4 * size,
          height: 2 * size,
          marginTop: 1,
          borderBottomLeftRadius: 2,
          borderBottomRightRadius: 2,
          backgroundColor: color,
        }}
      />
      <View
        style={{
          position: "absolute",
          width: 17 * size,
          height: 1.6,
          backgroundColor: color,
          transform: [{ rotate: "-45deg" }],
        }}
      />
    </View>
  );
}

function ArchiveGlyph({ color }) {
  return (
    <View style={{ width: 20, height: 18, alignItems: "center" }}>
      <View
        style={{
          width: 20,
          height: 6,
          borderWidth: 1.8,
          borderColor: color,
          borderRadius: 2,
        }}
      />
      <View
        style={{
          width: 16,
          height: 11,
          borderWidth: 1.8,
          borderTopWidth: 0,
          borderColor: color,
          borderBottomLeftRadius: 3,
          borderBottomRightRadius: 3,
          alignItems: "center",
        }}
      >
        <View
          style={{
            width: 6,
            height: 1.8,
            marginTop: 2.5,
            borderRadius: 1,
            backgroundColor: color,
          }}
        />
      </View>
    </View>
  );
}

function TrashGlyph({ color }) {
  return (
    <View style={{ width: 18, height: 21, alignItems: "center" }}>
      <View
        style={{
          width: 7,
          height: 3,
          borderWidth: 1.6,
          borderBottomWidth: 0,
          borderColor: color,
          borderTopLeftRadius: 2,
          borderTopRightRadius: 2,
        }}
      />
      <View
        style={{
          width: 18,
          height: 2.2,
          borderRadius: 1,
          backgroundColor: color,
        }}
      />
      <View
        style={{
          width: 14,
          height: 14,
          marginTop: 1,
          borderWidth: 1.8,
          borderTopWidth: 0,
          borderColor: color,
          borderBottomLeftRadius: 3,
          borderBottomRightRadius: 3,
        }}
      />
    </View>
  );
}

// Chat bubble with a dot (mark unread) or a check (mark read)
function UnreadGlyph({ color, read }) {
  return (
    <View style={[styles.unreadBubble, { borderColor: color }]}>
      {read ? (
        <Text style={[styles.unreadMark, { color }]}>✓</Text>
      ) : (
        <View style={[styles.unreadDot, { backgroundColor: color }]} />
      )}
    </View>
  );
}

/* ---------- Message status ticks ---------- */

// One tick = rotated "L" made of two borders
function Tick({ color, left = 0 }) {
  return (
    <View
      style={{
        position: "absolute",
        left,
        top: 0,
        width: 5,
        height: 9,
        borderRightWidth: 1.6,
        borderBottomWidth: 1.6,
        borderColor: color,
        transform: [{ rotate: "45deg" }],
      }}
    />
  );
}

// status: "sent" -> 1 gray tick, "delivered" -> 2 gray ticks, "seen" -> 2 blue ticks
function MessageTicks({ status, mutedColor }) {
  const seen = status === "seen";
  const double = status === "delivered" || seen;
  const color = seen ? SEEN_BLUE : mutedColor;

  return (
    <View
      style={{ width: double ? 17 : 12, height: 12, justifyContent: "center" }}
      accessibilityLabel={seen ? "Seen" : double ? "Delivered" : "Sent"}
    >
      <View style={{ height: 11, marginTop: -1 }}>
        <Tick color={color} left={3} />
        {double ? <Tick color={color} left={8} /> : null}
      </View>
    </View>
  );
}

/* ---------- Message type icons (camera / video camera / mic) ---------- */

function CameraGlyph({ color }) {
  return (
    <View style={{ width: 15, height: 13, alignItems: "center" }}>
      <View
        style={{
          width: 6,
          height: 2.5,
          backgroundColor: color,
          borderTopLeftRadius: 1.5,
          borderTopRightRadius: 1.5,
        }}
      />
      <View
        style={{
          width: 15,
          height: 10.5,
          borderWidth: 1.5,
          borderColor: color,
          borderRadius: 3,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <View
          style={{
            width: 5.5,
            height: 5.5,
            borderRadius: 3,
            borderWidth: 1.5,
            borderColor: color,
          }}
        />
      </View>
    </View>
  );
}

function VideoCameraGlyph({ color }) {
  return (
    <View
      style={{
        width: 17,
        height: 12,
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      <View
        style={{
          width: 11.5,
          height: 10,
          borderRadius: 2.5,
          backgroundColor: color,
        }}
      />
      <View
        style={{
          width: 0,
          height: 0,
          marginLeft: 0.5,
          borderTopWidth: 3.5,
          borderBottomWidth: 3.5,
          borderRightWidth: 5,
          borderTopColor: "transparent",
          borderBottomColor: "transparent",
          borderRightColor: color,
        }}
      />
    </View>
  );
}

function MicGlyph({ color }) {
  return (
    <View style={{ width: 12, height: 15, alignItems: "center" }}>
      <View
        style={{
          width: 6,
          height: 9,
          borderRadius: 3,
          backgroundColor: color,
        }}
      />
      <View
        style={{
          width: 10,
          height: 5,
          marginTop: -4,
          borderWidth: 1.5,
          borderTopWidth: 0,
          borderColor: color,
          borderBottomLeftRadius: 5,
          borderBottomRightRadius: 5,
        }}
      />
      <View style={{ width: 1.5, height: 2, backgroundColor: color }} />
    </View>
  );
}

function MediaIcon({ kind, color }) {
  if (kind === "photo") return <CameraGlyph color={color} />;
  if (kind === "video") return <VideoCameraGlyph color={color} />;
  if (kind === "voice") return <MicGlyph color={color} />;
  return null;
}

function formatDuration(sec) {
  if (sec == null) return "";
  const m = Math.floor(sec / 60);
  const s = String(Math.floor(sec % 60)).padStart(2, "0");
  return `${m}:${s}`;
}

// Returns { kind, text } where kind decides the icon shown before the text
function getPreview(m) {
  switch (m.type) {
    case "image":
      return { kind: "photo", text: m.caption || "Photo" };
    case "photos": {
      const n = m.total ?? m.uris?.length ?? 1;
      return { kind: "photo", text: n > 1 ? `${n} photos` : "Photo" };
    }
    case "video":
      return { kind: "video", text: m.caption || "Video" };
    case "voice":
      return {
        kind: "voice",
        text: formatDuration(m.duration) || "Voice message",
      };
    case "viewOnce": {
      const kind = m.kind === "video" ? "video" : "photo";
      return {
        kind,
        text: m.opened ? "Opened" : kind === "video" ? "Video" : "Photo",
      };
    }
    default:
      return { kind: null, text: messagePreview(m) };
  }
}

/* ---------- Filter tabs ---------- */

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
          const count = tab.key === "unread" ? unreadCount : 0;
          const showCount = count > 0;
          return (
            <Pressable
              key={tab.key}
              onPress={() => onChange(tab.key)}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              accessibilityLabel={
                showCount ? `${tab.label}, ${count} chats` : tab.label
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
                    {count}
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

/* ---------- Conversation row ---------- */

function ConversationRow({ item, onLongPress }) {
  const { colors } = useTheme();
  const last = item.messages[item.messages.length - 1];
  const hasUnread = item.unread > 0;
  const preview = getPreview(last);
  const previewColor = hasUnread ? colors.text : colors.textMuted;
  // Only messages I sent show ticks. Set `status` on a message to
  // "sent" | "delivered" | "seen"; it defaults to "sent" (1 tick).
  const status = last.status ?? "sent";

  return (
    <Pressable
      onPress={() => router.push(`/chats/${item.id}`)}
      onLongPress={onLongPress}
      delayLongPress={300}
      accessibilityRole="button"
      accessibilityLabel={`Open chat with ${item.name}${
        item.pinned ? ", pinned" : ""
      }${item.muted ? ", muted" : ""}`}
      accessibilityHint="Long press for pin, mute and archive"
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
        <View style={styles.nameLine}>
          <Text
            style={[styles.name, { color: colors.text, flexShrink: 1 }]}
            numberOfLines={1}
          >
            {item.name}
          </Text>
          {item.muted ? <MuteGlyph color={colors.textMuted} /> : null}
        </View>
        <View style={styles.previewLine}>
          {last.isMine ? (
            <MessageTicks status={status} mutedColor={colors.textMuted} />
          ) : null}
          {preview.kind ? (
            <MediaIcon kind={preview.kind} color={previewColor} />
          ) : null}
          <Text
            style={[
              styles.preview,
              { color: previewColor },
              hasUnread && { fontWeight: "600" },
            ]}
            numberOfLines={1}
          >
            {preview.text}
          </Text>
        </View>
      </View>

      <View style={styles.right}>
        <Text
          style={[
            styles.time,
            {
              color:
                hasUnread && !item.muted ? colors.primary : colors.textMuted,
            },
          ]}
        >
          {last.time}
        </Text>
        <View style={styles.rightBottom}>
          {item.pinned ? <PinGlyph color={colors.textMuted} /> : null}
          {hasUnread ? (
            <View
              style={[
                styles.badge,
                {
                  backgroundColor: item.muted
                    ? colors.textMuted
                    : colors.primary,
                },
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  { color: item.muted ? colors.background : colors.onPrimary },
                ]}
              >
                {item.unread}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

/* ---------- Swipe actions (iMessage style) ---------- */

// Round icon button that scales / fades in as the row is dragged open
function ActionButton({ progress, color, label, onPress, children }) {
  const animated = useAnimatedStyle(() => ({
    opacity: interpolate(
      progress.value,
      [0, 0.6, 1],
      [0, 0.6, 1],
      Extrapolation.CLAMP,
    ),
    transform: [
      {
        scale: interpolate(
          progress.value,
          [0, 1],
          [0.6, 1],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  return (
    <View style={styles.actionCell}>
      <Animated.View style={animated}>
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={label}
          style={[styles.actionCircle, { backgroundColor: color }]}
        >
          {children}
        </Pressable>
      </Animated.View>
    </View>
  );
}

// Tells the parent (via onChange) when the row is dragged past the full-swipe line
function FullSwipeWatcher({ translation, threshold, onChange }) {
  useAnimatedReaction(
    () => translation.value <= -threshold,
    (isFull, wasFull) => {
      if (isFull !== wasFull) runOnJS(onChange)(isFull);
    },
    [threshold],
  );
  return null;
}

// Right actions: archive + delete. Dragging all the way turns the whole
// revealed area into a gray "Archive" strip and archives on release.
function RightActions({
  item,
  progress,
  translation,
  onFullChange,
  onArchivePress,
  onDeletePress,
}) {
  const { width } = useWindowDimensions();
  const fullAt = RIGHT_ACTIONS_WIDTH + FULL_SWIPE_EXTRA;

  const bgStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translation.value,
      [-fullAt, -RIGHT_ACTIONS_WIDTH],
      [1, 0],
      Extrapolation.CLAMP,
    ),
  }));
  const glyphStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translation.value + 60 }],
  }));
  const deleteFade = useAnimatedStyle(() => ({
    opacity: interpolate(
      translation.value,
      [-fullAt, -RIGHT_ACTIONS_WIDTH],
      [0, 1],
      Extrapolation.CLAMP,
    ),
  }));

  return (
    <View style={styles.actionsRow}>
      <FullSwipeWatcher
        translation={translation}
        threshold={fullAt}
        onChange={onFullChange}
      />
      <Animated.View
        pointerEvents="none"
        style={[styles.fullSwipeBg, { width }, bgStyle]}
      >
        <Animated.View style={[styles.fullSwipeGlyph, glyphStyle]}>
          <ArchiveGlyph color="#fff" />
          <Text style={styles.fullSwipeText}>
            {item.archived ? "Unarchive" : "Archive"}
          </Text>
        </Animated.View>
      </Animated.View>

      <ActionButton
        progress={progress}
        color={ACTION_GRAY}
        label={item.archived ? "Unarchive chat" : "Archive chat"}
        onPress={onArchivePress}
      >
        <ArchiveGlyph color="#fff" />
      </ActionButton>
      <Animated.View style={deleteFade}>
        <ActionButton
          progress={progress}
          color={ACTION_RED}
          label="Delete chat"
          onPress={onDeletePress}
        >
          <TrashGlyph color="#fff" />
        </ActionButton>
      </Animated.View>
    </View>
  );
}

// Swipe right: mark read / unread.
// Swipe left: archive + delete buttons; swipe ALL the way left to archive.
function SwipeableConversation({
  item,
  onLongPress,
  onToggleRead,
  onArchive,
  onDelete,
  onWillOpen,
}) {
  const { colors } = useTheme();
  const ref = useRef(null);
  const fullSwipe = useRef(false);
  const close = () => ref.current?.close();
  const isUnread = item.unread > 0;

  const handleFullChange = (isFull) => {
    fullSwipe.current = isFull;
    if (isFull) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <ReanimatedSwipeable
      ref={ref}
      friction={1.6}
      overshootLeft={false}
      overshootRight // allow dragging past the buttons for the full swipe
      leftThreshold={36}
      rightThreshold={36}
      onSwipeableWillOpen={() => {
        if (fullSwipe.current) {
          // released past the full-swipe line -> archive
          fullSwipe.current = false;
          onArchive(item);
          return;
        }
        onWillOpen(ref);
      }}
      renderLeftActions={(progress) => (
        <View style={styles.actionsRow}>
          <ActionButton
            progress={progress}
            color={ACTION_BLUE}
            label={isUnread ? "Mark as read" : "Mark as unread"}
            onPress={() => {
              close();
              onToggleRead(item);
            }}
          >
            <UnreadGlyph color="#fff" read={isUnread} />
          </ActionButton>
        </View>
      )}
      renderRightActions={(progress, translation) => (
        <RightActions
          item={item}
          progress={progress}
          translation={translation}
          onFullChange={handleFullChange}
          onArchivePress={() => {
            close();
            onArchive(item);
          }}
          onDeletePress={() => {
            close();
            onDelete(item);
          }}
        />
      )}
    >
      {/* opaque background so the actions don't show through the row */}
      <View style={{ backgroundColor: colors.background }}>
        <ConversationRow item={item} onLongPress={onLongPress} />
      </View>
    </ReanimatedSwipeable>
  );
}

/* ---------- "Archived" row at the top of the list ---------- */

function ArchivedRow({ count, onPress }) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Archived chats, ${count}`}
      style={({ pressed }) => [
        styles.row,
        pressed && { backgroundColor: colors.surface },
      ]}
    >
      <View style={[styles.archiveIcon, { backgroundColor: colors.surface }]}>
        <ArchiveGlyph color={colors.textMuted} />
      </View>
      <View style={styles.middle}>
        <Text style={[styles.name, { color: colors.text }]}>Archived</Text>
      </View>
      <Text style={[styles.archivedCount, { color: colors.textMuted }]}>
        {count}
      </Text>
    </Pressable>
  );
}

/* ---------- Long-press action sheet ---------- */

function ActionRow({ icon, label, onPress, colors, destructive }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.sheetRow,
        pressed && { backgroundColor: colors.background },
      ]}
    >
      <View style={styles.sheetIcon}>{icon}</View>
      <Text
        style={[
          styles.sheetLabel,
          { color: destructive ? "#FF3B30" : colors.text },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function ChatActionSheet({ chat, onClose, onPin, onMute, onArchive }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={!!chat}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        style={styles.backdrop}
        onPress={onClose}
        accessibilityLabel="Close menu"
      >
        <Pressable
          // swallow taps so only the backdrop closes the sheet
          onPress={() => {}}
          style={[
            styles.sheet,
            {
              backgroundColor: colors.surface,
              paddingBottom: insets.bottom + 12,
            },
          ]}
        >
          <View style={styles.sheetHandle} />

          {chat ? (
            <>
              <View style={styles.sheetHeader}>
                <Avatar
                  uri={chat.avatar}
                  name={chat.name}
                  size={40}
                  online={false}
                />
                <Text
                  style={[styles.sheetTitle, { color: colors.text }]}
                  numberOfLines={1}
                >
                  {chat.name}
                </Text>
              </View>

              <ActionRow
                colors={colors}
                icon={<PinGlyph color={colors.text} size={1.3} />}
                label={chat.pinned ? "Unpin chat" : "Pin chat"}
                onPress={onPin}
              />
              <ActionRow
                colors={colors}
                icon={<MuteGlyph color={colors.text} size={1.2} />}
                label={
                  chat.muted ? "Unmute notifications" : "Mute notifications"
                }
                onPress={onMute}
              />
              <ActionRow
                colors={colors}
                icon={<ArchiveGlyph color={colors.text} />}
                label={chat.archived ? "Unarchive chat" : "Archive chat"}
                onPress={onArchive}
              />
            </>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/* ---------- Empty state ---------- */

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
    archived: {
      title: "No archived chats",
      body: "Long press a chat and choose Archive to tuck it away.",
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

/* ---------- Screen ---------- */

export default function ChatsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState("all");
  const [showArchived, setShowArchived] = useState(false); // archived list view

  const [flags, setFlags] = useState(() =>
    Object.fromEntries(
      CONVERSATIONS.map((c) => [
        c.id,
        {
          pinned: !!c.pinned,
          muted: !!c.muted,
          archived: !!c.archived,
          deleted: false,
        },
      ]),
    ),
  );
  const [menuId, setMenuId] = useState(null);
  const [notice, setNotice] = useState(null); // { text, undo? }
  const noticeTimer = useRef(null);

  useEffect(() => () => clearTimeout(noticeTimer.current), []);

  const conversations = useMemo(
    () =>
      CONVERSATIONS.map((c) => ({ ...c, ...flags[c.id] })).filter(
        (c) => !c.deleted,
      ),
    [flags],
  );

  // keep only one swiped row open at a time
  const openRow = useRef(null);
  const handleWillOpen = (ref) => {
    if (openRow.current && openRow.current !== ref.current) {
      openRow.current.close();
    }
    openRow.current = ref.current;
  };

  const unreadCount = useMemo(
    () => conversations.filter((c) => !c.archived && c.unread > 0).length,
    [conversations],
  );
  const archivedCount = useMemo(
    () => conversations.filter((c) => c.archived).length,
    [conversations],
  );

  const data = useMemo(() => {
    const tab = TABS.find((t) => t.key === activeTab) ?? TABS[0];
    const list = conversations.filter((c) =>
      showArchived ? c.archived : !c.archived && tab.match(c),
    );
    // pinned chats float to the top, everything else keeps its order
    return [...list.filter((c) => c.pinned), ...list.filter((c) => !c.pinned)];
  }, [conversations, activeTab, showArchived]);

  // Leave the archived view when its last chat is unarchived
  useEffect(() => {
    if (showArchived && archivedCount === 0) setShowArchived(false);
  }, [showArchived, archivedCount]);

  // Android back closes the archived view first
  useEffect(() => {
    if (!showArchived) return undefined;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      setShowArchived(false);
      return true;
    });
    return () => sub.remove();
  }, [showArchived]);

  const menuChat = conversations.find((c) => c.id === menuId) ?? null;

  const patch = (id, change) =>
    setFlags((prev) => ({ ...prev, [id]: { ...prev[id], ...change } }));

  const showNotice = (text, undo) => {
    clearTimeout(noticeTimer.current);
    setNotice({ text, undo });
    noticeTimer.current = setTimeout(() => setNotice(null), NOTICE_MS);
  };

  const togglePin = () => {
    const c = menuChat;
    if (!c) return;
    const pinnedNow = conversations.filter((x) => x.pinned).length;
    if (!c.pinned && pinnedNow >= MAX_PINS) {
      setMenuId(null);
      Alert.alert(
        "Pin limit reached",
        `You can pin up to ${MAX_PINS} chats. Unpin one to pin another.`,
      );
      return;
    }
    Haptics.selectionAsync();
    patch(c.id, { pinned: !c.pinned });
    setMenuId(null);
    showNotice(c.pinned ? "Chat unpinned" : "Chat pinned");
  };

  const toggleMute = () => {
    const c = menuChat;
    if (!c) return;
    Haptics.selectionAsync();
    patch(c.id, { muted: !c.muted });
    setMenuId(null);
    showNotice(c.muted ? "Notifications on" : "Chat muted");
  };

  const archiveChat = (c) => {
    if (!c) return;
    Haptics.selectionAsync();
    const was = c.archived;
    // archiving also unpins, like most messengers
    patch(c.id, was ? { archived: false } : { archived: true, pinned: false });
    setMenuId(null);
    showNotice(was ? "Chat unarchived" : "Chat archived", () =>
      patch(
        c.id,
        was ? { archived: true } : { archived: false, pinned: c.pinned },
      ),
    );
  };

  const toggleArchive = () => archiveChat(menuChat);

  const toggleRead = (c) => {
    Haptics.selectionAsync();
    patch(c.id, { unread: c.unread > 0 ? 0 : 1 });
  };

  const deleteChat = (c) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    patch(c.id, { deleted: true });
    showNotice("Chat deleted", () => patch(c.id, { deleted: false }));
  };

  // Tabs (and the Archived row) live in the list header so they scroll away
  // with the chats instead of staying pinned under the title.
  const listHeader = showArchived ? null : (
    <View>
      <FilterTabs
        active={activeTab}
        onChange={setActiveTab}
        unreadCount={unreadCount}
      />
      {activeTab === "all" && archivedCount > 0 ? (
        <ArchivedRow
          count={archivedCount}
          onPress={() => setShowArchived(true)}
        />
      ) : null}
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {showArchived ? (
            <GlassButton
              size={44}
              label="Back to chats"
              onPress={() => setShowArchived(false)}
            >
              <BackIcon color={colors.text} size={22} />
            </GlassButton>
          ) : null}
          <Text style={[styles.title, { color: colors.text }]}>
            {showArchived ? "Archived" : "Chats"}
          </Text>
        </View>
        <GlassButton size={44} label="Search chats">
          <SearchIcon color={colors.text} size={22} />
        </GlassButton>
      </View>

      <FlatList
        data={data}
        keyExtractor={(c) => c.id}
        renderItem={({ item }) => (
          <SwipeableConversation
            item={item}
            onWillOpen={handleWillOpen}
            onToggleRead={toggleRead}
            onArchive={archiveChat}
            onDelete={deleteChat}
            onLongPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setMenuId(item.id);
            }}
          />
        )}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          <EmptyState tab={showArchived ? "archived" : activeTab} />
        }
        // room for the floating glass tab bar and the FAB
        contentContainerStyle={{
          paddingBottom: insets.bottom + 170,
          flexGrow: 1,
        }}
      />

      {notice ? (
        <View
          style={[
            styles.notice,
            { bottom: insets.bottom + 100, backgroundColor: colors.text },
          ]}
        >
          <Text style={[styles.noticeText, { color: colors.background }]}>
            {notice.text}
          </Text>
          {notice.undo ? (
            <Pressable
              onPress={() => {
                notice.undo();
                clearTimeout(noticeTimer.current);
                setNotice(null);
              }}
              accessibilityRole="button"
              accessibilityLabel="Undo"
              hitSlop={10}
            >
              <Text style={[styles.noticeUndo, { color: colors.primary }]}>
                Undo
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

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

      <ChatActionSheet
        chat={menuChat}
        onClose={() => setMenuId(null)}
        onPin={togglePin}
        onMute={toggleMute}
        onArchive={toggleArchive}
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
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  title: { fontSize: 26, fontWeight: "700" },

  archiveIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
  },
  archivedCount: { fontSize: 14, fontWeight: "600" },

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
  nameLine: { flexDirection: "row", alignItems: "center", gap: 6 },
  name: { fontSize: 16.5, fontWeight: "600" },
  previewLine: { flexDirection: "row", alignItems: "center", gap: 5 },
  preview: { fontSize: 14.5, flexShrink: 1 },
  right: { alignItems: "flex-end", gap: 6, minWidth: 48 },
  rightBottom: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 22,
  },
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

  // swipe actions
  actionsRow: { flexDirection: "row", alignItems: "stretch" },
  actionCell: {
    width: 76,
    alignItems: "center",
    justifyContent: "center",
  },
  actionCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  fullSwipeBg: {
    position: "absolute",
    top: 0,
    bottom: 0,
    right: 0,
    backgroundColor: ACTION_GRAY,
    justifyContent: "center",
  },
  fullSwipeGlyph: {
    position: "absolute",
    right: 0,
    alignItems: "center",
    gap: 4,
  },
  fullSwipeText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  unreadBubble: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  unreadDot: { width: 8, height: 8, borderRadius: 4 },
  unreadMark: { fontSize: 13, fontWeight: "800", lineHeight: 15 },

  // undo notice
  notice: {
    position: "absolute",
    left: 20,
    right: 94,
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
  },
  noticeText: { flex: 1, fontSize: 14.5, fontWeight: "500" },
  noticeUndo: { fontSize: 14.5, fontWeight: "700" },

  // action sheet
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 8,
    paddingHorizontal: 8,
  },
  sheetHandle: {
    alignSelf: "center",
    width: 38,
    height: 4,
    borderRadius: 2,
    marginBottom: 10,
    backgroundColor: "rgba(128,128,128,0.4)",
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  sheetTitle: { flex: 1, fontSize: 17, fontWeight: "700" },
  sheetRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRadius: 14,
  },
  sheetIcon: { width: 26, alignItems: "center" },
  sheetLabel: { fontSize: 16, fontWeight: "500" },
});

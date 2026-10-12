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
import {
  GestureHandlerRootView,
  ScrollView as GHScrollView,
} from "react-native-gesture-handler";
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
import GlassSurface from "../../../src/components/GlassSurface";
import Icon from "../../../src/components/icons";
import ChatMessage from "../../../src/components/ChatMessage";
import ChatBackground from "../../../src/components/ChatBackground";
import { BubbleStyleProvider } from "../../../src/components/BubbleShell";
import {
  glassBubbles,
  glassColors,
  DEFAULT_WALLPAPER,
} from "../../../src/theme/chatTheme";
import { CONVERSATIONS } from "../../../src/data/chats";
import { messagePreview } from "../../../src/utils/messagePreview";

const MAX_PINS = 3;

// Swipe action colors (iMessage style)
const ACTION_BLUE = "#0A84FF";
const ACTION_GRAY = "#8E8E93";
const ACTION_ORANGE = "#FF9F0A";
const ACTION_RED = "#FF3B30";
const SEEN_BLUE = "#34B7F1";
const NOTICE_MS = 4000;

// Two 76px action cells on each side
const RIGHT_ACTIONS_WIDTH = 152;
const LEFT_ACTIONS_WIDTH = 152;
// How far past the open actions you must drag before it counts as a "full swipe"
const FULL_SWIPE_EXTRA = 70;
// After a swipe ends, taps on the row are ignored for this long (ms)
const SWIPE_TAP_GUARD_MS = 300;

// Dropdown menu sizing
const MENU_WIDTH = 232;
const MENU_ROW_HEIGHT = 44;
// How many recent messages the long-press preview can scroll through
const PREVIEW_MESSAGES = 40;

// Folders a chat can be moved into (shown as extra tabs once they hold a chat).
// Replace with your own / user-created folders later.
const FOLDERS = [
  { key: "work", label: "Work" },
  { key: "family", label: "Family" },
  { key: "friends", label: "Friends" },
];

// Works with either `type: "direct" | "group" | "channel"` or isGroup / isChannel flags.
function getKind(c) {
  if (c.type) return c.type;
  if (c.isChannel) return "channel";
  if (c.isGroup) return "group";
  return "direct";
}

const BASE_TABS = [
  { key: "all", label: "All", match: () => true },
  { key: "unread", label: "Unread", match: (c) => c.unread > 0 },
  { key: "groups", label: "Groups", match: (c) => getKind(c) === "group" },
  {
    key: "channels",
    label: "Channels",
    match: (c) => getKind(c) === "channel",
  },
];

/* ---------- Small glyphs ---------- */

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

function MediaIcon({ kind, color }) {
  if (kind === "photo") return <Icon name="camera" color={color} size={15} />;
  if (kind === "video") return <Icon name="video" color={color} size={17} />;
  if (kind === "voice") return <Icon name="mic" color={color} size={15} />;
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
  if (!m) return { kind: null, text: "No messages yet" };
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

function FilterTabs({ tabs, active, onChange, unreadCount }) {
  const { colors } = useTheme();

  return (
    <View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabs}
      >
        {tabs.map((tab) => {
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

// onPress / onLongPress are decided by the parent (SwipeableConversation) so
// swipes never count as taps.
function ConversationRow({ item, onPress, onLongPress, selecting, selected }) {
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
      onPress={onPress}
      onLongPress={selecting ? undefined : onLongPress}
      delayLongPress={300}
      accessibilityRole="button"
      accessibilityState={selecting ? { selected } : undefined}
      accessibilityLabel={`Open chat with ${item.name}${
        item.pinned ? ", pinned" : ""
      }${item.muted ? ", muted" : ""}`}
      accessibilityHint="Long press for more options"
      style={({ pressed }) => [
        styles.row,
        pressed && { backgroundColor: colors.surface },
      ]}
    >
      {selecting ? (
        <View
          style={[
            styles.selectCircle,
            {
              borderColor: selected ? colors.primary : colors.textMuted,
              backgroundColor: selected ? colors.primary : "transparent",
            },
          ]}
        >
          {selected ? (
            <Icon name="tick" color={colors.onPrimary} size={14} />
          ) : null}
        </View>
      ) : null}

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
          {item.muted ? (
            <Icon name="mute" color={colors.textMuted} size={15} />
          ) : null}
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
          {item.pinned ? (
            <Icon name="pin" color={colors.textMuted} size={14} />
          ) : null}
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

/* ---------- Swipe actions ---------- */

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

// Tells the parent (via onChange) when the row is dragged past the full-swipe line.
// side="right" -> dragging left (right actions), side="left" -> dragging right (left actions)
function FullSwipeWatcher({ translation, threshold, side, onChange }) {
  useAnimatedReaction(
    () =>
      side === "left"
        ? translation.value >= threshold
        : translation.value <= -threshold,
    (isFull, wasFull) => {
      if (isFull !== wasFull) runOnJS(onChange)(isFull);
    },
    [threshold, side],
  );
  return null;
}

// Left actions: Read/Unread + Pin. Dragging all the way turns the whole
// revealed area into a blue "Read"/"Unread" strip and toggles on release.
function LeftActions({
  item,
  progress,
  translation,
  onFullChange,
  onReadPress,
  onPinPress,
}) {
  const { width } = useWindowDimensions();
  const fullAt = LEFT_ACTIONS_WIDTH + FULL_SWIPE_EXTRA;
  const fadeEnd = LEFT_ACTIONS_WIDTH + 24;
  const isUnread = item.unread > 0;

  const bgStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translation.value,
      [LEFT_ACTIONS_WIDTH, fadeEnd],
      [0, 1],
      Extrapolation.CLAMP,
    ),
  }));
  const glyphStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translation.value - 60 }],
  }));
  const buttonsFade = useAnimatedStyle(() => ({
    opacity: interpolate(
      translation.value,
      [LEFT_ACTIONS_WIDTH, fadeEnd],
      [1, 0],
      Extrapolation.CLAMP,
    ),
  }));

  return (
    <View style={styles.actionsRow}>
      <FullSwipeWatcher
        translation={translation}
        threshold={fullAt}
        side="left"
        onChange={onFullChange}
      />
      <Animated.View
        pointerEvents="none"
        style={[styles.fullSwipeBgLeft, { width }, bgStyle]}
      >
        <Animated.View style={[styles.fullSwipeGlyphLeft, glyphStyle]}>
          <Icon name="comment-block" color="#fff" size={26} />
          <Text style={styles.fullSwipeText}>
            {isUnread ? "Read" : "Unread"}
          </Text>
        </Animated.View>
      </Animated.View>

      <Animated.View style={[styles.actionsFade, buttonsFade]}>
        <ActionButton
          progress={progress}
          color={ACTION_BLUE}
          label={isUnread ? "Mark as read" : "Mark as unread"}
          onPress={onReadPress}
        >
          <Icon name="comment-block" color="#fff" size={26} />
        </ActionButton>
        <ActionButton
          progress={progress}
          color={ACTION_ORANGE}
          label={item.pinned ? "Unpin chat" : "Pin chat"}
          onPress={onPinPress}
        >
          <Icon
            name={item.pinned ? "pin-off" : "pin"}
            color="#fff"
            size={26}
            strokeWidth={2}
          />
        </ActionButton>
      </Animated.View>
    </View>
  );
}

// Right actions: More (3 dots) + Archive. Dragging all the way turns the whole
// revealed area into a gray "Archive" strip and archives on release.
function RightActions({
  item,
  progress,
  translation,
  onFullChange,
  onMorePress,
  onArchivePress,
}) {
  const { width } = useWindowDimensions();
  const fullAt = RIGHT_ACTIONS_WIDTH + FULL_SWIPE_EXTRA;
  // the round buttons are completely gone by here, before the full-swipe strip is shown
  const fadeEnd = RIGHT_ACTIONS_WIDTH + 24;

  const bgStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translation.value,
      [-fadeEnd, -RIGHT_ACTIONS_WIDTH],
      [1, 0],
      Extrapolation.CLAMP,
    ),
  }));
  const glyphStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translation.value + 60 }],
  }));
  const buttonsFade = useAnimatedStyle(() => ({
    opacity: interpolate(
      translation.value,
      [-fadeEnd, -RIGHT_ACTIONS_WIDTH],
      [0, 1],
      Extrapolation.CLAMP,
    ),
  }));

  return (
    <View style={styles.actionsRow}>
      <FullSwipeWatcher
        translation={translation}
        threshold={fullAt}
        side="right"
        onChange={onFullChange}
      />
      <Animated.View
        pointerEvents="none"
        style={[styles.fullSwipeBg, { width }, bgStyle]}
      >
        <Animated.View style={[styles.fullSwipeGlyph, glyphStyle]}>
          <Icon name="archive" color="#fff" size={22} />
          <Text style={styles.fullSwipeText}>
            {item.archived ? "Unarchive" : "Archive"}
          </Text>
        </Animated.View>
      </Animated.View>

      {/* both round buttons fade out together, vertically centered in the row */}
      <Animated.View style={[styles.actionsFade, buttonsFade]}>
        <ActionButton
          progress={progress}
          color={ACTION_BLUE}
          label="More options"
          onPress={onMorePress}
        >
          <Icon name="more" color="#fff" size={22} />
        </ActionButton>
        <ActionButton
          progress={progress}
          color={ACTION_GRAY}
          label={item.archived ? "Unarchive chat" : "Archive chat"}
          onPress={onArchivePress}
        >
          <Icon name="archive" color="#fff" size={22} />
        </ActionButton>
      </Animated.View>
    </View>
  );
}

// Swipe right: mark read / unread + pin; swipe ALL the way right to toggle read.
// Swipe left: more (3 dots) + archive; swipe ALL the way left to archive.
function SwipeableConversation({
  item,
  selecting,
  selected,
  onToggleSelect,
  onLongPress,
  onToggleRead,
  onPin,
  onArchive,
  onMore,
  onWillOpen,
}) {
  const { colors } = useTheme();
  const ref = useRef(null);
  const fullSwipeRight = useRef(false); // dragged all the way left  -> archive
  const fullSwipeLeft = useRef(false); // dragged all the way right -> read/unread
  const close = () => ref.current?.close();

  // --- Swipe vs. tap guard ---------------------------------------------
  // The row's Pressable can still fire onPress when a drag is released.
  // `dragging` is true from the first drag movement until a short moment
  // after release; taps in that window are ignored. `isOpen` lets a tap on an
  // open row just close it (like iMessage) instead of opening the chat.
  const dragging = useRef(false);
  const isOpen = useRef(false);
  const guardTimer = useRef(null);
  const closeTimer = useRef(null);

  useEffect(
    () => () => {
      clearTimeout(guardTimer.current);
      clearTimeout(closeTimer.current);
    },
    [],
  );

  const startDrag = () => {
    clearTimeout(guardTimer.current);
    dragging.current = true;
  };
  const endDrag = () => {
    clearTimeout(guardTimer.current);
    guardTimer.current = setTimeout(() => {
      dragging.current = false;
    }, SWIPE_TAP_GUARD_MS);
  };

  const handlePress = () => {
    if (selecting) {
      onToggleSelect(item.id);
      return;
    }
    if (dragging.current) return; // that was a swipe, not a tap
    if (isOpen.current) {
      close(); // tapping an open row closes it
      return;
    }
    router.push(`/chats/${item.id}`);
  };

  const handleLongPress = (e) => {
    if (dragging.current || isOpen.current) return;
    onLongPress(e);
  };

  const handleFullRight = (isFull) => {
    fullSwipeRight.current = isFull;
    if (isFull) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };
  const handleFullLeft = (isFull) => {
    fullSwipeLeft.current = isFull;
    if (isFull) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <ReanimatedSwipeable
      ref={ref}
      enabled={!selecting}
      friction={1.6}
      overshootLeft // allow dragging past the left buttons for the full swipe
      overshootRight // allow dragging past the right buttons for the full swipe
      leftThreshold={36}
      rightThreshold={36}
      onSwipeableOpenStartDrag={startDrag}
      onSwipeableCloseStartDrag={startDrag}
      onSwipeableWillClose={endDrag}
      onSwipeableClose={() => {
        isOpen.current = false;
        endDrag();
      }}
      onSwipeableOpen={() => {
        isOpen.current = true;
        endDrag();
      }}
      onSwipeableWillOpen={() => {
        endDrag();
        if (fullSwipeRight.current) {
          // released past the full-swipe line (left) -> archive
          fullSwipeRight.current = false;
          onArchive(item);
          return;
        }
        if (fullSwipeLeft.current) {
          // released past the full-swipe line (right) -> toggle read/unread,
          // then snap the row shut again
          fullSwipeLeft.current = false;
          onToggleRead(item);
          clearTimeout(closeTimer.current);
          closeTimer.current = setTimeout(close, 80);
          return;
        }
        onWillOpen(ref);
      }}
      renderLeftActions={(progress, translation) => (
        <LeftActions
          item={item}
          progress={progress}
          translation={translation}
          onFullChange={handleFullLeft}
          onReadPress={() => {
            close();
            onToggleRead(item);
          }}
          onPinPress={() => {
            close();
            onPin(item);
          }}
        />
      )}
      renderRightActions={(progress, translation) => (
        <RightActions
          item={item}
          progress={progress}
          translation={translation}
          onFullChange={handleFullRight}
          onMorePress={(e) => {
            // grab the tap position so the dropdown opens next to this row
            const y = e?.nativeEvent?.pageY;
            close();
            onMore(item, y);
          }}
          onArchivePress={() => {
            close();
            onArchive(item);
          }}
        />
      )}
    >
      {/* opaque background so the actions don't show through the row */}
      <View style={{ backgroundColor: colors.background }}>
        <ConversationRow
          item={item}
          onPress={handlePress}
          onLongPress={handleLongPress}
          selecting={selecting}
          selected={selected}
        />
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
        <Icon name="archive" color={colors.textMuted} size={20} />
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

/* ---------- Long-press context menu (preview + small dropdown) ---------- */

const sameSender = (a, b) =>
  a.isMine === b.isMine && (a.sender ?? "") === (b.sender ?? "");

// Same run logic as the chat screen: tail on the last message of a run,
// sender name on the first message of a run in groups.
function decoratePreview(messages, isGroup) {
  return messages.map((m, i) => {
    const prev = messages[i - 1];
    const next = messages[i + 1];
    return {
      ...m,
      showTail: !next || !sameSender(next, m),
      showTime: !next || !sameSender(next, m),
      showName: isGroup && !m.isMine && (!prev || !sameSender(prev, m)),
    };
  });
}

// Mini version of the chat screen: same wallpaper, glass bubbles and messages.
// - The message area scrolls (starts at the newest message, drag down for older)
// - Tapping the preview (header or messages) opens the chat
function ChatPreview({ chat, onPress }) {
  const { colors } = useTheme();
  const scrollRef = useRef(null);
  // keep jumping to the newest message until the user starts scrolling
  const stickToEnd = useRef(true);
  const isGroup = !!chat.isGroup;
  const wallpaper =
    chat.wallpaper === false ? null : (chat.wallpaper ?? DEFAULT_WALLPAPER);
  const glass = !!wallpaper;
  const messages = useMemo(
    () => decoratePreview(chat.messages.slice(-PREVIEW_MESSAGES), isGroup),
    [chat, isGroup],
  );
  const fg = glass ? "#fff" : colors.text;
  const muted = glass ? glassColors.muted : colors.textMuted;

  const content = (
    <GHScrollView
      ref={scrollRef}
      style={styles.previewScroll}
      contentContainerStyle={styles.previewMessages}
      showsVerticalScrollIndicator={false}
      bounces
      scrollEventThrottle={16}
      onScrollBeginDrag={() => {
        stickToEnd.current = false;
      }}
      onContentSizeChange={() => {
        if (stickToEnd.current) {
          scrollRef.current?.scrollToEnd({ animated: false });
        }
      }}
    >
      {/* Pressable lives INSIDE the scroll view: a tap opens the chat,
          a drag scrolls. Messages themselves ignore touches. */}
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Open chat with ${chat.name}`}
      >
        <View pointerEvents="none">
          {messages.map((m, i) => (
            <View
              key={`${m.id}-${i}`}
              style={isGroup && !m.isMine ? { paddingLeft: 40 } : null}
            >
              {m.showName ? (
                <Text
                  style={[styles.previewSender, { color: muted }]}
                  numberOfLines={1}
                >
                  {m.sender}
                </Text>
              ) : null}
              <ChatMessage message={m} />
            </View>
          ))}
        </View>
      </Pressable>
    </GHScrollView>
  );

  return (
    <View
      style={[
        styles.previewCard,
        { backgroundColor: glass ? glassColors.base : colors.background },
      ]}
    >
      {glass ? <ChatBackground uri={wallpaper} /> : null}
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Open chat with ${chat.name}`}
        style={styles.previewHeader}
      >
        <Avatar
          uri={chat.avatar}
          name={chat.name}
          size={38}
          online={chat.online}
        />
        <View style={{ flex: 1 }}>
          <Text style={[styles.sheetTitle, { color: fg }]} numberOfLines={1}>
            {chat.name}
          </Text>
          {chat.status ? (
            <Text
              style={[styles.previewStatus, { color: muted }]}
              numberOfLines={1}
            >
              {chat.status}
            </Text>
          ) : null}
        </View>
      </Pressable>
      {glass ? (
        <BubbleStyleProvider value={glassBubbles}>
          {content}
        </BubbleStyleProvider>
      ) : (
        content
      )}
    </View>
  );
}

function MenuRow({ icon, label, onPress, textColor, destructive, dangerColor, trailing }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.menuRow,
        pressed && { backgroundColor: "rgba(255,255,255,0.12)" },
      ]}
    >
      <Text
        style={[
          styles.menuLabel,
          { color: destructive ? dangerColor : textColor },
        ]}
      >
        {label}
      </Text>
      {trailing ?? <View style={styles.menuIcon}>{icon}</View>}
    </Pressable>
  );
}

/* ---------- Long-press menu ---------- */

// `showPreview` = true  -> long press: chat preview + dropdown under it
// `showPreview` = false -> "more" icon: only the dropdown, near the tapped row
// Tapping anywhere outside the preview / dropdown closes everything.
function ChatContextMenu({
  chat,
  showPreview,
  anchorY,
  onClose,
  onOpenChat,
  onPin,
  onMute,
  onToggleRead,
  onArchive,
  onClear,
  onBlock,
  onExitGroup,
  onDelete,
}) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();

  const unread = chat ? chat.unread > 0 : false;
  // Group chats exit; direct chats block instead (see getKind).
  const isGroup = chat ? getKind(chat) === "group" : false;
  // Glass is dark-tinted, so icons/text use bright white in both themes for
  // contrast.
  const menuIcon = "#fff";
  const menuText = "#fff";
  const menuDanger = "#FF6B62";

  // 7 rows: pin, mute, read, archive, clear, + (exit | block, delete)
  const rowCount = 7;
  const menuHeight = rowCount * MENU_ROW_HEIGHT + 8;
  const minTop = insets.top + 8;
  const maxTop = Math.max(minTop, height - insets.bottom - menuHeight - 8);
  const dropdownTop = Math.min(
    Math.max((anchorY ?? height / 2) - 24, minTop),
    maxTop,
  );

  const card = chat ? (
    // GlassSurface paints its own translucent background + hairline border;
    // keep overflow hidden so the row highlight respects the rounded corners.
    <GlassSurface style={[styles.menuCard, { overflow: "hidden" }]}>
      <>
        <MenuRow
          textColor={menuText}
          dangerColor={menuDanger}
          label={chat.pinned ? "Unpin" : "Pin"}
            onPress={onPin}
            icon={
              <Icon
                name={chat.pinned ? "pin-off" : "pin"}
                color={menuIcon}
                size={20}
                strokeWidth={2}
              />
            }
          />
          <MenuRow
            textColor={menuText}
            dangerColor={menuDanger}
            label={chat.muted ? "Unmute" : "Mute"}
            onPress={onMute}
            icon={
              <Icon name="mute" color={menuIcon} size={20} strokeWidth={2} />
            }
          />
          <MenuRow
            textColor={menuText}
            dangerColor={menuDanger}
            label={unread ? "Mark as read" : "Mark as unread"}
            onPress={onToggleRead}
            icon={
              <Icon
                name="comment-block"
                color={menuIcon}
                size={20}
                strokeWidth={2}
              />
            }
          />
          <MenuRow
            textColor={menuText}
            dangerColor={menuDanger}
            label={chat.archived ? "Unarchive" : "Archive"}
            onPress={onArchive}
            icon={
              <Icon
                name="archive"
                color={menuIcon}
                size={20}
                strokeWidth={2}
              />
            }
          />
          <MenuRow
            textColor={menuText}
            dangerColor={menuDanger}
            label="Clear chat"
            onPress={onClear}
            icon={
              <Icon
                name="clear"
                color={menuIcon}
                size={20}
                strokeWidth={2}
              />
            }
          />
          {isGroup ? (
            <MenuRow
              textColor={menuText}
              dangerColor={menuDanger}
              label="Exit group"
              destructive
              onPress={onExitGroup}
              icon={
                <Icon
                  name="exit"
                  color={menuDanger}
                  size={20}
                  strokeWidth={2}
                />
              }
            />
          ) : (
            <>
              <MenuRow
                textColor={menuText}
                dangerColor={menuDanger}
                label={chat.blocked ? "Unblock user" : "Block user"}
                destructive
                onPress={onBlock}
                icon={
                  <Icon
                    name="block"
                    color={menuDanger}
                    size={20}
                    strokeWidth={2}
                  />
                }
              />
              <MenuRow
                textColor={menuText}
                dangerColor={menuDanger}
                label="Delete chat"
                destructive
                onPress={onDelete}
                icon={
                  <Icon
                    name="delete-chat"
                    color={menuDanger}
                    size={20}
                    strokeWidth={2}
                  />
                }
              />
            </>
          )}
        </>
    </GlassSurface>
  ) : null;

  return (
    <Modal
      visible={!!chat}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      {/* Modals render outside the app's gesture root, so they need their own */}
      <GestureHandlerRootView style={styles.modalRoot}>
        {/* Backdrop is a sibling (not a parent) of the content, so the preview
            can scroll / be tapped and any tap outside it closes the menu. */}
        <Pressable
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: showPreview
                ? "rgba(0,0,0,0.55)"
                : "rgba(0,0,0,0.3)",
            },
          ]}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close menu"
        />

        {chat && showPreview ? (
          <View
            pointerEvents="box-none"
            style={[
              styles.menuLayer,
              {
                paddingTop: insets.top + 16,
                paddingBottom: insets.bottom + 16,
              },
            ]}
          >
            <View pointerEvents="box-none" style={styles.menuStack}>
              <ChatPreview chat={chat} onPress={onOpenChat} />
              <View pointerEvents="box-none" style={styles.dropdownRight}>
                {card}
              </View>
            </View>
          </View>
        ) : null}

        {chat && !showPreview ? (
          <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
            <View style={[styles.dropdownAnchored, { top: dropdownTop }]}>
              {card}
            </View>
          </View>
        ) : null}
      </GestureHandlerRootView>
    </Modal>
  );
}

/* ---------- Multi-select bottom bar ---------- */

function SelectionBarItem({ label, onPress, color, icon, disabled }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[styles.selectionItem, disabled && { opacity: 0.4 }]}
    >
      {icon}
      <Text style={[styles.selectionLabel, { color }]}>{label}</Text>
    </Pressable>
  );
}

function SelectionBar({
  count,
  anyUnread,
  onRead,
  onArchive,
  onDelete,
  bottom,
}) {
  const { colors } = useTheme();
  const disabled = count === 0;

  return (
    <View
      style={[styles.selectionBar, { bottom, backgroundColor: colors.surface }]}
    >
      <SelectionBarItem
        label={anyUnread ? "Read" : "Unread"}
        color={colors.text}
        onPress={onRead}
        disabled={disabled}
        icon={<Icon name="comment-block" color={colors.text} size={22} />}
      />
      <SelectionBarItem
        label="Archive"
        color={colors.text}
        onPress={onArchive}
        disabled={disabled}
        icon={<Icon name="archive" color={colors.text} size={22} />}
      />
      <SelectionBarItem
        label="Delete"
        color={ACTION_RED}
        onPress={onDelete}
        disabled={disabled}
        icon={<Icon name="trash" color={ACTION_RED} size={22} />}
      />
    </View>
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
  }[tab] ?? {
    title: "This folder is empty",
    body: "Long press a chat and choose Add to folder.",
  };

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
          folder: c.folder ?? null,
          deleted: false,
        },
      ]),
    ),
  );
  // { id, preview: boolean, y: number | null } — preview=true for long press,
  // preview=false for the swipe "more" button (dropdown only)
  const [menu, setMenu] = useState(null);
  const [selecting, setSelecting] = useState(false); // multi-select ("Edit")
  const [selected, setSelected] = useState([]);
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

  // base tabs + a tab for every folder that currently holds a chat
  const tabs = useMemo(() => {
    const folderTabs = FOLDERS.filter((f) =>
      conversations.some((c) => !c.archived && c.folder === f.key),
    ).map((f) => ({
      key: `folder:${f.key}`,
      label: f.label,
      match: (c) => c.folder === f.key,
    }));
    return [...BASE_TABS, ...folderTabs];
  }, [conversations]);

  // falls back to "All" if the active folder tab disappeared (e.g. last chat removed)
  const tab = tabs.find((t) => t.key === activeTab) ?? tabs[0];

  // Leave the archived view when its last chat is unarchived. Derived during
  // render (never set state in an effect) so there's no cascading render.
  const inArchivedView = showArchived && archivedCount > 0;

  const data = useMemo(() => {
    const list = conversations.filter((c) =>
      inArchivedView ? c.archived : !c.archived && tab.match(c),
    );
    // pinned chats float to the top, everything else keeps its order
    return [...list.filter((c) => c.pinned), ...list.filter((c) => !c.pinned)];
  }, [conversations, tab, inArchivedView]);

  const exitSelecting = () => {
    setSelecting(false);
    setSelected([]);
  };

  // Android back: leave multi-select first, then the archived view
  useEffect(() => {
    if (!inArchivedView && !selecting) return undefined;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (selecting) exitSelecting();
      else setShowArchived(false);
      return true;
    });
    return () => sub.remove();
  }, [inArchivedView, selecting]);

  const menuChat = conversations.find((c) => c.id === menu?.id) ?? null;

  const patch = (id, change) =>
    setFlags((prev) => ({ ...prev, [id]: { ...prev[id], ...change } }));

  const showNotice = (text, undo) => {
    clearTimeout(noticeTimer.current);
    setNotice({ text, undo });
    noticeTimer.current = setTimeout(() => setNotice(null), NOTICE_MS);
  };

  const openMenu = (id, { preview, y }) => {
    setMenu({ id, preview, y: y ?? null });
  };
  const closeMenu = () => {
    setMenu(null);
  };

  /* ----- single-chat actions ----- */

  const pinChat = (c) => {
    if (!c) return;
    const pinnedNow = conversations.filter((x) => x.pinned).length;
    if (!c.pinned && pinnedNow >= MAX_PINS) {
      Alert.alert(
        "Pin limit reached",
        `You can pin up to ${MAX_PINS} chats. Unpin one to pin another.`,
      );
      return;
    }
    Haptics.selectionAsync();
    patch(c.id, { pinned: !c.pinned });
    showNotice(c.pinned ? "Chat unpinned" : "Chat pinned");
  };

  const muteChat = (c) => {
    if (!c) return;
    Haptics.selectionAsync();
    patch(c.id, { muted: !c.muted });
    showNotice(c.muted ? "Notifications on" : "Chat muted");
  };

  const archiveChat = (c) => {
    if (!c) return;
    Haptics.selectionAsync();
    const was = c.archived;
    // archiving also unpins, like most messengers
    patch(c.id, was ? { archived: false } : { archived: true, pinned: false });
    showNotice(was ? "Chat unarchived" : "Chat archived", () =>
      patch(
        c.id,
        was ? { archived: true } : { archived: false, pinned: c.pinned },
      ),
    );
  };

  const toggleRead = (c) => {
    if (!c) return;
    Haptics.selectionAsync();
    patch(c.id, { unread: c.unread > 0 ? 0 : 1 });
  };

  const deleteChat = (c) => {
    if (!c) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    const title =
      getKind(c) === "group" ? "Exit group?" : "Delete this chat?";
    const body =
      getKind(c) === "group"
        ? `You will leave "${c.name}".`
        : `Your copy of "${c.name}" will be removed.`;
    const confirmLabel = getKind(c) === "group" ? "Exit" : "Delete";
    Alert.alert(title, body, [
      { text: "Cancel", style: "cancel" },
      {
        text: confirmLabel,
        style: "destructive",
        onPress: () => {
          patch(c.id, { deleted: true });
          showNotice(
            getKind(c) === "group" ? "You left the group" : "Chat deleted",
            () => patch(c.id, { deleted: false }),
          );
        },
      },
    ]);
  };

  const clearChat = (c) => {
    if (!c) return;
    Alert.alert("Clear this chat?", "All messages will be removed.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear",
        style: "destructive",
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          patch(c.id, { messages: [], unread: 0 });
          showNotice("Chat cleared", () =>
            patch(c.id, { messages: c.messages, unread: c.unread }),
          );
        },
      },
    ]);
  };

  const blockUser = (c) => {
    if (!c) return;
    Haptics.selectionAsync();
    const was = !!c.blocked;
    patch(c.id, { blocked: !was, muted: !was ? true : c.muted });
    showNotice(was ? "User unblocked" : "User blocked", () =>
      patch(c.id, { blocked: was }),
    );
  };

  const setFolder = (c, key) => {
    if (!c) return;
    Haptics.selectionAsync();
    // Folders UI was removed from the menu; keep the flag logic so existing
    // folder tabs keep working.
    const before = c.folder ?? null;
    patch(c.id, { folder: key });
    const label = FOLDERS.find((f) => f.key === key)?.label;
    showNotice(key ? `Added to ${label}` : "Removed from folder", () =>
      patch(c.id, { folder: before }),
    );
  };

  /* ----- multi-select ----- */

  const toggleSelecting = () => {
    openRow.current?.close();
    openRow.current = null;
    if (selecting) exitSelecting();
    else {
      Haptics.selectionAsync();
      setSelecting(true);
    }
  };

  const toggleSelect = (id) => {
    Haptics.selectionAsync();
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const selectedChats = conversations.filter((c) => selected.includes(c.id));
  const anySelectedUnread = selectedChats.some((c) => c.unread > 0);

  const bulkRead = () => {
    Haptics.selectionAsync();
    selectedChats.forEach((c) =>
      patch(c.id, { unread: anySelectedUnread ? 0 : 1 }),
    );
    exitSelecting();
  };

  const bulkArchive = () => {
    Haptics.selectionAsync();
    const before = selectedChats.map((c) => ({
      id: c.id,
      archived: c.archived,
      pinned: c.pinned,
    }));
    selectedChats.forEach((c) =>
      patch(
        c.id,
        c.archived ? { archived: false } : { archived: true, pinned: false },
      ),
    );
    exitSelecting();
    showNotice(
      `${before.length} chat${before.length === 1 ? "" : "s"} updated`,
      () =>
        before.forEach((b) =>
          patch(b.id, { archived: b.archived, pinned: b.pinned }),
        ),
    );
  };

  const bulkDelete = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    const ids = selectedChats.map((c) => c.id);
    ids.forEach((id) => patch(id, { deleted: true }));
    exitSelecting();
    showNotice(`${ids.length} chat${ids.length === 1 ? "" : "s"} deleted`, () =>
      ids.forEach((id) => patch(id, { deleted: false })),
    );
  };

  // Tabs (and the Archived row) live in the list header so they scroll away
  // with the chats instead of staying pinned under the title.
  const listHeader = inArchivedView ? null : (
    <View>
      <FilterTabs
        tabs={tabs}
        active={tab.key}
        onChange={setActiveTab}
        unreadCount={unreadCount}
      />
      {tab.key === "all" && archivedCount > 0 ? (
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
          {inArchivedView && !selecting ? (
            <GlassButton
              size={44}
              label="Back to chats"
              onPress={() => setShowArchived(false)}
            >
              <Icon name="back" color={colors.text} size={22} />
            </GlassButton>
          ) : null}
          <Text style={[styles.title, { color: colors.text }]}>
            {selecting
              ? selected.length
                ? `${selected.length} selected`
                : "Select chats"
              : inArchivedView
                ? "Archived"
                : "Chats"}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <Pressable
            onPress={toggleSelecting}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={selecting ? "Done selecting" : "Edit chats"}
          >
            <Text style={[styles.editText, { color: colors.primary }]}>
              {selecting ? "Done" : "Edit"}
            </Text>
          </Pressable>
          {selecting ? null : (
            <GlassButton size={44} label="Search chats">
              <Icon name="search" color={colors.text} size={22} />
            </GlassButton>
          )}
        </View>
      </View>

      <FlatList
        data={data}
        keyExtractor={(c) => c.id}
        extraData={[selecting, selected]}
        renderItem={({ item }) => (
          <SwipeableConversation
            item={item}
            selecting={selecting}
            selected={selected.includes(item.id)}
            onToggleSelect={toggleSelect}
            onWillOpen={handleWillOpen}
            onToggleRead={toggleRead}
            onPin={pinChat}
            onArchive={archiveChat}
            // "more" icon -> dropdown only (no chat preview)
            onMore={(c, y) => openMenu(c.id, { preview: false, y })}
            // long press -> chat preview + dropdown
            onLongPress={(e) => {
              const y = e?.nativeEvent?.pageY;
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              openMenu(item.id, { preview: true, y });
            }}
          />
        )}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          <EmptyState tab={inArchivedView ? "archived" : tab.key} />
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
            {
              bottom: insets.bottom + (selecting ? 160 : 100),
              right: selecting ? 20 : 94,
              backgroundColor: colors.text,
            },
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

      {selecting ? (
        <SelectionBar
          count={selected.length}
          anyUnread={anySelectedUnread}
          onRead={bulkRead}
          onArchive={bulkArchive}
          onDelete={bulkDelete}
          bottom={insets.bottom + 92} // sits above the floating tab bar
        />
      ) : (
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
          <Icon name="add-chat" color={colors.onPrimary} size={26} />
        </Pressable>
      )}

      <ChatContextMenu
        chat={menuChat}
        showPreview={menu?.preview ?? true}
        anchorY={menu?.y ?? null}
        onClose={closeMenu}
        onOpenChat={() => {
          const c = menuChat;
          closeMenu();
          if (c) router.push(`/chats/${c.id}`);
        }}
        onPin={() => {
          const c = menuChat;
          closeMenu();
          if (c) pinChat(c);
        }}
        onMute={() => {
          const c = menuChat;
          closeMenu();
          if (c) muteChat(c);
        }}
        onToggleRead={() => {
          const c = menuChat;
          closeMenu();
          if (c) toggleRead(c);
        }}
        onArchive={() => {
          const c = menuChat;
          closeMenu();
          if (c) archiveChat(c);
        }}
        onDelete={() => {
          const c = menuChat;
          closeMenu();
          if (c) deleteChat(c);
        }}
        onClear={() => {
          const c = menuChat;
          closeMenu();
          if (c) clearChat(c);
        }}
        onBlock={() => {
          const c = menuChat;
          closeMenu();
          if (c) blockUser(c);
        }}
        onExitGroup={() => {
          const c = menuChat;
          closeMenu();
          if (c) deleteChat(c);
        }}
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
  headerRight: { flexDirection: "row", alignItems: "center", gap: 14 },
  title: { fontSize: 26, fontWeight: "700" },
  editText: { fontSize: 16.5, fontWeight: "600" },

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
  selectCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
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
  // full swipe (left drag) -> archive strip
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
  // full swipe (right drag) -> read / unread strip
  fullSwipeBgLeft: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: ACTION_BLUE,
    justifyContent: "center",
  },
  fullSwipeGlyphLeft: {
    position: "absolute",
    left: 0,
    alignItems: "center",
    gap: 4,
  },
  fullSwipeText: { color: "#fff", fontSize: 12, fontWeight: "700" },

  // undo notice
  notice: {
    position: "absolute",
    left: 20,
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

  // multi-select bar
  selectionBar: {
    position: "absolute",
    left: 20,
    right: 20,
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 12,
    borderRadius: 22,
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  selectionItem: { alignItems: "center", gap: 4, minWidth: 72 },
  selectionLabel: { fontSize: 12, fontWeight: "600" },

  // context menu
  modalRoot: { flex: 1 },
  menuLayer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  menuStack: { gap: 10 },
  dropdownRight: { alignItems: "flex-end" },
  dropdownAnchored: {
    position: "absolute",
    right: 20,
  },

  previewCard: {
    borderRadius: 22,
    height: 360,
    overflow: "hidden",
  },
  previewScroll: { flex: 1 },
  previewMessages: {
    flexGrow: 1,
    justifyContent: "flex-end",
    paddingBottom: 12,
  },
  previewSender: {
    fontSize: 12.5,
    paddingLeft: 22,
    marginTop: 4,
    marginBottom: 2,
  },
  actionsFade: { flexDirection: "row", alignItems: "center" },
  previewHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  previewStatus: { fontSize: 12.5 },

  // small dropdown card (GlassSurface paints the glass background + border)
  menuCard: {
    width: MENU_WIDTH,
    borderRadius: 14,
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    height: MENU_ROW_HEIGHT,
  },
  menuLabel: { fontSize: 15.5, fontWeight: "500" },
  menuIcon: { width: 24, alignItems: "flex-end" },
  divider: { height: StyleSheet.hairlineWidth * 2 },
  sheetTitle: { fontSize: 17, fontWeight: "700" },
});

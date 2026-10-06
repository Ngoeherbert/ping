import { memo, useCallback, useEffect, useRef, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Image } from "expo-image";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import Icon from "./Icon";
import { haptic } from "../utils/haptics";
import { useChatsStore, useGamesStore, useCallsStore, useUsersStore } from "../store";
import {
  chatTitle,
  deliveryIconName,
  formatChatTimestamp,
  hashTint,
  initialsOf,
  isChatUnread,
  isTypingInChat,
  partnerOf,
  previewIconName,
  previewText,
} from "../utils/chatList";

// Spec colours for the list: iOS blue, not the theme's #0A84FF primary.
const BLUE = "#007AFF";
const TEXT = "#111111";
const MUTED = "#8E8E93";
const HAIRLINE = "#E5E5EA";
const GREEN = "#34C759";
const ORANGE = "#FF9500";
const RED = "#FF3B30";
const WHITE = "#FFFFFF";

const ACTION_WIDTH = 68;

/** One button in the revealed swipe-actions row. */
function SwipeAction({ label, icon, color, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[styles.action, { backgroundColor: color }]}
    >
      <Icon name={icon} size={20} color={WHITE} />
      <Text numberOfLines={1} style={styles.actionLabel}>
        {label}
      </Text>
    </Pressable>
  );
}

/**
 * One row in the chat list: avatar (photo or hashed initials), name, time,
 * preview line with type icon or delivery checks, unread badge, swipe actions
 * and a long-press action sheet. Memoised, with all handlers passed in
 * stable, so list re-renders stay cheap.
 */
function ChatRow({
  conversation,
  preview,
  showSeparator,
  onOpen,
  onLongPress,
  onTogglePin,
  onMarkUnread,
  onToggleMute,
  onArchive,
  onDelete,
}) {
  const swipeRef = useRef(null);
  const [imageFailed, setImageFailed] = useState(false);

  const usersById = useUsersStore((s) => s.byId);
  const presenceByUser = useChatsStore((s) => s.presenceByUser);
  const game = useGamesStore((s) => (preview?.gameId ? s.byId[preview.gameId] : null));
  const call = useCallsStore((s) => (preview?.callId ? s.byId[preview.callId] : null));

  const isGroup = conversation.kind === "group";
  const partner = isGroup ? null : usersById[partnerOf(conversation)] ?? null;
  const displayName = chatTitle(conversation, usersById);
  const avatarUri = (isGroup ? conversation.iconUrl : partner?.avatarUrl) ?? null;

  // A broken avatar URL (the data ships some) drops to initials for good.
  useEffect(() => {
    setImageFailed(false);
  }, [avatarUri]);

  const unread = isChatUnread(conversation);
  const unreadCount = conversation.unreadCount ?? 0;
  const markedDot = unreadCount === 0 && !!conversation.isMarkedUnread;
  const typing = isTypingInChat(conversation, presenceByUser);
  const online = !isGroup && partner?.presence === "online";
  const verified = !isGroup && !!partner?.isVerified;

  const checkIcon = deliveryIconName(preview);
  const typeIcon = previewIconName(preview);
  const checkBlue = preview?.deliveryStatus === "read";
  const text = typing
    ? "typing…"
    : previewText(preview, { conversation, usersById, game, call });
  const time = formatChatTimestamp(preview?.createdAt ?? conversation.updatedAt);

  const handlePress = useCallback(() => {
    haptic.light();
    onOpen(conversation);
  }, [onOpen, conversation]);

  const handleLongPress = useCallback(() => {
    haptic.medium();
    onLongPress(conversation);
  }, [onLongPress, conversation]);

  const runSwipeAction = useCallback(
    (action) => {
      haptic.light();
      swipeRef.current?.close?.();
      action(conversation);
    },
    [conversation],
  );

  // Swipe right: Pin (blue) and Unread (gray).
  const renderLeftActions = useCallback(
    () => (
      <View style={styles.actionsRow}>
        <SwipeAction
          label={conversation.isPinned ? "Unpin" : "Pin"}
          icon="pin"
          color={BLUE}
          onPress={() => runSwipeAction(onTogglePin)}
        />
        <SwipeAction
          label="Unread"
          icon="chats"
          color={MUTED}
          onPress={() => runSwipeAction(onMarkUnread)}
        />
      </View>
    ),
    [conversation.isPinned, runSwipeAction, onTogglePin, onMarkUnread],
  );

  // Swipe left: Mute (orange), Archive (gray), Delete (red).
  const renderRightActions = useCallback(
    () => (
      <View style={styles.actionsRow}>
        <SwipeAction
          label={conversation.isMuted ? "Unmute" : "Mute"}
          icon="bellOff"
          color={ORANGE}
          onPress={() => runSwipeAction(onToggleMute)}
        />
        <SwipeAction
          label={conversation.isArchived ? "Unarchive" : "Archive"}
          icon="archive"
          color={MUTED}
          onPress={() => runSwipeAction(onArchive)}
        />
        <SwipeAction label="Delete" icon="trash" color={RED} onPress={() => runSwipeAction(onDelete)} />
      </View>
    ),
    [
      conversation.isMuted,
      conversation.isArchived,
      runSwipeAction,
      onToggleMute,
      onArchive,
      onDelete,
    ],
  );

  return (
    <ReanimatedSwipeable
      ref={swipeRef}
      friction={2}
      leftThreshold={ACTION_WIDTH}
      rightThreshold={ACTION_WIDTH * 3}
      overshootLeft={false}
      overshootRight={false}
      renderLeftActions={renderLeftActions}
      renderRightActions={renderRightActions}
    >
      <Pressable
        onPress={handlePress}
        onLongPress={handleLongPress}
        delayLongPress={250}
        style={styles.row}
        accessibilityRole="button"
        accessibilityLabel={`Chat with ${displayName}`}
      >
        <View style={styles.avatarOuter}>
          <View style={[styles.avatar, { backgroundColor: hashTint(conversation.id) }]}>
            {avatarUri && !imageFailed ? (
              <Image
                source={{ uri: avatarUri }}
                style={styles.avatarImage}
                contentFit="cover"
                transition={120}
                onError={() => setImageFailed(true)}
              />
            ) : (
              <Text style={styles.initials}>{initialsOf(displayName)}</Text>
            )}
          </View>
          {online ? <View style={styles.onlineDot} /> : null}
        </View>

        <View style={styles.content}>
          <View style={styles.lineOne}>
            <Text numberOfLines={1} style={[styles.name, unread && styles.nameUnread]}>
              {displayName}
            </Text>
            {verified ? <Icon name="verified" size={16} color={BLUE} style={styles.verified} /> : null}
            <View style={styles.flexSpacer} />
            <Text style={[styles.time, unread && styles.timeUnread]}>{time}</Text>
          </View>

          <View style={styles.lineTwo}>
            {checkIcon ? (
              <Icon
                name={checkIcon}
                size={14}
                color={checkBlue ? BLUE : MUTED}
                style={styles.previewIcon}
              />
            ) : null}
            {typeIcon ? <Icon name={typeIcon} size={14} color={MUTED} style={styles.previewIcon} /> : null}
            <Text
              numberOfLines={1}
              style={[
                styles.preview,
                typing ? styles.previewTyping : unread ? styles.previewUnread : styles.previewRead,
              ]}
            >
              {text}
            </Text>
            <View style={styles.badgeSlot}>
              {conversation.isMuted ? (
                <Icon name="bellOff" size={14} color={MUTED} style={styles.muteIcon} />
              ) : null}
              {unreadCount > 0 ? (
                <View style={[styles.badge, conversation.isMuted && styles.badgeMuted]}>
                  <Text style={styles.badgeText}>{unreadCount > 99 ? "99+" : String(unreadCount)}</Text>
                </View>
              ) : markedDot ? (
                <View style={styles.dot} />
              ) : conversation.isPinned ? (
                <Icon name="pin" size={14} color={MUTED} />
              ) : null}
            </View>
          </View>
        </View>

        {showSeparator ? <View style={styles.separator} /> : null}
      </Pressable>
    </ReanimatedSwipeable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 68,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: WHITE,
  },
  avatarOuter: { width: 48, height: 48 },
  avatar: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 24,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: { width: "100%", height: "100%" },
  initials: { color: WHITE, fontSize: 16, fontWeight: "600" },
  onlineDot: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: GREEN,
    borderWidth: 2,
    borderColor: WHITE,
  },
  content: { flex: 1, marginLeft: 12 },
  lineOne: { flexDirection: "row", alignItems: "center" },
  name: { flexShrink: 1, fontSize: 15, fontWeight: "600", color: TEXT },
  nameUnread: { fontWeight: "700" },
  verified: { marginLeft: 4 },
  flexSpacer: { flex: 1 },
  time: { fontSize: 12, color: MUTED, marginLeft: 8 },
  timeUnread: { color: BLUE },
  lineTwo: { flexDirection: "row", alignItems: "center", marginTop: 3 },
  previewIcon: { marginRight: 4 },
  preview: { flex: 1, fontSize: 13 },
  previewRead: { color: MUTED },
  previewUnread: { color: TEXT },
  previewTyping: { color: BLUE },
  badgeSlot: { flexDirection: "row", alignItems: "center", marginLeft: 6 },
  muteIcon: { marginRight: 4 },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 5,
    backgroundColor: BLUE,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeMuted: { backgroundColor: MUTED },
  badgeText: { color: WHITE, fontSize: 12, fontWeight: "600" },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: BLUE },
  // Hairline inset to start after the avatar: 16 padding + 48 avatar + 12 gap.
  separator: {
    position: "absolute",
    left: 76,
    right: 0,
    bottom: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: HAIRLINE,
  },
  actionsRow: { flexDirection: "row" },
  action: { width: 68, alignItems: "center", justifyContent: "center" },
  actionLabel: { color: WHITE, fontSize: 11, fontWeight: "600", marginTop: 4 },
});

export default memo(ChatRow);

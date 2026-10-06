/**
 * Adapters for the Chats list: titles, sort order, sections, filters,
 * timestamps, preview text and badge state, all derived from the messaging
 * data without ever modifying it. Pure functions only, so both the screen
 * (search) and a row (rendering) can share them.
 */
import { CURRENT_USER_ID } from "../data";
import { formatDuration } from "./format";
import { MS_PER_MINUTE } from "./time";

/** WAT wall-clock helpers: data timestamps are ISO strings with a +01:00 offset. */
const WAT_MS = 60 * MS_PER_MINUTE;
const MS_PER_DAY = 86_400_000;

const WEEKDAY_NAMES = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
];

const TINTS = [
  "#FF9500", "#FF2D55", "#5856D6", "#34C759",
  "#007AFF", "#AF52DE", "#FF3B30", "#5AC8FA",
];

/** Display names for every game type the data can generate. */
const GAME_DISPLAY_NAMES = {
  ludo: "Ludo",
  snake_and_ladder: "Snakes & Ladders",
  tic_tac_toe: "Tic-Tac-Toe",
  chess: "Chess",
  word_game: "Word Game",
  eight_ball: "8-Ball",
  cup_pong: "Cup Pong",
  dots_and_boxes: "Dots & Boxes",
  trivia: "Trivia",
};

/** One label per system-message event type in the data. */
const SYSTEM_PREVIEW_LABELS = {
  chat_created: "Chat created",
  member_added: "Member added",
  member_left: "Member left",
  group_renamed: "Group renamed",
  group_photo_changed: "Group photo changed",
  disappearing_messages_on: "Disappearing messages on",
  disappearing_messages_off: "Disappearing messages off",
  theme_changed: "Chat theme changed",
  nickname_changed: "Nickname changed",
  message_deleted: "Message deleted",
  story_reply: "Replied to your story",
  post_shared: "Shared a post",
  end_to_end_encryption: "Messages are end-to-end encrypted",
};

/** Call statuses that mean the call never connected. */
const MISSED_CALL_STATUSES = ["missed", "declined", "busy", "failed", "cancelled"];

/* ---------------------------------- people --------------------------------- */

/** The first participant who is not the viewer — the direct-chat partner. */
export function partnerOf(conversation) {
  return (conversation?.participantIds ?? []).find((id) => id !== CURRENT_USER_ID) ?? null;
}

/**
 * The row title: the group's name, or the partner's name for a direct chat.
 * Falls back gracefully while the user directory is still loading.
 * @param {object} conversation
 * @param {Record<string, object>} [usersById]
 * @returns {string}
 */
export function chatTitle(conversation, usersById = {}) {
  if (!conversation) return "";
  if (conversation.kind === "group") return conversation.title || "Group chat";
  const partner = usersById[partnerOf(conversation)];
  return partner?.name ?? "Unknown user";
}

/** Stable tint colour derived from a chat id or name, for avatar initials. */
export function hashTint(seed = "") {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return TINTS[hash % TINTS.length];
}

/** Up to two letters for the avatar fallback, e.g. "Kwame Mensah" -> "KM". */
export function initialsOf(label = "") {
  const parts = String(label).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

/* --------------------------------- unread ---------------------------------- */

/** True when a chat shows an unread badge, a "marked unread" dot, or both. */
export function isChatUnread(conversation) {
  if (!conversation) return false;
  return (conversation.unreadCount ?? 0) > 0 || !!conversation.isMarkedUnread;
}

/**
 * Whether someone is typing in this chat right now.
 *
 * The data never fills `typingInConversationId`, so the explicit match wins
 * when present and, failing that, a direct partner flagged `isTyping` counts
 * as typing here. Groups stay quiet unless the data names this conversation.
 */
export function isTypingInChat(conversation, presenceByUser = {}) {
  if (!conversation) return false;
  const isDirect = conversation.kind === "direct";
  const partnerId = isDirect ? partnerOf(conversation) : null;
  for (const presence of Object.values(presenceByUser)) {
    if (!presence?.isTyping) continue;
    if (presence.typingInConversationId) {
      if (presence.typingInConversationId === conversation.id) return true;
    } else if (isDirect && presence.userId === partnerId) {
      return true;
    }
  }
  return false;
}

/* -------------------------------- timestamps -------------------------------- */

/**
 * List timestamp: "9:41" for today, "Yesterday", a weekday name inside the
 * current Mon–Sun week, otherwise "12/09". Evaluated on the WAT wall clock so
 * every device shows the same time the data was generated with.
 * @param {string} [iso]
 * @returns {string}
 */
export function formatChatTimestamp(iso) {
  if (!iso) return "";
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return "";

  const then = new Date(ms + WAT_MS);
  const now = new Date(Date.now() + WAT_MS);
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const thatDay = Date.UTC(then.getUTCFullYear(), then.getUTCMonth(), then.getUTCDate());
  const daysAgo = Math.round((today - thatDay) / MS_PER_DAY);

  if (daysAgo <= 0) {
    return `${then.getUTCHours()}:${String(then.getUTCMinutes()).padStart(2, "0")}`;
  }
  if (daysAgo === 1) return "Yesterday";
  const weekdayOfToday = (now.getUTCDay() + 6) % 7; // Monday = 0
  if (daysAgo <= weekdayOfToday) return WEEKDAY_NAMES[then.getUTCDay()];
  return `${String(then.getUTCDate()).padStart(2, "0")}/${String(then.getUTCMonth() + 1).padStart(2, "0")}`;
}

/* --------------------------------- previews -------------------------------- */

/**
 * Registry icon leading the preview line, or null for plain text.
 * Maps every message type in the data (plus view-once, which the bubble
 * components know about) onto the shared icon registry.
 * @param {object|null} message
 * @returns {string|null}
 */
export function previewIconName(message) {
  switch (message?.type) {
    case "voice":
      return "mic";
    case "image":
      return "image";
    case "video":
      return "video";
    case "file":
      return "file";
    case "game":
      return "game";
    case "call":
      return "phone";
    case "viewOnce":
      return "viewOnce";
    default:
      // text, emoji and system messages render without an icon.
      return null;
  }
}

/** Delivery check icon for own messages: single for sent, double after that. */
export function deliveryIconName(message) {
  if (!message || message.senderId !== CURRENT_USER_ID) return null;
  if (message.deliveryStatus === "sent") return "check";
  if (message.deliveryStatus === "delivered" || message.deliveryStatus === "read") return "checkDouble";
  return null;
}

/** "Your turn in Tic-Tac-Toe", "You won Chess", … */
export function gamePreviewText(game) {
  const name = GAME_DISPLAY_NAMES[game.gameType] ?? "Game";
  if (game.status === "pending") {
    return game.invitedById === CURRENT_USER_ID
      ? `Invited them to ${name}`
      : `Invitation to ${name}`;
  }
  if (game.status === "active") {
    return game.currentTurnUserId === CURRENT_USER_ID
      ? `Your turn in ${name}`
      : `Waiting for their move in ${name}`;
  }
  if (game.status === "declined") return `${name} declined`;
  if (game.status === "expired") return `${name} invite expired`;
  if (game.status === "finished") {
    if (game.rematchRequestedById === CURRENT_USER_ID) return `Rematch requested in ${name}`;
    if (game.outcome === "won") return `You won ${name}`;
    if (game.outcome === "lost") return `You lost ${name}`;
    if (game.outcome === "draw") return `Draw: ${name}`;
    return `Game over: ${name}`;
  }
  return name;
}

/** "Missed voice call", "Video call", … Falls back to a plain "Call". */
export function callPreviewText(call) {
  if (!call) return "Call";
  const kind = call.kind === "video" ? "video" : "voice";
  if (call.status === "missed") return `Missed ${kind} call`;
  if (MISSED_CALL_STATUSES.includes(call.status)) return `Unanswered ${kind} call`;
  return `${kind[0].toUpperCase()}${kind.slice(1)} call`;
}

/** The message body without any sender prefix. */
function messageBody(message, { game, call } = {}) {
  switch (message.type) {
    case "text":
      return message.text ?? "";
    case "emoji":
      return message.emoji ?? "";
    case "image":
      return "Photo";
    case "video":
      return `Video ${formatDuration(message.durationSec ?? message.media?.durationSec ?? 0)}`;
    case "voice":
      return `Voice note ${formatDuration(message.durationSec ?? 0)}`;
    case "file":
      return message.fileName ?? "File";
    case "game":
      return game ? gamePreviewText(game) : "Game";
    case "call":
      return call ? callPreviewText(call) : "Call";
    case "system":
      return SYSTEM_PREVIEW_LABELS[message.eventType] ?? "System message";
    case "viewOnce":
      if (message.opened) return "Opened";
      return message.mediaType === "video" ? "Video, view once" : "Photo, view once";
    default:
      return "";
  }
}

/**
 * Full preview line for a row: the message body, prefixed with the sender's
 * first name in group chats ("You: " for own messages).
 *
 * @param {object|null} message The conversation's newest message.
 * @param {object} [options]
 * @param {object} [options.conversation]
 * @param {Record<string, object>} [options.usersById]
 * @param {object|null} [options.game] Enriched game record, when loaded.
 * @param {object|null} [options.call] Enriched call record, when loaded.
 * @returns {string}
 */
export function previewText(message, { conversation, usersById = {}, game = null, call = null } = {}) {
  if (!message) return "";
  if (message.isDeleted) return "This message was deleted";

  const body = messageBody(message, { game, call });
  if (conversation?.kind !== "group") return body;
  if (!message.senderId) return body; // system events speak for themselves
  if (message.senderId === CURRENT_USER_ID) return `You: ${body}`;

  const senderName = usersById[message.senderId]?.name ?? "Someone";
  const firstName = senderName.split(/\s+/)[0];
  return `${firstName}: ${body}`;
}

/* --------------------------------- filtering -------------------------------- */

/** Pill filters. "channels" matches nothing today — the data has no channels. */
export function matchesChatFilter(conversation, filter) {
  switch (filter) {
    case "unread":
      return isChatUnread(conversation);
    case "groups":
      return conversation.kind === "group";
    case "channels":
      return conversation.kind === "channel";
    default:
      return true;
  }
}

/* --------------------------------- sections --------------------------------- */

/**
 * Flatten the loaded chats into the rows the FlatList renders: an archived
 * row, a "Pinned" section and an "All chats" section, newest first. Sections
 * that end up empty are omitted, and the archived row only appears when it
 * has archives behind it and a list to sit on top of.
 *
 * @param {object} options
 * @param {object[]} [options.conversations]
 * @param {Record<string, object|null>} [options.previews]
 * @param {Record<string, object>} [options.usersById]
 * @param {Record<string, object>} [options.gamesById]
 * @param {Record<string, object>} [options.callsById]
 * @param {string} [options.query]
 * @param {string} [options.filter] One of "all" | "unread" | "groups" | "channels".
 * @returns {{ items: object[], matchedCount: number }}
 */
export function buildChatListData({
  conversations = [],
  previews = {},
  usersById = {},
  gamesById = {},
  callsById = {},
  query = "",
  filter = "all",
} = {}) {
  const trimmed = query.trim().toLowerCase();

  const matched = conversations.filter((conversation) => {
    if (conversation.isArchived) return false;
    if (!matchesChatFilter(conversation, filter)) return false;
    if (!trimmed) return true;
    const preview = previews[conversation.id] ?? null;
    const haystack = `${chatTitle(conversation, usersById)} ${previewText(preview, {
      conversation,
      usersById,
      game: preview?.gameId ? gamesById[preview.gameId] : null,
      call: preview?.callId ? callsById[preview.callId] : null,
    })}`.toLowerCase();
    return haystack.includes(trimmed);
  });

  const byNewest = (a, b) =>
    Date.parse(b.updatedAt ?? b.createdAt) - Date.parse(a.updatedAt ?? a.createdAt);
  const pinned = matched.filter((c) => c.isPinned).sort(byNewest);
  const rest = matched.filter((c) => !c.isPinned).sort(byNewest);

  const archivedCount = conversations.filter((c) => c.isArchived).length;
  const items = [];
  if (archivedCount > 0 && matched.length > 0) {
    items.push({ kind: "archived", id: "row_archived", count: archivedCount });
  }

  const pushSection = (id, title, icon, chats) => {
    if (chats.length === 0) return;
    items.push({ kind: "section", id, title, icon });
    chats.forEach((conversation, index) => {
      items.push({
        kind: "chat",
        id: conversation.id,
        conversation,
        preview: previews[conversation.id] ?? null,
        showSeparator: index < chats.length - 1,
      });
    });
  };
  pushSection("section_pinned", "Pinned", "pin", pinned);
  pushSection("section_all", "All chats", null, rest);

  return { items, matchedCount: matched.length };
}


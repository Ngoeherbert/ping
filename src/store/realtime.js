import * as api from "../api/client";
import { useNotificationsStore } from "./notifications";
import { useMessagesStore } from "./messages";
import { useChatsStore } from "./chats";
import { useCallsStore } from "./calls";
import { useGamesStore } from "./games";
import { toWatIso } from "../utils/time";

/**
 * Real-time simulation.
 *
 * This is off by default. When started it occasionally pushes a notification,
 * a message, a typing state, an incoming call or a game turn, and does it
 * through the same store actions a screen would call, so nothing special is
 * needed on the UI side.
 *
 * Usage:
 *   import { startRealtime, stopRealtime } from "../store/realtime";
 *   startRealtime();
 */

/** @typedef {"notification"|"message"|"typing"|"call"|"gameTurn"} RealtimeEvent */

/** Monotonic counter so simulated ids are unique even within one tick. */
let rtCounter = 0;

let timer = null;
let config = {
  /** How often an event fires, in milliseconds. */
  intervalMs: 20_000,
  /** How likely each tick produces an event. */
  chance: 0.6,
  enabled: false,
};

/** True while the simulation is running. */
export function isRealtimeRunning() {
  return timer !== null;
}

/** Read the current simulation settings. */
export function getRealtimeConfig() {
  return { ...config };
}

/**
 * Change the simulation settings. Takes effect on the next tick.
 * @param {{ intervalMs?: number, chance?: number }} patch
 */
export function configureRealtime(patch) {
  config = { ...config, ...patch };
  return getRealtimeConfig();
}

/**
 * Begin the simulation. Safe to call twice; the second call is ignored.
 * @param {{ intervalMs?: number, chance?: number }} [options]
 */
export function startRealtime(options = {}) {
  if (timer) return false;
  if (options.intervalMs !== undefined) config.intervalMs = options.intervalMs;
  if (options.chance !== undefined) config.chance = options.chance;
  config.enabled = true;

  timer = setInterval(() => {
    void tick();
  }, config.intervalMs);

  return true;
}

/** Stop the simulation and clear its timer. */
export function stopRealtime() {
  if (!timer) return false;
  clearInterval(timer);
  timer = null;
  config.enabled = false;
  return true;
}

/** Run a single event now, regardless of the schedule. Useful in tests. */
export async function tick() {
  if (Math.random() > config.chance) return null;

  const event = pickEvent();
  try {
    return await emit(event);
  } catch {
    // A failed event must never break the simulation loop.
    return null;
  }
}

const EVENTS = ["notification", "message", "typing", "call", "gameTurn"];

function pickEvent() {
  // Calls are rarer, so they do not dominate the feed of activity.
  const weights = [30, 30, 20, 8, 12];
  const total = weights.reduce((a, b) => a + b, 0);
  let roll = Math.random() * total;
  for (let i = 0; i < EVENTS.length; i += 1) {
    roll -= weights[i];
    if (roll <= 0) return EVENTS[i];
  }
  return "notification";
}

/** Dispatch one event through the same actions a screen would use. */
async function emit(event) {
  const db = api.getDb();

  switch (event) {
    case "notification":
      return emitNotification(db);
    case "message":
      return emitMessage(db);
    case "typing":
      return emitTyping(db);
    case "call":
      return emitCall(db);
    case "gameTurn":
      return emitGameTurn(db);
    default:
      return null;
  }
}

async function emitNotification(db) {
  const users = db.users.filter((u) => !u.isDeleted && u.id !== api.CURRENT_USER_ID);
  if (users.length === 0) return null;

  const actor = users[Math.floor(Math.random() * users.length)];
  const post = db.posts.find((p) => !p.isDeleted);
  const type = ["new_follower", "like", "comment", "mention", "follow_request"][
    Math.floor(Math.random() * 5)
  ];

  const notification = {
    id: `n_rt_${(rtCounter += 1)}`,
    type,
    actorIds: [actor.id],
    targetId: type === "new_follower" || type === "follow_request" ? actor.id : post?.id ?? null,
    targetType: type === "like" || type === "comment" || type === "mention" ? "post" : null,
    groupedCount: 1,
    isRead: false,
    createdAt: toWatIso(Date.now()),
  };

  // Push through the store so the badge and the list update together.
  useNotificationsStore.getState().applyIncoming(notification);
  return notification;
}

async function emitMessage(db) {
  const conversation = db.conversations.find(
    (c) => c.kind === "direct" && c.participantIds.includes(api.CURRENT_USER_ID),
  );
  if (!conversation) return null;

  const other = conversation.participantIds.find((id) => id !== api.CURRENT_USER_ID);
  const text = ["You?", "On my way", "Call me", "Send the file", "Ok"][
    Math.floor(Math.random() * 5)
  ];

  const message = {
    id: `m_rt_${(rtCounter += 1)}`,
    conversationId: conversation.id,
    type: "text",
    text,
    senderId: other,
    createdAt: toWatIso(Date.now()),
    replyToId: null,
    forwardedFromId: null,
    isDeleted: false,
    deliveryStatus: null,
  };

  useMessagesStore.getState().applyIncoming(conversation.id, message);
  useChatsStore.getState().applyIncomingMessage(conversation.id, message);
  return message;
}

function emitTyping(db) {
  const conversation = db.conversations.find(
    (c) => c.kind === "direct" && c.participantIds.includes(api.CURRENT_USER_ID),
  );
  if (!conversation) return null;

  const other = conversation.participantIds.find((id) => id !== api.CURRENT_USER_ID);
  useMessagesStore.getState().setTyping(conversation.id, other, true);

  // Clear it shortly after, as a real typing indicator would.
  setTimeout(() => {
    useMessagesStore.getState().setTyping(conversation.id, other, false);
  }, 2500);

  return { conversationId: conversation.id, userId: other };
}

async function emitCall(db) {
  const conversation = db.conversations.find(
    (c) => c.kind === "direct" && c.participantIds.includes(api.CURRENT_USER_ID),
  );
  if (!conversation) return null;

  const other = conversation.participantIds.find((id) => id !== api.CURRENT_USER_ID);
  const kind = Math.random() < 0.4 ? "video" : "voice";
  const call = await api.startCall(conversation.id, kind, [other]);
  // An incoming call shows as ringing rather than outgoing.
  const incoming = {
    ...call,
    direction: "incoming",
    initiatorId: other,
    status: "missed",
    isRead: false,
  };

  useCallsStore.getState().applyIncomingCall(incoming);
  return incoming;
}

async function emitGameTurn(db) {
  const game = db.games.find(
    (g) => g.status === "active" && g.currentTurnUserId === api.CURRENT_USER_ID,
  );
  if (!game) return null;

  const updated = await useGamesStore.getState().playTurn(game.id, { score: 1 });
  return updated;
}

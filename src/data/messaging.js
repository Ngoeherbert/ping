import { createRng, times, shuffled } from "../utils/random";
import {
  recentIso,
  isoWithinDays,
  secondsAgo,
  secondsFromNow,
  toWatIso,
  MS_PER_HOUR,
} from "../utils/time";
import {
  MESSAGE_FRAGMENTS,
  EMOJI_SETS,
  GROUP_NAMES,
  RTL_SAMPLE,
  DATA_VOLUME,
  DEFAULT_SEED,
  imageUrl,
  videoUrl,
  BROKEN_MEDIA_URLS,
} from "../constants/data";
import { CURRENT_USER_ID } from "./people";

/** Game types the app knows about. @type {import("../types").GameType[]} */
export const GAME_TYPES = [
  "ludo",
  "snake_and_ladder",
  "tic_tac_toe",
  "chess",
  "word_game",
  "eight_ball",
  "cup_pong",
  "dots_and_boxes",
  "trivia",
];

/** Call statuses that mean the call never connected. @type {import("../types").CallStatus[]} */
export const UNANSWERED_CALL_STATUSES = ["missed", "declined", "busy", "failed", "cancelled"];

/**
 * Build conversations, messages, games, calls, presence and call groups.
 *
 * @param {object} options
 * @param {any} options.people Output of `generatePeople`.
 * @param {any} [options.content] Output of `generateContent`, used for shared posts.
 * @param {string} [options.seed]
 */
export function generateMessaging(options) {
  const seed = options.seed ?? DEFAULT_SEED;
  const rng = createRng(`${seed}:messaging`, "msg");
  const now = Date.now();

  const active = options.people.users.filter((u) => !u.isDeleted);
  const blockedIds = new Set(options.people.blocks.map((b) => b.userId));

  const conversations = buildConversations(rng, active, now);
  const games = buildGames(rng, conversations, now);
  const calls = buildCalls(rng, conversations, active, now, blockedIds);
  const presence = buildPresence(rng, active);
  const messages = buildMessages(rng, conversations, games, calls, active, now);

  // Point every conversation at its newest message.
  for (const conversation of conversations) {
    const mine = messages
      .filter((m) => m.conversationId === conversation.id)
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
    conversation.lastMessageId = mine.length > 0 ? mine[0].id : null;
    conversation.updatedAt = mine.length > 0 ? mine[0].createdAt : conversation.createdAt;
  }

  const missedCallGroups = groupMissedCalls(calls, options.people);

  return { conversations, messages, games, calls, presence, missedCallGroups };
}

/**
 * Direct chats plus group chats. Groups carry admins, an icon and a description.
 */
function buildConversations(rng, active, now) {
  const conversations = [];
  let seq = 0;

  const directCount = Math.ceil(DATA_VOLUME.conversations * 0.7);
  const partners = shuffled(active.filter((u) => u.id !== CURRENT_USER_ID), rng).slice(0, directCount);

  for (const partner of partners) {
    seq += 1;
    conversations.push({
      id: `cv_${seq}`,
      kind: "direct",
      participantIds: [CURRENT_USER_ID, partner.id],
      adminIds: [],
      title: null,
      iconUrl: null,
      description: null,
      lastMessageId: null,
      // Some threads have unread messages, some are read, some are pinned or muted.
      unreadCount: rng.weighted([0, rng.int(1, 3), rng.int(4, 20)], [35, 35, 30]),
      isPinned: rng.chance(0.15),
      isMuted: rng.chance(0.15),
      disappearingMessagesEnabled: rng.chance(0.1),
      disappearingAfterSec: rng.chance(0.5) ? 86400 : 604800,
      createdAt: isoWithinDays(rng, 700, now),
      updatedAt: recentIso(rng, now),
    });
  }

  const groupCount = DATA_VOLUME.conversations - directCount;
  const groupNames = shuffled(GROUP_NAMES, rng).slice(0, groupCount);

  for (const name of groupNames) {
    seq += 1;
    const members = shuffled(active, rng).slice(0, rng.int(5, 14));
    const admins = members.slice(0, rng.int(1, 3));
    const createdAt = isoWithinDays(rng, 500, now);

    conversations.push({
      id: `cv_${seq}`,
      kind: "group",
      participantIds: [CURRENT_USER_ID, ...members.filter((m) => m.id !== CURRENT_USER_ID).map((m) => m.id)],
      adminIds: admins.map((a) => a.id),
      title: name,
      iconUrl: rng.chance(0.7) ? imageUrl("square", 8000 + seq) : null,
      description: rng.chance(0.5) ? rng.pick(MESSAGE_FRAGMENTS).text : null,
      lastMessageId: null,
      unreadCount: rng.weighted([0, rng.int(1, 40)], [40, 60]),
      isPinned: rng.chance(0.2),
      isMuted: rng.chance(0.25),
      disappearingMessagesEnabled: rng.chance(0.15),
      disappearingAfterSec: 86400,
      createdAt,
      updatedAt: recentIso(rng, now),
    });
  }

  return conversations;
}
/**
 * Games live inside chats. Every required situation is covered explicitly so a
 * screen can be built against invites, turn-taking, outcomes and expiry.
 */
function buildGames(rng, conversations, now) {
  const games = [];
  let seq = 0;

  /** Situations a game in a two-person thread can be in. */
  const SITUATIONS = [
    "invite_sent",
    "accepted_your_turn",
    "their_turn",
    "in_progress",
    "you_won",
    "you_lost",
    "draw",
    "declined",
    "expired",
    "rematch_requested",
    "forfeited",
    "finished_offline",
  ];

  for (const conversation of conversations) {
    const others = conversation.participantIds.filter((id) => id !== CURRENT_USER_ID);
    if (others.length === 0) continue;

    const isGroup = conversation.kind === "group";
    const count = rng.int(
      DATA_VOLUME.gamesPerConversation.min,
      DATA_VOLUME.gamesPerConversation.max,
    );

    const situations = isGroup
      ? ["lobby_partial", "in_progress", "finished_summary"]
      : times(count, () => rng.pick(SITUATIONS));

    for (const situation of situations) {
      seq += 1;
      games.push(makeGame(rng, `g_${seq}`, situation, conversation, others, now));
    }
  }

  // Guarantee a still-pending invite and an already-expired one.
  const firstDirect = conversations.find((c) => c.kind === "direct");
  if (firstDirect) {
    const partner = firstDirect.participantIds.find((id) => id !== CURRENT_USER_ID);
    seq += 1;
games.push(makeGame(rng, `g_${seq}`, "invite_sent", firstDirect, [partner], now));
    seq += 1;
    games.push(makeGame(rng, `g_${seq}`, "expired", firstDirect, [partner], now));
  }

  return games;
}

/** Build a single game record for one of the named situations. */
function makeGame(rng, id, situation, conversation, others, now) {
  const gameType = rng.pick(GAME_TYPES);
  const invitedById = rng.chance(0.5) ? CURRENT_USER_ID : others[0];
  const isGroupGame = conversation.kind === "group";
  const maxPlayers = isGroupGame ? rng.int(2, 4) : 2;
  const createdMs = now - rng.int(600, 86_400 * 3) * 1000;

  const playerIds = isGroupGame
    ? [CURRENT_USER_ID, ...others.slice(0, Math.max(1, maxPlayers - 1))]
    : [CURRENT_USER_ID, others[0]];

  const players = playerIds.map((userId, seat) => ({
    userId,
    seat,
    score: 0,
    isReady: false,
  }));

  /** @type {import("../types").Game} */
  const game = {
    id,
    gameType,
    conversationId: conversation.id,
    invitedById,
    playerIds,
    players,
    status: "pending",
    currentTurnUserId: null,
    winnerUserId: null,
    outcome: null,
    round: 1,
    maxRounds: rng.pick([3, 5, 7]),
    scores: {},
    board: null,
    boardThumbUrl: rng.chance(0.4)
      ? imageUrl("square", 9000 + Number(id.split("_")[1]))
      : null,
    createdAt: toWatIso(createdMs),
    startedAt: null,
    endedAt: null,
    expiresAt: null,
    isGroupGame,
    joinedCount: 0,
    maxPlayers,
    leaderboard: [],
    rematchRequestedById: null,
    forfeitedById: null,
    finishedWhileOffline: null,
  };

  for (const p of players) game.scores[p.userId] = 0;
  const opponent = playerIds.find((p) => p !== CURRENT_USER_ID) ?? playerIds[0];

  applyGameSituation(game, situation, rng, opponent, now);
  return game;
}

/** Shared finish path for won and lost games. */
function finishGame(game, rng, winnerId) {
  game.status = "finished";
  game.startedAt = game.createdAt;
  game.endedAt = toWatIso(Date.parse(game.createdAt) + rng.int(600, 3_600) * 1000);
  game.winnerUserId = winnerId;
  game.outcome = winnerId === CURRENT_USER_ID ? "won" : "lost";
  game.round = game.maxRounds;
  game.players.forEach((p) => {
    p.isReady = true;
    p.score = p.userId === winnerId ? rng.int(8, 40) : rng.int(0, 7);
  });
  for (const p of game.players) game.scores[p.userId] = p.score;
  game.currentTurnUserId = null;
}

/** Mutate a freshly built game into the requested situation. */
function applyGameSituation(game, situation, rng, opponent, now) {
  const startedAt = toWatIso(Date.parse(game.createdAt) + 60_000);

  switch (situation) {
    case "invite_sent":
      game.status = "pending";
      game.expiresAt = secondsFromNow(rng.int(3600, 172_800), now);
      break;

    case "accepted_your_turn":
      game.status = "active";
      game.startedAt = startedAt;
      game.currentTurnUserId = CURRENT_USER_ID;
      game.players.forEach((p) => { p.isReady = true; });
      game.round = rng.int(1, 4);
      break;

    case "their_turn":
    case "in_progress":
      game.status = "active";
      game.startedAt = startedAt;
      game.currentTurnUserId = rng.chance(0.5) ? CURRENT_USER_ID : opponent;
      game.players.forEach((p) => { p.isReady = true; });
      game.round = rng.int(1, 5);
      game.scores[opponent] = rng.int(1, 5);
      break;

    case "you_won":
      finishGame(game, rng, CURRENT_USER_ID);
      break;

    case "you_lost":
      finishGame(game, rng, opponent);
      break;

    case "draw":
      game.status = "finished";
      game.startedAt = startedAt;
      game.endedAt = toWatIso(Date.parse(game.createdAt) + 1_800_000);
      game.winnerUserId = null;
      game.outcome = "draw";
      game.round = game.maxRounds;
      break;

    case "declined":
      game.status = "declined";
      game.endedAt = toWatIso(Date.parse(game.createdAt) + 300_000);
      break;

    case "expired":
      game.status = "expired";
      game.expiresAt = secondsAgo(rng.int(3600, 172_800), now);
      game.endedAt = game.expiresAt;
      break;

    case "rematch_requested":
      game.status = "finished";
      game.startedAt = startedAt;
      game.endedAt = toWatIso(Date.parse(game.createdAt) + 1_800_000);
      game.winnerUserId = rng.chance(0.5) ? CURRENT_USER_ID : opponent;
      game.outcome = game.winnerUserId === CURRENT_USER_ID ? "won" : "lost";
      game.rematchRequestedById = rng.bool() ? CURRENT_USER_ID : opponent;
      break;

    case "forfeited":
      game.status = "finished";
      game.startedAt = startedAt;
      game.endedAt = toWatIso(Date.parse(game.createdAt) + 900_000);
      game.forfeitedById = opponent;
      game.winnerUserId = CURRENT_USER_ID;
      game.outcome = "won";
      break;

    case "finished_offline":
      game.status = "finished";
      game.startedAt = startedAt;
      game.endedAt = toWatIso(now - rng.int(3600, 86_400) * 1000);
      game.finishedWhileOffline = CURRENT_USER_ID;
      game.winnerUserId = rng.bool() ? CURRENT_USER_ID : opponent;
      game.outcome = game.winnerUserId === CURRENT_USER_ID ? "won" : "lost";
      break;

    case "lobby_partial":
      game.status = "pending";
      game.joinedCount = rng.int(1, Math.max(1, game.maxPlayers - 1));
      game.expiresAt = secondsFromNow(rng.int(1800, 86_400), now);
      break;

    case "finished_summary": {
      game.status = "finished";
      game.startedAt = startedAt;
      game.endedAt = toWatIso(Date.parse(game.createdAt) + 3_600_000);
      game.joinedCount = game.maxPlayers;
      game.players.forEach((p) => { p.isReady = true; });
      game.leaderboard = game.playerIds
        .map((userId) => ({ userId, score: rng.int(5, 60), gamesWon: rng.int(0, 4) }))
        .sort((a, b) => b.score - a.score)
        .map((entry, i) => ({ ...entry, rank: i + 1 }));
      const top = game.leaderboard[0];
      game.winnerUserId = top.userId;
      game.outcome = top.userId === CURRENT_USER_ID ? "won" : "lost";
      for (const entry of game.leaderboard) game.scores[entry.userId] = entry.score;
      break;
    }

    default:
      break;
  }
}

/**
 * Calls appear both as chat messages and in a separate call history.
 * Covers every status, runs of missed calls, blocked and deleted callers, and
 * a call lasting over an hour.
 */
function buildCalls(rng, conversations, active, now, blockedIds) {
  const calls = [];
  let seq = 0;
  const deletedUsers = active.filter((u) => u.isDeleted);

  for (const conversation of conversations) {
    const others = othersOf(conversation);
    if (others.length === 0) continue;

    const count = rng.int(
      DATA_VOLUME.callsPerConversation.min,
      DATA_VOLUME.callsPerConversation.max,
    );
    // The first direct thread also gets a run of consecutive missed calls.
    const isMissedRunHost = conversation.kind === "direct";

    times(count, (i) => {
      seq += 1;
      const status = isMissedRunHost && i < 3
        ? "missed"
        : rng.pick([
          "answered", "answered", "answered", "missed", "declined",
          "busy", "cancelled", "failed", "ongoing",
        ]);
      calls.push(makeCall(rng, `call_${seq}`, conversation, rng.pick(others), {
        status,
        kind: rng.chance(0.45) ? "video" : "voice",
        direction: rng.chance(0.5) ? "incoming" : "outgoing",
        startedMs: now - rng.int(300, 86_400 * 14) * 1000,
        now,
      }));
    });

    // A group call that started, had people join and leave, then ended.
    if (conversation.kind === "group") {
      seq += 1;
      calls.push(makeCall(rng, `call_${seq}`, conversation, rng.pick(others), {
        status: "answered",
        kind: rng.chance(0.5) ? "video" : "voice",
        direction: "incoming",
        startedMs: now - rng.int(3600, 86_400 * 6) * 1000,
        now,
        isGroupCall: true,
      }));
    }
  }

  const direct = conversations.find((c) => c.kind === "direct");
  if (direct) {
    // A call from someone the viewer has blocked.
    const blockedId = [...blockedIds][0];
    if (blockedId) {
      seq += 1;
      calls.push(makeCall(rng, `call_${seq}`, direct, blockedId, {
        status: "missed", kind: "voice", direction: "incoming",
        startedMs: now - 7_200_000, now,
      }));
    }
    // A call from a deactivated account.
    if (deletedUsers.length > 0) {
      seq += 1;
      calls.push(makeCall(rng, `call_${seq}`, direct, deletedUsers[0].id, {
        status: "answered", kind: "video", direction: "incoming",
        startedMs: now - 86_400_000, now,
      }));
    }
    // An unusually long call that ran for over an hour.
    seq += 1;
    calls.push(makeCall(rng, `call_${seq}`, direct, rng.pick(othersOf(direct)), {
      status: "answered", kind: "video", direction: "outgoing",
      startedMs: now - 5 * MS_PER_HOUR, now, forceDurationSec: 74 * 60,
    }));
  }

  return calls;
}

function othersOf(conversation) {
  return conversation.participantIds.filter((id) => id !== CURRENT_USER_ID);
}

/** Build one call record, deriving timestamps and events from its status. */
function makeCall(rng, id, conversation, otherUserId, opts) {
  const { status, kind, direction, startedMs, now, isGroupCall = false } = opts;
  const startedAt = toWatIso(startedMs);
  const answered = status === "answered" || status === "ongoing";

  // Duration is empty whenever the call was never answered.
  let durationSec = null;
  if (status === "answered") durationSec = opts.forceDurationSec ?? rng.int(15, 45 * 60);
  else if (status === "ongoing") durationSec = rng.int(5, 120);

  const answeredMs = answered ? startedMs + rng.int(2, 20) * 1000 : null;
  const endedMs = answered ? startedMs + (durationSec ?? 0) * 1000 : null;

  const events = [
    {
      type: "started",
      userId: direction === "outgoing" ? CURRENT_USER_ID : otherUserId,
      at: startedAt,
    },
  ];
  if (answered) {
    events.push({
      type: "joined",
      userId: direction === "outgoing" ? otherUserId : CURRENT_USER_ID,
      at: toWatIso(answeredMs),
    });
  }
  if (endedMs) events.push({ type: "ended", userId: null, at: toWatIso(endedMs) });

  if (isGroupCall) {
    const members = othersOf(conversation).slice(0, 3);
    members.forEach((userId, i) => {
      events.push({
        type: i === members.length - 1 ? "left" : "joined",
        userId,
        at: toWatIso(startedMs + (i + 1) * 60_000),
      });
    });
  }

  return {
    id,
    conversationId: conversation.id,
    kind,
    direction,
    status,
    initiatorId: direction === "outgoing" ? CURRENT_USER_ID : otherUserId,
    participantIds: [CURRENT_USER_ID, otherUserId],
    answeredAt: answeredMs ? toWatIso(answeredMs) : null,
    endedAt: endedMs ? toWatIso(endedMs) : null,
    durationSec,
    isRead: rng.chance(0.7),
    events,
    startedAt,
  };
}

/**
 * Collapse runs of consecutive missed calls from the same person into one
 * entry, so a screen can show "3 missed calls" instead of three rows.
 * @param {import("../types").Call[]} calls
 * @param {{ blocks?: import("../types").Block[], users?: import("../types").User[] }} [people]
 * @returns {import("../types").MissedCallGroup[]}
 */
export function groupMissedCalls(calls, people) {
  const blockedIds = new Set((people?.blocks ?? []).map((b) => b.userId));
  const deletedIds = new Set(
    (people?.users ?? []).filter((u) => u.isDeleted).map((u) => u.id),
  );

  /** @type {Map<string, import("../types").Call[]>} */
  const byUser = new Map();

  for (const call of calls) {
    if (call.status !== "missed") continue;
    const callerId = call.direction === "outgoing"
      ? call.initiatorId
      : call.participantIds.find((id) => id !== CURRENT_USER_ID);
    if (!callerId) continue;
    if (!byUser.has(callerId)) byUser.set(callerId, []);
    byUser.get(callerId).push(call);
  }

  return [...byUser.entries()].map(([userId, userCalls]) => {
    const sorted = userCalls
      .slice()
      .sort((a, b) => Date.parse(b.startedAt) - Date.parse(a.startedAt));
    return {
      userId,
      callIds: sorted.map((c) => c.id),
      count: sorted.length,
      lastCallAt: sorted[0].startedAt,
      isBlockedCaller: blockedIds.has(userId),
      isDeletedCaller: deletedIds.has(userId),
    };
  });
}

/** Presence for everyone the viewer can see. */
function buildPresence(rng, active) {
  return active.map((user) => ({
    userId: user.id,
    status: user.presence,
    lastSeenAt: user.lastSeenAt,
    isTyping: rng.chance(0.08),
    typingInConversationId: null,
  }));
}

/** Outgoing messages carry delivery state; incoming ones are already read. */
function deliveryFor(senderId, rng) {
  if (senderId !== CURRENT_USER_ID) return "read";
  return rng.weighted(["sent", "delivered", "read"], [20, 35, 45]);
}

function makeSystemMessage(rng, conversation, eventType, params, createdAt) {
  return {
    id: `m_${rng.int(1, 10_000_000)}`,
    conversationId: conversation.id,
    type: "system",
    eventType,
    params,
    senderId: null,
    createdAt,
    replyToId: null,
    forwardedFromId: null,
    isDeleted: false,
    deliveryStatus: null,
  };
}

function systemParams(rng, conversation) {
  const other = conversation.participantIds.find((id) => id !== CURRENT_USER_ID);
  switch (rng.pick([
    "member_added", "member_left", "group_photo_changed", "theme_changed",
    "nickname_changed", "post_shared", "story_reply",
  ])) {
    case "member_added":
    case "member_left":
      return { actorId: CURRENT_USER_ID, targetUserId: other };
    case "group_photo_changed":
      return { actorId: CURRENT_USER_ID, iconUrl: imageUrl("square", rng.int(1, 999)) };
    case "theme_changed":
      return { actorId: CURRENT_USER_ID, theme: rng.pick(["light", "dark", "system"]) };
    case "nickname_changed":
      return { actorId: other, nickname: rng.pick(["Big Tabi", "Chef", "Ngoe", "Boss"]) };
    case "post_shared":
      return { actorId: other, postId: `p_${rng.int(1, 150)}` };
    default:
      return { actorId: other, postId: `st_${rng.int(1, 50)}` };
  }
}

/**
 * Messages for each conversation, covering every type in the union plus
 * reply-to, forwarded, deleted and delivery states.
 */
function buildMessages(rng, conversations, games, calls, active, now) {
  const messages = [];
  let seq = 0;

  const byConversation = (list) => {
    const map = new Map();
    for (const item of list) {
      if (!map.has(item.conversationId)) map.set(item.conversationId, []);
      map.get(item.conversationId).push(item);
    }
    return map;
  };

  const callsByConversation = byConversation(calls);
  const gamesByConversation = byConversation(games);

  for (const conversation of conversations) {
    const count = rng.int(10, DATA_VOLUME.messagesPerConversation);
    const conversationCalls = callsByConversation.get(conversation.id) ?? [];
    const conversationGames = gamesByConversation.get(conversation.id) ?? [];
    const mine = [];

    // Every thread opens with a creation event, like a real chat.
    mine.push(makeSystemMessage(
      rng, conversation, "chat_created",
      { actorId: CURRENT_USER_ID },
      isoWithinDays(rng, 400, now),
    ));

    // Group threads carry member and settings events too.
    if (conversation.kind === "group") {
      const other = conversation.participantIds.find((id) => id !== CURRENT_USER_ID);
      mine.push(makeSystemMessage(rng, conversation, "member_added",
        { actorId: CURRENT_USER_ID, targetUserId: other }, isoWithinDays(rng, 380, now)));
      mine.push(makeSystemMessage(rng, conversation, "group_renamed",
        { actorId: CURRENT_USER_ID, title: conversation.title }, isoWithinDays(rng, 300, now)));
      if (conversation.disappearingMessagesEnabled) {
        mine.push(makeSystemMessage(rng, conversation, "disappearing_messages_on",
          { actorId: CURRENT_USER_ID }, isoWithinDays(rng, 200, now)));
      }
    }

    // Calls and games enter the thread at their own timestamps.
    const events = [
      ...conversationCalls.map((call) => ({ at: call.startedAt, call })),
      ...conversationGames.map((game) => ({ at: game.createdAt, game })),
    ].sort((a, b) => Date.parse(a.at) - Date.parse(b.at));

    let eventIndex = 0;
    let lastTextId = null;
    let usedRtl = false;

    for (let i = 0; i < count; i += 1) {
      while (eventIndex < events.length && rng.chance(0.18)) {
        const event = events[eventIndex];
        eventIndex += 1;
        const base = {
          id: `m_${(seq += 1)}`,
          conversationId: conversation.id,
          senderId: event.call ? event.call.initiatorId : event.game.invitedById,
          createdAt: event.at,
          replyToId: null,
          forwardedFromId: null,
          isDeleted: false,
          deliveryStatus: null,
        };
        mine.push(
          event.call
            ? { ...base, type: "call", callId: event.call.id }
            : { ...base, type: "game", gameId: event.game.id },
        );
      }

      const fragment = rng.pick(MESSAGE_FRAGMENTS);
      const senderId = rng.chance(0.45)
        ? CURRENT_USER_ID
        : rng.pick(conversation.participantIds.filter((id) => id !== CURRENT_USER_ID));
      const createdAt = recentIso(rng, now);
      const roll = rng.next();
      const id = `m_${(seq += 1)}`;
      const base = {
        id,
        conversationId: conversation.id,
        senderId,
        createdAt,
        replyToId: null,
        forwardedFromId: rng.chance(0.06) ? CURRENT_USER_ID : null,
        isDeleted: false,
        deliveryStatus: deliveryFor(senderId, rng),
      };

      let message;
      if (roll < 0.5) {
        const isEmoji = rng.chance(0.12);
        message = isEmoji
          ? { ...base, type: "emoji", emoji: rng.pick(EMOJI_SETS), replyToId: rng.chance(0.15) ? lastTextId : null }
          : { ...base, type: "text", text: fragment.text, replyToId: rng.chance(0.25) ? lastTextId : null };
        lastTextId = id;
      } else if (roll < 0.62) {
        message = {
          ...base,
          type: "image",
          media: {
            id: `med_msg_${seq}`,
            kind: "image",
            url: rng.chance(0.08)
              ? rng.pick(BROKEN_MEDIA_URLS)
              : imageUrl(rng.pick(["square", "portrait", "landscape"]), 20000 + seq),
            thumbUrl: null,
            width: 1080,
            height: 1350,
            durationSec: null,
            altText: null,
          },
          caption: rng.chance(0.3) ? fragment.text : null,
        };
      } else if (roll < 0.7) {
        const video = videoUrl(seq);
        message = {
          ...base,
          type: "video",
          media: {
            id: `med_msg_${seq}`,
            kind: "video",
            url: video.url,
            thumbUrl: video.thumbUrl,
            width: 1080,
            height: 1920,
            durationSec: rng.int(5, 90),
            altText: null,
          },
          caption: null,
          durationSec: rng.int(5, 90),
        };
      } else if (roll < 0.78) {
        message = {
          ...base,
          type: "voice",
          durationSec: rng.int(3, 180),
          waveform: times(28, () => Number(rng.float(0.1, 1).toFixed(2))),
          isListenOnce: rng.chance(0.1),
        };
      } else if (roll < 0.84) {
        message = {
          ...base,
          type: "file",
          fileName: rng.pick([
            "Ping-spec.pdf", "budget.xlsx", "notes.docx", "photo.zip",
            "receipt.jpg", "contract-signed.pdf",
          ]),
          sizeBytes: rng.int(20_000, 8_000_000),
          mimeType: "application/pdf",
          url: "https://files.example.cm/doc",
        };
      } else if (roll < 0.92) {
        message = {
          ...base,
          type: "system",
          senderId: null,
          deliveryStatus: null,
          eventType: rng.pick([
            "member_added", "member_left", "group_photo_changed", "theme_changed",
            "nickname_changed", "message_deleted", "story_reply", "post_shared",
            "end_to_end_encryption", "disappearing_messages_off",
          ]),
          params: systemParams(rng, conversation),
        };
      } else {
        // The RTL sample appears once so mixed-direction text is exercised.
        message = usedRtl
          ? { ...base, type: "text", text: fragment.text }
          : { ...base, type: "text", text: RTL_SAMPLE };
        usedRtl = true;
        lastTextId = id;
      }

      mine.push(message);
    }

    messages.push(...mine);
  }

  // Exactly one deleted message across the whole data set.
  const victim = messages.find(
    (m) => m.type === "text" && m.senderId === CURRENT_USER_ID && !m.isDeleted,
  );
  if (victim) {
    victim.isDeleted = true;
    victim.text = "";
  }

  return messages;
}

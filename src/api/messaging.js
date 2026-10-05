import {
  getDb, run, nextId, findUser, findConversation, findGame, findCall, CURRENT_USER_ID,
} from "./db";
import { paginate } from "./pagination";
import { notFound, validationError, forbidden, conflict } from "./errors";
import { groupMissedCalls } from "../data/messaging";
import { toWatIso, secondsFromNow } from "../utils/time";

/* ----------------------------- conversations ------------------------------- */

/** The conversation list, most recently active first. */
export function listConversations(params = {}) {
  return run(() => {
    const db = getDb();
    const ordered = db.conversations
      .slice()
      .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
    const { slice, pageInfo, requestId } = paginate(ordered, params);
    return { conversations: slice, pageInfo, requestId };
  });
}

/** One conversation. */
export function getConversation(conversationId) {
  return run(() => {
    const conversation = findConversation(conversationId);
    if (!conversation) throw notFound("That conversation no longer exists");
    return conversation;
  });
}

/** Total unread messages across every conversation. */
export function getUnreadCounts() {
  return run(() => {
    const db = getDb();
    const byConversation = {};
    let total = 0;
    for (const c of db.conversations) {
      byConversation[c.id] = c.unreadCount;
      total += c.unreadCount;
    }
    return { byConversation, total };
  });
}

/**
 * Messages in a conversation, oldest first, with a cursor for paging back.
 * @param {string} conversationId
 * @param {{ cursor?: string, limit?: number }} [params]
 */
export function listMessages(conversationId, params = {}) {
  return run(() => {
    const db = getDb();
    const conversation = findConversation(conversationId);
    if (!conversation) throw notFound("That conversation no longer exists");

    const mine = db.messages
      .filter((m) => m.conversationId === conversationId)
      .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));

    // Pages run newest-first internally, then flip so callers read top-down.
    const reversed = mine.slice().reverse();
    const { slice, pageInfo, requestId } = paginate(reversed, params);
    return { messages: slice.reverse(), pageInfo, requestId };
  });
}

/**
 * Send a message. `type` narrows the payload, matching the Message union.
 * @param {string} conversationId
 * @param {object} input
 */
export function sendMessage(conversationId, input = {}) {
  return run(() => {
    const db = getDb();
    const conversation = findConversation(conversationId);
    if (!conversation) throw notFound("That conversation no longer exists");

    const senderId = input.senderId ?? CURRENT_USER_ID;
    if (senderId !== CURRENT_USER_ID && !conversation.participantIds.includes(senderId)) {
      throw forbidden("That person is not in this conversation");
    }

    const type = input.type ?? "text";
    const now = toWatIso(Date.now());

    /** @type {any} */
    const message = {
      id: nextId("message"),
      conversationId,
      type,
      senderId,
      createdAt: now,
      replyToId: input.replyToId ?? null,
      forwardedFromId: input.forwardedFromId ?? null,
      isDeleted: false,
      deliveryStatus: senderId === CURRENT_USER_ID ? "sent" : null,
    };

    // Payload per message type; only the fields that type uses are attached.
    if (type === "text") message.text = (input.text ?? "").trim();
    else if (type === "emoji") message.emoji = input.emoji ?? "👍";
    else if (type === "image") message.media = input.media ?? null;
    else if (type === "video") {
      message.media = input.media ?? null;
      message.caption = input.caption ?? null;
      message.durationSec = input.durationSec ?? 0;
    } else if (type === "voice") {
      message.durationSec = input.durationSec ?? 0;
      message.waveform = input.waveform ?? [];
      message.isListenOnce = !!input.isListenOnce;
    } else if (type === "file") {
      message.fileName = input.fileName ?? "file";
      message.sizeBytes = input.sizeBytes ?? 0;
      message.mimeType = input.mimeType ?? "application/octet-stream";
      message.url = input.url ?? "";
    } else if (type === "game") message.gameId = input.gameId ?? null;
    else if (type === "call") message.callId = input.callId ?? null;
    else if (type === "system") {
      message.senderId = null;
      message.deliveryStatus = null;
      message.eventType = input.eventType ?? "member_added";
      message.params = input.params ?? {};
    }

    if (type === "text" && !message.text) throw validationError("Write something first");

    db.messages.push(message);
    conversation.lastMessageId = message.id;
    conversation.updatedAt = now;
    return message;
  });
}

/** Delete one of your own messages. */
export function deleteMessage(messageId) {
  return run(() => {
    const db = getDb();
    const message = db.messages.find((m) => m.id === messageId);
    if (!message) throw notFound("That message no longer exists");
    if (message.senderId !== CURRENT_USER_ID) {
      throw forbidden("You can only delete your own messages");
    }
    message.isDeleted = true;
    if (message.type === "text") message.text = "";
    return { deleted: true, message };
  });
}

/** Clear a conversation's unread count. */
export function markConversationRead(conversationId) {
  return run(() => {
    const conversation = findConversation(conversationId);
    if (!conversation) throw notFound("That conversation no longer exists");
    conversation.unreadCount = 0;
    return conversation;
  });
}

/** Pin, mute or rename a conversation. */
export function updateConversation(conversationId, changes = {}) {
  return run(() => {
    const conversation = findConversation(conversationId);
    if (!conversation) throw notFound("That conversation no longer exists");

    if (changes.isPinned !== undefined) conversation.isPinned = !!changes.isPinned;
    if (changes.isMuted !== undefined) conversation.isMuted = !!changes.isMuted;
    if (changes.title !== undefined && conversation.kind === "group") {
      conversation.title = changes.title;
    }
    if (changes.description !== undefined && conversation.kind === "group") {
      conversation.description = changes.description;
    }
    if (changes.disappearingAfterSec !== undefined) {
      conversation.disappearingAfterSec = changes.disappearingAfterSec;
      conversation.disappearingMessagesEnabled = !!changes.disappearingAfterSec;
    }
    return conversation;
  });
}

/** Turn disappearing messages on or off. */
export function setDisappearingMessages(conversationId, afterSec) {
  return updateConversation(conversationId, { disappearingAfterSec: afterSec });
}

/* -------------------------------- presence --------------------------------- */

/** Who is online or typing. */
export function getPresence() {
  return run(() => ({ presence: getDb().presence }));
}

/** Presence for one conversation. */
export function getConversationPresence(conversationId) {
  return run(() => {
    const conversation = findConversation(conversationId);
    if (!conversation) throw notFound("That conversation no longer exists");
    const db = getDb();
    return {
      presence: db.presence.filter((p) => conversation.participantIds.includes(p.userId)),
    };
  });
}

/* --------------------------------- games ---------------------------------- */

/** Games in a conversation, newest first. */
export function listGames(conversationId, params = {}) {
  return run(() => {
    const db = getDb();
    let games = db.games.filter((g) => g.conversationId === conversationId);
    if (params.status) games = games.filter((g) => g.status === params.status);

    const ordered = games
      .slice()
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
    const { slice, pageInfo, requestId } = paginate(ordered, params);
    return { games: slice, pageInfo, requestId };
  });
}

/** One game. */
export function getGame(gameId) {
  return run(() => {
    const game = findGame(gameId);
    if (!game) throw notFound("That game no longer exists");
    return game;
  });
}

/**
 * Invite someone to a game.
 * @param {string} conversationId
 * @param {string} gameType
 * @param {string[]} [inviteeIds]
 */
export function inviteToGame(conversationId, gameType, inviteeIds = []) {
  return run(() => {
    const db = getDb();
    const conversation = findConversation(conversationId);
    if (!conversation) throw notFound("That conversation no longer exists");

    // Default to a conversation peer so a game always has an opponent; a
    // one-player game could never be won, lost or drawn meaningfully.
    const invitees = inviteeIds.length > 0
      ? inviteeIds.filter((id) => id !== CURRENT_USER_ID)
      : conversation.participantIds.filter((id) => id !== CURRENT_USER_ID).slice(0, 1);

    const players = [CURRENT_USER_ID, ...invitees];
    const game = {
      id: nextId("game"),
      gameType,
      conversationId,
      invitedById: CURRENT_USER_ID,
      playerIds: players,
      players: players.map((userId, seat) => ({ userId, seat, score: 0, isReady: seat === 0 })),
      status: "pending",
      currentTurnUserId: null,
      winnerUserId: null,
      outcome: null,
      round: 1,
      maxRounds: 5,
      scores: Object.fromEntries(players.map((id) => [id, 0])),
      board: null,
      boardThumbUrl: null,
      createdAt: toWatIso(Date.now()),
      startedAt: null,
      endedAt: null,
      // Invites expire, like a real game server would enforce.
      expiresAt: secondsFromNow(86_400),
      isGroupGame: conversation.kind === "group",
      joinedCount: 1,
      maxPlayers: conversation.kind === "group" ? Math.max(2, players.length) : 2,
      leaderboard: [],
      rematchRequestedById: null,
      forfeitedById: null,
      finishedWhileOffline: null,
    };

    db.games.push(game);
    return game;
  });
}

/** Accept a pending invite, which starts the game. */
export function acceptGame(gameId) {
  return run(() => {
    const game = findGame(gameId);
    if (!game) throw notFound("That game no longer exists");
    if (game.status !== "pending") throw conflict("That invite is no longer open");

    if (game.expiresAt && Date.parse(game.expiresAt) <= Date.now()) {
      game.status = "expired";
      throw conflict("That invite has expired");
    }

    game.status = "active";
    game.startedAt = toWatIso(Date.now());
    game.expiresAt = null;
    game.joinedCount += 1;
    game.players.forEach((p) => { p.isReady = true; });
    // The inviter moves first.
    game.currentTurnUserId = game.invitedById;
    return game;
  });
}

/** Decline a pending invite. */
export function declineGame(gameId) {
  return run(() => {
    const game = findGame(gameId);
    if (!game) throw notFound("That game no longer exists");
    if (game.status !== "pending") throw conflict("That invite is no longer open");

    game.status = "declined";
    game.endedAt = toWatIso(Date.now());
    return game;
  });
}

/**
 * Play a turn. Only valid when it is the viewer's turn and the game is active.
 * @param {string} gameId
 * @param {object} [move] Optional board snapshot to store with the move.
 */
export function playTurn(gameId, move = {}) {
  return run(() => {
    const db = getDb();
    const game = findGame(gameId);
    if (!game) throw notFound("That game no longer exists");
    if (game.status !== "active") throw conflict("That game is not in play");

    if (game.currentTurnUserId !== CURRENT_USER_ID) {
      throw conflict("It is not your turn");
    }

    if (move.board !== undefined) game.board = move.board;
    game.scores[CURRENT_USER_ID] = (game.scores[CURRENT_USER_ID] ?? 0) + (move.score ?? 1);

    const opponents = game.playerIds.filter((id) => id !== CURRENT_USER_ID);
    const next = opponents.find((id) => id !== game.currentTurnUserId) ?? opponents[0];

    if (move.isFinished) {
      finishGameWith(game, db, CURRENT_USER_ID);
    } else if (game.round >= (game.maxRounds ?? 5)) {
      // Out of rounds: the higher score wins, otherwise it is a draw.
      const [a, b] = game.playerIds;
      if ((game.scores[a] ?? 0) === (game.scores[b] ?? 0)) finishGameWith(game, db, null);
      else finishGameWith(game, db, (game.scores[a] ?? 0) > (game.scores[b] ?? 0) ? a : b);
    } else {
      game.round += 1;
      game.currentTurnUserId = next ?? null;
    }

    return game;
  });
}

/** Give up a game in progress. */
export function forfeitGame(gameId) {
  return run(() => {
    const db = getDb();
    const game = findGame(gameId);
    if (!game) throw notFound("That game no longer exists");
    if (game.status === "finished") throw conflict("That game is already over");

    game.forfeitedById = CURRENT_USER_ID;
    // Forfeiting always hands the win to an opponent when one exists.
    const opponent = game.playerIds.find((id) => id !== CURRENT_USER_ID) ?? null;
    finishGameWith(game, db, opponent);
    return game;
  });
}

/** Ask for a rematch of a finished game. */
export function requestRematch(gameId) {
  return run(() => {
    const game = findGame(gameId);
    if (!game) throw notFound("That game no longer exists");
    if (game.status !== "finished") throw conflict("You can only rematch a finished game");

    game.rematchRequestedById = CURRENT_USER_ID;
    return game;
  });
}

/** Shared finish path: sets status, winner and the viewer's perspective. */
function finishGameWith(game, db, winnerId) {
  game.status = "finished";
  game.endedAt = toWatIso(Date.now());
  game.currentTurnUserId = null;
  game.winnerUserId = winnerId;

  if (winnerId === null) game.outcome = "draw";
  else if (winnerId === CURRENT_USER_ID) game.outcome = "won";
  else game.outcome = "lost";

  game.players = game.players.map((p) => ({
    ...p,
    score: game.scores[p.userId] ?? p.score,
  }));

  // Group games keep a ranked summary.
  if (game.isGroupGame) {
    game.leaderboard = game.playerIds
      .map((userId) => ({ userId, score: game.scores[userId] ?? 0, gamesWon: winnerId === userId ? 1 : 0 }))
      .sort((a, b) => b.score - a.score)
      .map((entry, i) => ({ ...entry, rank: i + 1 }));
    game.joinedCount = game.playerIds.length;
  }
}

/* ---------------------------------- calls --------------------------------- */

/**
 * The call history.
 * @param {{ filter?: "all"|"missed", cursor?: string, limit?: number }} [params]
 */
export function listCalls(params = {}) {
  return run(() => {
    const db = getDb();
    let calls = db.calls;
    if (params.filter === "missed") calls = calls.filter((c) => c.status === "missed");

    const ordered = calls
      .slice()
      .sort((a, b) => Date.parse(b.startedAt) - Date.parse(a.startedAt));

    const { slice, pageInfo, requestId } = paginate(ordered, params);
    return {
      calls: slice,
      groups: groupMissedCalls(ordered, db),
      pageInfo,
      requestId,
    };
  });
}

/** Missed calls collapsed into runs, for a "3 missed calls" row. */
export function listMissedCallGroups() {
  return run(() => {
    const db = getDb();
    return { groups: groupMissedCalls(db.calls, db) };
  });
}

/** Start an outgoing call. */
export function startCall(conversationId, kind = "voice", participantIds = []) {
  return run(() => {
    const db = getDb();
    const conversation = findConversation(conversationId);
    if (!conversation) throw notFound("That conversation no longer exists");

    const now = toWatIso(Date.now());
    const others = participantIds.length > 0
      ? participantIds
      : conversation.participantIds.filter((id) => id !== CURRENT_USER_ID);

    const call = {
      id: nextId("call"),
      conversationId,
      kind,
      direction: "outgoing",
      // An outgoing call starts ongoing and only becomes answered if picked up.
      status: "ongoing",
      initiatorId: CURRENT_USER_ID,
      participantIds: [CURRENT_USER_ID, ...others],
      answeredAt: null,
      endedAt: null,
      durationSec: null,
      isRead: true,
      events: [{ type: "started", userId: CURRENT_USER_ID, at: now }],
      startedAt: now,
    };

    db.calls.push(call);
    db.messages.push({
      id: nextId("message"),
      conversationId,
      type: "call",
      callId: call.id,
      senderId: CURRENT_USER_ID,
      createdAt: now,
      replyToId: null,
      forwardedFromId: null,
      isDeleted: false,
      deliveryStatus: "sent",
    });
    conversation.lastMessageId = db.messages[db.messages.length - 1].id;
    conversation.updatedAt = now;
    return call;
  });
}

/** End an ongoing call and record how long it lasted. */
export function endCall(callId, status = "answered") {
  return run(() => {
    const db = getDb();
    const call = findCall(callId);
    if (!call) throw notFound("That call no longer exists");
    if (call.status !== "ongoing" && call.status !== "answered") {
      throw conflict("That call has already ended");
    }

    const now = toWatIso(Date.now());
    const durationSec = call.answeredAt
      ? Math.max(0, Math.round((Date.parse(now) - Date.parse(call.answeredAt)) / 1000))
      : null;

    call.status = durationSec === null ? "cancelled" : status;
    call.endedAt = now;
    call.durationSec = durationSec;
    call.events.push({ type: "ended", userId: null, at: now });
    return call;
  });
}

/**
 * Answer a call. This covers both an incoming call being picked up and an
 * outgoing one being answered at the other end, which is what lets `endCall`
 * record a duration.
 */
export function answerCall(callId) {
  return run(() => {
    const call = findCall(callId);
    if (!call) throw notFound("That call no longer exists");
    if (call.status !== "incoming" && call.status !== "missed" && call.status !== "ongoing") {
      throw conflict("That call can no longer be answered");
    }
    call.status = "answered";
    call.answeredAt = toWatIso(Date.now());
    call.events.push({
      type: "joined",
      userId: call.direction === "outgoing"
        ? (call.participantIds.find((id) => id !== CURRENT_USER_ID) ?? null)
        : CURRENT_USER_ID,
      at: call.answeredAt,
    });
    return call;
  });
}

/** Call someone back, starting a fresh outgoing call. */
export function callBack(userId, kind = "voice") {
  return run(() => {
    const db = getDb();
    if (!findUser(userId)) throw notFound("That account no longer exists");

    const existing = db.conversations.find(
      (c) => c.kind === "direct" && c.participantIds.includes(userId),
    );
    if (!existing) throw notFound("There is no conversation with that person");
    return startCall(existing.id, kind, [userId]);
  });
}

/** Mark a call as seen. */
export function markCallRead(callId) {
  return run(() => {
    const call = findCall(callId);
    if (!call) throw notFound("That call no longer exists");
    call.isRead = true;
    return call;
  });
}

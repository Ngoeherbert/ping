import { create } from "zustand";
import * as api from "../api/client";
import { toErrorBody, appendIds } from "./helpers";

/**
 * Games played inside chats.
 *
 * Every action goes through the API and then writes the returned game back,
 * so the store never invents a state the server would not accept.
 */
export const useGamesStore = create((set, get) => ({
  byId: {},
  /** @type {Record<string, string[]>} conversation id -> game ids */
  byConversation: {},
  status: "idle",
  error: null,

  /** Load games in a conversation. */
  fetchGames: async (conversationId, params = {}) => {
    set({ status: "loading", error: null });
    try {
      const response = await api.listGames(conversationId, { limit: 20, ...params });
      set((state) => ({
        byId: { ...state.byId, ...Object.fromEntries(response.games.map((g) => [g.id, g])) },
        byConversation: {
          ...state.byConversation,
          [conversationId]: appendIds(
            state.byConversation[conversationId] ?? [],
            response.games.map((g) => g.id),
          ),
        },
        status: "idle",
        error: null,
      }));
    } catch (error) {
      set({ status: "error", error: toErrorBody(error) });
    }
  },

  /** Invite someone to a new game. */
  invite: async (conversationId, gameType, inviteeIds = []) => {
    try {
      const game = await api.inviteToGame(conversationId, gameType, inviteeIds);
      set((state) => ({
        byId: { ...state.byId, [game.id]: game },
        byConversation: {
          ...state.byConversation,
          [conversationId]: appendIds(state.byConversation[conversationId] ?? [], [game.id]),
        },
      }));
      return game;
    } catch (error) {
      set({ error: toErrorBody(error) });
      return null;
    }
  },

  /** Accept a pending invite. */
  accept: async (gameId) => applyGame(set, get, () => api.acceptGame(gameId)),

  /** Decline a pending invite. */
  decline: async (gameId) => applyGame(set, get, () => api.declineGame(gameId)),

  /** Play a turn. Fails when it is not the viewer's turn. */
  playTurn: async (gameId, move = {}) => applyGame(set, get, () => api.playTurn(gameId, move)),

  /** Give up a game in progress. */
  forfeit: async (gameId) => applyGame(set, get, () => api.forfeitGame(gameId)),

  /** Ask for a rematch of a finished game. */
  requestRematch: async (gameId) => applyGame(set, get, () => api.requestRematch(gameId)),

  /** Load one game, e.g. when opening a game screen. */
  fetchGame: async (gameId) => {
    try {
      const game = await api.getGame(gameId);
      set((state) => ({ byId: { ...state.byId, [gameId]: game } }));
      return game;
    } catch (error) {
      set({ error: toErrorBody(error) });
      return null;
    }
  },
}));

/** Run an API call and store whatever game it returns, or report the failure. */
async function applyGame(set, get, call) {
  try {
    const game = await call();
    set((state) => ({ byId: { ...state.byId, [game.id]: game }, error: null }));
    return game;
  } catch (error) {
    set({ error: toErrorBody(error) });
    return null;
  }
}

/* -------------------------------- selectors -------------------------------- */

const slice = (state) => state.games ?? state;

export const selectGame = (gameId) => (state) => slice(state).byId[gameId] ?? null;

export const selectGamesForConversation = (conversationId) => (state) =>
  (slice(state).byConversation[conversationId] ?? []).map((id) => slice(state).byId[id]).filter(Boolean);

/** Games still waiting for an answer, for a badge. */
export const selectPendingInvites = (state) =>
  Object.values(slice(state).byId).filter((g) => g.status === "pending");

/** Games where it is the viewer's move right now. */
export const selectYourTurnGames = (state) =>
  Object.values(slice(state).byId).filter(
    (g) => g.status === "active" && g.currentTurnUserId === api.CURRENT_USER_ID,
  );

/** Games finished while the viewer was offline, to sync on open. */
export const selectGamesFinishedOffline = (state) =>
  Object.values(slice(state).byId).filter((g) => g.finishedWhileOffline === api.CURRENT_USER_ID);

/** Finished games, newest first, for a history screen. */
export const selectGameHistory = (conversationId) => (state) =>
  selectGamesForConversation(conversationId)(state)
    .filter((g) => g.status === "finished")
    .sort((a, b) => Date.parse(b.endedAt ?? 0) - Date.parse(a.endedAt ?? 0));

/** Group games that are still filling up, e.g. "3 of 4 joined". */
export const selectOpenLobbies = (state) =>
  Object.values(slice(state).byId).filter(
    (g) => g.isGroupGame && g.status === "pending" && g.joinedCount < g.maxPlayers,
  );

export const selectGamesError = (state) => slice(state).error;

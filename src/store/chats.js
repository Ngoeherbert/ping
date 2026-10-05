import { create } from "zustand";
import * as api from "../api/client";
import { emptyList, mergeById, appendIds, toErrorBody } from "./helpers";

/**
 * The conversation list and presence.
 *
 * Messages live in their own store, so opening a thread does not reload the
 * whole list.
 */
export const useChatsStore = create((set, get) => ({
  byId: {},
  list: emptyList(),
  /** @type {Record<string, import("../types").Presence>} */
  presenceByUser: {},
  unreadTotal: 0,
  status: "idle",
  error: null,

  /** Load the conversation list, most recently active first. */
  fetchConversations: async (params = {}) => {
    set((state) => ({ list: { ...state.list, status: "loading", error: null } }));
    try {
      const response = await api.listConversations({ limit: 20, ...params });
      // Unread counts come from the API so a badge never drifts from the list.
      const { total } = await api.getUnreadCounts();
      set((state) => ({
        byId: mergeById(state.byId, response.conversations),
        list: {
          items: response.conversations.map((c) => c.id),
          status: "idle",
          error: null,
          cursor: response.pageInfo.cursor,
          hasMore: response.pageInfo.hasMore,
          lastFetchedAt: Date.now(),
        },
        unreadTotal: total,
      }));
    } catch (error) {
      set((state) => ({ list: { ...get().list, status: "error", error: toErrorBody(error) } }));
    }
  },

  /** Append the next page of conversations. */
  loadMoreConversations: async () => {
    const { list } = get();
    if (!list.hasMore || list.status === "loadingMore") return;

    set({ list: { ...list, status: "loadingMore" } });
    try {
      const response = await api.listConversations({ limit: 20, cursor: list.cursor });
      set((state) => ({
        byId: mergeById(state.byId, response.conversations),
        list: {
          ...get().list,
          items: appendIds(get().list.items, response.conversations.map((c) => c.id)),
          status: "idle",
          error: null,
          cursor: response.pageInfo.cursor,
          hasMore: response.pageInfo.hasMore,
          lastFetchedAt: Date.now(),
        },
      }));
    } catch (error) {
      set((state) => ({ list: { ...get().list, status: "error", error: toErrorBody(error) } }));
    }
  },

  /** Load presence for the whole app. */
  fetchPresence: async () => {
    try {
      const { presence } = await api.getPresence();
      set((state) => ({
        presenceByUser: Object.fromEntries(presence.map((p) => [p.userId, p])),
      }));
    } catch (error) {
      set({ error: toErrorBody(error) });
    }
  },

  /** Refresh the total unread count, used by a tab badge. */
  refreshUnreadCount: async () => {
    try {
      const { total } = await api.getUnreadCounts();
      set({ unreadTotal: total });
      return total;
    } catch (error) {
      set({ error: toErrorBody(error) });
      return null;
    }
  },

  /** Clear a conversation's unread count, locally and on the server. */
  markRead: async (conversationId) => {
    const before = get().byId[conversationId];
    if (!before) return null;

    set((state) => ({
      byId: {
        ...state.byId,
        [conversationId]: { ...before, unreadCount: 0 },
      },
      unreadTotal: Math.max(0, state.unreadTotal - before.unreadCount),
    }));

    try {
      const conversation = await api.markConversationRead(conversationId);
      set((state) => ({ byId: { ...state.byId, [conversationId]: conversation } }));
      return conversation;
    } catch (error) {
      set((state) => ({
        byId: { ...state.byId, [conversationId]: before },
        unreadTotal: state.unreadTotal + before.unreadCount,
        error: toErrorBody(error),
      }));
      return null;
    }
  },

  /** Pin, mute, rename or change disappearing messages on a conversation. */
  updateConversation: async (conversationId, changes) => {
    const before = get().byId[conversationId];
    if (!before) return null;

    set((state) => ({ byId: { ...state.byId, [conversationId]: { ...before, ...changes } } }));
    try {
      const conversation = await api.updateConversation(conversationId, changes);
      set((state) => ({ byId: { ...state.byId, [conversationId]: conversation } }));
      return conversation;
    } catch (error) {
      set((state) => ({ byId: { ...state.byId, [conversationId]: before }, error: toErrorBody(error) }));
      return null;
    }
  },

  /** Turn disappearing messages on or off. */
  setDisappearingMessages: (conversationId, afterSec) =>
    get().updateConversation(conversationId, { disappearingAfterSec: afterSec }),

  /** Keep the list in step when a new message arrives. */
  applyIncomingMessage: (conversationId, message) =>
    set((state) => {
      const conversation = state.byId[conversationId];
      if (!conversation) return state;
      return {
        byId: {
          ...state.byId,
          [conversationId]: {
            ...conversation,
            lastMessageId: message.id,
            updatedAt: message.createdAt,
            unreadCount: conversation.unreadCount + 1,
          },
        },
        unreadTotal: state.unreadTotal + 1,
      };
    }),
}));

/* -------------------------------- selectors -------------------------------- */

const slice = (state) => state.chats ?? state;

export const selectConversations = (state) =>
  slice(state).list.items.map((id) => slice(state).byId[id]).filter(Boolean);

export const selectConversation = (conversationId) => (state) =>
  slice(state).byId[conversationId] ?? null;

export const selectPinnedConversations = (state) =>
  selectConversations(state).filter((c) => c.isPinned);

/** Unread total across every conversation, for a tab badge. */
export const selectUnreadTotal = (state) => slice(state).unreadTotal;

/** How many conversations have unread messages. */
export const selectUnreadConversationCount = (state) =>
  selectConversations(state).filter((c) => c.unreadCount > 0).length;

export const selectDirectConversations = (state) =>
  selectConversations(state).filter((c) => c.kind === "direct");

export const selectGroupConversations = (state) =>
  selectConversations(state).filter((c) => c.kind === "group");

export const selectPresence = (userId) => (state) => slice(state).presenceByUser[userId] ?? null;

/** Everyone currently typing, for the "typing..." row. */
export const selectTypingUserIds = (conversationId) => (state) => {
  const conversation = slice(state).byId[conversationId];
  if (!conversation) return [];
  return Object.values(slice(state).presenceByUser)
    .filter((p) => p.isTyping && p.typingInConversationId === conversationId)
    .map((p) => p.userId);
};

export const selectChatsStatus = (state) => slice(state).list.status;

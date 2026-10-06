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
  /**
   * Newest message per conversation, keyed by conversation id. Populated by
   * `fetchPreviews` so the list can render previews and timestamps without
   * loading whole threads into the messages store.
   * @type {Record<string, import("../types").Message|null>}
   */
  previewByConversation: {},
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
        [conversationId]: { ...before, unreadCount: 0, isMarkedUnread: false },
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
            // A fresh message clears the "marked unread" dot on its own.
            isMarkedUnread: false,
          },
        },
        unreadTotal: state.unreadTotal + 1,
      };
    }),

  /**
   * Newest-message previews for the conversation list, fetched in one batched
   * pass. One `listMessages(id, { limit: 1 })` call per chat runs in parallel
   * and the results land in a single state update, so the list never flashes
   * once per row.
   * @param {string[]} [conversationIds] Defaults to every loaded conversation.
   */
  fetchPreviews: async (conversationIds = get().list.items) => {
    const entries = await Promise.all(
      conversationIds.map(async (conversationId) => {
        try {
          const response = await api.listMessages(conversationId, { limit: 1 });
          return [conversationId, response.messages[0] ?? null];
        } catch {
          // A missing preview only degrades one row; the list still renders.
          return [conversationId, null];
        }
      }),
    );
    set((state) => ({
      previewByConversation: {
        ...state.previewByConversation,
        ...Object.fromEntries(entries),
      },
    }));
  },

  /** Pin or unpin a chat. */
  togglePin: (conversationId) => {
    const conversation = get().byId[conversationId];
    if (!conversation) return Promise.resolve(null);
    return get().updateConversation(conversationId, { isPinned: !conversation.isPinned });
  },

  /** Mute or unmute a chat. */
  toggleMute: (conversationId) => {
    const conversation = get().byId[conversationId];
    if (!conversation) return Promise.resolve(null);
    return get().updateConversation(conversationId, { isMuted: !conversation.isMuted });
  },

  /** Archive a chat, or bring it back when `isArchived` is false. */
  setArchived: (conversationId, isArchived = true) => {
    const conversation = get().byId[conversationId];
    if (!conversation) return Promise.resolve(null);
    return get().updateConversation(conversationId, { isArchived });
  },

  /**
   * Flag a chat as unread without a count. The list shows this as a dot
   * instead of a badge; `markRead` clears it again.
   */
  markUnread: (conversationId) => {
    const conversation = get().byId[conversationId];
    if (!conversation) return Promise.resolve(null);
    return get().updateConversation(conversationId, { isMarkedUnread: true });
  },

  /**
   * Delete a chat. The row disappears immediately and comes back if the
   * server refuses, so the list can never drift from the API silently.
   * @returns {Promise<boolean>} Whether the delete went through.
   */
  deleteConversation: async (conversationId) => {
    const before = get().byId[conversationId];
    if (!before) return false;

    set((state) => {
      const { [conversationId]: _removed, ...byId } = state.byId;
      return {
        list: { ...state.list, items: state.list.items.filter((id) => id !== conversationId) },
        byId,
        unreadTotal: Math.max(0, state.unreadTotal - before.unreadCount),
      };
    });

    try {
      await api.deleteConversation(conversationId);
      return true;
    } catch (error) {
      set((state) => ({
        list: { ...state.list, items: appendIds(state.list.items, [conversationId]) },
        byId: { ...state.byId, [conversationId]: before },
        unreadTotal: state.unreadTotal + before.unreadCount,
        error: toErrorBody(error),
      }));
      return false;
    }
  },
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

/** The newest-message preview for one chat, once `fetchPreviews` has run. */
export const selectPreview = (conversationId) => (state) =>
  slice(state).previewByConversation[conversationId] ?? null;

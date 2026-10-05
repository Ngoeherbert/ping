import { create } from "zustand";
import * as api from "../api/client";
import { toErrorBody, appendIds, prependIds } from "./helpers";

/** Monotonic counter for temporary (optimistic) message ids. */
let tempIdCounter = 0;

/**
 * Messages, kept per conversation.
 *
 * Every conversation has its own list slice, so paging one thread never
 * disturbs another, and a message is stored once no matter which thread reads it.
 */
export const useMessagesStore = create((set, get) => ({
  /** @type {Record<string, ReturnType<typeof emptyMessageSlice>>} */
  byConversation: {},
  status: "idle",
  error: null,

  /** Load a page of a conversation, oldest first. */
  fetchMessages: async (conversationId, params = {}) => {
    set((state) => ({
      byConversation: {
        ...state.byConversation,
        [conversationId]: {
          ...(state.byConversation[conversationId] ?? emptyMessageSlice()),
          status: "loading",
          error: null,
        },
      },
    }));

    try {
      const response = await api.listMessages(conversationId, { limit: 20, ...params });
      const current = get().byConversation[conversationId] ?? emptyMessageSlice();
      set((state) => ({
        byConversation: {
          ...state.byConversation,
          [conversationId]: {
            items: appendIds(current.items, response.messages.map((m) => m.id)),
            byId: mergeMessages(current.byId, response.messages),
            status: "idle",
            error: null,
            cursor: response.pageInfo.cursor,
            hasMore: response.pageInfo.hasMore,
            lastFetchedAt: Date.now(),
          },
        },
      }));
    } catch (error) {
      const current = get().byConversation[conversationId] ?? emptyMessageSlice();
      set((state) => ({
        byConversation: {
          ...state.byConversation,
          [conversationId]: { ...current, status: "error", error: toErrorBody(error) },
        },
      }));
    }
  },

  /** Load older messages, paging backwards. */
  loadMore: async (conversationId) => {
    const current = get().byConversation[conversationId];
    if (!current || !current.hasMore || current.status === "loadingMore") return;

    set((state) => ({
      byConversation: {
        ...state.byConversation,
        [conversationId]: { ...current, status: "loadingMore" },
      },
    }));

    try {
      const response = await api.listMessages(conversationId, {
        limit: 20,
        cursor: current.cursor,
      });
      const latest = get().byConversation[conversationId];
      set((state) => ({
        byConversation: {
          ...state.byConversation,
          [conversationId]: {
            ...latest,
            items: appendIds(latest.items, response.messages.map((m) => m.id)),
            byId: mergeMessages(latest.byId, response.messages),
            status: "idle",
            error: null,
            cursor: response.pageInfo.cursor,
            hasMore: response.pageInfo.hasMore,
            lastFetchedAt: Date.now(),
          },
        },
      }));
    } catch (error) {
      const latest = get().byConversation[conversationId];
      set((state) => ({
        byConversation: {
          ...state.byConversation,
          [conversationId]: { ...latest, status: "error", error: toErrorBody(error) },
        },
      }));
    }
  },

  /**
   * Send a message. The bubble appears immediately with a pending flag and is
   * replaced by the server copy, or removed if the send fails.
   */
  sendMessage: async (conversationId, input) => {
    // A counter, not the clock: two sends in the same millisecond must not
    // collide, or the second rollback would delete the wrong bubble.
    tempIdCounter += 1;
    const tempId = `temp_${tempIdCounter}`;
    const optimistic = {
      id: tempId,
      conversationId,
      type: input.type ?? "text",
      senderId: api.CURRENT_USER_ID,
      createdAt: new Date().toISOString(),
      replyToId: input.replyToId ?? null,
      forwardedFromId: null,
      isDeleted: false,
      deliveryStatus: "sending",
      isPending: true,
      ...input,
    };

    const current = get().byConversation[conversationId] ?? emptyMessageSlice();
    set((state) => ({
      byConversation: {
        ...state.byConversation,
        [conversationId]: {
          ...current,
          byId: { ...current.byId, [tempId]: optimistic },
          items: [tempId, ...current.items],
        },
      },
    }));

    try {
      const saved = await api.sendMessage(conversationId, input);
      set((state) => {
        const sliceNow = state.byConversation[conversationId];
        const { [tempId]: _drop, ...rest } = sliceNow.byId;
        return {
          byConversation: {
            ...state.byConversation,
            [conversationId]: {
              ...sliceNow,
              byId: { ...rest, [saved.id]: saved },
              items: sliceNow.items.map((id) => (id === tempId ? saved.id : id)),
            },
          },
        };
      });
      return saved;
    } catch (error) {
      // Roll the bubble back out of the thread.
      set((state) => {
        const sliceNow = state.byConversation[conversationId];
        const { [tempId]: _drop, ...rest } = sliceNow.byId;
        return {
          byConversation: {
            ...state.byConversation,
            [conversationId]: {
              ...sliceNow,
              byId: rest,
              items: sliceNow.items.filter((id) => id !== tempId),
            },
          },
        };
      });
      return null;
    }
  },

  /** Delete one of your own messages. */
  deleteMessage: async (conversationId, messageId) => {
    const before = get().byConversation[conversationId]?.byId[messageId];
    if (!before) return null;

    patchMessage(set, conversationId, messageId, { isDeleted: true });
    try {
      await api.deleteMessage(messageId);
      return true;
    } catch (error) {
      patchMessage(set, conversationId, messageId, before);
      return null;
    }
  },

  /** Update a delivery state, e.g. when a read receipt arrives. */
  setDeliveryStatus: (conversationId, messageId, deliveryStatus) =>
    patchMessage(set, conversationId, messageId, { deliveryStatus }),

  /**
   * Add a message that arrived from elsewhere, such as the real-time
   * simulation, so it flows through the same path as a local send.
   */
  applyIncoming: (conversationId, message) =>
    set((state) => {
      const sliceNow = state.byConversation[conversationId] ?? emptyMessageSlice();
      return {
        byConversation: {
          ...state.byConversation,
          [conversationId]: {
            ...sliceNow,
            byId: { ...sliceNow.byId, [message.id]: message },
            items: prependIds(sliceNow.items, [message.id]),
          },
        },
      };
    }),

  /** Show or hide someone typing in a conversation. */
  setTyping: (conversationId, userId, isTyping) =>
    set((state) => {
      const presence = state.typingByUser ?? {};
      const existing = presence[userId];
      if (isTyping) {
        return {
          typingByUser: { ...presence, [userId]: { conversationId, at: Date.now() } },
        };
      }
      if (existing?.conversationId !== conversationId) return state;
      const { [userId]: _drop, ...rest } = presence;
      return { typingByUser: rest };
    }),

  typingByUser: {},
}));

/* --------------------------------- helpers --------------------------------- */

function emptyMessageSlice() {
  return {
    items: [],
    byId: {},
    status: "idle",
    error: null,
    cursor: null,
    hasMore: true,
    lastFetchedAt: null,
  };
}

function mergeMessages(existing, incoming) {
  const next = { ...existing };
  for (const message of incoming) {
    // Keep a pending local copy until the server copy arrives.
    if (!next[message.id]?.isPending) next[message.id] = message;
  }
  return next;
}

function patchMessage(set, conversationId, messageId, patch) {
  set((state) => {
    const sliceNow = state.byConversation[conversationId];
    if (!sliceNow?.byId[messageId]) return state;
    return {
      byConversation: {
        ...state.byConversation,
        [conversationId]: {
          ...sliceNow,
          byId: {
            ...sliceNow.byId,
            [messageId]: { ...sliceNow.byId[messageId], ...patch },
          },
        },
      },
    };
  });
}

/* -------------------------------- selectors -------------------------------- */

const slice = (state) => state.messages ?? state;

export const selectMessagesForConversation = (conversationId) => (state) => {
  const conversationSlice = slice(state).byConversation[conversationId];
  if (!conversationSlice) return [];
  return conversationSlice.items.map((id) => conversationSlice.byId[id]).filter(Boolean);
};

export const selectMessage = (conversationId, messageId) => (state) =>
  slice(state).byConversation[conversationId]?.byId[messageId] ?? null;

/** The newest message in a thread, for a conversation-list preview. */
export const selectLastMessage = (conversationId) => (state) => {
  const conversationSlice = slice(state).byConversation[conversationId];
  if (!conversationSlice) return null;
  const lastId = conversationSlice.items[conversationSlice.items.length - 1];
  return lastId ? conversationSlice.byId[lastId] : null;
};

export const selectMessagesStatus = (conversationId) => (state) =>
  slice(state).byConversation[conversationId]?.status ?? "idle";

export const selectMessagesError = (conversationId) => (state) =>
  slice(state).byConversation[conversationId]?.error ?? null;

/** Whether anyone is typing in a conversation right now. */
export const selectIsAnyoneTyping = (conversationId) => (state) =>
  Object.values(slice(state).typingByUser ?? {}).some(
    (t) => t.conversationId === conversationId,
  );

/** Messages of one type in a thread, e.g. to find a game message. */
export const selectMessagesByType = (conversationId, type) => (state) =>
  selectMessagesForConversation(conversationId)(state).filter((m) => m.type === type);

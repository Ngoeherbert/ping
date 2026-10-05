import { create } from "zustand";
import * as api from "../api/client";
import { emptyList, byId, mergeById, appendIds, toErrorBody } from "./helpers";

/**
 * People, follow relationships and suggestions.
 *
 * Users are normalised into `byId` so a record read in the feed and one read
 * on a profile are always the same object.
 */
export const useUsersStore = create((set, get) => ({
  byId: {},
  suggestions: [],
  pendingRequests: [],
  blockedIds: [],
  mutedIds: [],
  directory: emptyList(),
  status: "idle",
  error: null,

  fetchDirectory: async (params = {}) => {
    set({ status: "loading", error: null });
    try {
      const response = await api.listUsers({ limit: 20, ...params });
      set((state) => ({
        byId: mergeById(state.byId, response.users),
        directory: {
          ...state.directory,
          items: appendIds(state.directory.items, response.users.map((u) => u.id)),
          status: "idle",
          error: null,
          cursor: response.pageInfo.cursor,
          hasMore: response.pageInfo.hasMore,
          lastFetchedAt: Date.now(),
        },
      }));
    } catch (error) {
      set({ status: "error", error: toErrorBody(error) });
    }
  },

  fetchSuggestions: async () => {
    set({ status: "loading", error: null });
    try {
      const response = await api.listSuggestions({ limit: 12 });
      set((state) => ({
        byId: mergeById(state.byId, response.users),
        suggestions: response.suggestions,
        status: "idle",
        error: null,
      }));
    } catch (error) {
      set({ status: "error", error: toErrorBody(error) });
    }
  },

  fetchFollows: async (userId, relation = "followers") => {
    set({ status: "loading", error: null });
    try {
      const response = await api.listFollows(userId, relation, { limit: 50 });
      set((state) => ({
        byId: mergeById(state.byId, response.users),
        pendingRequests: relation === "pending" ? response.users : state.pendingRequests,
        status: "idle",
        error: null,
      }));
    } catch (error) {
      set({ status: "error", error: toErrorBody(error) });
    }
  },

  fetchRestricted: async () => {
    set({ status: "loading", error: null });
    try {
      const response = await api.listRestricted();
      set((state) => ({
        byId: mergeById(state.byId, [...response.blocked, ...response.muted]),
        blockedIds: response.blocked.map((u) => u.id),
        mutedIds: response.muted.map((u) => u.id),
        status: "idle",
        error: null,
      }));
    } catch (error) {
      set({ status: "error", error: toErrorBody(error) });
    }
  },

  /** Follow someone. Counts update immediately and roll back on failure. */
  follow: async (userId) => {
    const before = get().byId[userId];
    if (!before) return null;

    set((state) => ({
      byId: {
        ...state.byId,
        [userId]: {
          ...before,
          counts: { ...before.counts, followers: before.counts.followers + 1 },
        },
      },
    }));

    try {
      const { follow, status } = await api.followUser(userId);
      set((state) => ({
        byId: {
          ...state.byId,
          [userId]: { ...state.byId[userId], isFollowedByViewer: true, followStatus: status },
        },
      }));
      return follow;
    } catch (error) {
      set((state) => ({ byId: { ...state.byId, [userId]: before } }));
      return null;
    }
  },

  /** Stop following, with the same optimistic-then-rollback pattern. */
  unfollow: async (userId) => {
    const before = get().byId[userId];
    if (!before) return null;

    set((state) => ({
      byId: {
        ...state.byId,
        [userId]: {
          ...before,
          counts: { ...before.counts, followers: Math.max(0, before.counts.followers - 1) },
        },
      },
    }));

    try {
      const result = await api.unfollowUser(userId);
      set((state) => ({
        byId: {
          ...state.byId,
          [userId]: { ...state.byId[userId], isFollowedByViewer: false, followStatus: null },
        },
      }));
      return result;
    } catch (error) {
      set((state) => ({ byId: { ...state.byId, [userId]: before } }));
      return null;
    }
  },

  respondToFollowRequest: async (followId, accept) => {
    try {
      const { follow } = await api.respondToFollowRequest(followId, accept);
      set((state) => ({
        pendingRequests: accept
          ? state.pendingRequests.filter((u) => u.id !== follow.followerId)
          : state.pendingRequests,
      }));
      return follow;
    } catch (error) {
      set({ error: toErrorBody(error) });
      return null;
    }
  },

  /** Block someone, dropping them from suggestions straight away. */
  block: async (userId) => {
    const before = get().byId[userId];
    set((state) => ({
      blockedIds: appendIds(state.blockedIds, [userId]),
      suggestions: state.suggestions.filter((s) => s.userId !== userId),
    }));

    try {
      return await api.blockUser(userId);
    } catch (error) {
      set((state) => ({
        blockedIds: state.blockedIds.filter((id) => id !== userId),
        byId: before ? { ...state.byId, [userId]: before } : state.byId,
        error: toErrorBody(error),
      }));
      return null;
    }
  },

  unblock: async (userId) => {
    try {
      await api.unblockUser(userId);
      set((state) => ({ blockedIds: state.blockedIds.filter((id) => id !== userId) }));
      return true;
    } catch (error) {
      set({ error: toErrorBody(error) });
      return null;
    }
  },

  setMuted: async (userId, shouldMute) => {
    const before = get().mutedIds;
    set((state) => ({
      mutedIds: shouldMute
        ? appendIds(state.mutedIds, [userId])
        : state.mutedIds.filter((id) => id !== userId),
    }));

    try {
      await api.setMuted(userId, shouldMute);
      return true;
    } catch (error) {
      set({ mutedIds: before, error: toErrorBody(error) });
      return null;
    }
  },

  /** Merge freshly fetched users, e.g. after a search. */
  upsertUsers: (users) => set((state) => ({ byId: { ...state.byId, ...byId(users) } })),
}));

/* -------------------------------- selectors -------------------------------- */

/**
 * Selectors read this store's own slice, so a screen can pass either the
 * combined root state or the users slice itself.
 */

export const selectUser = (userId) => (state) =>
  (state.users ?? state).byId[userId] ?? null;

export const selectUsersByIds = (userIds) => (state) => {
  const slice = state.users ?? state;
  return userIds.map((id) => slice.byId[id]).filter(Boolean);
};

export const selectIsBlocked = (userId) => (state) => {
  const slice = state.users ?? state;
  return slice.blockedIds.includes(userId);
};

export const selectIsMuted = (userId) => (state) => {
  const slice = state.users ?? state;
  return slice.mutedIds.includes(userId);
};

export const selectSuggestions = (state) => (state.users ?? state).suggestions;

export const selectPendingRequests = (state) => (state.users ?? state).pendingRequests;

export const selectDirectory = (state) => (state.users ?? state).directory;

/** People who follow the viewer back, from the loaded suggestions. */
export const selectMutualFollowers = (state) => {
  const slice = state.users ?? state;
  return slice.suggestions
    .filter((s) => s.reasons.some((r) => r.type === "mutual_followers" && r.count > 0))
    .map((s) => slice.byId[s.userId])
    .filter(Boolean);
};

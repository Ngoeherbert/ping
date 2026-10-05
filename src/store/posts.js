import { create } from "zustand";
import * as api from "../api/client";
import {
  emptyList, mergeById, appendIds, toErrorBody,
} from "./helpers";

/**
 * Posts and short videos.
 *
 * Posts live in `byId` and each feed is an ordered id list, so liking a post
 * from the feed is reflected on a profile and in a search result.
 */
export const usePostsStore = create((set, get) => ({
  byId: {},
  feed: emptyList(),
  saved: emptyList(),
  /** @type {ReturnType<typeof emptyList>} */
  shortVideos: emptyList(),
  status: "idle",
  error: null,

  /** Load the first page of the feed. */
  fetchFeed: async (params = {}) => {
    set((state) => ({ feed: { ...state.feed, status: "loading", error: null } }));
    try {
      const response = await api.listFeed({ limit: 20, ...params });
      set((state) => ({
        byId: mergeById(state.byId, response.posts),
        feed: {
          items: response.posts.map((p) => p.id),
          status: "idle",
          error: null,
          cursor: response.pageInfo.cursor,
          hasMore: response.pageInfo.hasMore,
          lastFetchedAt: Date.now(),
        },
      }));
    } catch (error) {
      set((state) => ({ feed: { ...state.feed, status: "error", error: toErrorBody(error) } }));
    }
  },

  /** Reload the feed from the top, keeping what is on screen. */
  refreshFeed: async () => {
    set((state) => ({ feed: { ...state.feed, status: "refreshing", error: null } }));
    try {
      const response = await api.listFeed({ limit: 20 });
      set((state) => ({
        byId: mergeById(state.byId, response.posts),
        feed: {
          ...state.feed,
          items: response.posts.map((p) => p.id),
          status: "idle",
          error: null,
          cursor: response.pageInfo.cursor,
          hasMore: response.pageInfo.hasMore,
          lastFetchedAt: Date.now(),
        },
      }));
    } catch (error) {
      set((state) => ({ feed: { ...state.feed, status: "error", error: toErrorBody(error) } }));
    }
  },

  /** Append the next page of the feed. */
  loadMoreFeed: async () => {
    const { feed } = get();
    if (!feed.hasMore || feed.status === "loadingMore" || feed.status === "loading") return;

    set({ feed: { ...feed, status: "loadingMore", error: null } });
    try {
      const response = await api.listFeed({ limit: 20, cursor: feed.cursor });
      set((state) => ({
        byId: mergeById(state.byId, response.posts),
        feed: {
          ...get().feed,
          items: appendIds(get().feed.items, response.posts.map((p) => p.id)),
          status: "idle",
          error: null,
          cursor: response.pageInfo.cursor,
          hasMore: response.pageInfo.hasMore,
          lastFetchedAt: Date.now(),
        },
      }));
    } catch (error) {
      set((state) => ({ feed: { ...get().feed, status: "error", error: toErrorBody(error) } }));
    }
  },

  /** Load posts written by one user. */
  fetchUserPosts: async (userId) => {
    set((state) => ({ feed: { ...state.feed, status: "loading", error: null } }));
    try {
      const response = await api.listFeed({ authorId: userId, limit: 20 });
      set((state) => ({
        byId: mergeById(state.byId, response.posts),
        feed: {
          ...state.feed,
          items: response.posts.map((p) => p.id),
          status: "idle",
          error: null,
          cursor: response.pageInfo.cursor,
          hasMore: response.pageInfo.hasMore,
          lastFetchedAt: Date.now(),
        },
      }));
    } catch (error) {
      set((state) => ({ feed: { ...state.feed, status: "error", error: toErrorBody(error) } }));
    }
  },

  /** Load the short-video feed. */
  fetchShortVideos: async (params = {}) => {
    set((state) => ({ shortVideos: { ...state.shortVideos, status: "loading", error: null } }));
    try {
      const response = await api.listShortVideos({ limit: 20, ...params });
      set((state) => ({
        shortVideos: {
          items: appendIds(state.shortVideos.items, response.shortVideos.map((v) => v.id)),
          status: "idle",
          error: null,
          cursor: response.pageInfo.cursor,
          hasMore: response.pageInfo.hasMore,
          lastFetchedAt: Date.now(),
        },
      }));
    } catch (error) {
      set((state) => ({
        shortVideos: { ...get().shortVideos, status: "error", error: toErrorBody(error) },
      }));
    }
  },

  /**
   * Like or unlike a post. The heart fills immediately and reverts on failure.
   * @param {string} postId
   * @param {boolean} shouldLike
   */
  toggleLike: async (postId, shouldLike) => {
    const before = get().byId[postId];
    if (!before) return null;

    set((state) => ({
      byId: {
        ...state.byId,
        [postId]: {
          ...before,
          likedByViewer: shouldLike,
          counts: {
            ...before.counts,
            likes: Math.max(0, before.counts.likes + (shouldLike ? 1 : -1)),
          },
        },
      },
    }));

    try {
      const result = await api.setPostLike(postId, shouldLike);
      set((state) => ({
        byId: {
          ...state.byId,
          [postId]: { ...state.byId[postId], counts: { ...state.byId[postId].counts, likes: result.likesCount } },
        },
      }));
      return result;
    } catch (error) {
      set((state) => ({ byId: { ...state.byId, [postId]: before } }));
      return null;
    }
  },

  /** Save or unsave a post, optimistically. */
  toggleSave: async (postId, shouldSave) => {
    const before = get().byId[postId];
    if (!before) return null;

    set((state) => ({
      byId: { ...state.byId, [postId]: { ...before, savedByViewer: shouldSave } },
      saved: shouldSave
        ? { ...get().saved, items: appendIds(get().saved.items, [postId]) }
        : { ...get().saved, items: get().saved.items.filter((id) => id !== postId) },
    }));

    try {
      await api.setPostSaved(postId, shouldSave);
      return true;
    } catch (error) {
      set((state) => ({
        byId: { ...state.byId, [postId]: before },
        saved: { ...get().saved, items: appendIds(get().saved.items, before.savedByViewer ? [postId] : []) },
      }));
      return null;
    }
  },

  /** Load saved posts. */
  fetchSaved: async () => {
    set((state) => ({ saved: { ...state.saved, status: "loading", error: null } }));
    try {
      const response = await api.listSavedPosts({ limit: 20 });
      set((state) => ({
        byId: mergeById(state.byId, response.posts),
        saved: {
          items: response.posts.map((p) => p.id),
          status: "idle",
          error: null,
          cursor: response.pageInfo.cursor,
          hasMore: response.pageInfo.hasMore,
          lastFetchedAt: Date.now(),
        },
      }));
    } catch (error) {
      set((state) => ({ saved: { ...get().saved, status: "error", error: toErrorBody(error) } }));
    }
  },

  /** Create a post, putting it at the top of the feed. */
  createPost: async (input) => {
    try {
      const post = await api.createPost(input);
      set((state) => ({
        byId: mergeById(state.byId, [post]),
        feed: { ...get().feed, items: [post.id, ...get().feed.items.filter((id) => id !== post.id)] },
      }));
      return post;
    } catch (error) {
      set({ error: toErrorBody(error) });
      return null;
    }
  },

  /** Delete one of your own posts. */
  deletePost: async (postId) => {
    try {
      await api.deletePost(postId);
      set((state) => ({
        byId: { ...state.byId, [postId]: { ...state.byId[postId], isDeleted: true, caption: "", media: [] } },
        feed: { ...get().feed, items: get().feed.items.filter((id) => id !== postId) },
        saved: { ...get().saved, items: get().saved.items.filter((id) => id !== postId) },
      }));
      return true;
    } catch (error) {
      set({ error: toErrorBody(error) });
      return null;
    }
  },

  /** Repost with an optional comment. */
  repost: async (postId, quote = "") => {
    try {
      const post = await api.repostPost(postId, quote);
      set((state) => ({ byId: mergeById(state.byId, [post]) }));
      return post;
    } catch (error) {
      set({ error: toErrorBody(error) });
      return null;
    }
  },

  /** Merge posts from another source, e.g. search. */
  upsertPosts: (posts) => set((state) => ({ byId: mergeById(state.byId, posts) })),
}));

/* -------------------------------- selectors -------------------------------- */

const slice = (state) => state.posts ?? state;

export const selectPost = (postId) => (state) => slice(state).byId[postId] ?? null;

export const selectFeedPosts = (state) =>
  slice(state).feed.items.map((id) => slice(state).byId[id]).filter(Boolean);

export const selectUserPosts = (userId) => (state) =>
  slice(state).feed.items
    .map((id) => slice(state).byId[id])
    .filter((post) => post && post.authorId === userId);

export const selectSavedPosts = (state) =>
  slice(state).saved.items.map((id) => slice(state).byId[id]).filter(Boolean);

export const selectShortVideos = (state) => slice(state).shortVideos.items;

export const selectFeedStatus = (state) => slice(state).feed.status;

export const selectFeedError = (state) => slice(state).feed.error;

export const selectIsPostLiked = (postId) => (state) =>
  slice(state).byId[postId]?.likedByViewer ?? false;

export const selectIsPostSaved = (postId) => (state) =>
  slice(state).byId[postId]?.savedByViewer ?? false;

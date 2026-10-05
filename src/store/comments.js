import { create } from "zustand";
import * as api from "../api/client";
import { toErrorBody, appendIds } from "./helpers";

/** Monotonic counter for temporary (optimistic) comment ids. */
let tempCommentCounter = 0;

/**
 * Comments, keyed by post.
 *
 * Each post has its own list slice so one thread can refresh or page without
 * touching another, and replies stay nested under their parent.
 */
export const useCommentsStore = create((set, get) => ({
  /** @type {Record<string, ReturnType<typeof emptyCommentSlice>>} */
  byPost: {},
  status: "idle",
  error: null,

  /** Load a page of top-level comments with their replies. */
  fetchComments: async (postId, params = {}) => {
    set((state) => ({
      byPost: {
        ...state.byPost,
        [postId]: { ...(state.byPost[postId] ?? emptyCommentSlice()), status: "loading", error: null },
      },
    }));

    try {
      const response = await api.listComments(postId, { limit: 20, ...params });
      const current = get().byPost[postId] ?? emptyCommentSlice();
      set((state) => ({
        byPost: {
          ...state.byPost,
          [postId]: {
            items: appendIds(current.items, response.topLevel.map((c) => c.id)),
            repliesById: mergeComments(current.repliesById, response.topLevel),
            status: "idle",
            error: null,
            cursor: response.pageInfo.cursor,
            hasMore: response.pageInfo.hasMore,
            lastFetchedAt: Date.now(),
          },
        },
      }));
    } catch (error) {
      const current = get().byPost[postId] ?? emptyCommentSlice();
      set((state) => ({
        byPost: {
          ...state.byPost,
          [postId]: { ...current, status: "error", error: toErrorBody(error) },
        },
      }));
    }
  },

  /** Append the next page of comments. */
  loadMore: async (postId) => {
    const current = get().byPost[postId];
    if (!current || !current.hasMore || current.status === "loadingMore") return;

    set((state) => ({
      byPost: { ...state.byPost, [postId]: { ...current, status: "loadingMore" } },
    }));
    try {
      const response = await api.listComments(postId, { limit: 20, cursor: current.cursor });
      const latest = get().byPost[postId];
      set((state) => ({
        byPost: {
          ...state.byPost,
          [postId]: {
            ...latest,
            items: appendIds(latest.items, response.topLevel.map((c) => c.id)),
            repliesById: mergeComments(latest.repliesById, response.topLevel),
            status: "idle",
            error: null,
            cursor: response.pageInfo.cursor,
            hasMore: response.pageInfo.hasMore,
            lastFetchedAt: Date.now(),
          },
        },
      }));
    } catch (error) {
      const latest = get().byPost[postId];
      set((state) => ({
        byPost: { ...state.byPost, [postId]: { ...latest, status: "error", error: toErrorBody(error) } },
      }));
    }
  },

  /**
   * Post a comment or a reply. The new comment appears straight away and is
   * removed again if the request fails.
   */
  addComment: async (postId, text, parentId = null) => {
    // A counter, not the clock: two posts in the same millisecond must not
    // collide, or one rollback would delete the wrong bubble.
    tempCommentCounter += 1;
    const tempId = `temp_c_${tempCommentCounter}`;
    const optimistic = {
      id: tempId,
      postId,
      authorId: api.CURRENT_USER_ID,
      parentId,
      text,
      counts: { likes: 0, replies: 0 },
      likedByViewer: false,
      createdAt: new Date().toISOString(),
      editedAt: null,
      isDeleted: false,
      isPending: true,
    };

    const current = get().byPost[postId] ?? emptyCommentSlice();
    set((state) => ({
      byPost: {
        ...state.byPost,
        [postId]: {
          ...current,
          repliesById: { ...current.repliesById, [tempId]: optimistic },
          items: parentId ? current.items : [tempId, ...current.items],
        },
      },
    }));

    try {
      const saved = await api.createComment(postId, text, { parentId });
      set((state) => {
        const sliceNow = state.byPost[postId];
        const { [tempId]: _removed, ...rest } = sliceNow.repliesById;
        return {
          byPost: {
            ...state.byPost,
            [postId]: {
              ...sliceNow,
              repliesById: { ...rest, [saved.id]: { ...saved, isPending: false } },
              items: sliceNow.items.map((id) => (id === tempId ? saved.id : id)),
            },
          },
        };
      });
      return saved;
    } catch (error) {
      // Roll back the optimistic comment.
      set((state) => {
        const sliceNow = state.byPost[postId];
        const { [tempId]: _removed, ...rest } = sliceNow.repliesById;
        return {
          byPost: {
            ...state.byPost,
            [postId]: {
              ...sliceNow,
              repliesById: rest,
              items: sliceNow.items.filter((id) => id !== tempId),
            },
          },
        };
      });
      return null;
    }
  },

  /** Edit a comment the viewer wrote. */
  editComment: async (commentId, text) => {
    try {
      const updated = await api.editComment(commentId, text);
      updateCommentEverywhere(set, commentId, updated);
      return updated;
    } catch (error) {
      set({ error: toErrorBody(error) });
      return null;
    }
  },

  /** Soft-delete a comment. */
  deleteComment: async (commentId) => {
    try {
      await api.deleteComment(commentId);
      updateCommentEverywhere(set, commentId, { isDeleted: true, text: "" });
      return true;
    } catch (error) {
      set({ error: toErrorBody(error) });
      return null;
    }
  },

  /** Like or unlike a comment, optimistically. */
  toggleLike: async (commentId, shouldLike) => {
    const found = findComment(get().byPost, commentId);
    if (!found) return null;

    patchCommentEverywhere(set, commentId, {
      likedByViewer: shouldLike,
      counts: { ...found.counts, likes: Math.max(0, found.counts.likes + (shouldLike ? 1 : -1)) },
    });

    try {
      await api.setCommentLike(commentId, shouldLike);
      return true;
    } catch (error) {
      patchCommentEverywhere(set, commentId, found);
      return null;
    }
  },
}));

/* --------------------------------- helpers --------------------------------- */

function emptyCommentSlice() {
  return {
    items: [],
    repliesById: {},
    status: "idle",
    error: null,
    cursor: null,
    hasMore: true,
    lastFetchedAt: null,
  };
}

/**
 * Index comments and their replies together, since both are read the same way.
 * Fetched copies refresh the cache so likes and edits land everywhere, but an
 * `isPending` optimistic comment is left alone until it settles.
 */
function mergeComments(existing, comments) {
  const next = { ...existing };
  for (const comment of comments) {
    if (!next[comment.id]?.isPending) next[comment.id] = comment;
    for (const reply of comment.replies ?? []) {
      if (!next[reply.id]?.isPending) next[reply.id] = reply;
    }
  }
  return next;
}

function findComment(byPost, commentId) {
  for (const slice of Object.values(byPost)) {
    if (slice.repliesById[commentId]) return slice.repliesById[commentId];
  }
  return null;
}

/** Patch a comment in whichever post slice holds it. */
function patchCommentEverywhere(set, commentId, patch) {
  set((state) => {
    const byPost = { ...state.byPost };
    for (const [postId, slice] of Object.entries(byPost)) {
      const existing = slice.repliesById[commentId];
      if (!existing) continue;
      byPost[postId] = {
        ...slice,
        repliesById: { ...slice.repliesById, [commentId]: { ...existing, ...patch } },
      };
    }
    return { byPost };
  });
}

function updateCommentEverywhere(set, commentId, patch) {
  patchCommentEverywhere(set, commentId, patch);
}

/* -------------------------------- selectors -------------------------------- */

const slice = (state) => state.comments ?? state;

export const selectCommentsForPost = (postId) => (state) => {
  const postSlice = slice(state).byPost[postId];
  if (!postSlice) return [];
  return postSlice.items.map((id) => postSlice.repliesById[id]).filter(Boolean);
};

export const selectCommentReplies = (commentId) => (state) => {
  const comment = selectCommentById(commentId)(state);
  if (!comment) return [];
  return (comment.replies ?? []).filter(Boolean);
};

export const selectCommentById = (commentId) => (state) => {
  for (const postSlice of Object.values(slice(state).byPost)) {
    if (postSlice.repliesById[commentId]) return postSlice.repliesById[commentId];
  }
  return null;
};

export const selectCommentStatus = (postId) => (state) =>
  slice(state).byPost[postId]?.status ?? "idle";

export const selectCommentCount = (postId) => (state) =>
  slice(state).byPost[postId]?.items.length ?? 0;

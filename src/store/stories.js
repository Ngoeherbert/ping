import { create } from "zustand";
import * as api from "../api/client";
import { emptyList, mergeById, appendIds, toErrorBody } from "./helpers";

/**
 * Stories and highlights.
 *
 * Items expire after 24h, so `fetchStories` drops anything already expired and
 * a screen can trust whatever it reads.
 */
export const useStoriesStore = create((set, get) => ({
  /** @type {Record<string, import("../types").StoryItem>} */
  byId: {},
  groups: emptyList(),
  /** @type {Record<string, import("../types").Highlight[]>} */
  highlightsByUser: {},
  status: "idle",
  error: null,

  /** Load live story groups and their items. */
  fetchStories: async (params = {}) => {
    set((state) => ({ groups: { ...state.groups, status: "loading", error: null } }));
    try {
      const response = await api.listStories({ limit: 20, ...params });
      set((state) => ({
        byId: mergeById(state.byId, response.items),
        groups: {
          items: response.storyGroups.map((g) => g.id),
          status: "idle",
          error: null,
          cursor: response.pageInfo.cursor,
          hasMore: response.pageInfo.hasMore,
          lastFetchedAt: Date.now(),
        },
      }));
    } catch (error) {
      set((state) => ({ groups: { ...get().groups, status: "error", error: toErrorBody(error) } }));
    }
  },

  /** Append the next page of story groups. */
  loadMoreGroups: async () => {
    const { groups } = get();
    if (!groups.hasMore || groups.status === "loadingMore") return;

    set({ groups: { ...groups, status: "loadingMore" } });
    try {
      const response = await api.listStories({ limit: 20, cursor: groups.cursor });
      set((state) => ({
        byId: mergeById(state.byId, response.items),
        groups: {
          ...get().groups,
          items: appendIds(get().groups.items, response.storyGroups.map((g) => g.id)),
          status: "idle",
          error: null,
          cursor: response.pageInfo.cursor,
          hasMore: response.pageInfo.hasMore,
          lastFetchedAt: Date.now(),
        },
      }));
    } catch (error) {
      set((state) => ({ groups: { ...get().groups, status: "error", error: toErrorBody(error) } }));
    }
  },

  /** Load one person's highlights. */
  fetchHighlights: async (userId) => {
    try {
      const { highlights } = await api.listHighlights(userId);
      set((state) => ({ highlightsByUser: { ...state.highlightsByUser, [userId]: highlights } }));
      return highlights;
    } catch (error) {
      set({ error: toErrorBody(error) });
      return null;
    }
  },

  /**
   * Mark a story seen, flipping the ring locally before the call returns.
   * @param {string} storyId
   */
  markSeen: async (storyId) => {
    const before = get().byId[storyId];
    if (!before || before.seenByViewer) return null;

    set((state) => ({
      byId: { ...state.byId, [storyId]: { ...before, seenByViewer: true } },
    }));

    try {
      const story = await api.markStorySeen(storyId);
      set((state) => ({ byId: { ...state.byId, [storyId]: story } }));
      return story;
    } catch (error) {
      set((state) => ({ byId: { ...state.byId, [storyId]: before } }));
      return null;
    }
  },

  /** Reply to a story. */
  reply: async (storyId, text) => {
    try {
      const reply = await api.replyToStory(storyId, text);
      set((state) => {
        const story = state.byId[storyId];
        if (!story) return state;
        return {
          byId: {
            ...state.byId,
            [storyId]: { ...story, replies: [...(story.replies ?? []), reply] },
          },
        };
      });
      return reply;
    } catch (error) {
      set({ error: toErrorBody(error) });
      return null;
    }
  },

  /** Drop stories that have passed their 24h expiry. */
  pruneExpired: () => {
    const now = Date.now();
    set((state) => {
      const byId = {};
      for (const [id, story] of Object.entries(state.byId)) {
        if (Date.parse(story.expiresAt) > now) byId[id] = story;
      }
      return { byId };
    });
  },
}));

/* -------------------------------- selectors -------------------------------- */

const slice = (state) => state.stories ?? state;

export const selectStoryGroups = (state) => slice(state).groups.items;

/** A person's live stories, oldest first, for a story viewer. */
export const selectStoryItemsForAuthor = (authorId) => (state) =>
  Object.values(slice(state).byId)
    .filter((story) => story.authorId === authorId)
    .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));

export const selectStoryItem = (storyId) => (state) => slice(state).byId[storyId] ?? null;

export const selectUnseenCount = (state) =>
  Object.values(slice(state).byId).filter((s) => !s.seenByViewer).length;

export const selectHighlights = (userId) => (state) =>
  slice(state).highlightsByUser[userId] ?? [];

export const selectStoriesStatus = (state) => slice(state).groups.status;

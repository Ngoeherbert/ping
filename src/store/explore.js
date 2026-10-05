import { create } from "zustand";
import * as api from "../api/client";
import { emptyList, toErrorBody, appendIds } from "./helpers";

/**
 * Explore, trending topics, search and groups.
 *
 * Explore returns mixed aspect ratios, so items are kept as they arrive and a
 * screen decides how to lay them out.
 */
export const useExploreStore = create((set, get) => ({
  trending: [],
  items: emptyList(),
  recentSearches: [],
  /** @type {Record<string, import("../types").Group>} */
  groupsById: {},
  groups: emptyList(),
  searchResults: emptyList(),
  searchTerm: "",
  status: "idle",
  error: null,

  /** Load trending topics and a page of the explore grid. */
  fetchExplore: async (params = {}) => {
    set((state) => ({ items: { ...state.items, status: "loading", error: null } }));
    try {
      const response = await api.getExplore({ limit: 24, ...params });
      set((state) => ({
        trending: response.trending,
        items: {
          items: appendIds(state.items.items, response.items.map((i) => i.id)),
          status: "idle",
          error: null,
          cursor: response.pageInfo.cursor,
          hasMore: response.pageInfo.hasMore,
          lastFetchedAt: Date.now(),
        },
      }));
    } catch (error) {
      set((state) => ({ items: { ...get().items, status: "error", error: toErrorBody(error) } }));
    }
  },

  /** Append the next page of the explore grid. */
  loadMoreItems: async () => {
    const { items } = get();
    if (!items.hasMore || items.status === "loadingMore") return;

    set({ items: { ...items, status: "loadingMore" } });
    try {
      const response = await api.getExplore({ limit: 24, cursor: items.cursor });
      set((state) => ({
        items: {
          ...get().items,
          items: appendIds(get().items.items, response.items.map((i) => i.id)),
          status: "idle",
          error: null,
          cursor: response.pageInfo.cursor,
          hasMore: response.pageInfo.hasMore,
          lastFetchedAt: Date.now(),
        },
      }));
    } catch (error) {
      set((state) => ({ items: { ...get().items, status: "error", error: toErrorBody(error) } }));
    }
  },

  /** Load recent searches. */
  fetchRecentSearches: async () => {
    try {
      const { recentSearches } = await api.listRecentSearches();
      set({ recentSearches });
      return recentSearches;
    } catch (error) {
      set({ error: toErrorBody(error) });
      return null;
    }
  },

  /** Record a search so it appears in recent searches. */
  addRecentSearch: async (term) => {
    try {
      const search = await api.addRecentSearch(term);
      set((state) => ({
        recentSearches: [
          search,
          ...state.recentSearches.filter((s) => s.id !== search.id),
        ],
      }));
      return search;
    } catch (error) {
      set({ error: toErrorBody(error) });
      return null;
    }
  },

  /** Remove a recent search locally, e.g. when the user clears history. */
  clearRecentSearches: () => set({ recentSearches: [] }),

  /** Search people, groups, hashtags and posts. */
  search: async (term) => {
    set({ searchTerm: term, searchResults: { ...get().searchResults, status: "loading" } });
    try {
      const response = await api.search(term, { limit: 20 });
      set({
        searchResults: {
          items: response.results,
          status: "idle",
          error: null,
          cursor: response.pageInfo.cursor,
          hasMore: response.pageInfo.hasMore,
          lastFetchedAt: Date.now(),
        },
      });
      return response.results;
    } catch (error) {
      set((state) => ({
        searchResults: { ...state.searchResults, status: "error", error: toErrorBody(error) },
      }));
      return null;
    }
  },

  /** Load groups and channels. */
  fetchGroups: async (params = {}) => {
    set((state) => ({ groups: { ...state.groups, status: "loading", error: null } }));
    try {
      const response = await api.listGroups({ limit: 20, ...params });
      set((state) => ({
        groupsById: {
          ...state.groupsById,
          ...Object.fromEntries(response.groups.map((g) => [g.id, g])),
        },
        groups: {
          items: appendIds(state.groups.items, response.groups.map((g) => g.id)),
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

  /** Join or leave a group, optimistically. */
  setGroupMembership: async (groupId, shouldJoin) => {
    const before = get().groupsById[groupId];
    if (!before) return null;

    set((state) => ({
      groupsById: {
        ...state.groupsById,
        [groupId]: {
          ...before,
          joinedAt: shouldJoin ? new Date().toISOString() : null,
          memberCount: shouldJoin ? before.memberCount + 1 : Math.max(0, before.memberCount - 1),
        },
      },
    }));

    try {
      const group = await api.setGroupMembership(groupId, shouldJoin);
      set((state) => ({ groupsById: { ...state.groupsById, [groupId]: group } }));
      return group;
    } catch (error) {
      set((state) => ({
        groupsById: { ...state.groupsById, [groupId]: before },
        error: toErrorBody(error),
      }));
      return null;
    }
  },
}));

/* -------------------------------- selectors -------------------------------- */

const slice = (state) => state.explore ?? state;

export const selectTrendingTopics = (state) => slice(state).trending;

export const selectExploreItems = (state) => slice(state).items.items;

export const selectExploreStatus = (state) => slice(state).items.status;

export const selectRecentSearches = (state) => slice(state).recentSearches;

export const selectSearchResults = (state) => slice(state).searchResults.items;

export const selectSearchStatus = (state) => slice(state).searchResults.status;

export const selectGroups = (state) =>
  slice(state).groups.items.map((id) => slice(state).groupsById[id]).filter(Boolean);

export const selectGroup = (groupId) => (state) => slice(state).groupsById[groupId] ?? null;

/** Groups the viewer has joined. */
export const selectJoinedGroups = (state) =>
  selectGroups(state).filter((g) => g.joinedAt !== null);

/** One-way broadcast channels. */
export const selectChannels = (state) => selectGroups(state).filter((g) => g.kind === "channel");

export const selectGroupsStatus = (state) => slice(state).groups.status;

import { create } from "zustand";
import { usePostsStore } from "./posts";
import { useStoriesStore } from "./stories";
import { useNotificationsStore } from "./notifications";
import { useExploreStore } from "./explore";
import { toErrorBody } from "./helpers";

/**
 * The home feed, as one coordinating store.
 *
 * Posts themselves live in the posts store, so this only tracks which feeds
 * have been requested and delegates the work. A screen can import either this
 * or the posts store directly; both read the same data.
 */
export const useFeedStore = create((set, get) => ({
  /** Which feeds are active, so refresh only reloads what is on screen. */
  activeFeeds: { main: true, explore: false, shortVideos: false, stories: false },
  refreshing: false,
  error: null,
  lastRefreshedAt: null,

  /** Load the main feed. */
  fetchFeed: async () => {
    await usePostsStore.getState().fetchFeed();
  },

  /** Pull to refresh: reload whatever is currently on screen. */
  refresh: async () => {
    set({ refreshing: true, error: null });
    const { activeFeeds } = get();

    try {
      if (activeFeeds.explore) await useExploreStore.getState().fetchExplore();
      if (activeFeeds.shortVideos) await usePostsStore.getState().fetchShortVideos();
      if (activeFeeds.stories) await useStoriesStore.getState().fetchStories();
      if (activeFeeds.main || !Object.values(activeFeeds).some(Boolean)) {
        await usePostsStore.getState().refreshFeed();
      }
      set({ refreshing: false, lastRefreshedAt: Date.now() });
    } catch (error) {
      set({ refreshing: false, error: toErrorBody(error) });
    }
  },

  /** Append the next page of whichever feed is active. */
  loadMore: async () => {
    const { activeFeeds } = get();
    if (activeFeeds.explore) await useExploreStore.getState().loadMoreItems();
    else if (activeFeeds.shortVideos) await usePostsStore.getState().fetchShortVideos({});
    else await usePostsStore.getState().loadMoreFeed();
  },

  /** Record which feed a screen is showing. */
  setActiveFeed: (feed, isActive) =>
    set((state) => ({ activeFeeds: { ...state.activeFeeds, [feed]: isActive } })),

  /** Load the home screen in one call: feed, stories and unread counts. */
  fetchHome: async () => {
    set({ error: null });
    try {
      await Promise.all([
        usePostsStore.getState().fetchFeed(),
        useStoriesStore.getState().fetchStories(),
        useNotificationsStore.getState().refreshUnreadCount(),
      ]);
    } catch (error) {
      set({ error: toErrorBody(error) });
    }
  },
}));

/* -------------------------------- selectors -------------------------------- */

const slice = (state) => state.feed ?? state;

export const selectIsRefreshing = (state) => slice(state).refreshing;

export const selectLastRefreshedAt = (state) => slice(state).lastRefreshedAt;

/** The feed coordinator's own error, distinct from a list slice's error. */
export const selectFeedCoordinatorError = (state) => slice(state).error;

export const selectActiveFeeds = (state) => slice(state).activeFeeds;

import { create } from "zustand";
import * as api from "../api/client";
import { emptyList, mergeById, appendIds, prependIds, toErrorBody } from "./helpers";

/**
 * Notifications.
 *
 * A notification stores what happened plus the ids involved; the wording lives
 * in the screen, so copy can change without touching this data.
 */
export const useNotificationsStore = create((set, get) => ({
  byId: {},
  list: emptyList(),
  unreadCount: 0,
  status: "idle",
  error: null,

  /** Load the notification list, newest first. */
  fetchNotifications: async (params = {}) => {
    set((state) => ({ list: { ...state.list, status: "loading", error: null } }));
    try {
      const response = await api.listNotifications({ limit: 20, ...params });
      set((state) => ({
        byId: mergeById(state.byId, response.notifications),
        list: {
          items: response.notifications.map((n) => n.id),
          status: "idle",
          error: null,
          cursor: response.pageInfo.cursor,
          hasMore: response.pageInfo.hasMore,
          lastFetchedAt: Date.now(),
        },
        unreadCount: response.notifications.filter((n) => !n.isRead).length,
      }));
    } catch (error) {
      set((state) => ({ list: { ...get().list, status: "error", error: toErrorBody(error) } }));
    }
  },

  /** Append the next page. */
  loadMore: async () => {
    const { list } = get();
    if (!list.hasMore || list.status === "loadingMore") return;

    set({ list: { ...list, status: "loadingMore" } });
    try {
      const response = await api.listNotifications({ limit: 20, cursor: list.cursor });
      set((state) => ({
        byId: mergeById(state.byId, response.notifications),
        list: {
          ...get().list,
          items: appendIds(get().list.items, response.notifications.map((n) => n.id)),
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

  /** Refresh the unread count on its own, for a tab badge. */
  refreshUnreadCount: async () => {
    try {
      const { count } = await api.getUnreadNotificationCount();
      set({ unreadCount: count });
      return count;
    } catch (error) {
      set({ error: toErrorBody(error) });
      return null;
    }
  },

  /** Mark one notification, or all of them, as read. */
  markRead: async (notificationId) => {
    if (!notificationId) {
      const before = get().unreadCount;
      set({ unreadCount: 0 });
      try {
        await api.markNotificationsRead();
        set((state) => ({
          byId: Object.fromEntries(
            Object.entries(state.byId).map(([id, n]) => [id, { ...n, isRead: true }]),
          ),
        }));
        return true;
      } catch (error) {
        set({ unreadCount: before, error: toErrorBody(error) });
        return null;
      }
    }

    const before = get().byId[notificationId];
    if (!before || before.isRead) return null;

    set((state) => ({
      byId: { ...state.byId, [notificationId]: { ...before, isRead: true } },
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));

    try {
      await api.markNotificationsRead(notificationId);
      return true;
    } catch (error) {
      set((state) => ({
        byId: { ...state.byId, [notificationId]: before },
        unreadCount: state.unreadCount + 1,
        error: toErrorBody(error),
      }));
      return null;
    }
  },

  /** Add a notification that arrived from elsewhere, e.g. the simulation. */
  applyIncoming: (notification) =>
    set((state) => ({
      byId: { ...state.byId, [notification.id]: notification },
      list: { ...state.list, items: prependIds(state.list.items, [notification.id]) },
      unreadCount: notification.isRead ? state.unreadCount : state.unreadCount + 1,
    })),
}));

/* -------------------------------- selectors -------------------------------- */

const slice = (state) => state.notifications ?? state;

export const selectNotifications = (state) =>
  slice(state).list.items.map((id) => slice(state).byId[id]).filter(Boolean);

export const selectNotification = (id) => (state) => slice(state).byId[id] ?? null;

export const selectUnreadNotificationCount = (state) => slice(state).unreadCount;

export const selectUnreadNotifications = (state) =>
  selectNotifications(state).filter((n) => !n.isRead);

/** Notifications of one type, e.g. follow requests. */
export const selectNotificationsByType = (type) => (state) =>
  selectNotifications(state).filter((n) => n.type === type);

/** Follow requests, which need an accept or decline action. */
export const selectFollowRequests = (state) =>
  selectNotifications(state).filter((n) => n.type === "follow_request" && !n.isRead);

/**
 * Group notifications that share a target, e.g. several people liking one post.
 * Grouped entries are already collapsed by the API; this fills any gap.
 */
export const selectGroupedNotifications = (state) => {
  const byTarget = new Map();
  for (const n of selectNotifications(state)) {
    const key = `${n.type}:${n.targetId ?? ""}`;
    if (!byTarget.has(key)) byTarget.set(key, []);
    byTarget.get(key).push(n);
  }
  return [...byTarget.values()];
};

export const selectNotificationsStatus = (state) => slice(state).list.status;

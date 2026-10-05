import { create } from "zustand";
import * as api from "../api/client";
import { toErrorBody, appendIds } from "./helpers";

/**
 * Call history plus the live call state.
 *
 * A call exists both in this store and as a message in a thread, so a thread
 * and the history screen stay consistent after any action.
 */
export const useCallsStore = create((set, get) => ({
  byId: {},
  history: emptyHistory(),
  /** Runs of consecutive missed calls, keyed by caller. */
  missedGroups: [],
  /** The call currently ringing or in progress, if any. */
  activeCallId: null,
  status: "idle",
  error: null,

  /** Load the call history. `filter` is "all" or "missed". */
  fetchCalls: async (params = {}) => {
    set((state) => ({ history: { ...state.history, status: "loading", error: null } }));
    try {
      const response = await api.listCalls({ limit: 20, ...params });
      set((state) => ({
        byId: { ...state.byId, ...Object.fromEntries(response.calls.map((c) => [c.id, c])) },
        history: {
          items: appendIds(state.history.items, response.calls.map((c) => c.id)),
          status: "idle",
          error: null,
          cursor: response.pageInfo.cursor,
          hasMore: response.pageInfo.hasMore,
          lastFetchedAt: Date.now(),
        },
        missedGroups: response.groups,
      }));
    } catch (error) {
      set((state) => ({
        history: { ...get().history, status: "error", error: toErrorBody(error) },
      }));
    }
  },

  /** Append the next page of call history. */
  loadMore: async (params = {}) => {
    const { history } = get();
    if (!history.hasMore || history.status === "loadingMore") return;

    set({ history: { ...history, status: "loadingMore" } });
    try {
      const response = await api.listCalls({ limit: 20, cursor: history.cursor, ...params });
      set((state) => ({
        byId: { ...state.byId, ...Object.fromEntries(response.calls.map((c) => [c.id, c])) },
        history: {
          ...get().history,
          items: appendIds(get().history.items, response.calls.map((c) => c.id)),
          status: "idle",
          error: null,
          cursor: response.pageInfo.cursor,
          hasMore: response.pageInfo.hasMore,
          lastFetchedAt: Date.now(),
        },
      }));
    } catch (error) {
      set((state) => ({
        history: { ...get().history, status: "error", error: toErrorBody(error) },
      }));
    }
  },

  /** Reload only the missed-call groups, for the tab badge. */
  fetchMissedGroups: async () => {
    try {
      const { groups } = await api.listMissedCallGroups();
      set({ missedGroups: groups });
      return groups;
    } catch (error) {
      set({ error: toErrorBody(error) });
      return null;
    }
  },

  /** Start an outgoing call. */
  startCall: async (conversationId, kind = "voice", participantIds = []) => {
    try {
      const call = await api.startCall(conversationId, kind, participantIds);
      set((state) => ({
        byId: { ...state.byId, [call.id]: call },
        history: { ...get().history, items: appendIds(get().history.items, [call.id]) },
        activeCallId: call.id,
      }));
      return call;
    } catch (error) {
      set({ error: toErrorBody(error) });
      return null;
    }
  },

  /** End the active call and record its duration. */
  endCall: async (callId, status = "answered") => {
    try {
      const call = await api.endCall(callId, status);
      set((state) => ({
        byId: { ...state.byId, [callId]: call },
        activeCallId: state.activeCallId === callId ? null : state.activeCallId,
      }));
      return call;
    } catch (error) {
      set({ error: toErrorBody(error) });
      return null;
    }
  },

  /** Answer a ringing call. */
  answerCall: async (callId) => {
    try {
      const call = await api.answerCall(callId);
      set((state) => ({ byId: { ...state.byId, [callId]: call }, activeCallId: callId }));
      return call;
    } catch (error) {
      set({ error: toErrorBody(error) });
      return null;
    }
  },

  /** Call someone back. */
  callBack: async (userId, kind = "voice") => {
    try {
      const call = await api.callBack(userId, kind);
      set((state) => ({
        byId: { ...state.byId, [call.id]: call },
        history: { ...get().history, items: appendIds(get().history.items, [call.id]) },
        activeCallId: call.id,
      }));
      return call;
    } catch (error) {
      set({ error: toErrorBody(error) });
      return null;
    }
  },

  /** Mark a call as seen. */
  markRead: async (callId) => {
    const before = get().byId[callId];
    if (!before) return null;

    set((state) => ({ byId: { ...state.byId, [callId]: { ...before, isRead: true } } }));
    try {
      const call = await api.markCallRead(callId);
      set((state) => ({ byId: { ...state.byId, [callId]: call } }));
      return call;
    } catch (error) {
      set((state) => ({ byId: { ...state.byId, [callId]: before }, error: toErrorBody(error) }));
      return null;
    }
  },

  /** Show a call that arrived from elsewhere, e.g. the simulation. */
  applyIncomingCall: (call) =>
    set((state) => ({
      byId: { ...state.byId, [call.id]: call },
      history: { ...get().history, items: appendIds(get().history.items, [call.id]) },
      activeCallId: call.id,
    })),

  /** Clear the ringing call without changing history. */
  dismissActiveCall: () => set({ activeCallId: null }),
}));

function emptyHistory() {
  return {
    items: [],
    status: "idle",
    error: null,
    cursor: null,
    hasMore: true,
    lastFetchedAt: null,
  };
}

/* -------------------------------- selectors -------------------------------- */

const slice = (state) => state.calls ?? state;

/** Call history, newest first. Pass "missed" to filter. */
export const selectCallHistory = (filter = "all") => (state) => {
  const calls = slice(state).history.items
    .map((id) => slice(state).byId[id])
    .filter(Boolean);
  const filtered = filter === "missed" ? calls.filter((c) => c.status === "missed") : calls;
  return filtered.sort((a, b) => Date.parse(b.startedAt) - Date.parse(a.startedAt));
};

/** Runs of consecutive missed calls, e.g. "3 missed calls from Tabi". */
export const selectMissedCallGroups = (state) => slice(state).missedGroups;

export const selectMissedCallCount = (state) =>
  slice(state).missedGroups.reduce((sum, group) => sum + group.count, 0);

export const selectCall = (callId) => (state) => slice(state).byId[callId] ?? null;

export const selectActiveCall = (state) =>
  slice(state).activeCallId ? slice(state).byId[slice(state).activeCallId] ?? null : null;

/** Unread calls, for a badge. */
export const selectUnreadCalls = (state) =>
  Object.values(slice(state).byId).filter((c) => !c.isRead);

export const selectCallsStatus = (state) => slice(state).history.status;

/**
 * Shared helpers for the stores.
 *
 * Every list slice uses the same shape, so fetching, paging and error handling
 * are written once here instead of in each store.
 */

/** @typedef {"idle"|"loading"|"refreshing"|"loadingMore"|"error"} ListStatus */

/**
 * A fresh, empty list slice.
 * @returns {{
 *   items: string[],
 *   status: ListStatus,
 *   error: import("../types").ApiErrorBody|null,
 *   cursor: string|null,
 *   hasMore: boolean,
 *   lastFetchedAt: number|null,
 * }}
 */
export function emptyList() {
  return {
    items: [],
    status: "idle",
    error: null,
    cursor: null,
    hasMore: true,
    lastFetchedAt: null,
  };
}

/** Convert any thrown value into the API error body shape. */
export function toErrorBody(error) {
  if (error && typeof error === "object" && "code" in error && "message" in error) {
    return {
      code: error.code,
      message: error.message,
      requestId: error.requestId ?? null,
      details: error.details ?? null,
    };
  }
  return {
    code: "unknown_error",
    message: error instanceof Error ? error.message : "Something went wrong",
    requestId: null,
    details: null,
  };
}

/**
 * Index a list of entities by id.
 * @template {{ id: string }} T
 * @param {T[]} list
 * @returns {Record<string, T>}
 */
export function byId(list) {
  const out = {};
  for (const item of list) out[item.id] = item;
  return out;
}

/**
 * Merge new entities into an existing map. Fetched entities replace the cached
 * copy so counts and flags stay current, but entries with `isPending` (an
 * optimistic item still awaiting the server) are kept until it settles.
 * @template {{ id: string }} T
 * @param {Record<string, T>} existing
 * @param {T[]} incoming
 * @returns {Record<string, T>}
 */
export function mergeById(existing, incoming) {
  if (incoming.length === 0) return existing;
  const next = { ...existing };
  let changed = false;
  for (const item of incoming) {
    const current = next[item.id];
    if (current && current.isPending) continue;
    if (current !== item) {
      next[item.id] = item;
      changed = true;
    }
  }
  return changed ? next : existing;
}

/** Append ids that are not already present, keeping order and dropping dupes. */
export function appendIds(existing, incoming) {
  const seen = new Set(existing);
  const extra = incoming.filter((id) => !seen.has(id));
  if (extra.length === 0) return existing;
  return existing.concat(extra);
}

/** Prepend ids, removing them from wherever they were. */
export function prependIds(existing, incoming) {
  const incomingSet = new Set(incoming);
  return incoming.concat(existing.filter((id) => !incomingSet.has(id)));
}

/** Remove an id wherever it appears. */
export function removeId(existing, id) {
  return existing.filter((x) => x !== id);
}

/**
 * Standard fetch actions for one list slice.
 *
 * Returns the state patches a store should merge, so each store keeps its own
 * shape while sharing the loading, paging and error behaviour.
 *
 * @param {{
 *   slice: import("./helpers").emptyList extends () => infer S ? S : never,
 *   fetchPage: (params: { cursor: string|null, limit: number }) => Promise<any>,
 *   limit?: number,
 * }} options
 */
export function createListActions({ slice, fetchPage, limit = 20 }) {
  /** Load the first page, replacing anything already there. */
  const fetchInitial = async (set, get) => {
    set({ status: "loading", error: null });
    try {
      const response = await fetchPage({ cursor: null, limit });
      set({
        items: response.items,
        status: "idle",
        error: null,
        cursor: response.pageInfo.cursor,
        hasMore: response.pageInfo.hasMore,
        lastFetchedAt: Date.now(),
      });
    } catch (error) {
      set({ status: "error", error: toErrorBody(error) });
    }
  };

  /** Refresh from the top while keeping the current items visible. */
  const refresh = async (set) => {
    set({ status: "refreshing", error: null });
    try {
      const response = await fetchPage({ cursor: null, limit });
      set({
        items: response.items,
        status: "idle",
        error: null,
        cursor: response.pageInfo.cursor,
        hasMore: response.pageInfo.hasMore,
        lastFetchedAt: Date.now(),
      });
    } catch (error) {
      set({ status: "error", error: toErrorBody(error) });
    }
  };

  /** Append the next page. Does nothing when there is nothing more. */
  const loadMore = async (set, get) => {
    const state = get();
    const current = state[slice];
    if (!current.hasMore || current.status === "loadingMore" || current.status === "loading") return;

    set({ [slice]: { ...current, status: "loadingMore", error: null } });
    try {
      const response = await fetchPage({ cursor: current.cursor, limit });
      set({
        [slice]: {
          ...get()[slice],
          items: appendIds(current.items, response.items),
          status: "idle",
          error: null,
          cursor: response.pageInfo.cursor,
          hasMore: response.pageInfo.hasMore,
          lastFetchedAt: Date.now(),
        },
      });
    } catch (error) {
      set({ [slice]: { ...get()[slice], status: "error", error: toErrorBody(error) } });
    }
  };

  return { fetchInitial, refresh, loadMore };
}

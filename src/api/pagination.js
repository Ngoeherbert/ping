import { nextRequestId } from "./errors";

/**
 * Cursor pagination.
 *
 * A cursor is the index of the next item to return, encoded as a string. Using
 * an index rather than an id keeps the fake API simple while behaving exactly
 * like a real cursor for callers.
 */

/** @typedef {{ cursor: string|null, limit: number }} PageParams */

/** The default and maximum page size. */
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

/**
 * Split a list into one page, using an opaque cursor.
 *
 * @template T
 * @param {T[]} items Already in display order.
 * @param {PageParams} [params]
 * @returns {{ slice: T[], pageInfo: import("../types").PageInfo, requestId: string }}
 */
export function paginate(items, params = {}) {
  const limit = Math.min(Math.max(1, params.limit ?? DEFAULT_LIMIT), MAX_LIMIT);
  const start = params.cursor ? Number.parseInt(params.cursor, 10) : 0;
  const safeStart = Number.isNaN(start) || start < 0 ? 0 : start;

  const slice = items.slice(safeStart, safeStart + limit);
  const nextIndex = safeStart + slice.length;
  const hasMore = nextIndex < items.length;

  return {
    slice,
    pageInfo: {
      cursor: hasMore ? String(nextIndex) : null,
      hasMore,
      limit,
      total: items.length,
    },
    requestId: nextRequestId(),
  };
}

/**
 * Same as `paginate`, but for endpoints that return two arrays at once,
 * such as explore (trending plus a mixed-media grid).
 *
 * @template T
 * @param {T[]} items
 * @param {PageParams} [params]
 * @param {object} [extra] Extra top-level fields to merge into the response.
 */
export function paginateWith(items, params = {}, extra = {}) {
  const { slice, pageInfo, requestId } = paginate(items, params);
  return { ...extra, items: slice, pageInfo, requestId };
}

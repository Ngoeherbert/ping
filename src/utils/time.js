/**
 * Time helpers. Every timestamp in the data layer is an ISO 8601 string in
 * WAT (UTC+1, Cameroon), e.g. "2026-05-10T14:03:00+01:00".
 *
 * Mock data is generated relative to a single "now" so a dataset is internally
 * consistent: a story expires exactly 24h after it was posted, and a call that
 * started three hours ago ends three hours ago.
 */

/** WAT is a fixed +01:00 offset; Cameroon has no daylight saving. */
export const WAT_OFFSET_MINUTES = 60;
export const WAT_OFFSET_SUFFIX = "+01:00";
export const MS_PER_MINUTE = 60_000;
export const MS_PER_HOUR = 3_600_000;
export const MS_PER_DAY = 86_400_000;

/**
 * Format a Date (or epoch ms) as an ISO string with a +01:00 offset.
 * @param {Date|number} input
 * @returns {string}
 */
export function toWatIso(input) {
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) throw new TypeError("toWatIso received an invalid date");
  // Shift the UTC instant into WAT, then drop the trailing Z and label the offset.
  const shifted = new Date(date.getTime() + WAT_OFFSET_MINUTES * MS_PER_MINUTE);
  return `${shifted.toISOString().slice(0, -1)}${WAT_OFFSET_SUFFIX}`;
}

/**
 * Parse a WAT ISO string (or any ISO string) back into epoch milliseconds.
 * @param {string} iso
 * @returns {number}
 */
export function fromWatIso(iso) {
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) throw new TypeError(`fromWatIso received an invalid date: ${iso}`);
  return ms;
}

/**
 * Milliseconds in the past, as a WAT ISO string. `agoSeconds` may be fractional.
 * @param {number} agoSeconds
 * @param {number} [nowMs]
 * @returns {string}
 */
export function secondsAgo(agoSeconds, nowMs = Date.now()) {
  return toWatIso(nowMs - agoSeconds * 1000);
}

/** @param {number} agoMinutes @param {number} [nowMs] @returns {string} */
export function minutesAgo(agoMinutes, nowMs = Date.now()) {
  return toWatIso(nowMs - agoMinutes * MS_PER_MINUTE);
}

/** @param {number} agoHours @param {number} [nowMs] @returns {string} */
export function hoursAgo(agoHours, nowMs = Date.now()) {
  return toWatIso(nowMs - agoHours * MS_PER_HOUR);
}

/** @param {number} agoDays @param {number} [nowMs] @returns {string} */
export function daysAgo(agoDays, nowMs = Date.now()) {
  return toWatIso(nowMs - agoDays * MS_PER_DAY);
}

/**
 * A timestamp somewhere in the past, spread so that the data set covers
 * "a few seconds ago" all the way to "over a year ago" in one call.
 * The curve is exponential so recent items dominate, like a real feed.
 *
 * @param {import("./random").Rng} rng
 * @param {number} [nowMs]
 * @returns {string} WAT ISO string.
 */
export function recentIso(rng, nowMs = Date.now()) {
  const seconds = rng.weighted(
    [5, 45, 600, 7200, 86400, 604800],
    [12, 20, 22, 20, 15, 11],
  );
  return toWatIso(nowMs - seconds * 1000 * rng.float(0.8, 1.2));
}

/**
 * A timestamp uniformly spread across a window ending now.
 * @param {import("./random").Rng} rng
 * @param {number} maxAgeDays
 * @param {number} [nowMs]
 * @returns {string}
 */
export function isoWithinDays(rng, maxAgeDays, nowMs = Date.now()) {
  return toWatIso(nowMs - rng.float(0, maxAgeDays) * MS_PER_DAY);
}

/**
 * A timestamp in the future, for things like story expiry or a pending game.
 * @param {number} inSeconds
 * @param {number} [nowMs]
 * @returns {string}
 */
export function secondsFromNow(inSeconds, nowMs = Date.now()) {
  return toWatIso(nowMs + inSeconds * 1000);
}

/** @param {number} inHours @param {number} [nowMs] @returns {string} */
export function hoursFromNow(inHours, nowMs = Date.now()) {
  return toWatIso(nowMs + inHours * MS_PER_HOUR);
}

/**
 * True when `iso` is in the past relative to `nowMs`.
 * @param {string} iso
 * @param {number} [nowMs]
 * @returns {boolean}
 */
export function isExpired(iso, nowMs = Date.now()) {
  return fromWatIso(iso) <= nowMs;
}

/**
 * Seconds remaining until `iso`, floored at 0. Handy for countdowns.
 * @param {string} iso
 * @param {number} [nowMs]
 * @returns {number}
 */
export function secondsUntil(iso, nowMs = Date.now()) {
  return Math.max(0, Math.floor((fromWatIso(iso) - nowMs) / 1000));
}

/**
 * Sort comparator placing the newest first. Works on anything with `createdAt`.
 * @param {{ createdAt: string }} a
 * @param {{ createdAt: string }} b
 * @returns {number}
 */
export function byNewest(a, b) {
  return fromWatIso(b.createdAt) - fromWatIso(a.createdAt);
}

/**
 * Sort comparator placing the oldest first.
 * @param {{ createdAt: string }} a
 * @param {{ createdAt: string }} b
 * @returns {number}
 */
export function byOldest(a, b) {
  return fromWatIso(a.createdAt) - fromWatIso(b.createdAt);
}
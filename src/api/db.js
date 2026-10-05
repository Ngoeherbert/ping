import { generateData } from "../data";
import { groupMissedCalls } from "../data/messaging";
import { CURRENT_USER_ID } from "../data/people";
import { config } from "./config";
import { ApiError, nextRequestId } from "./errors";
import { toWatIso } from "../utils/time";

/**
 * The in-memory database the fake API reads and writes.
 *
 * It holds live, mutable copies of the generated data so mutations persist for
 * the life of the process, exactly as a real server would. Swap this module
 * for an HTTP client later and the rest of the app is unchanged.
 */

/** @type {ReturnType<typeof generateData>|null} */
let db = null;

/** Build the database once and reuse it. */
export function getDb() {
  if (!db) db = build();
  return db;
}

/** Discard all state and regenerate. Useful between tests. */
export function resetDb(seed) {
  db = build(seed);
  return db;
}

function build(seed) {
  const data = generateData({ seed });
  return {
    seed: data.seed,
    currentUserId: data.currentUserId,
    users: data.people.users,
    currentUser: data.people.currentUser,
    follows: data.people.follows,
    blocks: data.people.blocks,
    mutes: data.people.mutes,
    suggestions: data.people.suggestions,
    posts: data.posts,
    postOptions: data.postOptions,
    comments: data.comments,
    likes: data.likes,
    shares: data.shares,
    saves: data.saves,
    shortVideos: data.shortVideos,
    storyItems: data.storyItems,
    storyGroups: data.storyGroups,
    highlights: data.highlights,
    trendingTopics: data.trendingTopics,
    exploreItems: data.exploreItems,
    recentSearches: data.recentSearches,
    conversations: data.conversations,
    messages: data.messages,
    games: data.games,
    calls: data.calls,
    presence: data.presence,
    notifications: data.notifications,
    groups: data.groups,
    settings: data.settings,
    /** Monotonic counters so generated ids never collide with existing ones. */
    seq: { post: 10_000, comment: 10_000, reply: 10_000, message: 100_000, notification: 10_000, like: 100_000, save: 10_000, share: 10_000, call: 10_000, game: 10_000, conversation: 10_000 },
  };
}

/** Next id in a series, e.g. nextId("post") returns "p_10001". */
export function nextId(kind) {
  db.seq[kind] += 1;
  const prefix = {
    post: "p", comment: "c", reply: "sr", message: "m", notification: "n",
    like: "lk", save: "sav", share: "sh", call: "call", game: "g",
    conversation: "cv",
  }[kind];
  return `${prefix}_${db.seq[kind]}`;
}

/* ------------------------------------------------------------------ *
 * Shared request pipeline
 * ------------------------------------------------------------------ */

/** Sleep for a simulated round trip. */
export function delay() {
  const ms = config.minDelayMs + Math.random() * (config.maxDelayMs - config.minDelayMs);
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Throw if this request should fail, per the current config. */
export function maybeFail() {
  if (config.forceError) {
    throw new ApiError(
      config.forcedErrorCode ?? "forced_error",
      config.forcedErrorMessage ?? "Something went wrong. Try again.",
      { requestId: nextRequestId() },
    );
  }
  if (config.failureRate > 0 && Math.random() < config.failureRate) {
    throw new ApiError("network_error", "Network request failed", {
      requestId: nextRequestId(),
    });
  }
}

/**
 * Run an endpoint with simulated latency and the configured failure rate.
 * Every API function goes through this, so behaviour is uniform.
 *
 * @template T
 * @param {() => T} handler
 * @returns {Promise<T>}
 */
export async function run(handler) {
  await delay();
  maybeFail();
  return handler();
}

/* ------------------------------------------------------------------ *
 * Lookup helpers
 * ------------------------------------------------------------------ */

export function findUser(id) {
  return db.users.find((u) => u.id === id) ?? null;
}

export function findPost(id) {
  return db.posts.find((p) => p.id === id) ?? null;
}

export function findConversation(id) {
  return db.conversations.find((c) => c.id === id) ?? null;
}

export function findGame(id) {
  return db.games.find((g) => g.id === id) ?? null;
}

export function findCall(id) {
  return db.calls.find((c) => c.id === id) ?? null;
}

export function findComment(id) {
  return db.comments.find((c) => c.id === id) ?? null;
}

/** The signed-in user, always the same record. */
export function currentUser() {
  return db.currentUser;
}

export { CURRENT_USER_ID, groupMissedCalls, toWatIso };

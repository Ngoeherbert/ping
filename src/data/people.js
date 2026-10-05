import { createRng, times, shuffled } from "../utils/random";
import { isoWithinDays, daysAgo, recentIso, toWatIso } from "../utils/time";
import {
  CITIES,
  GIVEN_NAMES,
  FAMILY_NAMES,
  BIO_FRAGMENTS,
  OVERLONG_BIO,
  OVERLONG_NAME,
  OVERLONG_USERNAME,
  DATA_VOLUME,
  DEFAULT_SEED,
  imageUrl,
  AVATAR_IDS,
  BROKEN_MEDIA_URLS,
} from "../constants/data";

/** Ids used by other generators and by tests. The first user is always "me". */
export const CURRENT_USER_ID = "u_1";

/** Strip accents and punctuation so a username is safe and unique. */
const toHandle = (text) =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase();

/**
 * Build the full people data set: users, follows, blocks, mutes and suggestions.
 *
 * @param {object} [options]
 * @param {string} [options.seed]
 * @param {number} [options.count] How many users, including the current user.
 * @returns {{
 *   users: import("../types").User[],
 *   currentUser: import("../types").CurrentUser,
 *   follows: import("../types").Follow[],
 *   blocks: import("../types").Block[],
 *   mutes: import("../types").Mute[],
 *   suggestions: import("../types").SuggestedUser[],
 * }}
 */
export function generatePeople(options = {}) {
  const seed = options.seed ?? DEFAULT_SEED;
  const count = options.count ?? DATA_VOLUME.users;
  const rng = createRng(`${seed}:people`, "u");
  const now = Date.now();

  const usedHandles = new Set();

  const users = times(count, (i) => {
    // Ids are index-based so they stay unique and predictable. The first entry
    // is always the signed-in user, which is why it is pinned to CURRENT_USER_ID.
    const id = i === 0 ? CURRENT_USER_ID : `u_${i + 1}`;

    const given = rng.pick(GIVEN_NAMES);
    const family = rng.pick(FAMILY_NAMES);
    const isMe = i === 0;
    const isOverlong = i === 3;
    const noAvatar = i === 4;
    const isDeleted = i === 5;
    // Edge case: a brand new account with no content at all.
    const isEmptyAccount = i === 6;
    // Edge case: one celebrity account with millions of followers.
    const isHuge = i === 2;

    let handle = toHandle(`${given}.${family}${i % 7}`);
    let suffix = 1;
    while (usedHandles.has(handle)) {
      suffix += 1;
      handle = toHandle(`${given}.${family}${i % 7}${suffix}`);
    }
    usedHandles.add(handle);

    // A minority of accounts are private; a few are verified.
    const isPrivate = !isMe && rng.chance(0.22);
    const isVerified = !isMe && (i === 1 || rng.chance(0.12));
    const presence = !isMe && rng.chance(0.35) ? "online" : "offline";

    const bioFragment = rng.pick(BIO_FRAGMENTS);
    const bio = isOverlong ? OVERLONG_BIO : bioFragment.text;

    const followers = isEmptyAccount
      ? 0
      : isHuge
        ? 2_450_000 + rng.int(0, 99_999)
        : rng.weighted(
            [rng.int(0, 40), rng.int(40, 900), rng.int(900, 25_000), rng.int(25_000, 180_000)],
            [14, 34, 32, 20],
          );

    const following = isEmptyAccount ? 0 : rng.int(3, isHuge ? 1200 : 800);
    const postCount = isEmptyAccount ? 0 : rng.int(0, isHuge ? 4_200 : 640);

    const avatarUrl = noAvatar
      ? null
      : isDeleted && rng.chance(0.5)
        ? rng.pick(BROKEN_MEDIA_URLS)
        : imageUrl("avatar", rng.pick(AVATAR_IDS) + i);

    return {
      id,
      name: isOverlong ? OVERLONG_NAME : isDeleted ? `${given} (deleted)` : `${given} ${family}`,
      username: isOverlong ? OVERLONG_USERNAME : handle,
      avatarUrl,
      coverUrl: rng.chance(0.4) ? imageUrl("cover", i + 7) : null,
      bio,
      city: rng.chance(0.85) ? rng.pick(CITIES).name : null,
      joinedAt: isoWithinDays(rng, isHuge ? 2600 : 1500, now),
      isVerified,
      isPrivate,
      isDeleted,
      presence,
      lastSeenAt: presence === "online" ? null : recentIso(rng, now),
      counts: { posts: postCount, followers, following },
    };
  });

  const currentUser = {
    ...users[0],
    email: "ngoe.tabi@example.cm",
    phone: "+237 6 99 12 34 56",
    isCurrentUser: true,
  };
  users[0] = currentUser;

  const activeOthers = users.filter((u) => u.id !== CURRENT_USER_ID && !u.isDeleted);

  const follows = buildFollows(rng, activeOthers, now);
  const blocks = buildBlocks(rng, activeOthers);
  const mutes = buildMutes(rng, activeOthers);
  const suggestions = buildSuggestions(rng, activeOthers, follows);

  return { users, currentUser, follows, blocks, mutes, suggestions };
}

/**
 * One-way follow edges between the current user and everyone else, plus a few
 * edges between other users so "mutual friends" can be computed.
 */
function buildFollows(rng, others, now) {
  const follows = [];
  let seq = 0;
  const id = () => `f_${(seq += 1)}`;

  for (const user of others) {
    const isPending = user.isPrivate && rng.chance(0.45);
    const viewerFollows = rng.chance(0.62);

    if (viewerFollows) {
      follows.push({
        id: id(),
        followerId: CURRENT_USER_ID,
        followingId: user.id,
        status: isPending ? "pending" : "accepted",
        createdAt: isoWithinDays(rng, 900, now),
        resolvedAt: isPending ? null : isoWithinDays(rng, 890, now),
      });
    }

    // The other direction, which is what makes someone a mutual friend.
    const followsBack = viewerFollows ? rng.chance(0.55) : rng.chance(0.12);
    if (followsBack) {
      follows.push({
        id: id(),
        followerId: user.id,
        followingId: CURRENT_USER_ID,
        status: "accepted",
        createdAt: isoWithinDays(rng, 880, now),
        resolvedAt: isoWithinDays(rng, 875, now),
      });
    }
  }

  // A few extra edges between other people, so follower lists are not only the viewer.
  for (let i = 0; i < 60; i += 1) {
    const a = rng.pick(others);
    const b = rng.pick(others);
    if (a.id === b.id) continue;
    if (follows.some((f) => f.followerId === a.id && f.followingId === b.id)) continue;
    follows.push({
      id: id(),
      followerId: a.id,
      followingId: b.id,
      status: "accepted",
      createdAt: isoWithinDays(rng, 700, now),
      resolvedAt: isoWithinDays(rng, 690, now),
    });
  }

  return follows;
}

function buildBlocks(rng, others) {
  return times(2, (i) => ({
    id: `b_${i + 1}`,
    userId: rng.pick(others).id,
    createdAt: daysAgo(rng.int(2, 200), Date.now()),
  }));
}

function buildMutes(rng, others) {
  const now = Date.now();
  return times(3, (i) => ({
    id: `m_${i + 1}`,
    userId: rng.pick(others).id,
    createdAt: daysAgo(rng.int(1, 120), now),
    // One mute expires; the rest are indefinite.
    expiresAt: i === 0 ? toWatIso(now + 7 * 86_400_000) : null,
  }));
}

/**
 * Suggestions carry structured reasons only. Screens decide the wording.
 */
function buildSuggestions(rng, others, follows) {
  const followedByViewer = new Set(
    follows.filter((f) => f.followerId === CURRENT_USER_ID).map((f) => f.followingId),
  );

  return shuffled(others, rng)
    .slice(0, 12)
    .map((user) => {
      const reasons = [];

      const mutuals = others.filter(
        (other) =>
          other.id !== user.id &&
          followedByViewer.has(other.id) &&
          follows.some((f) => f.followerId === other.id && f.followingId === user.id),
      );

      if (mutuals.length > 0) {
        reasons.push({
          type: "mutual_followers",
          mutualFollowerIds: mutuals.slice(0, 5).map((m) => m.id),
          count: mutuals.length,
        });
      }
      if (rng.chance(0.4)) reasons.push({ type: "similar_location", count: rng.int(1, 9) });
      if (rng.chance(0.35)) reasons.push({ type: "followed_by", count: rng.int(1, 4) });
      if (rng.chance(0.3)) reasons.push({ type: "recent_activity", count: rng.int(1, 6) });
      if (reasons.length === 0) reasons.push({ type: "contact" });

      return { userId: user.id, reasons };
    });
}
import { createRng, times, shuffled } from "../utils/random";
import { recentIso, isoWithinDays, daysAgo, toWatIso } from "../utils/time";
import {
  GROUP_NAMES,
  CHANNEL_NAMES,
  MESSAGE_FRAGMENTS,
  DATA_VOLUME,
  DEFAULT_SEED,
  imageUrl,
} from "../constants/data";
import { CURRENT_USER_ID } from "./people";

/**
 * Notifications, groups, channels and account settings.
 *
 * Notifications describe what happened (type plus actor and target ids) and
 * never the sentence to render, so wording can change without touching data.
 *
 * @param {object} options
 * @param {any} options.people Output of `generatePeople`.
 * @param {any} [options.content] Output of `generateContent`.
 * @param {string} [options.seed]
 */
export function generateSocial(options) {
  const seed = options.seed ?? DEFAULT_SEED;
  const rng = createRng(`${seed}:social`, "sn");
  const now = Date.now();

  const active = options.people.users.filter((u) => !u.isDeleted);
  const posts = options.content?.posts ?? [];
  const comments = options.content?.comments ?? [];
  const groups = buildGroups(rng, active, now);

  return {
    notifications: buildNotifications(rng, active, posts, comments, groups, now),
    groups,
    settings: buildSettings(rng, now),
  };
}

/** One of every notification type, plus grouped entries and mixed read state. */
function buildNotifications(rng, active, posts, comments, groups, now) {
  /** @type {import("../types").NotificationType[]} */
  const TYPES = [
    "new_follower", "follow_request", "like", "comment", "reply", "mention",
    "share", "new_story", "message_request", "birthday", "group_invite",
  ];

  const myPosts = posts.filter((p) => p.authorId === CURRENT_USER_ID && !p.isDeleted);
  const myComments = comments.filter((c) => c.authorId === CURRENT_USER_ID);
  const myGroups = groups.filter((g) => g.joinedAt !== null);
  const others = active.filter((u) => u.id !== CURRENT_USER_ID);

  const notifications = [];
  let seq = 0;

  const add = (type, actorIds, targetId, targetType, extra = {}) => {
    seq += 1;
    // Grouped entries collapse several actors into one row.
    const grouped = actorIds.length > 2;
    notifications.push({
      id: `n_${seq}`,
      type,
      actorIds,
      targetId,
      targetType,
      groupedCount: grouped ? actorIds.length : 1,
      isRead: rng.chance(0.35),
      createdAt: recentIso(rng, now),
      ...extra,
    });
  };

  // Ensure every type is represented, then top up to the requested volume.
  TYPES.forEach((type) => addOneOf(rng, type, add, pickPost, myPosts, myComments, myGroups, others));

  while (notifications.length < DATA_VOLUME.notifications) {
    const type = rng.pick(TYPES);
    add(type, rng.sample(others, rng.int(1, 4)).map((a) => a.id), pickPost(myPosts, rng), "post");
  }

  return notifications
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, DATA_VOLUME.notifications);
}

/** Add a single notification of a given type, with type-appropriate targets. */
function addOneOf(rng, type, add, pickPost, myPosts, myComments, myGroups, others) {
  const actors = rng.sample(others, rng.weighted([1, 1, 1, 3, 8], [45, 30, 15, 7, 3]));
  const actorIds = actors.map((a) => a.id);

  switch (type) {
    case "new_follower":
    case "follow_request":
    case "message_request":
      add(type, actorIds, actors[0]?.id ?? null, "conversation");
      break;
    case "reply":
      add(type, actorIds, myComments.length ? rng.pick(myComments).id : null, "comment");
      break;
    case "new_story":
      add(type, actorIds, `st_${rng.int(1, 50)}`, "story");
      break;
    case "group_invite":
      add(type, actorIds, myGroups.length ? rng.pick(myGroups).id : null, "group");
      break;
    case "birthday":
      // The birthday itself lives in meta; the actor is the person celebrating.
      add(type, actorIds, actors[0]?.id ?? null, null, {
        meta: { birthdayYear: rng.int(1978, 2004) },
      });
      break;
    default:
      add(type, actorIds, pickPost(myPosts, rng), "post");
      break;
  }
}

function pickPost(posts, rng) {
  if (posts.length === 0) return null;
  return rng.pick(posts).id;
}

/** Public and private groups plus one-way broadcast channels. */
function buildGroups(rng, active, now) {
  const groups = [];
  let seq = 0;

  const groupNames = shuffled(GROUP_NAMES, rng).slice(0, DATA_VOLUME.groups);
  for (const name of groupNames) {
    seq += 1;
    const members = shuffled(active, rng).slice(0, rng.int(6, 30));
    const admins = members.slice(0, rng.int(1, 2));
    const isPrivate = rng.chance(0.3);
    const joined = rng.chance(0.75);

    groups.push({
      id: `grp_${seq}`,
      kind: "group",
      name,
      iconUrl: rng.chance(0.8) ? imageUrl("square", 11000 + seq) : null,
      description: rng.pick(MESSAGE_FRAGMENTS).text,
      isPrivate,
      members: members.map((m, i) => ({
        userId: m.id,
        role: admins.some((a) => a.id === m.id)
          ? "admin"
          : i < admins.length + 3
            ? "moderator"
            : "member",
        joinedAt: isoWithinDays(rng, 400, now),
      })),
      memberCount: members.length,
      subscriberCount: null,
      postCount: rng.int(0, 900),
      createdAt: isoWithinDays(rng, 900, now),
      joinedAt: joined ? isoWithinDays(rng, 300, now) : null,
      viewerRole: joined ? (rng.chance(0.15) ? "admin" : "member") : null,
    });
  }

  const channelNames = shuffled(CHANNEL_NAMES, rng).slice(0, DATA_VOLUME.channels);
  for (const name of channelNames) {
    seq += 1;
    // Channels are broadcasts: subscribers, not members.
    groups.push({
      id: `chn_${seq}`,
      kind: "channel",
      name,
      iconUrl: imageUrl("square", 12000 + seq),
      description: rng.pick(MESSAGE_FRAGMENTS).text,
      isPrivate: false,
      members: [],
      memberCount: 0,
      subscriberCount: rng.weighted(
        [rng.int(10, 900), rng.int(900, 90_000), rng.int(90_000, 1_500_000)],
        [25, 45, 30],
      ),
      postCount: rng.int(10, 5_000),
      createdAt: isoWithinDays(rng, 1200, now),
      joinedAt: rng.chance(0.6) ? isoWithinDays(rng, 400, now) : null,
      viewerRole: null,
    });
  }

  return groups;
}

/** Privacy, notification settings, linked devices, verification and reports. */
function buildSettings(rng, now) {
  return {
    privacy: {
      isPrivateAccount: rng.chance(0.4),
      showActivityStatus: rng.chance(0.7),
      allowMessagesFromEveryone: rng.chance(0.6),
      allowTagging: rng.chance(0.8),
      commentBeforePosting: rng.chance(0.3),
      hideReadReceipts: rng.chance(0.25),
    },
    notifications: {
      likes: true,
      comments: true,
      follows: rng.chance(0.8),
      messages: true,
      stories: rng.chance(0.7),
      groupInvites: rng.chance(0.6),
      birthdays: rng.chance(0.5),
      sound: rng.chance(0.8),
    },
    theme: rng.pick(["system", "light", "dark"]),
    language: rng.pick(["en", "fr", "pcm"]),
    draftPostText: rng.chance(0.4)
      ? "Draft: Makossa night at Buea this Saturday, bring the speaker"
      : null,
    linkedDevices: times(3, (i) => ({
      id: `dev_${i + 1}`,
      label: i === 0 ? "This phone" : rng.pick([
        "iPad", "Galaxy S23", "Chrome on laptop", "Old Redmi",
      ]),
      platform: i === 0
        ? "android"
        : rng.pick(["ios", "android", "web"]),
      location: rng.pick(["Douala", "Buea", "Yaounde", "Bamenda"]),
      lastActiveAt: daysAgo(rng.int(0, 40), now),
      isCurrentDevice: i === 0,
    })),
    verification: rng.pick([
      { status: "none" },
      { status: "pending" },
      { status: "rejected" },
    ]).status === "none"
      ? { id: "ver_1", status: "none", requestedAt: null, resolvedAt: null, rejectionReason: null }
      : {
          id: "ver_1",
          status: rng.pick(["pending", "rejected"]),
          requestedAt: daysAgo(rng.int(5, 200), now),
          resolvedAt: null,
          rejectionReason: null,
        },
    reports: times(4, (i) => ({
      id: `rep_${i + 1}`,
      targetType: rng.pick(["post", "comment", "message", "user"]),
      targetId: `p_${rng.int(1, 150)}`,
      targetUserId: `u_${rng.int(2, 40)}`,
      reason: rng.pick(["spam", "harassment", "hate", "violence", "nudity", "scam", "other"]),
      details: rng.chance(0.5) ? rng.pick(MESSAGE_FRAGMENTS).text : null,
      status: rng.pick(["open", "reviewing", "resolved", "dismissed"]),
      reportedAt: daysAgo(rng.int(1, 90), now),
      resolvedAt: null,
    })),
  };
}

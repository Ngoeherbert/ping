import { getDb, run, nextId, findUser, findPost, findConversation, CURRENT_USER_ID } from "./db";
import { paginate } from "./pagination";
import { notFound, validationError } from "./errors";
import { toWatIso } from "../utils/time";

/* ----------------------------- notifications ------------------------------ */

/** The notification list, newest first. */
export function listNotifications(params = {}) {
  return run(() => {
    const db = getDb();
    let items = db.notifications;
    if (params.unreadOnly) items = items.filter((n) => !n.isRead);
    if (params.type) items = items.filter((n) => n.type === params.type);

    const ordered = items
      .slice()
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));

    const { slice, pageInfo, requestId } = paginate(ordered, params);
    return { notifications: slice, pageInfo, requestId };
  });
}

/** How many notifications are unread. */
export function getUnreadNotificationCount() {
  return run(() => ({
    count: getDb().notifications.filter((n) => !n.isRead).length,
  }));
}

/** Mark one notification, or every notification, as read. */
export function markNotificationsRead(notificationId) {
  return run(() => {
    const db = getDb();
    if (notificationId) {
      const notification = db.notifications.find((n) => n.id === notificationId);
      if (!notification) throw notFound("That notification no longer exists");
      notification.isRead = true;
      return { notification };
    }
    let changed = 0;
    for (const n of db.notifications) {
      if (!n.isRead) {
        n.isRead = true;
        changed += 1;
      }
    }
    return { markedRead: changed };
  });
}

/* -------------------------------- explore --------------------------------- */

/** Trending topics plus the mixed-media explore grid. */
export function getExplore(params = {}) {
  return run(() => {
    const db = getDb();
    const trending = db.trendingTopics
      .slice()
      .sort((a, b) => a.rank - b.rank);
    const { slice, pageInfo, requestId } = paginate(db.exploreItems, params);
    return { trending, items: slice, pageInfo, requestId };
  });
}

/** Recent searches. */
export function listRecentSearches() {
  return run(() => ({ recentSearches: getDb().recentSearches }));
}

/** Record a search term as recent. */
export function addRecentSearch(term) {
  return run(() => {
    const db = getDb();
    const trimmed = (term ?? "").trim();
    if (!trimmed) throw validationError("Type something to search");

    const existing = db.recentSearches.find(
      (s) => s.term.toLowerCase() === trimmed.toLowerCase(),
    );
    if (existing) {
      existing.searchedAt = toWatIso(Date.now());
      db.recentSearches = db.recentSearches.filter((s) => s.id !== existing.id);
    }
    const search = {
      id: `rs_${Date.now().toString(36)}`,
      term: trimmed,
      searchedAt: toWatIso(Date.now()),
    };
    db.recentSearches.unshift(search);
    return search;
  });
}

/**
 * Search across people, groups, hashtags and posts.
 * @param {string} term
 * @param {{ cursor?: string, limit?: number }} [params]
 */
export function search(term, params = {}) {
  return run(() => {
    const db = getDb();
    const q = (term ?? "").trim().toLowerCase();
    if (!q) return { results: [], pageInfo: { cursor: null, hasMore: false, limit: 20, total: 0 }, requestId: "req_search_empty" };

    const results = [];

    for (const user of db.users) {
      if (user.isDeleted) continue;
      if (user.name.toLowerCase().includes(q) || user.username.toLowerCase().includes(q)) {
        results.push({ type: "user", user });
      }
    }
    for (const group of db.groups) {
      if (group.name.toLowerCase().includes(q)) results.push({ type: "group", group });
    }
    const matchingHashtags = new Set(
      db.posts
        .filter((p) => p.hashtags.some((h) => h.toLowerCase().includes(q)))
        .flatMap((p) => p.hashtags)
        .filter((h) => h.toLowerCase().includes(q)),
    );
    for (const label of matchingHashtags) results.push({ type: "hashtag", label });
    for (const post of db.posts) {
      if (!post.isDeleted && post.caption.toLowerCase().includes(q)) {
        results.push({ type: "post", post });
      }
    }

    const { slice, pageInfo, requestId } = paginate(results, params);
    return { results: slice, pageInfo, requestId };
  });
}

/* --------------------------------- groups --------------------------------- */

/** Groups and channels. */
export function listGroups(params = {}) {
  return run(() => {
    const db = getDb();
    let groups = db.groups;
    if (params.kind) groups = groups.filter((g) => g.kind === params.kind);
    if (params.mineOnly) groups = groups.filter((g) => g.joinedAt !== null);

    const { slice, pageInfo, requestId } = paginate(groups, params);
    return { groups: slice, pageInfo, requestId };
  });
}

/** One group, with its posts. */
export function getGroup(groupId, params = {}) {
  return run(() => {
    const db = getDb();
    const group = db.groups.find((g) => g.id === groupId);
    if (!group) throw notFound("That group no longer exists");

    const members = new Set(group.members.map((m) => m.userId));
    const posts = db.posts
      .filter((p) => members.has(p.authorId) && !p.isDeleted)
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));

    const { slice, pageInfo, requestId } = paginate(posts, params);
    return { group, posts: slice, pageInfo, requestId };
  });
}

/** Join or leave a group. */
export function setGroupMembership(groupId, shouldJoin) {
  return run(() => {
    const db = getDb();
    const group = db.groups.find((g) => g.id === groupId);
    if (!group) throw notFound("That group no longer exists");
    if (group.kind === "channel") {
      // Channels only track subscribers, never members.
      if (shouldJoin) group.subscriberCount = (group.subscriberCount ?? 0) + 1;
      else group.subscriberCount = Math.max(0, (group.subscriberCount ?? 0) - 1);
      group.joinedAt = shouldJoin ? toWatIso(Date.now()) : null;
      return group;
    }

    const index = group.members.findIndex((m) => m.userId === CURRENT_USER_ID);
    if (shouldJoin && index === -1) {
      group.members.push({
        userId: CURRENT_USER_ID,
        role: "member",
        joinedAt: toWatIso(Date.now()),
      });
      group.memberCount += 1;
      group.joinedAt = toWatIso(Date.now());
    } else if (!shouldJoin && index !== -1) {
      group.members.splice(index, 1);
      group.memberCount = Math.max(0, group.memberCount - 1);
      group.joinedAt = null;
      group.viewerRole = null;
    }
    return group;
  });
}

/* -------------------------------- settings -------------------------------- */

/** All account settings. */
export function getSettings() {
  return run(() => ({ settings: getDb().settings }));
}

/**
 * Patch settings. Only known top-level keys are written.
 * @param {object} patch
 */
export function updateSettings(patch = {}) {
  return run(() => {
    const settings = getDb().settings;
    if (patch.privacy) Object.assign(settings.privacy, patch.privacy);
    if (patch.notifications) Object.assign(settings.notifications, patch.notifications);
    if (patch.theme) settings.theme = patch.theme;
    if (patch.language) settings.language = patch.language;
    if (patch.draftPostText !== undefined) settings.draftPostText = patch.draftPostText;
    return settings;
  });
}

/** Linked devices for the account. */
export function listLinkedDevices() {
  return run(() => ({ devices: getDb().settings.linkedDevices }));
}

/** Sign a device out, except the current one. */
export function removeLinkedDevice(deviceId) {
  return run(() => {
    const settings = getDb().settings;
    const device = settings.linkedDevices.find((d) => d.id === deviceId);
    if (!device) throw notFound("That device is not linked");
    if (device.isCurrentDevice) throw validationError("You cannot sign out this device");
    settings.linkedDevices = settings.linkedDevices.filter((d) => d.id !== deviceId);
    return { removed: true, deviceId };
  });
}

/** The account's verification state. */
export function getVerification() {
  return run(() => ({ verification: getDb().settings.verification }));
}

/** Submit or check a verification request. */
export function requestVerification() {
  return run(() => {
    const settings = getDb().settings;
    if (settings.verification.status === "pending") {
      throw validationError("A request is already in review");
    }
    settings.verification = {
      id: `ver_${Date.now().toString(36)}`,
      status: "pending",
      requestedAt: toWatIso(Date.now()),
      resolvedAt: null,
      rejectionReason: null,
    };
    return settings.verification;
  });
}

/** Items the viewer reported, for the moderation screen. */
export function listReports(params = {}) {
  return run(() => {
    const reports = getDb().settings.reports
      .slice()
      .sort((a, b) => Date.parse(b.reportedAt) - Date.parse(a.reportedAt));
    const { slice, pageInfo, requestId } = paginate(reports, params);
    return { reports: slice, pageInfo, requestId };
  });
}

/** Report a post, comment, message or user. */
export function reportItem(input = {}) {
  return run(() => {
    const db = getDb();
    if (!input.targetId) throw validationError("Nothing to report");

    const report = {
      id: `rep_${Date.now().toString(36)}`,
      targetType: input.targetType ?? "post",
      targetId: input.targetId,
      targetUserId: input.targetUserId ?? null,
      reason: input.reason ?? "other",
      details: input.details ?? null,
      status: "open",
      reportedAt: toWatIso(Date.now()),
      resolvedAt: null,
    };

    db.settings.reports.unshift(report);
    return report;
  });
}

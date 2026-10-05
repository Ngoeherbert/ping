import { getDb, run, nextId, findUser, currentUser, CURRENT_USER_ID } from "./db";
import { paginate } from "./pagination";
import { notFound, validationError, forbidden } from "./errors";
import { toWatIso } from "../utils/time";

/* ---------------------------------- reads ---------------------------------- */

/**
 * Fetch a page of users, optionally filtered.
 * @param {{ cursor?: string, limit?: number, query?: string, ids?: string[] }} [params]
 * @returns {Promise<import("../types").UsersResponse>}
 */
export function listUsers(params = {}) {
  return run(() => {
    const db = getDb();
    let users = db.users.filter((u) => !u.isDeleted);

    if (params.ids) {
      users = params.ids.map((id) => findUser(id)).filter(Boolean);
    } else if (params.query) {
      const q = params.query.toLowerCase();
      users = users.filter(
        (u) => u.name.toLowerCase().includes(q) || u.username.toLowerCase().includes(q),
      );
    }

    const { slice, pageInfo, requestId } = paginate(users, params);
    return { users: slice, pageInfo, requestId };
  });
}

/**
 * One user by id. Deleted accounts are still returned so referencing screens
 * can render "no longer available" instead of crashing.
 * @param {string} userId
 * @returns {Promise<import("../types").User>}
 */
export function getUser(userId) {
  return run(() => {
    const user = findUser(userId);
    if (!user) throw notFound("That account no longer exists");
    return user;
  });
}

/**
 * The signed-in user's own profile.
 * @returns {Promise<import("../types").CurrentUser>}
 */
export function getCurrentUser() {
  return run(() => currentUser());
}

/**
 * People the viewer may know: not already followed, not blocked, suggested
 * with structured reasons.
 * @param {{ cursor?: string, limit?: number }} [params]
 */
export function listSuggestions(params = {}) {
  return run(() => {
    const db = getDb();
    const followed = new Set(
      db.follows
        .filter((f) => f.followerId === CURRENT_USER_ID && f.status === "accepted")
        .map((f) => f.followingId),
    );
    const blocked = new Set(db.blocks.map((b) => b.userId));

    const items = db.suggestions
      .map((s) => ({ ...s, user: findUser(s.userId) }))
      .filter((s) => s.user && !followed.has(s.userId) && !blocked.has(s.userId));

    const { slice, pageInfo, requestId } = paginate(items, params);
    return { suggestions: slice, users: slice.map((s) => s.user), pageInfo, requestId };
  });
}

/**
 * Followers, following or pending requests.
 * @param {string} userId
 * @param {"followers"|"following"|"pending"} relation
 * @param {{ cursor?: string, limit?: number }} [params]
 */
export function listFollows(userId, relation = "followers", params = {}) {
  return run(() => {
    const db = getDb();
    if (!findUser(userId)) throw notFound("That account no longer exists");

    const edges = db.follows.filter((f) => {
      if (relation === "followers") return f.followingId === userId && f.status === "accepted";
      if (relation === "following") return f.followerId === userId && f.status === "accepted";
      // Pending requests only make sense for the account being viewed.
      return f.followingId === userId && f.status === "pending";
    });

    const users = edges
      .map((f) => findUser(relation === "followers" ? f.followerId : f.followingId))
      .filter(Boolean);

    const { slice, pageInfo, requestId } = paginate(users, params);
    return { users: slice, pageInfo, requestId };
  });
}

/** Blocked and muted users. */
export function listRestricted() {
  return run(() => {
    const db = getDb();
    const blocked = db.blocks
      .map((b) => findUser(b.userId))
      .filter(Boolean);
    const muted = db.mutes.map((m) => findUser(m.userId)).filter(Boolean);
    return { blocked, muted };
  });
}

/* -------------------------------- mutations -------------------------------- */

/**
 * Follow a user, or queue a request when their account is private.
 * @param {string} userId
 * @returns {Promise<{ follow: import("../types").Follow, status: "accepted"|"pending" }>}
 */
export function followUser(userId) {
  return run(() => {
    const db = getDb();
    if (userId === CURRENT_USER_ID) throw validationError("You cannot follow yourself");
    const user = findUser(userId);
    if (!user) throw notFound("That account no longer exists");

    const existing = db.follows.find(
      (f) => f.followerId === CURRENT_USER_ID && f.followingId === userId,
    );
    if (existing && existing.status === "accepted") {
      return { follow: existing, status: "accepted" };
    }
    if (existing) return { follow: existing, status: "pending" };

    const status = user.isPrivate ? "pending" : "accepted";
    const follow = {
      id: `f_${Date.now().toString(36)}`,
      followerId: CURRENT_USER_ID,
      followingId: userId,
      status,
      createdAt: toWatIso(Date.now()),
      resolvedAt: status === "accepted" ? toWatIso(Date.now()) : null,
    };
    db.follows.push(follow);
    // A pending request is not a follow yet, so only accepted follows count.
    if (status === "accepted") {
      user.counts.followers += 1;
      currentUser().counts.following += 1;
    }
    return { follow, status };
  });
}

/** Stop following, and cancel a pending request. */
export function unfollowUser(userId) {
  return run(() => {
    const db = getDb();
    const index = db.follows.findIndex(
      (f) => f.followerId === CURRENT_USER_ID && f.followingId === userId,
    );
    if (index === -1) throw notFound("You are not following that account");

    const [removed] = db.follows.splice(index, 1);
    const user = findUser(userId);
    // Mirror the follow: only an accepted follow moved the counters.
    if (user && removed.status === "accepted") {
      user.counts.followers = Math.max(0, user.counts.followers - 1);
      currentUser().counts.following = Math.max(0, currentUser().counts.following - 1);
    }
    return { removed: true, follow: removed };
  });
}

/** Accept or decline an incoming follow request. */
export function respondToFollowRequest(followId, accept) {
  return run(() => {
    const db = getDb();
    const follow = db.follows.find((f) => f.id === followId);
    if (!follow) throw notFound("That request no longer exists");
    if (follow.status !== "pending") throw validationError("That request was already handled");

    if (accept) {
      follow.status = "accepted";
      follow.resolvedAt = toWatIso(Date.now());
      const user = findUser(follow.followerId);
      if (user) user.counts.followers += 1;
      currentUser().counts.following += 1;
    } else {
      db.follows.splice(db.follows.indexOf(follow), 1);
    }
    return { follow };
  });
}

/**
 * Like or unlike a post.
 * @param {string} postId
 * @param {boolean} shouldLike
 */
export function setPostLike(postId, shouldLike) {
  return run(() => {
    const db = getDb();
    const post = db.posts.find((p) => p.id === postId);
    if (!post) throw notFound("That post no longer exists");

    const index = db.likes.findIndex(
      (l) => l.targetType === "post" && l.targetId === postId && l.userId === CURRENT_USER_ID,
    );
    const alreadyLiked = index !== -1;

    if (shouldLike && !alreadyLiked) {
      db.likes.push({
        id: nextId("like"),
        userId: CURRENT_USER_ID,
        targetType: "post",
        targetId: postId,
        createdAt: toWatIso(Date.now()),
      });
      post.counts.likes += 1;
      post.likedByViewer = true;
    } else if (!shouldLike && alreadyLiked) {
      db.likes.splice(index, 1);
      post.counts.likes = Math.max(0, post.counts.likes - 1);
      post.likedByViewer = false;
    }

    return { post, liked: post.likedByViewer, likesCount: post.counts.likes };
  });
}

/** Save or unsave a post. */
export function setPostSaved(postId, shouldSave) {
  return run(() => {
    const db = getDb();
    const post = db.posts.find((p) => p.id === postId);
    if (!post) throw notFound("That post no longer exists");

    const index = db.saves.findIndex(
      (s) => s.postId === postId && s.userId === CURRENT_USER_ID,
    );
    const alreadySaved = index !== -1;

    if (shouldSave && !alreadySaved) {
      db.saves.push({
        id: nextId("save"),
        postId,
        userId: CURRENT_USER_ID,
        createdAt: toWatIso(Date.now()),
      });
      post.savedByViewer = true;
    } else if (!shouldSave && alreadySaved) {
      db.saves.splice(index, 1);
      post.savedByViewer = false;
    }

    return { post, saved: post.savedByViewer };
  });
}

/** Block a user. Existing follows are removed, as on a real server. */
export function blockUser(userId) {
  return run(() => {
    const db = getDb();
    if (userId === CURRENT_USER_ID) throw validationError("You cannot block yourself");
    if (!findUser(userId)) throw notFound("That account no longer exists");
    if (db.blocks.some((b) => b.userId === userId)) {
      return { blocked: true, alreadyBlocked: true };
    }

    db.blocks.push({ id: `b_${Date.now().toString(36)}`, userId, createdAt: toWatIso(Date.now()) });
    for (let i = db.follows.length - 1; i >= 0; i -= 1) {
      const f = db.follows[i];
      if ((f.followerId === CURRENT_USER_ID && f.followingId === userId)
        || (f.followerId === userId && f.followingId === CURRENT_USER_ID)) {
        db.follows.splice(i, 1);
      }
    }
    return { blocked: true, alreadyBlocked: false };
  });
}

/** Unblock a user. */
export function unblockUser(userId) {
  return run(() => {
    const db = getDb();
    const index = db.blocks.findIndex((b) => b.userId === userId);
    if (index === -1) throw notFound("That account is not blocked");
    db.blocks.splice(index, 1);
    return { blocked: false };
  });
}

/** Mute or unmute a user. */
export function setMuted(userId, shouldMute) {
  return run(() => {
    const db = getDb();
    if (!findUser(userId)) throw notFound("That account no longer exists");

    const index = db.mutes.findIndex((m) => m.userId === userId);
    if (shouldMute && index === -1) {
      db.mutes.push({
        id: `m_${Date.now().toString(36)}`,
        userId,
        createdAt: toWatIso(Date.now()),
        expiresAt: null,
      });
    } else if (!shouldMute && index !== -1) {
      db.mutes.splice(index, 1);
    }

    return { muted: shouldMute };
  });
}

/** People who follow the viewer back. */
export function listMutualFollowers() {
  return run(() => {
    const db = getDb();
    const viewerFollows = new Set(
      db.follows
        .filter((f) => f.followerId === CURRENT_USER_ID && f.status === "accepted")
        .map((f) => f.followingId),
    );
    const followMe = new Set(
      db.follows
        .filter((f) => f.followingId === CURRENT_USER_ID && f.status === "accepted")
        .map((f) => f.followerId),
    );

    const mutuals = [...viewerFollows]
      .filter((id) => followMe.has(id))
      .map(findUser)
      .filter(Boolean);

    return { users: mutuals, requestId: `req_${Date.now().toString(36)}` };
  });
}

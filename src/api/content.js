import { getDb, run, nextId, findPost, findUser, currentUser, CURRENT_USER_ID } from "./db";
import { paginate } from "./pagination";
import { notFound, validationError, forbidden } from "./errors";
import { toWatIso } from "../utils/time";
import { DEFAULT_SEED } from "../constants/data";
import { createRng } from "../utils/random";

/* ---------------------------------- feed ---------------------------------- */

/**
 * The main feed, newest first. Supports a cursor for paging.
 * @param {{ cursor?: string, limit?: number, authorId?: string }} [params]
 * @returns {Promise<import("../types").PostsResponse>}
 */
export function listFeed(params = {}) {
  return run(() => {
    const db = getDb();
    const blocked = new Set(db.blocks.map((b) => b.userId));
    let posts = db.posts.filter((p) => !blocked.has(p.authorId));

    if (params.authorId) posts = posts.filter((p) => p.authorId === params.authorId);

    const ordered = posts
      .slice()
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));

    const { slice, pageInfo, requestId } = paginate(ordered, params);
    return { posts: slice, pageInfo, requestId };
  });
}

/** One post by id. */
export function getPost(postId) {
  return run(() => {
    const post = findPost(postId);
    if (!post) throw notFound("That post no longer exists");
    return post;
  });
}

/** Posts saved by the viewer. */
export function listSavedPosts(params = {}) {
  return run(() => {
    const db = getDb();
    const ids = db.saves.filter((s) => s.userId === CURRENT_USER_ID).map((s) => s.postId);
    const posts = ids.map(findPost).filter(Boolean)
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
    const { slice, pageInfo, requestId } = paginate(posts, params);
    return { posts: slice, pageInfo, requestId };
  });
}

/* -------------------------------- comments -------------------------------- */

/**
 * Top-level comments for a post, newest first, with replies nested under each.
 * @param {string} postId
 * @param {{ cursor?: string, limit?: number, sort?: "top"|"newest" }} [params]
 */
export function listComments(postId, params = {}) {
  return run(() => {
    const db = getDb();
    if (!findPost(postId)) throw notFound("That post no longer exists");

    const mine = db.comments.filter((c) => c.postId === postId);
    const topLevel = mine.filter((c) => !c.parentId);

    const ordered = params.sort === "top"
      ? topLevel.slice().sort((a, b) => b.counts.likes - a.counts.likes)
      : topLevel.slice().sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));

    const { slice, pageInfo, requestId } = paginate(ordered, params);

    // Attach replies so a thread renders from one request.
    const withReplies = slice.map((comment) => ({
      ...comment,
      replies: mine
        .filter((c) => c.parentId === comment.id)
        .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt)),
    }));

    return { topLevel: withReplies, comments: withReplies, pageInfo, requestId };
  });
}

/**
 * Add a comment, or a reply when `parentId` is given.
 * @param {string} postId
 * @param {string} text
 * @param {{ parentId?: string|null }} [options]
 */
export function createComment(postId, text, options = {}) {
  return run(() => {
    const db = getDb();
    const post = findPost(postId);
    if (!post) throw notFound("That post no longer exists");
    if (!text || !text.trim()) throw validationError("Write something first");

    const comment = {
      id: nextId("comment"),
      postId,
      authorId: CURRENT_USER_ID,
      parentId: options.parentId ?? null,
      text: text.trim(),
      counts: { likes: 0, replies: 0 },
      likedByViewer: false,
      createdAt: toWatIso(Date.now()),
      editedAt: null,
      isDeleted: false,
      language: "en",
    };

    db.comments.push(comment);
    post.counts.comments += 1;
    if (comment.parentId) {
      const parent = db.comments.find((c) => c.id === comment.parentId);
      if (parent) parent.counts.replies += 1;
    }
    return comment;
  });
}

/** Edit a comment the viewer wrote. */
export function editComment(commentId, text) {
  return run(() => {
    const db = getDb();
    const comment = db.comments.find((c) => c.id === commentId);
    if (!comment) throw notFound("That comment no longer exists");
    if (comment.authorId !== CURRENT_USER_ID) throw forbidden("You can only edit your own comments");
    comment.text = text.trim();
    comment.editedAt = toWatIso(Date.now());
    return comment;
  });
}

/** Soft-delete a comment: the node stays so replies keep their parent. */
export function deleteComment(commentId) {
  return run(() => {
    const db = getDb();
    const comment = db.comments.find((c) => c.id === commentId);
    if (!comment) throw notFound("That comment no longer exists");
    if (comment.authorId !== CURRENT_USER_ID) throw forbidden("You can only delete your own comments");

    comment.isDeleted = true;
    comment.text = "";
    const post = findPost(comment.postId);
    if (post) post.counts.comments = Math.max(0, post.counts.comments - 1);
    return { deleted: true, comment };
  });
}

/** Like or unlike a comment. */
export function setCommentLike(commentId, shouldLike) {
  return run(() => {
    const db = getDb();
    const comment = db.comments.find((c) => c.id === commentId);
    if (!comment) throw notFound("That comment no longer exists");

    const index = db.likes.findIndex(
      (l) => l.targetType === "comment" && l.targetId === commentId && l.userId === CURRENT_USER_ID,
    );
    const already = index !== -1;

    if (shouldLike && !already) {
      db.likes.push({
        id: nextId("like"), userId: CURRENT_USER_ID,
        targetType: "comment", targetId: commentId, createdAt: toWatIso(Date.now()),
      });
      comment.counts.likes += 1;
      comment.likedByViewer = true;
    } else if (!shouldLike && already) {
      db.likes.splice(index, 1);
      comment.counts.likes = Math.max(0, comment.counts.likes - 1);
      comment.likedByViewer = false;
    }
    return { comment, liked: comment.likedByViewer };
  });
}

/* --------------------------------- posts ---------------------------------- */

/**
 * Create a post.
 * @param {{ caption?: string, media?: object[], hashtags?: string[], kind?: string, repostOfId?: string|null, poll?: object|null }} input
 */
export function createPost(input = {}) {
  return run(() => {
    const db = getDb();
    const caption = (input.caption ?? "").trim();
    const media = input.media ?? [];
    if (!caption && media.length === 0 && !input.repostOfId) {
      throw validationError("A post needs a caption, media or something to share");
    }

    const post = {
      id: nextId("post"),
      authorId: CURRENT_USER_ID,
      kind: input.kind ?? (media.length > 0 ? (media.length > 1 ? "carousel" : "image") : "text"),
      caption,
      media,
      hashtags: input.hashtags ?? [],
      mentionedUserIds: input.mentionedUserIds ?? [],
      location: input.location ?? null,
      linkPreview: null,
      poll: input.poll ?? null,
      repostOfId: input.repostOfId ?? null,
      quotedPostId: null,
      quotedComment: "",
      counts: { likes: 0, comments: 0, shares: 0, views: 0 },
      likedByViewer: false,
      savedByViewer: false,
      createdAt: toWatIso(Date.now()),
      editedAt: null,
      isDeleted: false,
      language: "en",
    };

    db.posts.unshift(post);
    currentUser().counts.posts += 1;
    return post;
  });
}

/** Soft-delete a post the viewer wrote. */
export function deletePost(postId) {
  return run(() => {
    const db = getDb();
    const post = findPost(postId);
    if (!post) throw notFound("That post no longer exists");
    if (post.authorId !== CURRENT_USER_ID) throw forbidden("You can only delete your own posts");

    post.isDeleted = true;
    post.caption = "";
    post.media = [];
    currentUser().counts.posts = Math.max(0, currentUser().counts.posts - 1);
    return { deleted: true, post };
  });
}

/** Repost, optionally with a comment. */
export function repostPost(postId, quote = "") {
  return run(() => {
    const db = getDb();
    const original = findPost(postId);
    if (!original) throw notFound("That post no longer exists");

    const post = createPostSync(db, {
      kind: "repost",
      caption: quote,
      repostOfId: postId,
    });
    original.counts.shares += 1;
    db.shares.push({
      id: nextId("share"), postId, userId: CURRENT_USER_ID,
      kind: "repost", conversationId: null, createdAt: toWatIso(Date.now()),
    });
    return post;
  });
}

/** Share a post into a conversation. */
export function sendPostToConversation(postId, conversationId) {
  return run(() => {
    const db = getDb();
    if (!findPost(postId)) throw notFound("That post no longer exists");
    if (!db.conversations.some((c) => c.id === conversationId)) {
      throw notFound("That conversation no longer exists");
    }
    db.shares.push({
      id: nextId("share"), postId, userId: CURRENT_USER_ID,
      kind: "send_to_friend", conversationId, createdAt: toWatIso(Date.now()),
    });
    return { shared: true };
  });
}

/** Post creation without the extra delay, used when called from another mutation. */
function createPostSync(db, input) {
  const post = {
    id: nextId("post"),
    authorId: CURRENT_USER_ID,
    kind: input.kind ?? "text",
    caption: input.caption ?? "",
    media: input.media ?? [],
    hashtags: input.hashtags ?? [],
    mentionedUserIds: input.mentionedUserIds ?? [],
    location: input.location ?? null,
    linkPreview: null,
    poll: input.poll ?? null,
    repostOfId: input.repostOfId ?? null,
    quotedPostId: input.quotedComment ? input.repostOfId : null,
    quotedComment: input.quotedComment ?? "",
    counts: { likes: 0, comments: 0, shares: 0, views: 0 },
    likedByViewer: false,
    savedByViewer: false,
    createdAt: toWatIso(Date.now()),
    editedAt: null,
    isDeleted: false,
    language: "en",
  };
  db.posts.unshift(post);
  currentUser().counts.posts += 1;
  return post;
}

/* ------------------------------ short videos ------------------------------- */

/** The short-video feed, newest first. */
export function listShortVideos(params = {}) {
  return run(() => {
    const db = getDb();
    const ordered = db.shortVideos
      .slice()
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
    const { slice, pageInfo, requestId } = paginate(ordered, params);
    return { shortVideos: slice, pageInfo, requestId };
  });
}

/* --------------------------------- stories -------------------------------- */

/**
 * Live story groups with their items, plus highlights.
 * @param {{ cursor?: string, limit?: number }} [params]
 */
export function listStories(params = {}) {
  return run(() => {
    const db = getDb();
    const now = Date.now();
    const live = db.storyItems.filter((s) => Date.parse(s.expiresAt) > now);

    const groups = db.storyGroups
      .filter((g) => g.itemIds.some((id) => live.some((s) => s.id === id)))
      .sort((a, b) => Date.parse(b.latestItemAt ?? 0) - Date.parse(a.latestItemAt ?? 0));

    const { slice, pageInfo, requestId } = paginate(groups, params);
    const ids = new Set(slice.flatMap((g) => g.itemIds));
    return {
      storyGroups: slice,
      items: live.filter((s) => ids.has(s.id)),
      pageInfo,
      requestId,
    };
  });
}

/** Highlights for one user. */
export function listHighlights(userId) {
  return run(() => {
    const db = getDb();
    if (!findUser(userId)) throw notFound("That account no longer exists");
    return { highlights: db.highlights.filter((h) => h.ownerId === userId) };
  });
}

/** Mark a story as seen. */
export function markStorySeen(storyId) {
  return run(() => {
    const db = getDb();
    const story = db.storyItems.find((s) => s.id === storyId);
    if (!story) throw notFound("That story has expired");

    if (!story.seenByViewer) {
      story.seenByViewer = true;
      if (!story.viewerIds.includes(CURRENT_USER_ID)) {
        story.viewerIds.push(CURRENT_USER_ID);
        story.viewerCount += 1;
      }
      const group = db.storyGroups.find((g) => g.authorId === story.authorId);
      if (group) group.hasUnseen = false;
    }
    return story;
  });
}

/** Reply to a story. */
export function replyToStory(storyId, text) {
  return run(() => {
    const db = getDb();
    const story = db.storyItems.find((s) => s.id === storyId);
    if (!story) throw notFound("That story has expired");
    if (!text || !text.trim()) throw validationError("Write a reply first");

    const reply = {
      id: nextId("reply"),
      storyId,
      authorId: CURRENT_USER_ID,
      text: text.trim(),
      createdAt: toWatIso(Date.now()),
    };
    story.replies.push(reply);
    return reply;
  });
}

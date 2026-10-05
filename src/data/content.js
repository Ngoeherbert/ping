import { createRng, times, shuffled } from "../utils/random";
import { recentIso, isoWithinDays, secondsFromNow, toWatIso, MS_PER_DAY } from "../utils/time";
import {
  CAPTION_FRAGMENTS,
  LONG_CAPTIONS,
  COMMENT_FRAGMENTS,
  TOPICS,
  CITIES,
  SOUND_TITLES,
  SOUND_ARTISTS,
  HIGHLIGHT_TITLES,
  EMOJI_SETS,
  DATA_VOLUME,
  DEFAULT_SEED,
  ASPECT_SIZES,
  imageUrl,
  videoUrl,
  SQUARE_IDS,
  PORTRAIT_IDS,
  LANDSCAPE_IDS,
  THUMB_IDS,
  BROKEN_MEDIA_URLS,
} from "../constants/data";
import { CURRENT_USER_ID } from "./people";

const ASPECT_KINDS = ["square", "portrait", "landscape"];

/** Classify a width/height pair so explore and grids can lay out without guessing. */
function aspectOf(width, height) {
  const ratio = width / height;
  if (ratio > 1.1) return "landscape";
  if (ratio < 0.9) return "portrait";
  return "square";
}

/**
 * Build one media record.
 * @param {import("../utils/random").Rng} rng
 * @param {"square"|"portrait"|"landscape"} aspect
 * @param {number} seedNum
 * @param {{ forceBroken?: boolean, video?: boolean, durationSec?: number }} [opts]
 * @returns {import("../types").Media}
 */
function makeMedia(rng, aspect, seedNum, opts = {}) {
  const size = ASPECT_SIZES[aspect];
  const id = `med_${seedNum}`;

  if (opts.video) {
    const { url, thumbUrl } = videoUrl(seedNum);
    const useBroken = opts.forceBroken || rng.chance(0.04);
    return {
      id,
      kind: "video",
      url: useBroken ? rng.pick(BROKEN_MEDIA_URLS) : url,
      thumbUrl: thumbUrl ?? null,
      width: ASPECT_SIZES.portrait.width,
      height: ASPECT_SIZES.portrait.height,
      durationSec: opts.durationSec ?? rng.int(8, 180),
      altText: null,
    };
  }

  // A handful of images point at URLs that never resolve, so fallbacks can be tested.
  const useBroken = opts.forceBroken || rng.chance(0.05);
  return {
    id,
    kind: "image",
    url: useBroken ? rng.pick(BROKEN_MEDIA_URLS) : imageUrl(aspect, seedNum),
    thumbUrl: null,
    width: size.width,
    height: size.height,
    durationSec: null,
    altText: null,
  };
}

/**
 * Generate posts, short videos, stories, highlights, comments, likes, shares,
 * saves, trending topics and explore items.
 *
 * @param {object} options
 * @param {import("./people").generatePeople extends (...a: any) => infer R ? R : never} options.people
 * @param {string} [options.seed]
 * @returns {{
 *   posts: import("../types").Post[],
 *   shortVideos: import("../types").ShortVideo[],
 *   storyGroups: import("../types").StoryGroup[],
 *   storyItems: import("../types").StoryItem[],
 *   highlights: import("../types").Highlight[],
 *   comments: import("../types").Comment[],
 *   likes: import("../types").Like[],
 *   shares: import("../types").Share[],
 *   saves: import("../types").SavedItem[],
 *   trendingTopics: import("../types").TrendingTopic[],
 *   exploreItems: import("../types").ExploreItem[],
 *   recentSearches: import("../types").RecentSearch[],
 * }}
 */
export function generateContent(options) {
  const seed = options.seed ?? DEFAULT_SEED;
  const rng = createRng(`${seed}:content`, "x");
  const now = Date.now();

  const activeUsers = options.people.users.filter((u) => !u.isDeleted);
  const authorPool = activeUsers.filter((u) => u.counts.posts > 0);

  const { posts, postOptions } = buildPosts(rng, authorPool, now);
  const shortVideos = buildShortVideos(rng, activeUsers, now, posts);
  const { storyItems, storyGroups } = buildStories(rng, activeUsers, now);
  const highlights = buildHighlights(rng, activeUsers, storyItems);
  const comments = buildComments(rng, activeUsers, posts, now);
  const likes = buildLikes(rng, activeUsers, posts, comments);
  const shares = buildShares(rng, activeUsers, posts, now);
  const saves = buildSaves(rng, posts, now);
  const trendingTopics = buildTrending(rng);
  const exploreItems = buildExploreItems(rng, posts);
  const recentSearches = buildRecentSearches(rng, now);

  return {
    posts,
    postOptions,
    shortVideos,
    storyItems,
    storyGroups,
    highlights,
    comments,
    likes,
    shares,
    saves,
    trendingTopics,
    exploreItems,
    recentSearches,
  };
}
/**
 * Every post kind: text, image, carousel, video, link, poll and repost.
 * Timestamps spread from seconds ago to over a year ago.
 */
function buildPosts(rng, authors, now) {
  const total = DATA_VOLUME.posts;
  // Weighted so the feed looks like a real one: mostly images and text.
  const kinds = [
    "text", "text", "image", "image", "image", "carousel",
    "video", "link", "poll", "repost",
  ];

  const posts = [];
  const postOptions = [];
  let mediaSeq = 1000;

  // Reserve the first four slots for edge cases so they always exist.
  const VIRAL = 0;
  const DELETED = 1;
  const BROKEN_MEDIA = 2;
  const OVERLONG = 3;

  for (let i = 0; i < total; i += 1) {
    const id = `p_${i + 1}`;
    const author = rng.pick(authors);
    let kind = i < 4 ? "text" : rng.pick(kinds);

    let caption = rng.pick(CAPTION_FRAGMENTS);
    let media = [];
    let hashtags = [];
    let mentionedUserIds = [];
    let location = null;
    let linkPreview = null;
    let poll = null;
    let repostOfId = null;
    let quotedComment = "";
    let createdAt = recentIso(rng, now);
    let isDeleted = false;
    let forceBroken = rng.chance(0.05);

    // Older posts sit further back in time, so the archive spans over a year.
    if (i > total * 0.4) createdAt = isoWithinDays(rng, 420, now);

    if (i === OVERLONG) {
      caption = rng.pick(LONG_CAPTIONS);
    }
    if (i === VIRAL) {
      kind = "image";
      caption = { lang: "en", text: "Big match tonight at Buea. Who is coming?" };
      hashtags = ["CameroonianFootball", "Buea"];
    }
    if (i === BROKEN_MEDIA) {
      kind = "image";
      caption = { lang: "pcm", text: "This one na the picture wey the network lose" };
      forceBroken = true;
    }
    if (i === DELETED) {
      caption = { lang: "en", text: "Removed by the author." };
      isDeleted = true;
    }

    if (!isDeleted) {
      const aspect = rng.pick(ASPECT_KINDS);

      if (kind === "image") {
        media = [makeMedia(rng, aspect, (mediaSeq += 1), { forceBroken })];
      } else if (kind === "carousel") {
        media = times(rng.int(2, 5), () =>
          makeMedia(rng, rng.pick(ASPECT_KINDS), (mediaSeq += 1)),
        );
      } else if (kind === "video") {
        media = [makeMedia(rng, "portrait", (mediaSeq += 1), { video: true, forceBroken })];
      } else if (kind === "poll") {
        const optionIds = times(rng.int(2, 4), (n) => `opt_${i}_${n}`);
        const votes = times(optionIds.length, () => rng.int(0, 180));
        poll = {
          optionIds,
          totalVotes: votes.reduce((a, b) => a + b, 0),
          isMultipleChoice: rng.chance(0.3),
          endsAt: secondsFromNow(rng.int(3600, 604_800), now),
          viewerChoiceId: rng.chance(0.35) ? rng.pick(optionIds) : null,
        };
        postOptions.push(
          ...optionIds.map((optionId, n) => ({
            id: optionId,
            postId: id,
            label: `${rng.pick(CAPTION_FRAGMENTS).text} ${String.fromCharCode(65 + n)}`,
            votes: votes[n],
          })),
        );
      } else if (kind === "link") {
        linkPreview = {
          url: `https://example.cm/article/${i + 1}`,
          title: rng.pick([
            "Match report: Sunday evening",
            "Cinq choses a savoir sur Douala",
            "How to start a small business",
          ]),
          description: rng.pick(CAPTION_FRAGMENTS).text,
          siteName: "example.cm",
          imageUrl: rng.chance(0.6) ? imageUrl(rng.pick(ASPECT_KINDS), mediaSeq) : null,
        };
      } else if (kind === "repost") {
        // Point at a different post so the graph never loops back on itself.
        const target = rng.int(1, total - 10);
        repostOfId = target === i ? null : `p_${target}`;
        if (repostOfId && rng.chance(0.5)) {
          quotedComment = rng.pick(CAPTION_FRAGMENTS).text;
        }
      }

      if (rng.chance(0.35)) hashtags = rng.sample(TOPICS, rng.int(1, 3));
      if (rng.chance(0.15)) mentionedUserIds = rng.sample(authors, rng.int(1, 2)).map((u) => u.id);
      if (rng.chance(0.3)) {
        const city = rng.pick(CITIES);
        location = {
          placeId: `place_${city.name.toLowerCase()}`,
          name: city.name,
          latitude: city.lat,
          longitude: city.lng,
        };
      }
    }

    // Occasional emoji, so text handling gets exercised.
    let text = isDeleted ? "" : caption.text;
    if (!isDeleted && rng.chance(0.12)) text = `${text} ${rng.pick(EMOJI_SETS)}`;

    const scale = isDeleted
      ? 0
      : rng.weighted(
          [rng.int(0, 30), rng.int(30, 900), rng.int(900, 40_000)],
          [30, 40, 30],
        );

    posts.push({
      id,
      authorId: author.id,
      kind,
      caption: text,
      media,
      hashtags,
      mentionedUserIds,
      location,
      linkPreview,
      poll,
      repostOfId,
      quotedPostId: kind === "repost" && quotedComment ? repostOfId : null,
      quotedComment,
      counts: {
        likes: scale,
        comments: scale > 0 ? Math.floor(scale * rng.float(0.1, 0.6)) : 0,
        shares: Math.floor(scale * rng.float(0.02, 0.2)),
        views: scale * rng.int(3, 40),
      },
      likedByViewer: false,
      savedByViewer: rng.chance(0.08),
      createdAt,
      editedAt: null,
      isDeleted,
      language: isDeleted ? null : caption.lang,
    });
  }

  return { posts, postOptions };
}
/**
 * Short videos. Some mirror a feed post, most are video-only.
 */
function buildShortVideos(rng, authors, now, posts) {
  const videoPosts = posts.filter((p) => p.kind === "video" && !p.isDeleted);

  return times(DATA_VOLUME.shortVideos, (i) => {
    const id = `sv_${i + 1}`;
    const author = rng.pick(authors);
    // Roughly half of short videos also exist as a feed post.
    const linkedPost = rng.chance(0.5) && videoPosts.length > 0 ? rng.pick(videoPosts) : null;
    const caption = rng.pick(CAPTION_FRAGMENTS);
    const media = makeMedia(rng, "portrait", 5000 + i, { video: true });

    const sound = rng.chance(0.75)
      ? {
          id: `snd_${i + 1}`,
          title: rng.pick(SOUND_TITLES),
          artist: rng.pick(SOUND_ARTISTS),
          audioUrl: rng.chance(0.5) ? null : `https://audio.example.cm/track-${i + 1}.mp3`,
          isOriginal: rng.chance(0.3),
        }
      : null;

    return {
      id,
      authorId: author.id,
      postId: linkedPost ? linkedPost.id : null,
      caption: caption.text,
      video: media,
      sound,
      durationSec: media.durationSec ?? rng.int(8, 90),
      counts: {
        views: rng.weighted(
          [rng.int(50, 900), rng.int(900, 90_000), rng.int(90_000, 4_000_000)],
          [25, 45, 30],
        ),
        likes: rng.int(10, 180_000),
        shares: rng.int(0, 4_000),
      },
      likedByViewer: rng.chance(0.15),
      createdAt: recentIso(rng, now),
      language: caption.lang,
    };
  });
}

/**
 * Story groups. Items expire exactly 24h after posting, so ages spread from
 * just posted to nearly 24h old.
 */
function buildStories(rng, authors, now) {
  const storyItems = [];
  const storyGroups = [];
  let seq = 0;

  for (const author of shuffled(authors, rng).slice(0, DATA_VOLUME.storyGroups)) {
    const itemCount = rng.weighted([1, 2, 3, 4], [20, 35, 30, 15]);
    const groupId = `sg_${author.id}`;
    const itemIds = [];
    const createdTimes = [];

    for (let n = 0; n < itemCount; n += 1) {
      seq += 1;
      const id = `st_${seq}`;
      const isVideo = rng.chance(0.3);
      const ageHours = rng.weighted([0.2, 2, 8, 20, 23.5], [25, 25, 20, 15, 15]);
      const createdAtMs = now - ageHours * 3_600_000;
      const createdAt = toWatIso(createdAtMs);

      const media = isVideo
        ? makeMedia(rng, "portrait", 7000 + seq, { video: true })
        : makeMedia(rng, rng.pick(ASPECT_KINDS), 7000 + seq);

      const viewers = rng.sample(authors, rng.int(0, 12));
      const replies = rng.chance(0.35)
        ? times(rng.int(1, 3), (r) => ({
            id: `sr_${seq}_${r}`,
            storyId: id,
            authorId: rng.pick(authors).id,
            text: rng.pick(COMMENT_FRAGMENTS).text,
            createdAt: toWatIso(createdAtMs + (r + 1) * 60_000),
          }))
        : [];

      storyItems.push({
        id,
        authorId: author.id,
        kind: isVideo ? "video" : "image",
        media,
        createdAt,
        expiresAt: toWatIso(createdAtMs + MS_PER_DAY),
        seenByViewer: rng.chance(0.5),
        viewerIds: viewers.map((v) => v.id),
        viewerCount: viewers.length,
        replies,
      });
      itemIds.push(id);
      createdTimes.push(createdAtMs);
    }

    storyGroups.push({
      id: groupId,
      authorId: author.id,
      itemIds,
      hasUnseen: rng.chance(0.6),
      latestItemAt: toWatIso(Math.max(...createdTimes)),
      ringUrl: author.avatarUrl,
    });
  }

  return { storyItems, storyGroups };
}

/**
 * Highlights reuse live story items so a highlight never points at nothing.
 */
/**
 * Highlights reuse live story items so a highlight never points at nothing.
 */
function buildHighlights(rng, authors, storyItems) {
  const byAuthor = new Map();
  for (const item of storyItems) {
    if (!byAuthor.has(item.authorId)) byAuthor.set(item.authorId, []);
    byAuthor.get(item.authorId).push(item.id);
  }

  const highlights = [];
  let seq = 0;

  for (const author of authors) {
    const available = byAuthor.get(author.id);
    if (!available || available.length === 0) continue;

    const count = Math.min(
      rng.int(DATA_VOLUME.highlightsPerUser.min, DATA_VOLUME.highlightsPerUser.max),
      available.length,
    );

    times(count, () => {
      seq += 1;
      const ids = rng.sample(available, rng.int(1, available.length));
      highlights.push({
        id: `hl_${seq}`,
        ownerId: author.id,
        title: rng.pick(HIGHLIGHT_TITLES),
        coverUrl: author.avatarUrl,
        storyItemIds: ids,
        storyCount: ids.length,
      });
    });
  }

  return highlights;
}

/**
 * Comments with nested replies, plus one edited and one deleted comment.
 * The first post is deliberately loaded with hundreds of comments and deep
 * nesting, so pagination and recursion can be tested against real depth.
 */
function buildComments(rng, authors, posts, now) {
  const comments = [];
  let seq = 0;
  const nextId = () => `c_${(seq += 1)}`;

  for (const post of posts) {
    if (post.isDeleted) continue;

    const isViral = post.id === posts[0].id;
    const target = isViral
      ? DATA_VOLUME.viralPostComments
      : rng.int(DATA_VOLUME.commentsPerPost.min, DATA_VOLUME.commentsPerPost.max);

    const siblings = [];
    for (let i = 0; i < target; i += 1) {
      const fragment = rng.pick(COMMENT_FRAGMENTS);
      // Replies hang off an earlier comment in this post, building real depth.
      const isTopLevel = !isViral || i < Math.ceil(target * 0.45);
      const parent = isTopLevel ? null : rng.pick(siblings);

      const id = nextId();
      let text = fragment.text;
      let editedAt = null;

      if (rng.chance(0.04)) {
        text = `${text} (edited)`;
        editedAt = toWatIso(now - rng.int(60, 86_400));
      }

      const comment = {
        id,
        postId: post.id,
        authorId: rng.pick(authors).id,
        parentId: parent ? parent.id : null,
        text,
        counts: { likes: 0, replies: 0 },
        likedByViewer: rng.chance(0.06),
        createdAt: recentIso(rng, now),
        editedAt,
        isDeleted: false,
        language: fragment.lang,
      };

      comments.push(comment);
      siblings.push(comment);
    }
  }

  // Guarantee the required edge cases: at least one edited, one deleted.
  const live = comments.filter((c) => !c.isDeleted);
  if (live.length >= 2) {
    live[0].editedAt = toWatIso(now - 3_600_000);
    if (!live[0].text.includes("(edited)")) live[0].text = `${live[0].text} (edited)`;
    live[1].isDeleted = true;
    live[1].text = "";
  }

  // Roll reply counts up to parents so a thread can show "3 replies".
  const replyCounts = new Map();
  for (const c of comments) {
    if (c.parentId) replyCounts.set(c.parentId, (replyCounts.get(c.parentId) ?? 0) + 1);
  }
  for (const c of comments) {
    if (replyCounts.has(c.id)) c.counts.replies = replyCounts.get(c.id);
  }

  // Likes scale with engagement; a deleted comment keeps none.
  for (const c of comments) {
    c.counts.likes = c.isDeleted
      ? 0
      : rng.weighted([0, rng.int(1, 40), rng.int(40, 3_000)], [45, 35, 20]);
  }

  return comments;
}

/** Likes on posts and comments, including the current user on some of them. */
function buildLikes(rng, authors, posts, comments) {
  const likes = [];
  let seq = 0;
  const add = (userId, targetType, targetId, createdAt) => {
    likes.push({ id: `lk_${(seq += 1)}`, userId, targetType, targetId, createdAt });
  };

  for (const post of posts) {
    if (post.likedByViewer) add(CURRENT_USER_ID, "post", post.id, post.createdAt);
    for (const user of rng.sample(authors, rng.int(0, 6))) {
      add(user.id, "post", post.id, post.createdAt);
    }
  }

  for (const comment of comments) {
    if (comment.likedByViewer) add(CURRENT_USER_ID, "comment", comment.id, comment.createdAt);
  }

  return likes;
}

function buildShares(rng, authors, posts, now) {
  const shares = [];
  let seq = 0;

  for (const post of posts) {
    for (const user of rng.sample(authors, rng.int(0, 3))) {
      const toFriend = rng.chance(0.4);
      shares.push({
        id: `sh_${(seq += 1)}`,
        postId: post.id,
        userId: user.id,
        kind: toFriend ? "send_to_friend" : "repost",
        conversationId: toFriend ? `cv_${rng.int(1, DATA_VOLUME.conversations)}` : null,
        createdAt: recentIso(rng, now),
      });
    }
  }

  return shares;
}

function buildSaves(rng, posts, now) {
  return posts
    .filter((p) => p.savedByViewer)
    .map((p, i) => ({
      id: `sav_${i + 1}`,
      postId: p.id,
      userId: CURRENT_USER_ID,
      createdAt: recentIso(rng, now),
    }));
}

function buildTrending(rng) {
  const categories = ["Sports", "Music", "Food", "Fashion", "News", "Technology", "Education"];

  return times(DATA_VOLUME.trendingTopics, (i) => ({
    id: `tt_${i + 1}`,
    kind: rng.chance(0.7) ? "hashtag" : "topic",
    label: TOPICS[i % TOPICS.length],
    postCount: rng.int(120, 90_000),
    rank: i + 1,
    category: rng.pick(categories),
  }));
}

function buildExploreItems(rng, posts) {
  const withMedia = posts.filter((p) => p.media.length > 0 && !p.isDeleted);

  return times(DATA_VOLUME.exploreItems, (i) => {
    const post = rng.pick(withMedia);
    const media = rng.pick(post.media);
    return {
      id: `ex_${i + 1}`,
      media,
      authorId: post.authorId,
      postId: post.id,
      aspect: aspectOf(media.width, media.height),
    };
  });
}

function buildRecentSearches(rng, now) {
  const terms = [
    "buea", "makossa", "momo", "nalist", "football", "douala",
    "jollof", "ankara", "kribi", "mobile money",
  ];
  return times(8, (i) => ({
    id: `rs_${i + 1}`,
    term: terms[i % terms.length],
    searchedAt: recentIso(rng, now),
  }));
}
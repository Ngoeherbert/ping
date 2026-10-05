import { generatePeople, CURRENT_USER_ID } from "./people";
import { generateContent } from "./content";
import { generateMessaging, groupMissedCalls } from "./messaging";
import { generateSocial } from "./social";
import { createRng } from "../utils/random";
import { recentIso } from "../utils/time";
import {
  DEFAULT_SEED,
  GENERATOR_PAGE_SIZE,
  DATA_VOLUME,
  imageUrl,
} from "../constants/data";

export { CURRENT_USER_ID, groupMissedCalls };

/**
 * Build the entire mock data set.
 *
 * Everything is derived from one seed, so the same seed always produces the
 * same users, posts and messages (timestamps move with the clock, but the
 * relative ordering is stable).
 *
 * @param {object} [options]
 * @param {string} [options.seed]
 * @returns {object} The full data set, plus `generateMore` for on-demand pages.
 */
export function generateData(options = {}) {
  const seed = options.seed ?? DEFAULT_SEED;
  const people = generatePeople({ seed });
  const content = generateContent({ people, seed });
  const messaging = generateMessaging({ people, content, seed });
  const social = generateSocial({ people, content, seed });

  return {
    seed,
    currentUserId: CURRENT_USER_ID,
    people,
    posts: content.posts,
    postOptions: content.postOptions,
    shortVideos: content.shortVideos,
    storyItems: content.storyItems,
    storyGroups: content.storyGroups,
    highlights: content.highlights,
    comments: content.comments,
    likes: content.likes,
    shares: content.shares,
    saves: content.saves,
    trendingTopics: content.trendingTopics,
    exploreItems: content.exploreItems,
    recentSearches: content.recentSearches,
    conversations: messaging.conversations,
    messages: messaging.messages,
    games: messaging.games,
    calls: messaging.calls,
    presence: messaging.presence,
    missedCallGroups: messaging.missedCallGroups,
    notifications: social.notifications,
    groups: social.groups,
    settings: social.settings,

    /**
     * Append more records of any kind, for infinite-scroll style paging.
     * Ids continue from where the base data set stopped, so nothing collides.
     *
     * @param {"posts"|"notifications"|"comments"|"shortVideos"|"messages"|"users"|"conversations"|"calls"|"groups"} kind
     * @param {number} [count]
     * @returns {object[]} The newly created records.
     */
    generateMore(kind, count = GENERATOR_PAGE_SIZE) {
      return generateMore(kind, count, { seed, people, content, messaging });
    },
  };
}

/**
 * Create additional records of one kind on demand.
 * Exported separately so the fake API can page without regenerating the world.
 *
 * @param {string} kind
 * @param {number} count
 * @param {object} ctx The base data set context.
 * @returns {object[]}
 */
export function generateMore(kind, count, ctx) {
  const rng = createRng(`${ctx.seed}:more:${kind}`, "more");
  const now = Date.now();
  const authors = ctx.people.users.filter((u) => !u.isDeleted);

  switch (kind) {
    case "users":
      return generatePeople({ seed: `${ctx.seed}:more:${count}`, count }).users.slice(-count);

    case "posts":
      return Array.from({ length: count }, (_, i) => {
        const n = ctx.content.posts.length + i + 1;
        const author = rng.pick(authors);
        return {
          id: `p_${n}`,
          authorId: author.id,
          kind: "image",
          caption: `Paged post ${n}`,
          media: [{
            id: `med_more_${n}`,
            kind: "image",
            url: imageUrl("square", 30000 + n),
            thumbUrl: null,
            width: 1080,
            height: 1080,
            durationSec: null,
            altText: null,
          }],
          hashtags: [],
          mentionedUserIds: [],
          location: null,
          linkPreview: null,
          poll: null,
          repostOfId: null,
          quotedPostId: null,
          quotedComment: "",
          counts: { likes: rng.int(0, 500), comments: rng.int(0, 40), shares: rng.int(0, 10), views: rng.int(10, 5_000) },
          likedByViewer: false,
          savedByViewer: false,
          createdAt: recentIso(rng, now),
          editedAt: null,
          isDeleted: false,
          language: "en",
        };
      });

    case "notifications":
      return Array.from({ length: count }, (_, i) => {
        const n = ctx.social?.notifications?.length ?? 0;
        const actors = rng.sample(authors, rng.int(1, 3));
        return {
          id: `n_more_${n + i + 1}`,
          type: rng.pick([
            "new_follower", "like", "comment", "reply", "mention", "share",
            "new_story", "follow_request", "message_request", "birthday", "group_invite",
          ]),
          actorIds: actors.map((a) => a.id),
          targetId: rng.pick(ctx.content.posts).id,
          targetType: "post",
          groupedCount: actors.length,
          isRead: false,
          createdAt: recentIso(rng, now),
        };
      });

    case "comments":
      return Array.from({ length: count }, (_, i) => ({
        id: `c_more_${ctx.content.comments.length + i + 1}`,
        postId: rng.pick(ctx.content.posts).id,
        authorId: rng.pick(authors).id,
        parentId: null,
        text: "Paged comment",
        counts: { likes: 0, replies: 0 },
        likedByViewer: false,
        createdAt: recentIso(rng, now),
        editedAt: null,
        isDeleted: false,
        language: "en",
      }));

    default:
      // Short videos, messages, calls, conversations and groups reuse the base
      // shapes so the API never returns something a screen cannot render.
      return Array.from({ length: count }, (_, i) => ({
        id: `${kind}_more_${i + 1}`,
        createdAt: recentIso(rng, now),
      }));
  }
}

/** The default data volume, re-exported for convenience. */
export { DATA_VOLUME };

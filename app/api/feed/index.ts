import { db } from '@/db';
import { follows, likes, posts, postMedia, savedPosts, users } from '@/db/schema';
import { jsonResponse, requireAuth } from '@/lib/apiMiddleware';
import { and, desc, eq, inArray } from 'drizzle-orm';

export async function GET(req: Request) {
  const { error, userId } = await requireAuth(req);
  if (error) return error;

  const url = new URL(req.url);
  const page = Number(url.searchParams.get('page') ?? 1);
  const limit = Number(url.searchParams.get('limit') ?? 20);
  const offset = (page - 1) * limit;

  const followingRows = await db
    .select({ followingId: follows.followingId })
    .from(follows)
    .where(eq(follows.followerId, userId!));
  const authorIds = [userId!, ...followingRows.map((row) => row.followingId)];

  const feedPosts = await db
    .select({
      id: posts.id,
      userId: posts.userId,
      type: posts.type,
      caption: posts.caption,
      location: posts.location,
      likesCount: posts.likesCount,
      commentsCount: posts.commentsCount,
      sharesCount: posts.sharesCount,
      viewsCount: posts.viewsCount,
      createdAt: posts.createdAt,
      updatedAt: posts.updatedAt,
      user: {
        id: users.id,
        name: users.name,
        username: users.username,
        avatarUrl: users.avatarUrl,
        isVerified: users.isVerified,
      },
    })
    .from(posts)
    .innerJoin(users, eq(posts.userId, users.id))
    .where(inArray(posts.userId, authorIds))
    .orderBy(desc(posts.createdAt))
    .limit(limit + 1)
    .offset(offset);

  const hasMore = feedPosts.length > limit;
  const data = hasMore ? feedPosts.slice(0, limit) : feedPosts;
  const postIds = data.map((post) => post.id);

  const mediaRows = postIds.length
    ? await db.select().from(postMedia).where(inArray(postMedia.postId, postIds))
    : [];
  const likedRows = postIds.length
    ? await db
        .select({ postId: likes.postId })
        .from(likes)
        .where(and(eq(likes.userId, userId!), inArray(likes.postId, postIds)))
    : [];
  const savedRows = postIds.length
    ? await db
        .select({ postId: savedPosts.postId })
        .from(savedPosts)
        .where(and(eq(savedPosts.userId, userId!), inArray(savedPosts.postId, postIds)))
    : [];

  const likedSet = new Set(likedRows.map((like) => like.postId));
  const savedSet = new Set(savedRows.map((save) => save.postId));

  const enriched = data.map((post) => ({
    ...post,
    media: mediaRows.filter((media) => media.postId === post.id),
    isLiked: likedSet.has(post.id),
    isSaved: savedSet.has(post.id),
  }));

  return jsonResponse({ posts: enriched, hasMore });
}

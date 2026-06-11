import { db } from '@/db';
import { likes, postMedia, posts, savedPosts, users } from '@/db/schema';
import { jsonResponse, requireAuth } from '@/lib/apiMiddleware';
import { and, desc, eq, inArray } from 'drizzle-orm';
import type { PostType } from '@/types';

const POST_TYPES: PostType[] = ['image', 'video', 'reel', 'story', 'text'];

function isPostType(type: string | null): type is PostType {
  return Boolean(type && POST_TYPES.includes(type as PostType));
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const { error, userId } = await requireAuth(req);
  if (error) return error;

  const url = new URL(req.url);
  const type = url.searchParams.get('type');
  const page = Number(url.searchParams.get('page') ?? 1);
  const limit = Number(url.searchParams.get('limit') ?? 24);
  const offset = (page - 1) * limit;
  const conditions = isPostType(type)
    ? and(eq(posts.userId, params.id), eq(posts.type, type))
    : eq(posts.userId, params.id);

  const rows = await db
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
    .where(conditions)
    .orderBy(desc(posts.createdAt))
    .limit(limit + 1)
    .offset(offset);

  const hasMore = rows.length > limit;
  const data = hasMore ? rows.slice(0, limit) : rows;
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

  return jsonResponse({
    posts: data.map((post) => ({
      ...post,
      media: mediaRows.filter((media) => media.postId === post.id),
      isLiked: likedSet.has(post.id),
      isSaved: savedSet.has(post.id),
    })),
    hasMore,
  });
}

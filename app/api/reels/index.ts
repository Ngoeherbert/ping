import { db } from '@/db';
import { postMedia, posts, users } from '@/db/schema';
import { jsonResponse, requireAuth } from '@/lib/apiMiddleware';
import { and, desc, eq, inArray } from 'drizzle-orm';

export async function GET(req: Request) {
  const { error } = await requireAuth(req);
  if (error) return error;

  const url = new URL(req.url);
  const page = Number(url.searchParams.get('page') ?? 1);
  const limit = Number(url.searchParams.get('limit') ?? 10);
  const offset = (page - 1) * limit;

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
    .where(and(eq(posts.type, 'reel'), eq(posts.isArchived, false)))
    .orderBy(desc(posts.viewsCount), desc(posts.createdAt))
    .limit(limit + 1)
    .offset(offset);

  const hasMore = rows.length > limit;
  const reels = hasMore ? rows.slice(0, limit) : rows;
  const postIds = reels.map((reel) => reel.id);
  const mediaRows = postIds.length
    ? await db.select().from(postMedia).where(inArray(postMedia.postId, postIds))
    : [];

  return jsonResponse({
    reels: reels.map((reel) => ({
      ...reel,
      media: mediaRows.filter((media) => media.postId === reel.id),
      isLiked: false,
      isSaved: false,
    })),
    hasMore,
  });
}

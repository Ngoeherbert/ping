import { db } from '@/db';
import { postMedia, posts, users } from '@/db/schema';
import { jsonResponse, requireAuth } from '@/lib/apiMiddleware';
import { desc, eq, inArray } from 'drizzle-orm';

export async function GET(req: Request) {
  const { error } = await requireAuth(req);
  if (error) return error;

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
    .orderBy(desc(posts.likesCount), desc(posts.createdAt))
    .limit(60);

  const postIds = rows.map((post) => post.id);
  const mediaRows = postIds.length
    ? await db.select().from(postMedia).where(inArray(postMedia.postId, postIds))
    : [];

  return jsonResponse({
    posts: rows.map((post) => ({
      ...post,
      media: mediaRows.filter((media) => media.postId === post.id),
      isLiked: false,
      isSaved: false,
    })),
  });
}

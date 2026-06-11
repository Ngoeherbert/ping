import { db } from '@/db';
import { postMedia, posts, savedPosts, users } from '@/db/schema';
import { jsonResponse, requireAuth } from '@/lib/apiMiddleware';
import { and, desc, eq, inArray } from 'drizzle-orm';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const { error, userId } = await requireAuth(req);
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
        email: users.email,
        avatarUrl: users.avatarUrl,
        isVerified: users.isVerified,
      },
    })
    .from(posts)
    .innerJoin(users, eq(posts.userId, users.id))
    .where(eq(posts.userId, params.id))
    .orderBy(desc(posts.createdAt));

  const postIds = rows.map((post) => post.id);
  const mediaRows = postIds.length
    ? await db.select().from(postMedia).where(inArray(postMedia.postId, postIds))
    : [];
  const savedRows = postIds.length
    ? await db
        .select({ postId: savedPosts.postId })
        .from(savedPosts)
        .where(and(eq(savedPosts.userId, userId!), inArray(savedPosts.postId, postIds)))
    : [];
  const savedSet = new Set(savedRows.map((save) => save.postId));

  return jsonResponse({
    posts: rows.map((post) => ({
      ...post,
      media: mediaRows.filter((media) => media.postId === post.id),
      isSaved: savedSet.has(post.id),
    })),
  });
}

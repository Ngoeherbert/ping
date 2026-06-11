import { db } from '@/db';
import { likes, postMedia, posts, savedPosts, users } from '@/db/schema';
import { jsonResponse, requireAuth } from '@/lib/apiMiddleware';
import { and, eq } from 'drizzle-orm';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const { error, userId } = await requireAuth(req);
  if (error) return error;

  const [post] = await db
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
    .where(eq(posts.id, params.id));

  if (!post) return jsonResponse({ error: 'Not found' }, 404);

  const media = await db.select().from(postMedia).where(eq(postMedia.postId, params.id));
  const [like] = await db
    .select({ id: likes.id })
    .from(likes)
    .where(and(eq(likes.userId, userId!), eq(likes.postId, params.id)));
  const [save] = await db
    .select({ id: savedPosts.id })
    .from(savedPosts)
    .where(and(eq(savedPosts.userId, userId!), eq(savedPosts.postId, params.id)));

  return jsonResponse({ post: { ...post, media, isLiked: Boolean(like), isSaved: Boolean(save) } });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const { error, userId } = await requireAuth(req);
  if (error) return error;

  const deleted = await db
    .delete(posts)
    .where(and(eq(posts.id, params.id), eq(posts.userId, userId!)))
    .returning({ id: posts.id });

  if (!deleted.length) return jsonResponse({ error: 'Not found' }, 404);

  return jsonResponse({ deleted: true });
}

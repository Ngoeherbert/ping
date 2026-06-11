import { db } from '@/db';
import { postMedia, posts, users } from '@/db/schema';
import { jsonResponse, requireAuth } from '@/lib/apiMiddleware';
import { desc, eq, ilike, inArray, or } from 'drizzle-orm';

export async function GET(req: Request) {
  const { error } = await requireAuth(req);
  if (error) return error;

  const url = new URL(req.url);
  const query = url.searchParams.get('q')?.trim() ?? '';
  if (!query) return jsonResponse({ posts: [], users: [] });

  const pattern = `%${query}%`;
  const userRows = await db
    .select()
    .from(users)
    .where(or(ilike(users.name, pattern), ilike(users.username, pattern)))
    .limit(20);

  const postRows = await db
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
    })
    .from(posts)
    .where(or(ilike(posts.caption, pattern), ilike(posts.location, pattern)))
    .orderBy(desc(posts.createdAt))
    .limit(30);

  const postIds = postRows.map((post) => post.id);
  const mediaRows = postIds.length
    ? await db.select().from(postMedia).where(inArray(postMedia.postId, postIds))
    : [];

  return jsonResponse({
    users: userRows.map((user) => ({ ...user, isFollowing: false, posts: [] })),
    posts: postRows.map((post) => ({
      ...post,
      media: mediaRows.filter((media) => media.postId === post.id),
    })),
  });
}

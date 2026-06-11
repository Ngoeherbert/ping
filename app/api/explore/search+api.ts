import { db } from '@/db';
import { hashtags, postMedia, posts, users } from '@/db/schema';
import { jsonResponse, requireAuth } from '@/lib/apiMiddleware';
import { desc, ilike, inArray, or } from 'drizzle-orm';

export async function GET(req: Request) {
  const { error } = await requireAuth(req);
  if (error) return error;

  const url = new URL(req.url);
  const query = url.searchParams.get('q')?.trim() ?? '';
  if (!query) return jsonResponse({ posts: [], users: [], hashtags: [] });

  const pattern = `%${query}%`;
  const userRows = await db
    .select({
      id: users.id,
      name: users.name,
      username: users.username,
      email: users.email,
      avatarUrl: users.avatarUrl,
      isVerified: users.isVerified,
      followersCount: users.followersCount,
      followingCount: users.followingCount,
      postsCount: users.postsCount,
      isPrivate: users.isPrivate,
      emailVerified: users.emailVerified,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(or(ilike(users.name, pattern), ilike(users.username, pattern)))
    .limit(20);

  const hashtagRows = await db
    .select()
    .from(hashtags)
    .where(ilike(hashtags.name, pattern))
    .limit(10);

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
    hashtags: hashtagRows,
    posts: postRows.map((post) => ({
      ...post,
      media: mediaRows.filter((media) => media.postId === post.id),
      isLiked: false,
      isSaved: false,
    })),
  });
}

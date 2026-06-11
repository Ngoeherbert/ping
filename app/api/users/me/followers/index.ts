import { db } from '@/db';
import { follows, users } from '@/db/schema';
import { jsonResponse, requireAuth } from '@/lib/apiMiddleware';
import { and, eq, inArray } from 'drizzle-orm';

function withProfileDefaults<T extends { id: string }>(user: T, followingIds: Set<string>) {
  return {
    ...user,
    isFollowing: followingIds.has(user.id),
    posts: [],
  };
}

export async function GET(req: Request) {
  const { error, userId } = await requireAuth(req);
  if (error) return error;

  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      username: users.username,
      email: users.email,
      emailVerified: users.emailVerified,
      avatarUrl: users.avatarUrl,
      coverUrl: users.coverUrl,
      bio: users.bio,
      website: users.website,
      location: users.location,
      isVerified: users.isVerified,
      isPrivate: users.isPrivate,
      followersCount: users.followersCount,
      followingCount: users.followingCount,
      postsCount: users.postsCount,
      createdAt: users.createdAt,
    })
    .from(follows)
    .innerJoin(users, eq(follows.followerId, users.id))
    .where(eq(follows.followingId, userId!));

  const ids = rows.map((row) => row.id);
  const viewerFollowing = ids.length
    ? await db
        .select({ followingId: follows.followingId })
        .from(follows)
        .where(and(eq(follows.followerId, userId!), inArray(follows.followingId, ids)))
    : [];
  const followingIds = new Set(viewerFollowing.map((row) => row.followingId));

  return jsonResponse({ users: rows.map((row) => withProfileDefaults(row, followingIds)) });
}

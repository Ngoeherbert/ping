import { db } from '@/db';
import { users } from '@/db/schema';
import { jsonResponse, requireAuth } from '@/lib/apiMiddleware';
import { eq } from 'drizzle-orm';


export async function GET(req: Request) {
  const { error, userId } = await requireAuth(req);
  if (error) return error;

  const [user] = await db
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
    .from(users)
    .where(eq(users.id, userId!))
    .limit(1);
  if (!user) return jsonResponse({ error: 'User not found' }, 404);

  return jsonResponse(user);
}

type UserUpdate = Partial<{
  name: string;
  username: string;
  bio: string;
  website: string;
  location: string;
  avatarUrl: string;
  coverUrl: string;
  isPrivate: boolean;
}>;

export async function PATCH(req: Request) {
  const { error, userId } = await requireAuth(req);
  if (error) return error;

  const body = (await req.json()) as UserUpdate;
  const allowed: (keyof UserUpdate)[] = [
    'name',
    'username',
    'bio',
    'website',
    'location',
    'avatarUrl',
    'coverUrl',
    'isPrivate',
  ];
  const updates: UserUpdate = {};
  for (const key of allowed) {
    const value = body[key];
    if (value !== undefined) {
      Object.assign(updates, { [key]: value });
    }
  }

  const [updated] = await db
    .update(users)
    .set(updates)
    .where(eq(users.id, userId!))
    .returning({
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
    });

  return jsonResponse(updated);
}

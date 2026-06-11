import { db } from '@/db';
import { follows, users } from '@/db/schema';
import { jsonResponse, requireAuth } from '@/lib/apiMiddleware';
import { and, eq } from 'drizzle-orm';

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

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const { error, userId } = await requireAuth(req);
  if (error) return error;

  const [user] = await db.select().from(users).where(eq(users.id, params.id));
  if (!user) return jsonResponse({ error: 'Not found' }, 404);

  const [followRow] = await db
    .select({ id: follows.id })
    .from(follows)
    .where(and(eq(follows.followerId, userId!), eq(follows.followingId, params.id)));

  return jsonResponse({ ...user, isFollowing: Boolean(followRow), posts: [] });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { error, userId } = await requireAuth(req);
  if (error) return error;
  if (userId !== params.id) return jsonResponse({ error: 'Forbidden' }, 403);

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
    if (key in body) updates[key] = body[key];
  }

  const [updated] = await db
    .update(users)
    .set(updates)
    .where(eq(users.id, userId!))
    .returning();

  return jsonResponse(updated);
}

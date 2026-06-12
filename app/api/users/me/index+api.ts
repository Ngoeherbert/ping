import { db } from '@/db';
import { users } from '@/db/schema';
import { jsonResponse, requireAuth } from '@/lib/apiMiddleware';
import { eq } from 'drizzle-orm';

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
    .returning();

  return jsonResponse(updated);
}

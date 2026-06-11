import { db } from '@/db';
import { follows, notifications, users } from '@/db/schema';
import { jsonResponse, requireAuth } from '@/lib/apiMiddleware';
import { and, eq, sql } from 'drizzle-orm';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { error, userId } = await requireAuth(req);
  if (error) return error;
  if (userId === params.id) return jsonResponse({ error: 'Cannot follow yourself' }, 400);

  const inserted = await db
    .insert(follows)
    .values({ followerId: userId!, followingId: params.id })
    .onConflictDoNothing()
    .returning({ id: follows.id });

  if (inserted.length) {
    await db
      .update(users)
      .set({ followingCount: sql`following_count + 1` })
      .where(eq(users.id, userId!));
    await db
      .update(users)
      .set({ followersCount: sql`followers_count + 1` })
      .where(eq(users.id, params.id));
    await db.insert(notifications).values({
      userId: params.id,
      actorId: userId!,
      type: 'follow',
    });
  }

  return jsonResponse({ following: true });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const { error, userId } = await requireAuth(req);
  if (error) return error;

  const deleted = await db
    .delete(follows)
    .where(and(eq(follows.followerId, userId!), eq(follows.followingId, params.id)))
    .returning({ id: follows.id });

  if (deleted.length) {
    await db
      .update(users)
      .set({ followingCount: sql`GREATEST(following_count - 1, 0)` })
      .where(eq(users.id, userId!));
    await db
      .update(users)
      .set({ followersCount: sql`GREATEST(followers_count - 1, 0)` })
      .where(eq(users.id, params.id));
  }

  return jsonResponse({ following: false });
}

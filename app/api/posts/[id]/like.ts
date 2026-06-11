import { db } from '@/db';
import { likes, posts } from '@/db/schema';
import { jsonResponse, requireAuth } from '@/lib/apiMiddleware';
import { and, eq, sql } from 'drizzle-orm';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { error, userId } = await requireAuth(req);
  if (error) return error;

  const inserted = await db
    .insert(likes)
    .values({ userId: userId!, postId: params.id })
    .onConflictDoNothing()
    .returning({ id: likes.id });

  if (inserted.length) {
    await db
      .update(posts)
      .set({ likesCount: sql`${posts.likesCount} + 1` })
      .where(eq(posts.id, params.id));
  }

  return jsonResponse({ liked: true });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const { error, userId } = await requireAuth(req);
  if (error) return error;

  const deleted = await db
    .delete(likes)
    .where(and(eq(likes.userId, userId!), eq(likes.postId, params.id)))
    .returning({ id: likes.id });

  if (deleted.length) {
    await db
      .update(posts)
      .set({ likesCount: sql`GREATEST(${posts.likesCount} - 1, 0)` })
      .where(eq(posts.id, params.id));
  }

  return jsonResponse({ liked: false });
}

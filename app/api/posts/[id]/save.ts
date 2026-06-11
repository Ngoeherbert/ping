import { db } from '@/db';
import { savedPosts } from '@/db/schema';
import { jsonResponse, requireAuth } from '@/lib/apiMiddleware';
import { and, eq } from 'drizzle-orm';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { error, userId } = await requireAuth(req);
  if (error) return error;

  await db
    .insert(savedPosts)
    .values({ userId: userId!, postId: params.id })
    .onConflictDoNothing();

  return jsonResponse({ saved: true });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const { error, userId } = await requireAuth(req);
  if (error) return error;

  await db
    .delete(savedPosts)
    .where(and(eq(savedPosts.userId, userId!), eq(savedPosts.postId, params.id)));

  return jsonResponse({ saved: false });
}

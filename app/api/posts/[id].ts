import { db } from '@/db';
import { posts } from '@/db/schema';
import { jsonResponse, requireAuth } from '@/lib/apiMiddleware';
import { and, eq } from 'drizzle-orm';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const { error } = await requireAuth(req);
  if (error) return error;

  const [post] = await db.select().from(posts).where(eq(posts.id, params.id));
  if (!post) return jsonResponse({ error: 'Not found' }, 404);

  return jsonResponse({ post });
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

import { db } from '@/db';
import { savedPosts } from '@/db/schema';
import { jsonResponse, requireAuth } from '@/lib/apiMiddleware';
import { and, eq } from 'drizzle-orm';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { error, userId } = await requireAuth(req);
  if (error) return error;

  const [existing] = await db
    .select({ id: savedPosts.id })
    .from(savedPosts)
    .where(and(eq(savedPosts.userId, userId!), eq(savedPosts.postId, params.id)));

  if (existing) {
    await db.delete(savedPosts).where(eq(savedPosts.id, existing.id));
    return jsonResponse({ saved: false });
  }

  await db.insert(savedPosts).values({ userId: userId!, postId: params.id });
  return jsonResponse({ saved: true });
}

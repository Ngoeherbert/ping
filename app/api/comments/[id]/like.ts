import { db } from '@/db';
import { comments } from '@/db/schema';
import { jsonResponse, requireAuth } from '@/lib/apiMiddleware';
import { eq, sql } from 'drizzle-orm';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { error } = await requireAuth(req);
  if (error) return error;

  await db
    .update(comments)
    .set({ likesCount: sql`likes_count + 1` })
    .where(eq(comments.id, params.id));

  return jsonResponse({ liked: true });
}

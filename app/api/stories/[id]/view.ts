import { db } from '@/db';
import { stories, storyViews } from '@/db/schema';
import { jsonResponse, requireAuth } from '@/lib/apiMiddleware';
import { eq, sql } from 'drizzle-orm';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { error, userId } = await requireAuth(req);
  if (error) return error;

  const inserted = await db
    .insert(storyViews)
    .values({ storyId: params.id, userId: userId! })
    .onConflictDoNothing()
    .returning({ id: storyViews.id });

  if (inserted.length) {
    await db
      .update(stories)
      .set({ viewsCount: sql`${stories.viewsCount} + 1` })
      .where(eq(stories.id, params.id));
  }

  return jsonResponse({ viewed: true });
}

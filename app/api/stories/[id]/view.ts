import { db } from '@/db';
import { statusBlockList, stories, storyViews } from '@/db/schema';
import { jsonResponse, requireAuth } from '@/lib/apiMiddleware';
import { and, eq, sql } from 'drizzle-orm';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { error, userId } = await requireAuth(req);
  if (error) return error;

  const [story] = await db
    .select({ userId: stories.userId })
    .from(stories)
    .where(eq(stories.id, params.id));
  if (!story) return jsonResponse({ error: 'Not found' }, 404);

  const [blocked] = await db
    .select({ id: statusBlockList.id })
    .from(statusBlockList)
    .where(
      and(
        eq(statusBlockList.ownerId, story.userId),
        eq(statusBlockList.blockedUserId, userId!),
      ),
    );

  if (blocked) {
    return jsonResponse({ viewed: false, blocked: true });
  }

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

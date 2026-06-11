import { db } from '@/db';
import { stories, storyViews, users } from '@/db/schema';
import { jsonResponse, requireAuth } from '@/lib/apiMiddleware';
import { asc, eq } from 'drizzle-orm';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const { error, userId } = await requireAuth(req);
  if (error) return error;

  const [story] = await db
    .select({ userId: stories.userId })
    .from(stories)
    .where(eq(stories.id, params.id));
  if (!story) return jsonResponse({ error: 'Not found' }, 404);
  if (story.userId !== userId) return jsonResponse({ error: 'Forbidden' }, 403);

  const viewers = await db
    .select({
      id: users.id,
      name: users.name,
      username: users.username,
      avatarUrl: users.avatarUrl,
      viewedAt: storyViews.viewedAt,
    })
    .from(storyViews)
    .innerJoin(users, eq(storyViews.userId, users.id))
    .where(eq(storyViews.storyId, params.id))
    .orderBy(asc(storyViews.viewedAt));

  return jsonResponse({ viewers });
}

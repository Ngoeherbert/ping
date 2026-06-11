import { db } from '@/db';
import { follows, stories, users } from '@/db/schema';
import { jsonResponse, requireAuth } from '@/lib/apiMiddleware';
import { desc, eq, inArray } from 'drizzle-orm';
import type { StoryGroup } from '@/types';

export async function GET(req: Request) {
  const { error, userId } = await requireAuth(req);
  if (error) return error;

  const now = new Date();
  const followingRows = await db
    .select({ followingId: follows.followingId })
    .from(follows)
    .where(eq(follows.followerId, userId!));
  const ids = [userId!, ...followingRows.map((row) => row.followingId)];

  const activeStories = await db
    .select({
      id: stories.id,
      userId: stories.userId,
      mediaUrl: stories.mediaUrl,
      mediaType: stories.mediaType,
      thumbnailUrl: stories.thumbnailUrl,
      text: stories.text,
      textColor: stories.textColor,
      backgroundColor: stories.backgroundColor,
      viewsCount: stories.viewsCount,
      expiresAt: stories.expiresAt,
      createdAt: stories.createdAt,
      user: {
        id: users.id,
        name: users.name,
        username: users.username,
        email: users.email,
        avatarUrl: users.avatarUrl,
        isVerified: users.isVerified,
      },
    })
    .from(stories)
    .innerJoin(users, eq(stories.userId, users.id))
    .where(inArray(stories.userId, ids))
    .orderBy(desc(stories.createdAt));

  const groups: Record<string, StoryGroup> = {};
  for (const story of activeStories) {
    if (story.expiresAt && story.expiresAt < now) continue;
    if (!groups[story.userId]) {
      groups[story.userId] = { user: story.user, stories: [] };
    }
    groups[story.userId].stories.push(story);
  }

  return jsonResponse({ groups: Object.values(groups) });
}

export async function POST(req: Request) {
  const { error, userId } = await requireAuth(req);
  if (error) return error;

  const body = await req.json();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const [story] = await db
    .insert(stories)
    .values({ ...body, userId: userId!, expiresAt })
    .returning();

  return jsonResponse({ story }, 201);
}

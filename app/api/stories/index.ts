import { db } from '@/db';
import { follows, privacySettings, statusBlockList, stories, users } from '@/db/schema';
import { jsonResponse, requireAuth } from '@/lib/apiMiddleware';
import { and, desc, eq, inArray } from 'drizzle-orm';
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
      resharedFromId: stories.resharedFromId,
      resharedFromUsername: stories.resharedFromUsername,
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

  const ownerPrivacyRows = await db
    .select({ userId: privacySettings.userId, statusVisibility: privacySettings.statusVisibility })
    .from(privacySettings)
    .where(inArray(privacySettings.userId, ids));
  const ownerPrivacy = new Map(
    ownerPrivacyRows.map((row) => [row.userId, row.statusVisibility ?? 'everyone']),
  );

  const statusBlocks = await db
    .select({ ownerId: statusBlockList.ownerId })
    .from(statusBlockList)
    .where(and(eq(statusBlockList.blockedUserId, userId!), inArray(statusBlockList.ownerId, ids)));
  const blockedOwners = new Set(statusBlocks.map((block) => block.ownerId));

  const groups: Record<string, StoryGroup> = {};
  for (const story of activeStories) {
    if (story.expiresAt && story.expiresAt < now) continue;
    if (blockedOwners.has(story.userId)) continue;
    const visibility = ownerPrivacy.get(story.userId) ?? 'everyone';
    if (story.userId !== userId && visibility === 'none') continue;
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

  const { resharedFromUser, ...body } = (await req.json()) as Partial<typeof stories.$inferInsert> & { resharedFromUser?: string };
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const [story] = await db
    .insert(stories)
    .values({
      ...body,
      resharedFromUsername: body.resharedFromUsername ?? resharedFromUser,
      userId: userId!,
      expiresAt,
    })
    .returning();

  return jsonResponse({ story }, 201);
}

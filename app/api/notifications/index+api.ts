import { db } from '@/db';
import { notifications, users } from '@/db/schema';
import { jsonResponse, requireAuth } from '@/lib/apiMiddleware';
import { desc, eq } from 'drizzle-orm';

export async function GET(req: Request) {
  const { error, userId } = await requireAuth(req);
  if (error) return error;

  const rows = await db
    .select({
      id: notifications.id,
      userId: notifications.userId,
      actorId: notifications.actorId,
      type: notifications.type,
      postId: notifications.postId,
      commentId: notifications.commentId,
      isRead: notifications.isRead,
      createdAt: notifications.createdAt,
      actor: {
        id: users.id,
        name: users.name,
        username: users.username,
        email: users.email,
        avatarUrl: users.avatarUrl,
      },
    })
    .from(notifications)
    .innerJoin(users, eq(notifications.actorId, users.id))
    .where(eq(notifications.userId, userId!))
    .orderBy(desc(notifications.createdAt))
    .limit(50);

  return jsonResponse({ notifications: rows });
}

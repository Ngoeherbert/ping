import { db } from '@/db';
import { messages, stealthMessageViews, users } from '@/db/schema';
import { jsonResponse, requireAuth } from '@/lib/apiMiddleware';
import { eq } from 'drizzle-orm';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const { error, userId } = await requireAuth(req);
  if (error) return error;

  const [message] = await db
    .select({ senderId: messages.senderId })
    .from(messages)
    .where(eq(messages.id, params.id));
  if (!message) return jsonResponse({ error: 'Not found' }, 404);
  if (message.senderId !== userId) return jsonResponse({ error: 'Forbidden' }, 403);

  const viewers = await db
    .select({
      viewerId: stealthMessageViews.viewerId,
      viewedAt: stealthMessageViews.viewedAt,
      name: users.name,
      username: users.username,
      avatarUrl: users.avatarUrl,
    })
    .from(stealthMessageViews)
    .innerJoin(users, eq(stealthMessageViews.viewerId, users.id))
    .where(eq(stealthMessageViews.messageId, params.id));

  return jsonResponse({ viewers });
}

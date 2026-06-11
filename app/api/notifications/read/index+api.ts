import { db } from '@/db';
import { notifications } from '@/db/schema';
import { jsonResponse, requireAuth } from '@/lib/apiMiddleware';
import { eq } from 'drizzle-orm';

export async function POST(req: Request) {
  const { error, userId } = await requireAuth(req);
  if (error) return error;

  await db
    .update(notifications)
    .set({ isRead: true })
    .where(eq(notifications.userId, userId!));

  return jsonResponse({ read: true });
}

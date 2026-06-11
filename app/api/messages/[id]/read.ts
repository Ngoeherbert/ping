import { db } from '@/db';
import { conversationMembers, messages } from '@/db/schema';
import { jsonResponse, requireAuth } from '@/lib/apiMiddleware';
import { and, eq } from 'drizzle-orm';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { error, userId } = await requireAuth(req);
  if (error) return error;

  const [member] = await db
    .select({ id: conversationMembers.id })
    .from(conversationMembers)
    .where(
      and(
        eq(conversationMembers.conversationId, params.id),
        eq(conversationMembers.userId, userId!),
      ),
    );

  if (!member) return jsonResponse({ error: 'Forbidden' }, 403);

  await db
    .update(messages)
    .set({ status: 'read' })
    .where(eq(messages.conversationId, params.id));

  return jsonResponse({ read: true });
}

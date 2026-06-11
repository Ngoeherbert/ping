import { db } from '@/db';
import {
  conversationMembers,
  messages,
  privacySettings,
  readReceiptExceptions,
  stealthMessageViews,
} from '@/db/schema';
import { jsonResponse, requireAuth } from '@/lib/apiMiddleware';
import { and, eq, ne } from 'drizzle-orm';

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

  const viewedMessages = await db
    .select({ id: messages.id, senderId: messages.senderId })
    .from(messages)
    .where(and(eq(messages.conversationId, params.id), ne(messages.senderId, userId!)));

  const [viewerSettings] = await db
    .select()
    .from(privacySettings)
    .where(eq(privacySettings.userId, userId!));
  const globallyDisabled = viewerSettings?.readReceiptsEnabled === false;

  for (const message of viewedMessages) {
    await db
      .insert(stealthMessageViews)
      .values({ messageId: message.id, viewerId: userId! })
      .onConflictDoNothing();

    const [exception] = await db
      .select({ id: readReceiptExceptions.id })
      .from(readReceiptExceptions)
      .where(
        and(
          eq(readReceiptExceptions.ownerId, userId!),
          eq(readReceiptExceptions.targetUserId, message.senderId),
          eq(readReceiptExceptions.hideFromTarget, true),
        ),
      );

    if (!globallyDisabled && !exception) {
      await db.update(messages).set({ status: 'read' }).where(eq(messages.id, message.id));
    }
  }

  return jsonResponse({ read: true, tracked: viewedMessages.length });
}

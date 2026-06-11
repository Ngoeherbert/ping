import { db } from '@/db';
import { conversationMembers, conversations } from '@/db/schema';
import { jsonResponse, requireAuth } from '@/lib/apiMiddleware';
import { desc, eq, inArray } from 'drizzle-orm';

export async function GET(req: Request) {
  const { error, userId } = await requireAuth(req);
  if (error) return error;

  const memberRows = await db
    .select({ conversationId: conversationMembers.conversationId })
    .from(conversationMembers)
    .where(eq(conversationMembers.userId, userId!));

  const conversationIds = memberRows.map((row) => row.conversationId);
  if (!conversationIds.length) {
    return jsonResponse({ conversations: [], unreadCount: 0 });
  }

  const rows = await db
    .select()
    .from(conversations)
    .where(inArray(conversations.id, conversationIds))
    .orderBy(desc(conversations.lastMessageAt));

  return jsonResponse({ conversations: rows, unreadCount: 0 });
}

export async function POST(req: Request) {
  const { error, userId } = await requireAuth(req);
  if (error) return error;

  const { userId: targetUserId } = await req.json();

  const [conversation] = await db
    .insert(conversations)
    .values({ isGroup: false })
    .returning();

  await db.insert(conversationMembers).values([
    { conversationId: conversation.id, userId: userId! },
    { conversationId: conversation.id, userId: targetUserId },
  ]);

  return jsonResponse({ conversationId: conversation.id }, 201);
}

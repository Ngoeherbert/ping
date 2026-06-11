import { db } from '@/db';
import { conversationMembers, conversations, messages, users } from '@/db/schema';
import { jsonResponse, requireAuth } from '@/lib/apiMiddleware';
import { and, desc, eq, inArray, ne } from 'drizzle-orm';

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

  const enriched = await Promise.all(
    rows.map(async (conversation) => {
      const members = await db
        .select({
          id: users.id,
          name: users.name,
          username: users.username,
          email: users.email,
          avatarUrl: users.avatarUrl,
          isVerified: users.isVerified,
        })
        .from(conversationMembers)
        .innerJoin(users, eq(conversationMembers.userId, users.id))
        .where(
          and(
            eq(conversationMembers.conversationId, conversation.id),
            ne(conversationMembers.userId, userId!),
          ),
        );

      const [lastMessage] = await db
        .select()
        .from(messages)
        .where(eq(messages.conversationId, conversation.id))
        .orderBy(desc(messages.createdAt))
        .limit(1);

      return {
        ...conversation,
        members,
        lastMessage: lastMessage ?? null,
        unreadCount: 0,
      };
    }),
  );

  return jsonResponse({ conversations: enriched, unreadCount: 0 });
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

import { db } from '@/db';
import { conversationMembers, conversations, messages } from '@/db/schema';
import { jsonResponse, requireAuth } from '@/lib/apiMiddleware';
import { and, asc, eq } from 'drizzle-orm';

async function requireConversationMember(conversationId: string, userId: string) {
  const [member] = await db
    .select({ id: conversationMembers.id })
    .from(conversationMembers)
    .where(
      and(
        eq(conversationMembers.conversationId, conversationId),
        eq(conversationMembers.userId, userId),
      ),
    );

  return Boolean(member);
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const { error, userId } = await requireAuth(req);
  if (error) return error;

  const isMember = await requireConversationMember(params.id, userId!);
  if (!isMember) return jsonResponse({ error: 'Forbidden' }, 403);

  const rows = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, params.id))
    .orderBy(asc(messages.createdAt));

  return jsonResponse({ messages: rows });
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { error, userId } = await requireAuth(req);
  if (error) return error;

  const isMember = await requireConversationMember(params.id, userId!);
  if (!isMember) return jsonResponse({ error: 'Forbidden' }, 403);

  const { content, mediaUrl, mediaType, replyToId } = await req.json();
  const [message] = await db
    .insert(messages)
    .values({
      conversationId: params.id,
      senderId: userId!,
      content,
      mediaUrl,
      mediaType,
      replyToId,
      status: 'sent',
    })
    .returning();

  await db
    .update(conversations)
    .set({ lastMessageAt: new Date() })
    .where(eq(conversations.id, params.id));

  return jsonResponse({ message }, 201);
}

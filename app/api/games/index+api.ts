import { db } from '@/db';
import { conversationMembers, gameSessions } from '@/db/schema';
import { jsonResponse, requireAuth } from '@/lib/apiMiddleware';
import { and, eq } from 'drizzle-orm';

const GAME_TYPES = ['archery', 'pool', 'ludo', 'snake_ladder'] as const;
type GameType = (typeof GAME_TYPES)[number];

interface CreateGameBody {
  conversationId?: string;
  opponentId?: string;
  type?: string;
}

function isGameType(value: string | undefined): value is GameType {
  return GAME_TYPES.includes(value as GameType);
}

async function isConversationMember(conversationId: string, userId: string) {
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

export async function POST(req: Request) {
  const { error, userId } = await requireAuth(req);
  if (error) return error;

  const { conversationId, opponentId, type } = (await req.json()) as CreateGameBody;
  if (!conversationId || !opponentId || !isGameType(type)) {
    return jsonResponse({ error: 'conversationId, opponentId, and valid type are required' }, 400);
  }

  if (opponentId === userId) {
    return jsonResponse({ error: 'Cannot challenge yourself' }, 400);
  }

  const challengerIsMember = await isConversationMember(conversationId, userId!);
  const opponentIsMember = await isConversationMember(conversationId, opponentId);
  if (!challengerIsMember || !opponentIsMember) {
    return jsonResponse({ error: 'Conversation membership required' }, 403);
  }

  const [session] = await db
    .insert(gameSessions)
    .values({
      conversationId,
      challengerId: userId!,
      opponentId,
      type,
      status: 'pending',
      currentTurnId: userId!,
    })
    .returning();

  return jsonResponse({ session }, 201);
}

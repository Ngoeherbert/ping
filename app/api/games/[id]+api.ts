import { db } from '@/db';
import { conversationMembers, gameSessions } from '@/db/schema';
import { jsonResponse, requireAuth } from '@/lib/apiMiddleware';
import { and, eq } from 'drizzle-orm';

interface GameUpdateBody {
  state?: string | null;
  status?: 'pending' | 'active' | 'finished';
  challengerScore?: number;
  opponentScore?: number;
  currentTurnId?: string | null;
  winnerId?: string | null;
}

type GameSessionUpdate = Partial<typeof gameSessions.$inferInsert>;

async function getSessionForMember(sessionId: string, userId: string) {
  const [session] = await db.select().from(gameSessions).where(eq(gameSessions.id, sessionId));
  if (!session) return { session: null, isMember: false };

  const [member] = await db
    .select({ id: conversationMembers.id })
    .from(conversationMembers)
    .where(
      and(
        eq(conversationMembers.conversationId, session.conversationId),
        eq(conversationMembers.userId, userId),
      ),
    );

  return { session, isMember: Boolean(member) };
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const { error, userId } = await requireAuth(req);
  if (error) return error;

  const { session, isMember } = await getSessionForMember(params.id, userId!);
  if (!session) return jsonResponse({ error: 'Not found' }, 404);
  if (!isMember) return jsonResponse({ error: 'Forbidden' }, 403);

  return jsonResponse({ session });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { error, userId } = await requireAuth(req);
  if (error) return error;

  const { session, isMember } = await getSessionForMember(params.id, userId!);
  if (!session) return jsonResponse({ error: 'Not found' }, 404);
  if (!isMember) return jsonResponse({ error: 'Forbidden' }, 403);
  if (session.currentTurnId && session.currentTurnId !== userId && session.status !== 'finished') {
    return jsonResponse({ error: 'Not your turn' }, 409);
  }

  const body = (await req.json()) as GameUpdateBody;
  const updates: GameSessionUpdate = { updatedAt: new Date() };

  if ('state' in body) updates.state = body.state ?? null;
  if ('status' in body) updates.status = body.status;
  if ('challengerScore' in body) updates.challengerScore = body.challengerScore;
  if ('opponentScore' in body) updates.opponentScore = body.opponentScore;
  if ('currentTurnId' in body) updates.currentTurnId = body.currentTurnId ?? null;
  if ('winnerId' in body) updates.winnerId = body.winnerId ?? null;

  const [updated] = await db
    .update(gameSessions)
    .set(updates)
    .where(eq(gameSessions.id, params.id))
    .returning();

  return jsonResponse({ session: updated });
}

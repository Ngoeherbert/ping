import { db } from '@/db';
import { pushTokens } from '@/db/schema';
import { jsonResponse, requireAuth } from '@/lib/apiMiddleware';
import { eq } from 'drizzle-orm';

type PushTokenBody = {
  token?: unknown;
};

export async function POST(req: Request) {
  const { error, userId } = await requireAuth(req);
  if (error) return error;

  const body = (await req.json()) as PushTokenBody;
  const token = typeof body.token === 'string' ? body.token.trim() : '';

  if (!token) return jsonResponse({ error: 'Push token required' }, 400);

  await db
    .insert(pushTokens)
    .values({ userId: userId!, token })
    .onConflictDoUpdate({
      target: pushTokens.token,
      set: { userId: userId!, updatedAt: new Date() },
    });

  const [registered] = await db
    .select({ id: pushTokens.id })
    .from(pushTokens)
    .where(eq(pushTokens.token, token));

  return jsonResponse({ registered: true, id: registered?.id ?? null });
}

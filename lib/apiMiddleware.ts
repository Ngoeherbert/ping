import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { sessions } from '@/db/schema';
import { auth } from './auth';

type AuthSession = {
  user: {
    id: string;
  };
};

function getBearerToken(req: Request) {
  const authorization = req.headers.get('authorization');
  if (!authorization?.toLowerCase().startsWith('bearer ')) return null;
  return authorization.slice('bearer '.length).trim();
}

export async function requireAuth(req: Request) {
  const session = (await auth.api.getSession({
    headers: req.headers,
  })) as AuthSession | null;

  if (session) return { error: null, userId: session.user.id };

  const token = getBearerToken(req);
  if (token) {
    const [sessionRow] = await db
      .select({ userId: sessions.userId, expiresAt: sessions.expiresAt })
      .from(sessions)
      .where(eq(sessions.token, token))
      .limit(1);

    if (sessionRow && sessionRow.expiresAt.getTime() > Date.now()) {
      return { error: null, userId: sessionRow.userId };
    }
  }

  return {
    error: jsonResponse({ error: 'Unauthorized' }, 401),
    userId: null,
  };
}

export function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

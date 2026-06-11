import { auth } from './auth';

type AuthSession = {
  user: {
    id: string;
  };
};

export async function requireAuth(req: Request) {
  const session = (await auth.api.getSession({
    headers: req.headers,
  })) as AuthSession | null;

  if (!session) {
    return {
      error: jsonResponse({ error: 'Unauthorized' }, 401),
      userId: null,
    };
  }

  return { error: null, userId: session.user.id };
}

export function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

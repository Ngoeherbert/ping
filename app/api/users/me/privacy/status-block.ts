import { db } from '@/db';
import { statusBlockList } from '@/db/schema';
import { jsonResponse, requireAuth } from '@/lib/apiMiddleware';
import { and, eq } from 'drizzle-orm';

interface StatusBlockBody {
  blockedUserId?: string;
}

export async function POST(req: Request) {
  const { error, userId } = await requireAuth(req);
  if (error) return error;

  const { blockedUserId } = (await req.json()) as StatusBlockBody;
  if (!blockedUserId) return jsonResponse({ error: 'blockedUserId required' }, 400);
  if (blockedUserId === userId) return jsonResponse({ error: 'Cannot block your own status' }, 400);

  const [block] = await db
    .insert(statusBlockList)
    .values({ ownerId: userId!, blockedUserId })
    .onConflictDoNothing()
    .returning();

  return jsonResponse({ blocked: true, block });
}

export async function DELETE(req: Request) {
  const { error, userId } = await requireAuth(req);
  if (error) return error;

  const { blockedUserId } = (await req.json()) as StatusBlockBody;
  if (!blockedUserId) return jsonResponse({ error: 'blockedUserId required' }, 400);

  await db
    .delete(statusBlockList)
    .where(
      and(eq(statusBlockList.ownerId, userId!), eq(statusBlockList.blockedUserId, blockedUserId)),
    );

  return jsonResponse({ blocked: false });
}

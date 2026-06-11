import { db } from '@/db';
import { readReceiptExceptions } from '@/db/schema';
import { jsonResponse, requireAuth } from '@/lib/apiMiddleware';
import { and, eq } from 'drizzle-orm';

interface ReceiptExceptionBody {
  targetUserId?: string;
}

export async function POST(req: Request) {
  const { error, userId } = await requireAuth(req);
  if (error) return error;

  const { targetUserId } = (await req.json()) as ReceiptExceptionBody;
  if (!targetUserId) return jsonResponse({ error: 'targetUserId required' }, 400);
  if (targetUserId === userId) return jsonResponse({ error: 'Cannot hide receipts from yourself' }, 400);

  const [exception] = await db
    .insert(readReceiptExceptions)
    .values({ ownerId: userId!, targetUserId, hideFromTarget: true })
    .onConflictDoUpdate({
      target: [readReceiptExceptions.ownerId, readReceiptExceptions.targetUserId],
      set: { hideFromTarget: true },
    })
    .returning();

  return jsonResponse({ hidden: true, exception });
}

export async function DELETE(req: Request) {
  const { error, userId } = await requireAuth(req);
  if (error) return error;

  const { targetUserId } = (await req.json()) as ReceiptExceptionBody;
  if (!targetUserId) return jsonResponse({ error: 'targetUserId required' }, 400);

  await db
    .delete(readReceiptExceptions)
    .where(
      and(
        eq(readReceiptExceptions.ownerId, userId!),
        eq(readReceiptExceptions.targetUserId, targetUserId),
      ),
    );

  return jsonResponse({ hidden: false });
}

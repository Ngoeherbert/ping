import { db } from '@/db';
import { privacySettings, readReceiptExceptions, statusBlockList } from '@/db/schema';
import { jsonResponse, requireAuth } from '@/lib/apiMiddleware';
import { eq } from 'drizzle-orm';

type StatusVisibility = 'everyone' | 'followers' | 'none';

interface PrivacyUpdateBody {
  readReceiptsEnabled?: boolean;
  statusVisibility?: StatusVisibility;
  showOnlineStatus?: boolean;
}

const STATUS_VISIBILITY_VALUES = ['everyone', 'followers', 'none'] as const;

function isStatusVisibility(value: unknown): value is StatusVisibility {
  return STATUS_VISIBILITY_VALUES.includes(value as StatusVisibility);
}

export async function GET(req: Request) {
  const { error, userId } = await requireAuth(req);
  if (error) return error;

  let [settings] = await db
    .select()
    .from(privacySettings)
    .where(eq(privacySettings.userId, userId!));

  if (!settings) {
    [settings] = await db.insert(privacySettings).values({ userId: userId! }).returning();
  }

  const receiptExceptions = await db
    .select()
    .from(readReceiptExceptions)
    .where(eq(readReceiptExceptions.ownerId, userId!));

  const statusBlocks = await db
    .select()
    .from(statusBlockList)
    .where(eq(statusBlockList.ownerId, userId!));

  return jsonResponse({ settings, receiptExceptions, statusBlocks });
}

export async function PATCH(req: Request) {
  const { error, userId } = await requireAuth(req);
  if (error) return error;

  const body = (await req.json()) as PrivacyUpdateBody;
  const updates: Partial<typeof privacySettings.$inferInsert> = { updatedAt: new Date() };

  if (typeof body.readReceiptsEnabled === 'boolean') {
    updates.readReceiptsEnabled = body.readReceiptsEnabled;
  }
  if (typeof body.showOnlineStatus === 'boolean') {
    updates.showOnlineStatus = body.showOnlineStatus;
  }
  if ('statusVisibility' in body) {
    if (!isStatusVisibility(body.statusVisibility)) {
      return jsonResponse({ error: 'Invalid status visibility' }, 400);
    }
    updates.statusVisibility = body.statusVisibility;
  }

  const [settings] = await db
    .insert(privacySettings)
    .values({ userId: userId!, ...updates })
    .onConflictDoUpdate({
      target: privacySettings.userId,
      set: updates,
    })
    .returning();

  return jsonResponse({ settings });
}

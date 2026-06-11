import { db } from '@/db';
import { comments, posts, users } from '@/db/schema';
import { jsonResponse, requireAuth } from '@/lib/apiMiddleware';
import { desc, eq, sql } from 'drizzle-orm';
import type { Comment } from '@/types';

type CommentRow = {
  id: string;
  postId: string;
  userId: string;
  parentId: string | null;
  content: string;
  likesCount: number | null;
  createdAt: Date | null;
  user: Comment['user'];
};

type CreateCommentBody = {
  content?: unknown;
  parentId?: unknown;
};

function toComment(row: CommentRow): Comment {
  return {
    id: row.id,
    postId: row.postId,
    userId: row.userId,
    parentId: row.parentId,
    content: row.content,
    likesCount: row.likesCount ?? 0,
    createdAt: row.createdAt ?? new Date(),
    user: row.user,
    replies: [],
  };
}

function nestComments(rows: CommentRow[]) {
  const byId = new Map<string, Comment>();
  const roots: Comment[] = [];

  for (const row of rows) {
    byId.set(row.id, toComment(row));
  }

  for (const row of rows) {
    const comment = byId.get(row.id)!;
    if (row.parentId) {
      byId.get(row.parentId)?.replies?.push(comment);
    } else {
      roots.push(comment);
    }
  }

  return roots;
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const { error } = await requireAuth(req);
  if (error) return error;

  const rows = await db
    .select({
      id: comments.id,
      postId: comments.postId,
      userId: comments.userId,
      parentId: comments.parentId,
      content: comments.content,
      likesCount: comments.likesCount,
      createdAt: comments.createdAt,
      user: {
        id: users.id,
        name: users.name,
        username: users.username,
        avatarUrl: users.avatarUrl,
        isVerified: users.isVerified,
      },
    })
    .from(comments)
    .innerJoin(users, eq(comments.userId, users.id))
    .where(eq(comments.postId, params.id))
    .orderBy(desc(comments.createdAt));

  return jsonResponse({ comments: nestComments(rows) });
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { error, userId } = await requireAuth(req);
  if (error) return error;

  const body = (await req.json()) as CreateCommentBody;
  const content = typeof body.content === 'string' ? body.content.trim() : '';
  const parentId = typeof body.parentId === 'string' ? body.parentId : null;

  if (!content) return jsonResponse({ error: 'Comment content is required' }, 400);

  const [created] = await db
    .insert(comments)
    .values({ postId: params.id, userId: userId!, parentId, content })
    .returning();

  await db
    .update(posts)
    .set({ commentsCount: sql`comments_count + 1` })
    .where(eq(posts.id, params.id));

  const [comment] = await db
    .select({
      id: comments.id,
      postId: comments.postId,
      userId: comments.userId,
      parentId: comments.parentId,
      content: comments.content,
      likesCount: comments.likesCount,
      createdAt: comments.createdAt,
      user: {
        id: users.id,
        name: users.name,
        username: users.username,
        avatarUrl: users.avatarUrl,
        isVerified: users.isVerified,
      },
    })
    .from(comments)
    .innerJoin(users, eq(comments.userId, users.id))
    .where(eq(comments.id, created.id));

  return jsonResponse({ comment: toComment(comment) }, 201);
}

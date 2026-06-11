import { db } from '@/db';
import { hashtags, postHashtags, postMedia, posts } from '@/db/schema';
import { jsonResponse, requireAuth } from '@/lib/apiMiddleware';
import { eq } from 'drizzle-orm';
import type { MediaType, PostType } from '@/types';

type CreatePostMedia = {
  url: string;
  type: MediaType;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  duration?: number;
};

type CreatePostBody = {
  caption?: string;
  location?: string;
  type?: PostType;
  media?: CreatePostMedia[];
  hashtagNames?: string[];
};

export async function POST(req: Request) {
  const { error, userId } = await requireAuth(req);
  if (error) return error;

  const body = (await req.json()) as CreatePostBody;
  const { caption, location, type, media, hashtagNames } = body;

  const [post] = await db
    .insert(posts)
    .values({ userId: userId!, caption, location, type: type ?? 'image' })
    .returning();

  if (media?.length) {
    await db.insert(postMedia).values(
      media.map((item, index) => ({
        postId: post.id,
        url: item.url,
        type: item.type,
        thumbnailUrl: item.thumbnailUrl,
        width: item.width,
        height: item.height,
        duration: item.duration,
        order: index,
      })),
    );
  }

  if (hashtagNames?.length) {
    for (const rawName of hashtagNames) {
      const name = rawName.toLowerCase();
      let [tag] = await db.select().from(hashtags).where(eq(hashtags.name, name));
      if (!tag) {
        [tag] = await db.insert(hashtags).values({ name }).returning();
      }
      await db.insert(postHashtags).values({ postId: post.id, hashtagId: tag.id });
    }
  }

  return jsonResponse({ post }, 201);
}

import { relations } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

// ─── Enums ──────────────────────────────────────────────────────────────────

export const postTypeEnum = pgEnum('post_type', [
  'image',
  'video',
  'reel',
  'story',
  'text',
]);

export const mediaTypeEnum = pgEnum('media_type', [
  'image',
  'video',
  'audio',
]);

export const notificationTypeEnum = pgEnum('notification_type', [
  'like',
  'comment',
  'follow',
  'mention',
  'message',
  'share',
  'tag',
]);

export const messageStatusEnum = pgEnum('message_status', [
  'sent',
  'delivered',
  'read',
]);

export const gameTypeEnum = pgEnum('game_type', [
  'archery',
  'pool',
  'ludo',
  'snake_ladder',
]);

export const gameStatusEnum = pgEnum('game_status', [
  'pending',
  'active',
  'finished',
]);

// ─── Users ───────────────────────────────────────────────────────────────────

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 100 }).notNull(),
    username: varchar('username', { length: 50 }).notNull().unique(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    emailVerified: boolean('email_verified').default(false),
    passwordHash: text('password_hash'),
    avatarUrl: text('avatar_url'),
    coverUrl: text('cover_url'),
    bio: text('bio'),
    website: text('website'),
    location: varchar('location', { length: 100 }),
    isVerified: boolean('is_verified').default(false),
    isPrivate: boolean('is_private').default(false),
    followersCount: integer('followers_count').default(0),
    followingCount: integer('following_count').default(0),
    postsCount: integer('posts_count').default(0),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (t) => ({
    usernameIdx: index('username_idx').on(t.username),
    emailIdx: index('email_idx').on(t.email),
  }),
);

// ─── Better Auth sessions / accounts (required by better-auth) ───────────────

export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const accounts = pgTable('accounts', {
  id: text('id').primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  idToken: text('id_token'),
  password: text('password'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const verifications = pgTable('verifications', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ─── Posts ────────────────────────────────────────────────────────────────────

export const posts = pgTable(
  'posts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: postTypeEnum('type').notNull().default('image'),
    caption: text('caption'),
    location: varchar('location', { length: 100 }),
    likesCount: integer('likes_count').default(0),
    commentsCount: integer('comments_count').default(0),
    sharesCount: integer('shares_count').default(0),
    viewsCount: integer('views_count').default(0),
    isArchived: boolean('is_archived').default(false),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (t) => ({
    userIdIdx: index('post_user_id_idx').on(t.userId),
    createdAtIdx: index('post_created_at_idx').on(t.createdAt),
  }),
);

// ─── Post Media ───────────────────────────────────────────────────────────────

export const postMedia = pgTable('post_media', {
  id: uuid('id').primaryKey().defaultRandom(),
  postId: uuid('post_id')
    .notNull()
    .references(() => posts.id, { onDelete: 'cascade' }),
  type: mediaTypeEnum('type').notNull(),
  url: text('url').notNull(),
  thumbnailUrl: text('thumbnail_url'),
  width: integer('width'),
  height: integer('height'),
  duration: integer('duration'),
  order: integer('order').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

// ─── Stories ─────────────────────────────────────────────────────────────────

export const stories = pgTable('stories', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  mediaUrl: text('media_url').notNull(),
  mediaType: mediaTypeEnum('media_type').notNull(),
  thumbnailUrl: text('thumbnail_url'),
  text: text('text'),
  textColor: varchar('text_color', { length: 7 }),
  backgroundColor: varchar('background_color', { length: 7 }),
  viewsCount: integer('views_count').default(0),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const storyViews = pgTable(
  'story_views',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    storyId: uuid('story_id')
      .notNull()
      .references(() => stories.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    viewedAt: timestamp('viewed_at').defaultNow(),
  },
  (t) => ({
    uniqueView: uniqueIndex('unique_story_view').on(t.storyId, t.userId),
  }),
);

// ─── Likes ────────────────────────────────────────────────────────────────────

export const likes = pgTable(
  'likes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    postId: uuid('post_id')
      .notNull()
      .references(() => posts.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (t) => ({
    uniqueLike: uniqueIndex('unique_like').on(t.userId, t.postId),
  }),
);

// ─── Comments ─────────────────────────────────────────────────────────────────

export const comments = pgTable(
  'comments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    postId: uuid('post_id')
      .notNull()
      .references(() => posts.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    parentId: uuid('parent_id'),
    content: text('content').notNull(),
    likesCount: integer('likes_count').default(0),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (t) => ({
    postIdIdx: index('comment_post_id_idx').on(t.postId),
  }),
);

// ─── Follows ──────────────────────────────────────────────────────────────────

export const follows = pgTable(
  'follows',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    followerId: uuid('follower_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    followingId: uuid('following_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (t) => ({
    uniqueFollow: uniqueIndex('unique_follow').on(t.followerId, t.followingId),
  }),
);

// ─── Messages ─────────────────────────────────────────────────────────────────

export const conversations = pgTable('conversations', {
  id: uuid('id').primaryKey().defaultRandom(),
  isGroup: boolean('is_group').default(false),
  groupName: varchar('group_name', { length: 100 }),
  groupAvatarUrl: text('group_avatar_url'),
  lastMessageAt: timestamp('last_message_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const conversationMembers = pgTable(
  'conversation_members',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    conversationId: uuid('conversation_id')
      .notNull()
      .references(() => conversations.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    joinedAt: timestamp('joined_at').defaultNow(),
  },
  (t) => ({
    uniqueMember: uniqueIndex('unique_member').on(t.conversationId, t.userId),
  }),
);

export const messages = pgTable(
  'messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    conversationId: uuid('conversation_id')
      .notNull()
      .references(() => conversations.id, { onDelete: 'cascade' }),
    senderId: uuid('sender_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    content: text('content'),
    mediaUrl: text('media_url'),
    mediaType: mediaTypeEnum('media_type'),
    status: messageStatusEnum('status').default('sent'),
    replyToId: uuid('reply_to_id'),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (t) => ({
    convIdx: index('message_conv_idx').on(t.conversationId),
  }),
);

// ─── Game Sessions ────────────────────────────────────────────────────────────

export const gameSessions = pgTable(
  'game_sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    conversationId: uuid('conversation_id')
      .notNull()
      .references(() => conversations.id, { onDelete: 'cascade' }),
    challengerId: uuid('challenger_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    opponentId: uuid('opponent_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: gameTypeEnum('type').notNull(),
    status: gameStatusEnum('status').default('pending'),
    state: text('state'),
    challengerScore: integer('challenger_score').default(0),
    opponentScore: integer('opponent_score').default(0),
    currentTurnId: uuid('current_turn_id'),
    winnerId: uuid('winner_id').references(() => users.id),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (t) => ({
    conversationIdx: index('game_session_conversation_idx').on(t.conversationId),
    challengerIdx: index('game_session_challenger_idx').on(t.challengerId),
    opponentIdx: index('game_session_opponent_idx').on(t.opponentId),
  }),
);

// ─── Notifications ────────────────────────────────────────────────────────────

export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    actorId: uuid('actor_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: notificationTypeEnum('type').notNull(),
    postId: uuid('post_id').references(() => posts.id, { onDelete: 'cascade' }),
    commentId: uuid('comment_id').references(() => comments.id, {
      onDelete: 'cascade',
    }),
    isRead: boolean('is_read').default(false),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (t) => ({
    userIdIdx: index('notif_user_id_idx').on(t.userId),
  }),
);

// ─── Push Tokens ─────────────────────────────────────────────────────────────

export const pushTokens = pgTable(
  'push_tokens',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    token: text('token').notNull(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (t) => ({
    uniqueToken: uniqueIndex('unique_push_token').on(t.token),
    userIdIdx: index('push_token_user_id_idx').on(t.userId),
  }),
);

// ─── Saved Posts ──────────────────────────────────────────────────────────────

export const savedPosts = pgTable(
  'saved_posts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    postId: uuid('post_id')
      .notNull()
      .references(() => posts.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (t) => ({
    uniqueSave: uniqueIndex('unique_save').on(t.userId, t.postId),
  }),
);

// ─── Hashtags ─────────────────────────────────────────────────────────────────

export const hashtags = pgTable('hashtags', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  postsCount: integer('posts_count').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

export const postHashtags = pgTable('post_hashtags', {
  postId: uuid('post_id')
    .notNull()
    .references(() => posts.id, { onDelete: 'cascade' }),
  hashtagId: uuid('hashtag_id')
    .notNull()
    .references(() => hashtags.id, { onDelete: 'cascade' }),
});

// ─── Relations ────────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
  stories: many(stories),
  followers: many(follows, { relationName: 'following' }),
  following: many(follows, { relationName: 'follower' }),
  notifications: many(notifications),
  pushTokens: many(pushTokens),
  challengedGames: many(gameSessions, { relationName: 'challenger' }),
  opponentGames: many(gameSessions, { relationName: 'opponent' }),
  sentMessages: many(messages),
  savedPosts: many(savedPosts),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  user: one(users, { fields: [posts.userId], references: [users.id] }),
  media: many(postMedia),
  likes: many(likes),
  comments: many(comments),
  savedBy: many(savedPosts),
  hashtags: many(postHashtags),
}));

export const followsRelations = relations(follows, ({ one }) => ({
  follower: one(users, {
    fields: [follows.followerId],
    references: [users.id],
    relationName: 'follower',
  }),
  following: one(users, {
    fields: [follows.followingId],
    references: [users.id],
    relationName: 'following',
  }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
  sender: one(users, { fields: [messages.senderId], references: [users.id] }),
}));


export const gameSessionsRelations = relations(gameSessions, ({ one }) => ({
  conversation: one(conversations, {
    fields: [gameSessions.conversationId],
    references: [conversations.id],
  }),
  challenger: one(users, {
    fields: [gameSessions.challengerId],
    references: [users.id],
    relationName: 'challenger',
  }),
  opponent: one(users, {
    fields: [gameSessions.opponentId],
    references: [users.id],
    relationName: 'opponent',
  }),
  winner: one(users, {
    fields: [gameSessions.winnerId],
    references: [users.id],
  }),
}));

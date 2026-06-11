// ─── Shared ──────────────────────────────────────────────────────────────────

export type ID = string;
export type ISODateString = string;

export interface TimestampFields {
  createdAt: Date;
  updatedAt: Date;
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  avatarUrl?: string | null;
  coverUrl?: string | null;
  bio?: string | null;
  website?: string | null;
  location?: string | null;
  isVerified: boolean | null;
  isPrivate: boolean | null;
  emailVerified: boolean | null;
  followersCount?: number | null;
  followingCount?: number | null;
  postsCount?: number | null;
  createdAt?: ISODateString | Date | null;
}

// ─── Profiles (public view) ───────────────────────────────────────────────────

export interface UserProfile extends User {
  followersCount: number | null;
  followingCount: number | null;
  postsCount: number | null;
  isFollowing: boolean;
  posts: Post[];
}

export type UserSummary = Pick<
  User,
  'id' | 'name' | 'username' | 'avatarUrl' | 'isVerified'
>;

// ─── Media ───────────────────────────────────────────────────────────────────

export type MediaType = 'image' | 'video' | 'audio';

export interface PostMedia {
  id: string;
  postId?: string;
  type: MediaType;
  url: string;
  thumbnailUrl?: string | null;
  width?: number | null;
  height?: number | null;
  duration?: number | null;
  order: number | null;
}

// ─── Posts ───────────────────────────────────────────────────────────────────

export type PostType = 'image' | 'video' | 'reel' | 'story' | 'text';

export interface Post {
  id: string;
  userId: string;
  type: PostType;
  caption?: string | null;
  location?: string | null;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  viewsCount: number;
  createdAt: ISODateString | Date;
  updatedAt?: ISODateString | Date | null;
  user?: UserSummary;
  media?: PostMedia[];
  isLiked?: boolean;
  isSaved?: boolean;
  isArchived?: boolean | null;
}

// ─── Comments ─────────────────────────────────────────────────────────────────

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  parentId?: string | null;
  content: string;
  likesCount: number;
  createdAt: ISODateString | Date;
  user: UserSummary;
  replies?: Comment[];
}

// ─── Stories ─────────────────────────────────────────────────────────────────

export interface Story {
  id: string;
  userId: string;
  mediaUrl: string;
  mediaType: MediaType;
  thumbnailUrl?: string | null;
  text?: string | null;
  textColor?: string | null;
  backgroundColor?: string | null;
  viewsCount: number;
  expiresAt: ISODateString | Date;
  createdAt: ISODateString | Date;
  user?: Pick<User, 'id' | 'name' | 'username' | 'avatarUrl'>;
  isViewed?: boolean;
}

export interface StoryGroup {
  user: Pick<User, 'id' | 'name' | 'username' | 'avatarUrl'>;
  stories: Story[];
  hasUnviewed?: boolean;
}

// ─── Messages ─────────────────────────────────────────────────────────────────

export type MessageStatus = 'sent' | 'delivered' | 'read';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content?: string | null;
  mediaUrl?: string | null;
  mediaType?: MediaType | null;
  status: MessageStatus;
  replyToId?: string | null;
  createdAt: ISODateString | Date;
}

export interface Conversation {
  id: string;
  isGroup: boolean | null;
  groupName?: string | null;
  groupAvatarUrl?: string | null;
  avatarUrl?: string | null;
  name?: string;
  lastMessage?: Message | string | null;
  lastMessageTime?: ISODateString | Date | null;
  lastMessageAt?: ISODateString | Date | null;
  unreadCount: number;
  members?: Pick<User, 'id' | 'name' | 'username' | 'avatarUrl'>[];
  createdAt?: ISODateString | Date | null;
}

// ─── Notifications ────────────────────────────────────────────────────────────

export type NotificationType =
  | 'like'
  | 'comment'
  | 'follow'
  | 'mention'
  | 'message'
  | 'share'
  | 'tag';

export interface Notification {
  id: string;
  userId: string;
  actorId?: string;
  type: NotificationType;
  postId?: string | null;
  commentId?: string | null;
  isRead: boolean | null;
  createdAt: ISODateString | Date;
  actor?: Pick<User, 'id' | 'name' | 'username' | 'avatarUrl'>;
}

// ─── API ─────────────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  hasMore: boolean;
  total?: number;
}

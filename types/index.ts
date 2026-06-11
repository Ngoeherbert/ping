export type ID = string;

export type TimestampFields = {
  createdAt: Date;
  updatedAt: Date;
};

export type ISODateString = string;
export type MediaType = 'image' | 'video' | 'audio';
export type PostType = 'image' | 'video' | 'reel' | 'story' | 'text';
export type MessageStatus = 'sent' | 'delivered' | 'read';
export type NotificationType =
  | 'like'
  | 'comment'
  | 'follow'
  | 'mention'
  | 'message'
  | 'share'
  | 'tag';

export type User = {
  id: ID;
  name: string;
  username: string;
  email: string;
  emailVerified?: boolean;
  avatarUrl?: string | null;
  coverUrl?: string | null;
  bio?: string | null;
  website?: string | null;
  location?: string | null;
  isVerified?: boolean;
  isPrivate?: boolean;
  followersCount?: number;
  followingCount?: number;
  postsCount?: number;
};

export type PostMedia = {
  id: ID;
  type: MediaType;
  url: string;
  thumbnailUrl?: string | null;
  width?: number | null;
  height?: number | null;
  duration?: number | null;
  order?: number;
};

export type Post = {
  id: ID;
  userId: ID;
  user?: User;
  type: PostType;
  caption?: string | null;
  location?: string | null;
  media?: PostMedia[];
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  viewsCount: number;
  isLiked?: boolean;
  isSaved?: boolean;
  isArchived?: boolean;
  createdAt: ISODateString;
  updatedAt?: ISODateString;
};

export type Story = {
  id: ID;
  userId: ID;
  mediaUrl: string;
  mediaType: MediaType;
  thumbnailUrl?: string | null;
  text?: string | null;
  textColor?: string | null;
  backgroundColor?: string | null;
  viewsCount: number;
  isViewed?: boolean;
  expiresAt: ISODateString;
  createdAt: ISODateString;
};

export type StoryGroup = {
  user: User;
  stories: Story[];
};

export type UserProfile = User & {
  isFollowing: boolean;
  posts: Post[];
};

export type Message = {
  id: ID;
  conversationId: ID;
  senderId: ID;
  content?: string | null;
  mediaUrl?: string | null;
  mediaType?: MediaType | null;
  status: MessageStatus;
  replyToId?: ID | null;
  createdAt: ISODateString;
};

export type Conversation = {
  id: ID;
  isGroup: boolean;
  groupName?: string | null;
  groupAvatarUrl?: string | null;
  members?: User[];
  lastMessage?: Message | null;
  lastMessageAt?: ISODateString;
  unreadCount: number;
  createdAt: ISODateString;
};

export type Notification = {
  id: ID;
  userId: ID;
  actorId: ID;
  actor?: User;
  type: NotificationType;
  postId?: ID | null;
  commentId?: ID | null;
  isRead: boolean;
  createdAt: ISODateString;
};

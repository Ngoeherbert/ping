export type ID = string;

export type TimestampFields = {
  createdAt: Date;
  updatedAt: Date;
};

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

import type { Post, StoryGroup, UserSummary } from '@/types';

const now = Date.now();

export const seedUsers: UserSummary[] = [
  {
    id: 'seed-user-maya',
    name: 'Maya Chen',
    username: 'maya.moves',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=160&h=160&fit=crop&crop=faces',
    isVerified: true,
  },
  {
    id: 'seed-user-kwame',
    name: 'Kwame Mensah',
    username: 'kwame.creates',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&h=160&fit=crop&crop=faces',
    isVerified: false,
  },
  {
    id: 'seed-user-amara',
    name: 'Amara James',
    username: 'amara.daily',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&h=160&fit=crop&crop=faces',
    isVerified: true,
  },
];

export const seedPosts: Post[] = [
  {
    id: 'seed-post-1',
    userId: seedUsers[0].id,
    type: 'image',
    caption: 'First sunrise walk of the week. Welcome to Ping 👋',
    location: 'Limbe Beach',
    likesCount: 248,
    commentsCount: 18,
    sharesCount: 7,
    viewsCount: 1200,
    createdAt: new Date(now - 1000 * 60 * 18).toISOString(),
    user: seedUsers[0],
    media: [
      {
        id: 'seed-media-1',
        postId: 'seed-post-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&h=1200&fit=crop',
        order: 0,
      },
    ],
    isLiked: false,
    isSaved: false,
  },
  {
    id: 'seed-post-2',
    userId: seedUsers[1].id,
    type: 'image',
    caption: 'Shipping small improvements every day. What are you building?',
    location: 'Douala Tech Hub',
    likesCount: 139,
    commentsCount: 11,
    sharesCount: 3,
    viewsCount: 840,
    createdAt: new Date(now - 1000 * 60 * 60 * 3).toISOString(),
    user: seedUsers[1],
    media: [
      {
        id: 'seed-media-2',
        postId: 'seed-post-2',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=1200&h=1200&fit=crop',
        order: 0,
      },
    ],
    isLiked: true,
    isSaved: false,
  },
  {
    id: 'seed-post-3',
    userId: seedUsers[2].id,
    type: 'image',
    caption: 'Coffee, notes, and a fresh timeline to explore.',
    location: 'Yaoundé',
    likesCount: 92,
    commentsCount: 6,
    sharesCount: 2,
    viewsCount: 620,
    createdAt: new Date(now - 1000 * 60 * 60 * 8).toISOString(),
    user: seedUsers[2],
    media: [
      {
        id: 'seed-media-3',
        postId: 'seed-post-3',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1200&h=1200&fit=crop',
        order: 0,
      },
    ],
    isLiked: false,
    isSaved: true,
  },
];

export const seedStoryGroups: StoryGroup[] = seedUsers.map((user, index) => ({
  user,
  hasUnviewed: index !== 1,
  stories: [
    {
      id: `seed-story-${index + 1}`,
      userId: user.id,
      mediaUrl: seedPosts[index]?.media?.[0]?.url ?? '',
      mediaType: 'image',
      text: index === 0 ? 'Good morning, Ping!' : null,
      textColor: '#FFFFFF',
      backgroundColor: '#111111',
      viewsCount: 20 + index * 14,
      expiresAt: new Date(now + 1000 * 60 * 60 * (18 - index)).toISOString(),
      createdAt: new Date(now - 1000 * 60 * 45 * (index + 1)).toISOString(),
      user,
      isViewed: index === 1,
    },
  ],
}));

import { create } from 'zustand';
import { API_URL } from '@/lib/constants';
import { seedPosts } from '@/lib/seedData';
import type { Post } from '@/types';

interface FeedState {
  posts: Post[];
  page: number;
  hasMore: boolean;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;

  fetchFeed: () => Promise<void>;
  refreshFeed: () => Promise<void>;
  loadMore: () => Promise<void>;
  likePost: (postId: string) => Promise<void>;
  unlikePost: (postId: string) => Promise<void>;
  savePost: (postId: string) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
  addPost: (post: Post) => void;
}

async function fetchFeedPage(page: number) {
  const res = await fetch(`${API_URL}/api/feed?page=${page}&limit=20`);
  if (!res.ok) throw new Error('Feed request failed');

  const data = await res.json();
  const posts = Array.isArray(data.posts) && data.posts.length > 0 ? data.posts : seedPosts;

  return {
    posts: posts as Post[],
    hasMore: Boolean(data.hasMore && posts !== seedPosts),
  };
}

export const useFeedStore = create<FeedState>((set, get) => ({
  posts: seedPosts,
  page: 1,
  hasMore: false,
  isLoading: false,
  isRefreshing: false,
  error: null,

  fetchFeed: async () => {
    if (get().isLoading) return;
    set({ isLoading: true, error: null });
    try {
      const data = await fetchFeedPage(1);
      set({ posts: data.posts, page: 1, hasMore: data.hasMore });
    } catch {
      set({ posts: seedPosts, page: 1, hasMore: false, error: null });
    } finally {
      set({ isLoading: false });
    }
  },

  refreshFeed: async () => {
    set({ isRefreshing: true, error: null });
    try {
      const data = await fetchFeedPage(1);
      set({ posts: data.posts, page: 1, hasMore: data.hasMore });
    } catch {
      set({ posts: seedPosts, page: 1, hasMore: false, error: null });
    } finally {
      set({ isRefreshing: false });
    }
  },

  loadMore: async () => {
    const { page, hasMore, isLoading, posts } = get();
    if (!hasMore || isLoading) return;
    const nextPage = page + 1;
    set({ isLoading: true });
    try {
      const data = await fetchFeedPage(nextPage);
      set({
        posts: [...posts, ...data.posts],
        page: nextPage,
        hasMore: data.hasMore,
      });
    } finally {
      set({ isLoading: false });
    }
  },

  likePost: async (postId) => {
    set((state) => ({
      posts: state.posts.map((post) =>
        post.id === postId
          ? { ...post, isLiked: true, likesCount: post.likesCount + 1 }
          : post,
      ),
    }));
    try {
      await fetch(`${API_URL}/api/posts/${postId}/like`, { method: 'POST' });
    } catch {
      set((state) => ({
        posts: state.posts.map((post) =>
          post.id === postId
            ? { ...post, isLiked: false, likesCount: Math.max(0, post.likesCount - 1) }
            : post,
        ),
      }));
    }
  },

  unlikePost: async (postId) => {
    set((state) => ({
      posts: state.posts.map((post) =>
        post.id === postId
          ? {
              ...post,
              isLiked: false,
              likesCount: Math.max(0, post.likesCount - 1),
            }
          : post,
      ),
    }));
    try {
      await fetch(`${API_URL}/api/posts/${postId}/like`, { method: 'DELETE' });
    } catch {
      set((state) => ({
        posts: state.posts.map((post) =>
          post.id === postId
            ? { ...post, isLiked: true, likesCount: post.likesCount + 1 }
            : post,
        ),
      }));
    }
  },

  savePost: async (postId) => {
    const wasSaved = Boolean(get().posts.find((post) => post.id === postId)?.isSaved);
    set((state) => ({
      posts: state.posts.map((post) =>
        post.id === postId ? { ...post, isSaved: !post.isSaved } : post,
      ),
    }));
    await fetch(`${API_URL}/api/posts/${postId}/save`, {
      method: wasSaved ? 'DELETE' : 'POST',
    }).catch(() => undefined);
  },

  deletePost: async (postId) => {
    set((state) => ({ posts: state.posts.filter((post) => post.id !== postId) }));
    await fetch(`${API_URL}/api/posts/${postId}`, { method: 'DELETE' }).catch(() => undefined);
  },

  addPost: (post) => {
    set((state) => ({ posts: [post, ...state.posts] }));
  },
}));

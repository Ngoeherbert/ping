import { create } from 'zustand';
import { API_URL } from '@/lib/constants';
import type { Post } from '@/types';

interface ReelState {
  reels: Post[];
  activeIndex: number;
  isLoading: boolean;
  hasMore: boolean;
  page: number;
  isMuted: boolean;

  fetchReels: () => Promise<void>;
  loadMore: () => Promise<void>;
  setActiveIndex: (index: number) => void;
  toggleMute: () => void;
  likeReel: (id: string) => void;
}

export const useReelStore = create<ReelState>((set, get) => ({
  reels: [],
  activeIndex: 0,
  isLoading: false,
  hasMore: true,
  page: 1,
  isMuted: false,

  fetchReels: async () => {
    set({ isLoading: true });
    const res = await fetch(`${API_URL}/api/reels?page=1&limit=10`);
    const data = await res.json();
    set({ reels: data.reels, page: 1, hasMore: data.hasMore, isLoading: false });
  },

  loadMore: async () => {
    const { page, hasMore, isLoading, reels } = get();
    if (!hasMore || isLoading) return;
    const next = page + 1;
    set({ isLoading: true });
    const res = await fetch(`${API_URL}/api/reels?page=${next}&limit=10`);
    const data = await res.json();
    set({
      reels: [...reels, ...data.reels],
      page: next,
      hasMore: data.hasMore,
      isLoading: false,
    });
  },

  setActiveIndex: (index) => set({ activeIndex: index }),
  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),

  likeReel: (id) =>
    set((state) => ({
      reels: state.reels.map((reel) =>
        reel.id === id
          ? {
              ...reel,
              isLiked: !reel.isLiked,
              likesCount: reel.isLiked
                ? Math.max(0, reel.likesCount - 1)
                : reel.likesCount + 1,
            }
          : reel,
      ),
    })),
}));

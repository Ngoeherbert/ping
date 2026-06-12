import { create } from 'zustand';
import { API_URL } from '@/lib/constants';
import { apiFetch } from '@/lib/apiFetch';
import { useAuthStore } from '@/store/authStore';
import type { UserProfile } from '@/types';

interface ProfileState {
  profiles: Record<string, UserProfile>;
  isLoading: boolean;

  fetchProfile: (userId: string) => Promise<void>;
  followUser: (userId: string) => Promise<void>;
  unfollowUser: (userId: string) => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
}

export const useProfileStore = create<ProfileState>((set) => ({
  profiles: {},
  isLoading: false,

  fetchProfile: async (userId) => {
    set({ isLoading: true });
    const res = await apiFetch(`${API_URL}/api/users/${userId}`);
    const data = await res.json();
    set((state) => ({
      profiles: { ...state.profiles, [userId]: data },
      isLoading: false,
    }));
  },

  followUser: async (userId) => {
    set((state) => ({
      profiles: {
        ...state.profiles,
        [userId]: state.profiles[userId]
          ? {
              ...state.profiles[userId],
              isFollowing: true,
              followersCount: (state.profiles[userId].followersCount ?? 0) + 1,
            }
          : state.profiles[userId],
      },
    }));
    await apiFetch(`${API_URL}/api/users/${userId}/follow`, { method: 'POST' });
  },

  unfollowUser: async (userId) => {
    set((state) => ({
      profiles: {
        ...state.profiles,
        [userId]: state.profiles[userId]
          ? {
              ...state.profiles[userId],
              isFollowing: false,
              followersCount: Math.max(
                0,
                (state.profiles[userId].followersCount ?? 0) - 1,
              ),
            }
          : state.profiles[userId],
      },
    }));
    await apiFetch(`${API_URL}/api/users/${userId}/follow`, { method: 'DELETE' });
  },

  updateProfile: async (data) => {
    const res = await apiFetch(`${API_URL}/api/users/me`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Profile update failed');
    const updated = await res.json();
    useAuthStore.getState().setUser(updated);
    set((state) => ({ profiles: { ...state.profiles, [updated.id]: updated } }));
  },
}));

import { create } from 'zustand';
import { API_URL } from '@/lib/constants';
import { seedStoryGroups } from '@/lib/seedData';
import type { StoryGroup } from '@/types';

interface StoryState {
  storyGroups: StoryGroup[];
  activeGroupIndex: number;
  activeStoryIndex: number;
  isLoading: boolean;

  fetchStories: () => Promise<void>;
  viewStory: (storyId: string) => Promise<void>;
  setActiveGroup: (index: number) => void;
  nextStory: () => void;
  prevStory: () => void;
}

export const useStoryStore = create<StoryState>((set, get) => ({
  storyGroups: seedStoryGroups,
  activeGroupIndex: 0,
  activeStoryIndex: 0,
  isLoading: false,

  fetchStories: async () => {
    set({ isLoading: true });
    try {
      const res = await fetch(`${API_URL}/api/stories`);
      if (!res.ok) throw new Error('Stories request failed');

      const data = await res.json();
      const groups = Array.isArray(data.groups) && data.groups.length > 0
        ? data.groups
        : seedStoryGroups;
      set({ storyGroups: groups });
    } catch {
      set({ storyGroups: seedStoryGroups });
    } finally {
      set({ isLoading: false });
    }
  },

  viewStory: async (storyId) => {
    await fetch(`${API_URL}/api/stories/${storyId}/view`, { method: 'POST' }).catch(
      () => undefined,
    );
  },

  setActiveGroup: (index) => set({ activeGroupIndex: index, activeStoryIndex: 0 }),

  nextStory: () => {
    const { activeGroupIndex, activeStoryIndex, storyGroups } = get();
    const group = storyGroups[activeGroupIndex];
    if (!group) return;

    if (activeStoryIndex < group.stories.length - 1) {
      set({ activeStoryIndex: activeStoryIndex + 1 });
    } else if (activeGroupIndex < storyGroups.length - 1) {
      set({ activeGroupIndex: activeGroupIndex + 1, activeStoryIndex: 0 });
    }
  },

  prevStory: () => {
    const { activeGroupIndex, activeStoryIndex } = get();
    if (activeStoryIndex > 0) {
      set({ activeStoryIndex: activeStoryIndex - 1 });
    } else if (activeGroupIndex > 0) {
      set({ activeGroupIndex: activeGroupIndex - 1, activeStoryIndex: 0 });
    }
  },
}));

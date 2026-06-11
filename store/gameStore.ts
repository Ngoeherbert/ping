import { create } from 'zustand';
import { API_URL } from '@/lib/constants';
import type { GameSession, GameType } from '@/types';

type GameSessionUpdate = Pick<
  Partial<GameSession>,
  'state' | 'status' | 'challengerScore' | 'opponentScore' | 'currentTurnId' | 'winnerId'
>;

interface GameState {
  activeSession: GameSession | null;
  isLoading: boolean;
  pollingInterval: ReturnType<typeof setInterval> | null;

  createChallenge: (
    conversationId: string,
    opponentId: string,
    type: GameType,
  ) => Promise<GameSession>;
  fetchSession: (id: string) => Promise<void>;
  updateSession: (id: string, updates: GameSessionUpdate) => Promise<void>;
  startPolling: (id: string) => void;
  stopPolling: () => void;
  clearSession: () => void;
}

async function readGameResponse(res: Response): Promise<GameSession> {
  const data = (await res.json()) as { session?: GameSession; error?: string };
  if (!res.ok || !data.session) {
    throw new Error(data.error ?? 'Game request failed');
  }

  return data.session;
}

export const useGameStore = create<GameState>((set, get) => ({
  activeSession: null,
  isLoading: false,
  pollingInterval: null,

  createChallenge: async (conversationId, opponentId, type) => {
    set({ isLoading: true });
    try {
      const res = await fetch(`${API_URL}/api/games`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, opponentId, type }),
      });
      const session = await readGameResponse(res);
      set({ activeSession: session, isLoading: false });
      return session;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  fetchSession: async (id) => {
    set({ isLoading: true });
    try {
      const res = await fetch(`${API_URL}/api/games/${id}`);
      const session = await readGameResponse(res);
      set({ activeSession: session, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  updateSession: async (id, updates) => {
    const res = await fetch(`${API_URL}/api/games/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const session = await readGameResponse(res);
    set({ activeSession: session });
  },

  startPolling: (id) => {
    const { pollingInterval } = get();
    if (pollingInterval) clearInterval(pollingInterval);

    const interval = setInterval(() => {
      get().fetchSession(id).catch(() => undefined);
    }, 2000);
    set({ pollingInterval: interval });
  },

  stopPolling: () => {
    const { pollingInterval } = get();
    if (pollingInterval) clearInterval(pollingInterval);
    set({ pollingInterval: null });
  },

  clearSession: () => {
    get().stopPolling();
    set({ activeSession: null });
  },
}));

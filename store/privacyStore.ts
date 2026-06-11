import { create } from 'zustand';
import { API_URL } from '@/lib/constants';
import type { PrivacySettings, ReadReceiptException, StatusBlock } from '@/types';

interface PrivacyState {
  settings: PrivacySettings | null;
  receiptExceptions: ReadReceiptException[];
  statusBlocks: StatusBlock[];
  isLoading: boolean;

  fetchPrivacy: () => Promise<void>;
  updateSettings: (updates: Partial<PrivacySettings>) => Promise<void>;
  hideReceiptFromUser: (targetUserId: string) => Promise<void>;
  restoreReceiptForUser: (targetUserId: string) => Promise<void>;
  blockStatusForUser: (blockedUserId: string) => Promise<void>;
  unblockStatusForUser: (blockedUserId: string) => Promise<void>;
  isReceiptHiddenFrom: (userId: string) => boolean;
  isStatusBlockedFor: (userId: string) => boolean;
}

interface PrivacyResponse {
  settings: PrivacySettings;
  receiptExceptions: ReadReceiptException[];
  statusBlocks: StatusBlock[];
}

async function readJson<T>(res: Response): Promise<T> {
  const data = (await res.json()) as T & { error?: string };
  if (!res.ok) throw new Error(data.error ?? 'Privacy request failed');
  return data;
}

export const usePrivacyStore = create<PrivacyState>((set, get) => ({
  settings: null,
  receiptExceptions: [],
  statusBlocks: [],
  isLoading: false,

  fetchPrivacy: async () => {
    set({ isLoading: true });
    try {
      const res = await fetch(`${API_URL}/api/users/me/privacy`);
      const data = await readJson<PrivacyResponse>(res);
      set({
        settings: data.settings,
        receiptExceptions: data.receiptExceptions,
        statusBlocks: data.statusBlocks,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  updateSettings: async (updates) => {
    const res = await fetch(`${API_URL}/api/users/me/privacy`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const data = await readJson<{ settings: PrivacySettings }>(res);
    set({ settings: data.settings });
  },

  hideReceiptFromUser: async (targetUserId) => {
    const res = await fetch(`${API_URL}/api/users/me/privacy/receipt-exception`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetUserId }),
    });
    const data = await readJson<{ exception?: ReadReceiptException }>(res);
    set((state) => ({
      receiptExceptions: [
        ...state.receiptExceptions.filter((exception) => exception.targetUserId !== targetUserId),
        data.exception ?? { id: `local-${targetUserId}`, targetUserId, hideFromTarget: true },
      ],
    }));
  },

  restoreReceiptForUser: async (targetUserId) => {
    const res = await fetch(`${API_URL}/api/users/me/privacy/receipt-exception`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetUserId }),
    });
    await readJson<{ hidden: boolean }>(res);
    set((state) => ({
      receiptExceptions: state.receiptExceptions.filter(
        (exception) => exception.targetUserId !== targetUserId,
      ),
    }));
  },

  blockStatusForUser: async (blockedUserId) => {
    const res = await fetch(`${API_URL}/api/users/me/privacy/status-block`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blockedUserId }),
    });
    const data = await readJson<{ block?: StatusBlock }>(res);
    set((state) => ({
      statusBlocks: [
        ...state.statusBlocks.filter((block) => block.blockedUserId !== blockedUserId),
        data.block ?? { id: `local-${blockedUserId}`, blockedUserId },
      ],
    }));
  },

  unblockStatusForUser: async (blockedUserId) => {
    const res = await fetch(`${API_URL}/api/users/me/privacy/status-block`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blockedUserId }),
    });
    await readJson<{ blocked: boolean }>(res);
    set((state) => ({
      statusBlocks: state.statusBlocks.filter((block) => block.blockedUserId !== blockedUserId),
    }));
  },

  isReceiptHiddenFrom: (userId) =>
    get().receiptExceptions.some(
      (exception) => exception.targetUserId === userId && exception.hideFromTarget,
    ),

  isStatusBlockedFor: (userId) =>
    get().statusBlocks.some((block) => block.blockedUserId === userId),
}));

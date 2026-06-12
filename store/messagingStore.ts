import { create } from 'zustand';
import { API_URL } from '@/lib/constants';
import { apiFetch } from '@/lib/apiFetch';
import type { Conversation, Message } from '@/types';

interface MessagingState {
  conversations: Conversation[];
  messages: Record<string, Message[]>;
  isLoading: boolean;
  unreadCount: number;

  fetchConversations: () => Promise<void>;
  fetchMessages: (conversationId: string) => Promise<void>;
  sendMessage: (
    conversationId: string,
    content: string,
    mediaUrl?: string,
  ) => Promise<void>;
  createConversation: (userId: string) => Promise<string>;
  markRead: (conversationId: string) => Promise<void>;
}

export const useMessagingStore = create<MessagingState>((set) => ({
  conversations: [],
  messages: {},
  isLoading: false,
  unreadCount: 0,

  fetchConversations: async () => {
    set({ isLoading: true });
    const res = await apiFetch(`${API_URL}/api/messages`);
    const data = await res.json();
    set({
      conversations: data.conversations,
      unreadCount: data.unreadCount,
      isLoading: false,
    });
  },

  fetchMessages: async (conversationId) => {
    const res = await apiFetch(`${API_URL}/api/messages/${conversationId}`);
    const data = await res.json();
    set((state) => ({
      messages: { ...state.messages, [conversationId]: data.messages },
    }));
  },

  sendMessage: async (conversationId, content, mediaUrl) => {
    const tempMsg: Message = {
      id: `temp-${Date.now()}`,
      conversationId,
      senderId: 'me',
      content,
      mediaUrl,
      status: 'sent',
      createdAt: new Date().toISOString(),
    };
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: [...(state.messages[conversationId] ?? []), tempMsg],
      },
    }));
    const res = await apiFetch(`${API_URL}/api/messages/${conversationId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, mediaUrl }),
    });
    const data = await res.json();
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: (state.messages[conversationId] ?? []).map((message) =>
          message.id === tempMsg.id ? data.message : message,
        ),
      },
    }));
  },

  createConversation: async (userId) => {
    const res = await apiFetch(`${API_URL}/api/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    const data = await res.json();
    return data.conversationId;
  },

  markRead: async (conversationId) => {
    await apiFetch(`${API_URL}/api/messages/${conversationId}/read`, { method: 'POST' });
    set((state) => ({
      conversations: state.conversations.map((conversation) =>
        conversation.id === conversationId
          ? { ...conversation, unreadCount: 0 }
          : conversation,
      ),
    }));
  },
}));

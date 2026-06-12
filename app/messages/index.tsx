import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Edit, Search, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { FlatList, Image, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useToast } from '@/components/ui/Toast';
import { apiFetch } from '@/lib/apiFetch';
import { API_URL, COLORS } from '@/lib/constants';
import { useMessagingStore } from '@/store/messagingStore';
import type { Conversation, UserProfile } from '@/types';

export default function MessagesScreen() {
  const { conversations, fetchConversations, createConversation } = useMessagingStore();
  const [composeVisible, setComposeVisible] = useState(false);
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const { showToast } = useToast();
  const router = useRouter();

  useEffect(() => {
    fetchConversations().catch(() => showToast({ type: 'error', title: 'Messages unavailable', message: 'Could not load conversations.' }));
  }, [fetchConversations, showToast]);

  useEffect(() => {
    if (!composeVisible || !query.trim()) {
      setUsers([]);
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        const res = await apiFetch(`${API_URL}/api/explore/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setUsers(data.users ?? []);
      } catch {
        setUsers([]);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [composeVisible, query]);

  const startConversation = async (userId: string) => {
    try {
      const conversationId = await createConversation(userId);
      setComposeVisible(false);
      setQuery('');
      router.push(`/messages/${conversationId}`);
    } catch {
      showToast({ type: 'error', title: 'Unable to start chat', message: 'Please try again.' });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <ArrowLeft color={COLORS.text} size={22} />
        </TouchableOpacity>
        <Text style={styles.title}>Messages</Text>
        <TouchableOpacity style={styles.headerButton} onPress={() => setComposeVisible(true)}>
          <Edit color={COLORS.text} size={22} />
        </TouchableOpacity>
      </View>
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ConversationRow conversation={item} onPress={() => router.push(`/messages/${item.id}`)} />}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<Text style={styles.emptyText}>No conversations yet. Tap the pen to start one.</Text>}
      />

      <Modal visible={composeVisible} animationType="slide" onRequestClose={() => setComposeVisible(false)}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.headerButton} onPress={() => setComposeVisible(false)}>
              <X color={COLORS.text} size={22} />
            </TouchableOpacity>
            <Text style={styles.title}>New message</Text>
            <View style={styles.headerButton} />
          </View>
          <View style={styles.searchBar}>
            <Search color={COLORS.muted} size={18} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search people"
              placeholderTextColor={COLORS.muted}
              value={query}
              onChangeText={setQuery}
              autoCapitalize="none"
              autoFocus
            />
          </View>
          <FlatList
            data={users}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.userRow} onPress={() => startConversation(item.id)}>
                {item.avatarUrl ? <Image source={{ uri: item.avatarUrl }} style={styles.avatar} /> : <View style={styles.avatar} />}
                <View>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.lastMessage}>@{item.username}</Text>
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={<Text style={styles.emptyText}>{query ? 'No people found.' : 'Search for someone to message.'}</Text>}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function ConversationRow({ conversation, onPress }: { conversation: Conversation; onPress: () => void }) {
  const displayName = conversation.groupName ?? conversation.members?.[0]?.name ?? 'Conversation';
  const avatarUrl = conversation.groupAvatarUrl ?? conversation.members?.[0]?.avatarUrl;
  const lastMessage = typeof conversation.lastMessage === 'string'
    ? conversation.lastMessage
    : conversation.lastMessage?.content ?? 'No messages yet';
  const lastMessageTime = conversation.lastMessageAt
    ? formatRelativeTime(conversation.lastMessageAt)
    : '';

  return (
    <TouchableOpacity style={styles.row} onPress={onPress}>
      {avatarUrl ? <Image source={{ uri: avatarUrl }} style={styles.avatar} /> : <View style={styles.avatar} />}
      <View style={styles.info}>
        <Text style={styles.name}>{displayName}</Text>
        <Text style={styles.lastMessage} numberOfLines={1}>{lastMessage}</Text>
      </View>
      <View style={styles.meta}>
        {lastMessageTime ? <Text style={styles.time}>{lastMessageTime}</Text> : null}
        {conversation.unreadCount > 0 ? <View style={styles.badge}><Text style={styles.badgeText}>{conversation.unreadCount}</Text></View> : null}
      </View>
    </TouchableOpacity>
  );
}

function formatRelativeTime(dateValue: string | Date) {
  const diff = Date.now() - new Date(dateValue).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  modalContainer: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: COLORS.border },
  headerButton: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '800', color: COLORS.text },
  searchBar: { flexDirection: 'row', alignItems: 'center', margin: 12, borderRadius: 12, backgroundColor: '#F5F5F5', paddingHorizontal: 12 },
  searchInput: { flex: 1, paddingVertical: 12, paddingHorizontal: 8, color: COLORS.text, fontSize: 15 },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: '#F5F5F5' },
  userRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: '#F5F5F5' },
  avatar: { width: 52, height: 52, borderRadius: 26, marginRight: 12, backgroundColor: '#EEEEEE' },
  info: { flex: 1 },
  name: { fontWeight: '700', fontSize: 15, color: COLORS.text, marginBottom: 3 },
  lastMessage: { fontSize: 13, color: COLORS.muted },
  meta: { alignItems: 'flex-end', gap: 4 },
  time: { fontSize: 11, color: '#BBBBBB' },
  badge: { backgroundColor: COLORS.primary, borderRadius: 10, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 5 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  emptyText: { color: COLORS.textSecondary, textAlign: 'center', marginTop: 40, paddingHorizontal: 24 },
});

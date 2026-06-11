import { useRouter } from 'expo-router';
import { Edit } from 'lucide-react-native';
import { useEffect } from 'react';
import { FlatList, Image, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '@/lib/constants';
import { useMessagingStore } from '@/store/messagingStore';
import type { Conversation } from '@/types';

export default function MessagesScreen() {
  const { conversations, fetchConversations } = useMessagingStore();
  const router = useRouter();

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
        <TouchableOpacity>
          <Edit color={COLORS.text} size={22} />
        </TouchableOpacity>
      </View>
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ConversationRow conversation={item} onPress={() => router.push(`/messages/${item.id}`)} />}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

function ConversationRow({ conversation, onPress }: { conversation: Conversation; onPress: () => void }) {
  const displayName = conversation.groupName ?? conversation.members?.[0]?.name ?? 'Conversation';
  const avatarUrl = conversation.groupAvatarUrl ?? conversation.members?.[0]?.avatarUrl;
  const lastMessage = conversation.lastMessage?.content ?? 'No messages yet';
  const lastMessageTime = conversation.lastMessageAt
    ? formatRelativeTime(conversation.lastMessageAt)
    : '';

  return (
    <TouchableOpacity style={styles.row} onPress={onPress}>
      {avatarUrl ? <Image source={{ uri: avatarUrl }} style={styles.avatar} /> : <View style={styles.avatar} />}
      <View style={styles.info}>
        <Text style={styles.name}>{displayName}</Text>
        <Text style={styles.lastMessage} numberOfLines={1}>
          {lastMessage}
        </Text>
      </View>
      <View style={styles.meta}>
        {lastMessageTime ? <Text style={styles.time}>{lastMessageTime}</Text> : null}
        {conversation.unreadCount > 0 ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{conversation.unreadCount}</Text>
          </View>
        ) : null}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  title: { fontSize: 22, fontWeight: '800', color: COLORS.text },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F5F5F5',
  },
  avatar: { width: 52, height: 52, borderRadius: 26, marginRight: 12, backgroundColor: '#EEEEEE' },
  info: { flex: 1 },
  name: { fontWeight: '700', fontSize: 15, color: COLORS.text, marginBottom: 3 },
  lastMessage: { fontSize: 13, color: COLORS.muted },
  meta: { alignItems: 'flex-end', gap: 4 },
  time: { fontSize: 11, color: '#BBBBBB' },
  badge: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
});

import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Gamepad2, Image as ImageIcon, Send } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { GameLauncher } from '@/components/games/GameLauncher';
import { COLORS } from '@/lib/constants';
import { useAuthStore } from '@/store/authStore';
import { useMessagingStore } from '@/store/messagingStore';
import type { Message } from '@/types';

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    conversations,
    messages,
    fetchConversations,
    fetchMessages,
    sendMessage,
    markRead,
  } = useMessagingStore();
  const { user } = useAuthStore();
  const [text, setText] = useState('');
  const [showGameLauncher, setShowGameLauncher] = useState(false);
  const flatListRef = useRef<FlatList<Message>>(null);
  const router = useRouter();

  useEffect(() => {
    if (!id) return;

    fetchMessages(id);
    markRead(id);
    fetchConversations();
  }, [fetchConversations, fetchMessages, id, markRead]);

  const conversationMessages = id ? messages[id] ?? [] : [];
  const conversation = useMemo(
    () => conversations.find((item) => item.id === id),
    [conversations, id],
  );
  const opponentId = conversation?.members?.find((member) => member.id !== user?.id)?.id;

  const handleSend = async () => {
    if (!text.trim() || !id) return;

    const message = text.trim();
    setText('');
    await sendMessage(id, message);
    flatListRef.current?.scrollToEnd({ animated: true });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft color={COLORS.text} size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chat</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardAvoiding}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={90}
      >
        <FlatList
          ref={flatListRef}
          data={conversationMessages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messageList}
          renderItem={({ item }) => {
            const isMe = item.senderId === user?.id || item.senderId === 'me';
            return (
              <View style={[styles.messageBubble, isMe ? styles.myBubble : styles.theirBubble]}>
                <Text style={[styles.messageText, isMe && styles.myMessageText]}>{item.content}</Text>
                <Text style={[styles.messageTime, !isMe && styles.theirMessageTime]}>
                  {new Date(item.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            );
          }}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        />

        <View style={styles.inputRow}>
          <TouchableOpacity style={styles.mediaButton}>
            <ImageIcon color={COLORS.muted} size={22} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.mediaButton} onPress={() => setShowGameLauncher(true)}>
            <Gamepad2 color={COLORS.muted} size={22} />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="Message..."
            placeholderTextColor={COLORS.muted}
            value={text}
            onChangeText={setText}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendButton, !text.trim() && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!text.trim()}
          >
            <Send color="#fff" size={18} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      <GameLauncher
        conversationId={id ?? ''}
        opponentId={opponentId}
        visible={showGameLauncher}
        onClose={() => setShowGameLauncher(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  headerSpacer: { width: 30 },
  keyboardAvoiding: { flex: 1 },
  messageList: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  messageBubble: {
    maxWidth: '75%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  myBubble: { backgroundColor: COLORS.primary, alignSelf: 'flex-end' },
  theirBubble: { backgroundColor: '#F5F5F5', alignSelf: 'flex-start' },
  messageText: { fontSize: 14, color: COLORS.text, lineHeight: 20 },
  myMessageText: { color: '#fff' },
  messageTime: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  theirMessageTime: { color: COLORS.muted },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.border,
  },
  mediaButton: { padding: 8 },
  input: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: COLORS.text,
    marginHorizontal: 8,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: { backgroundColor: '#CCCCCC' },
});

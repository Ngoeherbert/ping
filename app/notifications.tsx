import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useEffect } from 'react';
import { FlatList, Image, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '@/lib/constants';
import { useNotificationStore } from '@/store/notificationStore';
import type { ISODateString, NotificationType } from '@/types';

const NOTIFICATION_LABELS: Record<NotificationType, string> = {
  like: 'liked your post.',
  comment: 'commented on your post.',
  follow: 'started following you.',
  mention: 'mentioned you in a comment.',
  message: 'sent you a message.',
  share: 'shared your post.',
  tag: 'tagged you in a post.',
};

export default function NotificationsScreen() {
  const { notifications, unreadCount, fetchNotifications, markAllRead } = useNotificationStore();
  const router = useRouter();

  useEffect(() => {
    fetchNotifications();
    return () => {
      markAllRead();
    };
  }, [fetchNotifications, markAllRead]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft color={COLORS.text} size={22} />
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
        {unreadCount > 0 ? (
          <TouchableOpacity onPress={markAllRead}>
            <Text style={styles.markAll}>Mark all read</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.headerSpacer} />
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.row, !item.isRead && styles.unreadRow]}
            onPress={() => item.postId && router.push(`/post/${item.postId}`)}
          >
            {item.actor?.avatarUrl ? (
              <Image source={{ uri: item.actor.avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatar} />
            )}
            <View style={styles.content}>
              <Text style={styles.text}>
                <Text style={styles.bold}>{item.actor?.name ?? 'Someone'} </Text>
                {NOTIFICATION_LABELS[item.type] ?? 'interacted with you.'}
              </Text>
              <Text style={styles.time}>{formatRelativeTime(item.createdAt)}</Text>
            </View>
            {!item.isRead ? <View style={styles.dot} /> : null}
          </TouchableOpacity>
        )}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

function formatRelativeTime(dateValue: ISODateString) {
  const diff = Date.now() - new Date(dateValue).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  title: { fontSize: 20, fontWeight: '800', color: COLORS.text },
  markAll: { color: COLORS.primary, fontSize: 13, fontWeight: '600' },
  headerSpacer: { width: 82 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F5F5F5',
  },
  unreadRow: { backgroundColor: '#FFF5F2' },
  avatar: { width: 46, height: 46, borderRadius: 23, marginRight: 12, backgroundColor: '#EEEEEE' },
  content: { flex: 1 },
  text: { fontSize: 13, color: COLORS.text, lineHeight: 18 },
  bold: { fontWeight: '700' },
  time: { fontSize: 11, color: '#BBBBBB', marginTop: 4 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.primary },
});

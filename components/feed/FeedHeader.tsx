import { useRouter } from 'expo-router';
import { Bell, MessageCircle } from 'lucide-react-native';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '@/lib/constants';
import { useNotificationStore } from '@/store/notificationStore';

export function FeedHeader() {
  const router = useRouter();
  const { unreadCount } = useNotificationStore();

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>ping</Text>
      <View style={styles.actions}>
        <TouchableOpacity onPress={() => router.push('/notifications')} style={styles.iconButton}>
          <Bell color={COLORS.text} size={22} />
          {unreadCount > 0 ? <View style={styles.badge} /> : null}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/messages')} style={styles.iconButton}>
          <MessageCircle color={COLORS.text} size={22} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  logo: { fontSize: 26, fontWeight: '800', color: COLORS.primary },
  actions: { flexDirection: 'row', gap: 8 },
  iconButton: { padding: 6, position: 'relative' },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    borderWidth: 1.5,
    borderColor: COLORS.background,
  },
});

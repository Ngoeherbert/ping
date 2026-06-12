import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { API_URL, BORDER_RADIUS, COLORS, FONT_SIZE, FONT_WEIGHT, SPACING } from '@/lib/constants';
import { useProfileStore } from '@/store/profileStore';
import type { UserProfile } from '@/types';

type TabType = 'followers' | 'following';
const tabs: TabType[] = ['followers', 'following'];

function isTab(value: string | string[] | undefined): value is TabType {
  return value === 'followers' || value === 'following';
}

export default function FollowersScreen() {
  const { id, tab: initialTab } = useLocalSearchParams<{ id: string; tab?: string }>();
  const [tab, setTab] = useState<TabType>(isTab(initialTab) ? initialTab : 'followers');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const { followUser, unfollowUser } = useProfileStore();
  const router = useRouter();

  useEffect(() => {
    if (!id) return;
    fetch(`${API_URL}/api/users/${id}/${tab}`)
      .then((response) => response.json())
      .then((data) => setUsers(data.users ?? []))
      .catch(() => setUsers([]));
  }, [id, tab]);

  const toggleFollow = async (targetUser: UserProfile) => {
    if (targetUser.isFollowing) {
      await unfollowUser(targetUser.id);
    } else {
      await followUser(targetUser.id);
    }

    setUsers((current) =>
      current.map((user) =>
        user.id === targetUser.id ? { ...user, isFollowing: !targetUser.isFollowing } : user,
      ),
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <ArrowLeft color={COLORS.text} size={22} />
        </TouchableOpacity>
        <Text style={styles.title}>{tab === 'followers' ? 'Followers' : 'Following'}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.tabs}>
        {tabs.map((item) => (
          <TouchableOpacity
            key={item}
            style={[styles.tab, tab === item && styles.tabActive]}
            onPress={() => setTab(item)}
          >
            <Text style={[styles.tabText, tab === item && styles.tabTextActive]}>
              {item.charAt(0).toUpperCase() + item.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.userRow}>
            <TouchableOpacity style={styles.userInfo} onPress={() => router.push(`/user/${item.id}`)}>
              {item.avatarUrl ? (
                <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
              ) : (
                <View style={styles.avatar} />
              )}
              <View>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.username}>@{item.username}</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.followBtn, item.isFollowing && styles.followingBtn]}
              onPress={() => toggleFollow(item)}
            >
              <Text style={[styles.followBtnText, item.isFollowing && styles.followingBtnText]}>
                {item.isFollowing ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
        showsVerticalScrollIndicator={false}
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
    paddingHorizontal: SPACING.lg,
    paddingVertical: 13,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  headerButton: { padding: SPACING.xs },
  headerSpacer: { width: 30 },
  title: { fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold, color: COLORS.text },
  tabs: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: COLORS.border },
  tab: { flex: 1, paddingVertical: 13, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: COLORS.primary },
  tabText: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.semibold, color: COLORS.textTertiary },
  tabTextActive: { color: COLORS.primary },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.borderLight,
  },
  userInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatar: { width: 46, height: 46, borderRadius: 23, marginRight: SPACING.md, backgroundColor: COLORS.border },
  name: { fontWeight: FONT_WEIGHT.bold, fontSize: FONT_SIZE.sm, color: COLORS.text },
  username: { color: COLORS.textTertiary, fontSize: FONT_SIZE.sm, marginTop: 2 },
  followBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: 18,
    paddingVertical: SPACING.sm,
  },
  followingBtn: { backgroundColor: COLORS.background, borderWidth: 1.5, borderColor: COLORS.border },
  followBtnText: { color: COLORS.white, fontWeight: FONT_WEIGHT.bold, fontSize: FONT_SIZE.sm },
  followingBtnText: { color: COLORS.text },
});

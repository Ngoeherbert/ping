import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Bookmark, Film, Grid3x3, QrCode, Settings } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { API_URL, COLORS } from '@/lib/constants';
import { useAuthStore } from '@/store/authStore';
import { useProfileStore } from '@/store/profileStore';
import type { Post } from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_SIZE = (SCREEN_WIDTH - 2) / 3;
const PROFILE_TABS = [
  { id: 'posts', Icon: Grid3x3 },
  { id: 'reels', Icon: Film },
  { id: 'saved', Icon: Bookmark },
] as const;

type ProfileTab = (typeof PROFILE_TABS)[number]['id'];

export default function ProfileScreen() {
  const { user } = useAuthStore();
  const { fetchProfile, profiles } = useProfileStore();
  const [posts, setPosts] = useState<Post[]>([]);
  const [tab, setTab] = useState<ProfileTab>('posts');
  const router = useRouter();
  const profile = user ? profiles[user.id] : null;

  useEffect(() => {
    if (!user?.id) return;

    fetchProfile(user.id);
    fetch(`${API_URL}/api/users/${user.id}/posts`)
      .then((response) => response.json())
      .then((data) => setPosts(data.posts ?? []))
      .catch(() => setPosts([]));
  }, [fetchProfile, user?.id]);

  const visiblePosts = useMemo(() => {
    if (tab === 'reels') return posts.filter((post) => post.type === 'reel');
    if (tab === 'saved') return posts.filter((post) => post.isSaved);
    return posts.filter((post) => post.type !== 'reel');
  }, [posts, tab]);

  const stats = [
    { label: 'Posts', value: profile?.postsCount ?? user?.postsCount ?? posts.length },
    { label: 'Followers', value: profile?.followersCount ?? user?.followersCount ?? 0 },
    { label: 'Following', value: profile?.followingCount ?? user?.followingCount ?? 0 },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.coverWrapper}>
          {profile?.coverUrl ? (
            <Image source={{ uri: profile.coverUrl }} style={styles.cover} />
          ) : (
            <View style={styles.cover} />
          )}
        </View>

        <View style={styles.avatarRow}>
          {user?.avatarUrl ? (
            <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatar} />
          )}
          <View style={styles.profileActions}>
            <TouchableOpacity style={styles.editButton} onPress={() => router.push('/edit-profile')}>
              <Text style={styles.editText}>Edit Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/qr-profile')}>
              <QrCode color={COLORS.text} size={18} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/settings')}>
              <Settings color={COLORS.text} size={18} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{user?.name ?? 'Your Profile'}</Text>
            {profile?.isVerified ? <View style={styles.verifiedBadge} /> : null}
          </View>
          {user?.username ? <Text style={styles.username}>@{user.username}</Text> : null}
          {profile?.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}
          {profile?.website ? <Text style={styles.website}>{profile.website}</Text> : null}
        </View>

        <View style={styles.stats}>
          {stats.map((stat) => (
            <TouchableOpacity
              key={stat.label}
              style={styles.statItem}
              onPress={() => {
                if (!user?.id || stat.label === 'Posts') return;
                router.push(`/followers/${user.id}?tab=${stat.label === 'Followers' ? 'followers' : 'following'}`);
              }}
            >
              <Text style={styles.statValue}>{formatCount(stat.value ?? 0)}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.tabs}>
          {PROFILE_TABS.map(({ id, Icon }) => (
            <TouchableOpacity
              key={id}
              style={[styles.tab, tab === id && styles.tabActive]}
              onPress={() => setTab(id)}
            >
              <Icon color={tab === id ? COLORS.primary : COLORS.muted} size={22} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.grid}>
          {visiblePosts.map((post, index) => (
            <TouchableOpacity
              key={post.id}
              onPress={() => router.push(`/post/${post.id}`)}
              style={[styles.gridItem, index % 3 !== 2 && styles.gridItemRight]}
            >
              {post.media?.[0]?.url ? (
                <Image source={{ uri: post.media[0].url }} style={styles.gridImage} resizeMode="cover" />
              ) : (
                <View style={styles.gridImage} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function formatCount(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(value);
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  coverWrapper: { height: 150 },
  cover: { width: '100%', height: '100%', backgroundColor: '#EEEEEE' },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: -40,
    marginBottom: 12,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    borderColor: COLORS.background,
    backgroundColor: '#EEEEEE',
  },
  profileActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  editButton: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  editText: { fontWeight: '700', color: COLORS.text, fontSize: 13 },
  iconButton: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 10,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: { paddingHorizontal: 16, marginBottom: 16 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontSize: 20, fontWeight: '800', color: COLORS.text },
  verifiedBadge: { width: 18, height: 18, borderRadius: 9, backgroundColor: COLORS.primary },
  username: { color: COLORS.textSecondary, fontSize: 14, marginTop: 2 },
  bio: { color: COLORS.text, fontSize: 14, marginTop: 6, lineHeight: 20 },
  website: { color: COLORS.primary, fontSize: 13, marginTop: 4 },
  stats: {
    flexDirection: 'row',
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: COLORS.border,
    marginBottom: 2,
  },
  statItem: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  statLabel: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  tabs: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: COLORS.border },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: COLORS.primary },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  gridItem: { width: GRID_SIZE, height: GRID_SIZE, marginBottom: 1 },
  gridItemRight: { marginRight: 1 },
  gridImage: { width: '100%', height: '100%', backgroundColor: '#EEEEEE' },
});

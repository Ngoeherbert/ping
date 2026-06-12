import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Film, Grid3x3, MoreHorizontal } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { apiFetch } from '@/lib/apiFetch';
import { API_URL, BORDER_RADIUS, COLORS, FONT_SIZE, FONT_WEIGHT, SPACING } from '@/lib/constants';
import { useProfileStore } from '@/store/profileStore';
import type { Post } from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_SIZE = (SCREEN_WIDTH - 2) / 3;

type ProfileTab = 'posts' | 'reels';

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profiles, fetchProfile, followUser, unfollowUser } = useProfileStore();
  const [posts, setPosts] = useState<Post[]>([]);
  const [tab, setTab] = useState<ProfileTab>('posts');
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const profile = id ? profiles[id] : null;

  useEffect(() => {
    if (!id) return;

    setIsLoading(true);
    fetchProfile(id).finally(() => setIsLoading(false));
    fetch(`${API_URL}/api/users/${id}/posts`)
      .then((response) => response.json())
      .then((data) => setPosts(data.posts ?? []))
      .catch(() => setPosts([]));
  }, [fetchProfile, id]);

  const visiblePosts = useMemo(
    () => posts.filter((post) => (tab === 'posts' ? post.type !== 'reel' : post.type === 'reel')),
    [posts, tab],
  );

  const handleFollowToggle = async () => {
    if (!id) return;
    if (profile?.isFollowing) {
      await unfollowUser(id);
    } else {
      await followUser(id);
    }
  };

  const startConversation = async () => {
    if (!id) return;
    const res = await apiFetch(`${API_URL}/api/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: id }),
    });
    const data = await res.json();
    if (data.conversationId) router.push(`/messages/${data.conversationId}`);
  };

  if (isLoading || !profile) {
    return (
      <SafeAreaView style={styles.loader}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </SafeAreaView>
    );
  }

  const stats = [
    { label: 'Posts', value: profile.postsCount ?? 0 },
    { label: 'Followers', value: profile.followersCount ?? 0 },
    { label: 'Following', value: profile.followingCount ?? 0 },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <ArrowLeft color={COLORS.text} size={22} />
        </TouchableOpacity>
        <Text style={styles.headerUsername}>@{profile.username}</Text>
        <TouchableOpacity style={styles.headerButton}>
          <MoreHorizontal color={COLORS.text} size={22} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.coverWrapper}>
          <Image
            source={{ uri: profile.coverUrl ?? 'https://via.placeholder.com/400x140' }}
            style={styles.cover}
          />
        </View>

        <View style={styles.avatarRow}>
          <Image source={{ uri: profile.avatarUrl ?? undefined }} style={styles.avatar} />
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.followBtn, profile.isFollowing && styles.followingBtn]}
              onPress={handleFollowToggle}
            >
              <Text style={[styles.followBtnText, profile.isFollowing && styles.followingBtnText]}>
                {profile.isFollowing ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.messageBtn} onPress={startConversation}>
              <Text style={styles.messageBtnText}>Message</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{profile.name}</Text>
            {profile.isVerified && <View style={styles.verifiedBadge} />}
          </View>
          <Text style={styles.username}>@{profile.username}</Text>
          {profile.bio && <Text style={styles.bio}>{profile.bio}</Text>}
          {profile.website && <Text style={styles.website}>{profile.website}</Text>}
        </View>

        <View style={styles.stats}>
          {stats.map((stat) => (
            <TouchableOpacity
              key={stat.label}
              style={styles.statItem}
              onPress={() => {
                if (!id || stat.label === 'Posts') return;
                router.push(`/followers/${id}?tab=${stat.label === 'Followers' ? 'followers' : 'following'}`);
              }}
            >
              <Text style={styles.statValue}>{formatCount(stat.value)}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.tabs}>
          {[
            { id: 'posts' as const, Icon: Grid3x3 },
            { id: 'reels' as const, Icon: Film },
          ].map(({ id: tabId, Icon }) => (
            <TouchableOpacity
              key={tabId}
              style={[styles.tab, tab === tabId && styles.tabActive]}
              onPress={() => setTab(tabId)}
            >
              <Icon color={tab === tabId ? COLORS.primary : COLORS.textTertiary} size={22} />
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
              <Image
                source={{ uri: post.media?.[0]?.url }}
                style={styles.gridImage}
                resizeMode="cover"
              />
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
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
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
  headerUsername: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.bold, color: COLORS.text },
  coverWrapper: { height: 140 },
  cover: { width: '100%', height: '100%', backgroundColor: COLORS.border },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    marginTop: -44,
    marginBottom: SPACING.md,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    borderColor: COLORS.white,
    backgroundColor: COLORS.border,
  },
  actionButtons: { flexDirection: 'row', gap: SPACING.sm, paddingBottom: 6 },
  followBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: 22,
    paddingVertical: 9,
  },
  followingBtn: { backgroundColor: COLORS.background, borderWidth: 1.5, borderColor: COLORS.border },
  followBtnText: { color: COLORS.white, fontWeight: FONT_WEIGHT.bold, fontSize: FONT_SIZE.sm },
  followingBtnText: { color: COLORS.text },
  messageBtn: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 9,
  },
  messageBtnText: { fontWeight: FONT_WEIGHT.bold, color: COLORS.text, fontSize: FONT_SIZE.sm },
  info: { paddingHorizontal: SPACING.lg, marginBottom: SPACING.lg },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontSize: FONT_SIZE.xl, fontWeight: FONT_WEIGHT.extrabold, color: COLORS.text },
  verifiedBadge: { width: 18, height: 18, borderRadius: 9, backgroundColor: COLORS.primary },
  username: { color: COLORS.textSecondary, fontSize: FONT_SIZE.sm, marginTop: 2 },
  bio: { color: COLORS.text, fontSize: FONT_SIZE.sm, marginTop: 6, lineHeight: 20 },
  website: { color: COLORS.primary, fontSize: FONT_SIZE.sm, marginTop: SPACING.xs },
  stats: {
    flexDirection: 'row',
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: COLORS.border,
    marginBottom: 2,
  },
  statItem: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: FONT_WEIGHT.extrabold, color: COLORS.text },
  statLabel: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  tabs: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: COLORS.border },
  tab: { flex: 1, paddingVertical: SPACING.md, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: COLORS.primary },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  gridItem: { width: GRID_SIZE, height: GRID_SIZE, marginBottom: 1 },
  gridItemRight: { marginRight: 1 },
  gridImage: { width: '100%', height: '100%', backgroundColor: COLORS.border },
});

import { useRouter } from 'expo-router';
import { Bookmark, Heart, MessageCircle, MoreHorizontal, Send } from 'lucide-react-native';
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '@/lib/constants';
import { useFeedStore } from '@/store/feedStore';
import type { Post } from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  const router = useRouter();
  const { likePost, unlikePost, savePost } = useFeedStore();
  const user = post.user;
  const media = post.media?.[0];

  const toggleLike = () => {
    if (post.isLiked) {
      unlikePost(post.id);
    } else {
      likePost(post.id);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.userRow}
          onPress={() => user && router.push(`/user/${user.id}`)}
          disabled={!user}
        >
          {user?.avatarUrl ? (
            <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatar} />
          )}
          <View>
            <View style={styles.nameRow}>
              <Text style={styles.username}>{user?.username ?? 'unknown'}</Text>
              {user?.isVerified ? <View style={styles.verifiedBadge} /> : null}
            </View>
            {post.location ? <Text style={styles.location}>{post.location}</Text> : null}
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.moreButton}>
          <MoreHorizontal color={COLORS.textSecondary} size={20} />
        </TouchableOpacity>
      </View>

      {media ? (
        <TouchableOpacity onPress={() => router.push(`/post/${post.id}`)}>
          <Image
            source={{ uri: media.url }}
            style={[styles.media, { height: SCREEN_WIDTH }]}
            resizeMode="cover"
          />
        </TouchableOpacity>
      ) : null}

      <View style={styles.actions}>
        <View style={styles.leftActions}>
          <TouchableOpacity onPress={toggleLike} style={styles.actionButton}>
            <Heart
              color={post.isLiked ? COLORS.primary : COLORS.text}
              fill={post.isLiked ? COLORS.primary : 'none'}
              size={24}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push(`/post/${post.id}`)}
          >
            <MessageCircle color={COLORS.text} size={24} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Send color={COLORS.text} size={24} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={() => savePost(post.id)}>
          <Bookmark
            color={post.isSaved ? COLORS.primary : COLORS.text}
            fill={post.isSaved ? COLORS.primary : 'none'}
            size={24}
          />
        </TouchableOpacity>
      </View>

      {post.likesCount > 0 ? (
        <Text style={styles.likesText}>
          {post.likesCount.toLocaleString()} {post.likesCount === 1 ? 'like' : 'likes'}
        </Text>
      ) : null}

      {post.caption ? (
        <View style={styles.captionRow}>
          <Text style={styles.captionUsername}>{user?.username ?? 'unknown'} </Text>
          <Text style={styles.captionText}>{post.caption}</Text>
        </View>
      ) : null}

      {post.commentsCount > 0 ? (
        <TouchableOpacity onPress={() => router.push(`/post/${post.id}`)}>
          <Text style={styles.commentsText}>View all {post.commentsCount} comments</Text>
        </TouchableOpacity>
      ) : null}

      <Text style={styles.timestamp}>{formatRelativeTime(post.createdAt)}</Text>
    </View>
  );
}

function formatRelativeTime(dateValue: string | Date) {
  const diff = Date.now() - new Date(dateValue).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

const styles = StyleSheet.create({
  container: { backgroundColor: COLORS.background, marginBottom: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  userRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
    backgroundColor: '#EEEEEE',
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  username: { fontWeight: '700', fontSize: 14, color: COLORS.text },
  verifiedBadge: { width: 14, height: 14, borderRadius: 7, backgroundColor: COLORS.primary },
  location: { fontSize: 12, color: COLORS.textSecondary, marginTop: 1 },
  moreButton: { padding: 4 },
  media: { width: '100%', backgroundColor: '#EEEEEE' },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  leftActions: { flexDirection: 'row', gap: 4 },
  actionButton: { padding: 4 },
  likesText: {
    paddingHorizontal: 14,
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  captionRow: { flexDirection: 'row', paddingHorizontal: 14, marginBottom: 4 },
  captionUsername: { fontSize: 13, fontWeight: '700', color: COLORS.text },
  captionText: { fontSize: 13, color: COLORS.text, flex: 1 },
  commentsText: { paddingHorizontal: 14, fontSize: 13, color: COLORS.muted, marginBottom: 4 },
  timestamp: { paddingHorizontal: 14, fontSize: 11, color: '#BBBBBB', marginBottom: 10 },
});

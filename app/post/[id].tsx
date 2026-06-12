import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Bookmark,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Send,
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { API_URL, BORDER_RADIUS, COLORS, FONT_SIZE, FONT_WEIGHT, SPACING } from '@/lib/constants';
import { useAuthStore } from '@/store/authStore';
import { useFeedStore } from '@/store/feedStore';
import type { Comment, Post } from '@/types';

type ReplyTarget = {
  id: string;
  username: string;
};

type CommentPayload = {
  content: string;
  parentId?: string;
};

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const cachedPost = useFeedStore((state) => state.posts.find((item) => item.id === id));
  const [post, setPost] = useState<Post | null>(cachedPost ?? null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [isLoading, setIsLoading] = useState(!cachedPost);
  const [replyTo, setReplyTo] = useState<ReplyTarget | null>(null);
  const { likePost, unlikePost, savePost } = useFeedStore();
  const { user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!id) return;
    loadPost();
    loadComments();
  }, [id]);

  const loadPost = async () => {
    if (!id) return;
    setIsLoading(true);
    const res = await fetch(`${API_URL}/api/posts/${id}`);
    const data = await res.json();
    setPost(data.post ?? null);
    setIsLoading(false);
  };

  const loadComments = async () => {
    if (!id) return;
    const res = await fetch(`${API_URL}/api/posts/${id}/comments`);
    const data = await res.json();
    setComments(data.comments ?? []);
  };

  const togglePostLike = async () => {
    if (!post) return;
    if (post.isLiked) {
      await unlikePost(post.id);
      setPost({ ...post, isLiked: false, likesCount: Math.max(0, post.likesCount - 1) });
    } else {
      await likePost(post.id);
      setPost({ ...post, isLiked: true, likesCount: post.likesCount + 1 });
    }
  };

  const togglePostSave = async () => {
    if (!post) return;
    await savePost(post.id);
    setPost({ ...post, isSaved: !post.isSaved });
  };

  const submitComment = async () => {
    if (!id || !commentText.trim()) return;

    const body: CommentPayload = { content: commentText.trim() };
    if (replyTo) body.parentId = replyTo.id;

    const res = await fetch(`${API_URL}/api/posts/${id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();

    if (data.comment) {
      setComments((prev) => [data.comment, ...prev]);
      setPost((current) =>
        current ? { ...current, commentsCount: current.commentsCount + 1 } : current,
      );
    }
    setCommentText('');
    setReplyTo(null);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loader}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </SafeAreaView>
    );
  }

  if (!post?.user) {
    return (
      <SafeAreaView style={styles.loader}>
        <Text style={styles.emptyText}>Post not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <ArrowLeft color={COLORS.text} size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Post</Text>
        <TouchableOpacity style={styles.headerButton}>
          <MoreHorizontal color={COLORS.text} size={22} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={90}
      >
        <FlatList
          data={comments}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <>
              <TouchableOpacity
                style={styles.postHeader}
                onPress={() => post.user && router.push(`/user/${post.user.id}`)}
              >
                <Image source={{ uri: post.user?.avatarUrl ?? undefined }} style={styles.avatar} />
                <View style={styles.authorInfo}>
                  <Text style={styles.username}>{post.user?.username ?? 'unknown'}</Text>
                  {post.location && <Text style={styles.location}>{post.location}</Text>}
                </View>
                <MoreHorizontal color={COLORS.textSecondary} size={18} />
              </TouchableOpacity>

              {post.media?.[0] && (
                <Image
                  source={{ uri: post.media[0].url }}
                  style={styles.postImage}
                  resizeMode="cover"
                />
              )}

              <View style={styles.actions}>
                <View style={styles.leftActions}>
                  <TouchableOpacity style={styles.actionBtn} onPress={togglePostLike}>
                    <Heart
                      color={post.isLiked ? COLORS.primary : COLORS.text}
                      fill={post.isLiked ? COLORS.primary : 'none'}
                      size={26}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionBtn}>
                    <MessageCircle color={COLORS.text} size={26} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionBtn}>
                    <Send color={COLORS.text} size={26} />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity onPress={togglePostSave} style={styles.actionBtn}>
                  <Bookmark
                    color={post.isSaved ? COLORS.primary : COLORS.text}
                    fill={post.isSaved ? COLORS.primary : 'none'}
                    size={26}
                  />
                </TouchableOpacity>
              </View>

              <Text style={styles.likesText}>
                {post.likesCount.toLocaleString()} {post.likesCount === 1 ? 'like' : 'likes'}
              </Text>

              {post.caption && (
                <View style={styles.captionRow}>
                  <Text style={styles.captionUsername}>{post.user.username} </Text>
                  <Text style={styles.captionText}>{post.caption}</Text>
                </View>
              )}

              <View style={styles.commentsDivider}>
                <Text style={styles.commentsHeading}>Comments</Text>
              </View>
            </>
          }
          renderItem={({ item }) => (
            <CommentRow
              comment={item}
              onReply={(commentId, username) => setReplyTo({ id: commentId, username })}
              onLike={async (commentId) => {
                await fetch(`${API_URL}/api/comments/${commentId}/like`, { method: 'POST' });
              }}
            />
          )}
          contentContainerStyle={styles.list}
        />

        <View style={styles.inputWrapper}>
          {replyTo && (
            <View style={styles.replyIndicator}>
              <Text style={styles.replyText}>Replying to @{replyTo.username}</Text>
              <TouchableOpacity onPress={() => setReplyTo(null)}>
                <Text style={styles.cancelReply}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
          <View style={styles.inputRow}>
            <Image source={{ uri: user?.avatarUrl ?? undefined }} style={styles.inputAvatar} />
            <TextInput
              style={styles.commentInput}
              placeholder={replyTo ? `Reply to @${replyTo.username}…` : 'Add a comment…'}
              placeholderTextColor={COLORS.textTertiary}
              value={commentText}
              onChangeText={setCommentText}
              multiline
            />
            <TouchableOpacity
              onPress={submitComment}
              disabled={!commentText.trim()}
              style={[styles.sendBtn, !commentText.trim() && styles.sendBtnDisabled]}
            >
              <Text style={styles.sendText}>Post</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function CommentRow({
  comment,
  onReply,
  onLike,
}: {
  comment: Comment;
  onReply: (id: string, username: string) => void;
  onLike: (id: string) => void;
}) {
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(comment.likesCount);

  const handleLike = () => {
    setLiked((current) => !current);
    setLikesCount((current) => (liked ? Math.max(0, current - 1) : current + 1));
    onLike(comment.id);
  };

  return (
    <View style={styles.commentRow}>
      <Image source={{ uri: comment.user.avatarUrl ?? undefined }} style={styles.commentAvatar} />
      <View style={styles.commentBody}>
        <View style={styles.commentBubble}>
          <Text style={styles.commentUsername}>{comment.user.username} </Text>
          <Text style={styles.commentContent}>{comment.content}</Text>
        </View>
        <View style={styles.commentMeta}>
          <Text style={styles.commentTime}>{formatRelativeTime(comment.createdAt)}</Text>
          {likesCount > 0 && <Text style={styles.commentLikes}>{likesCount} likes</Text>}
          <TouchableOpacity onPress={() => onReply(comment.id, comment.user.username)}>
            <Text style={styles.commentReply}>Reply</Text>
          </TouchableOpacity>
        </View>
        {comment.replies?.map((reply) => (
          <CommentRow key={reply.id} comment={reply} onReply={onReply} onLike={onLike} />
        ))}
      </View>
      <TouchableOpacity style={styles.commentLikeBtn} onPress={handleLike}>
        <Heart
          color={liked ? COLORS.primary : COLORS.textDisabled}
          fill={liked ? COLORS.primary : 'none'}
          size={14}
        />
      </TouchableOpacity>
    </View>
  );
}

function formatRelativeTime(date: string | Date) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  emptyText: { color: COLORS.textSecondary, fontSize: FONT_SIZE.md },
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
  headerTitle: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.bold, color: COLORS.text },
  keyboardView: { flex: 1 },
  list: { paddingBottom: 80 },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  avatar: { width: 38, height: 38, borderRadius: 19, marginRight: 10, backgroundColor: COLORS.border },
  authorInfo: { flex: 1 },
  username: { fontWeight: FONT_WEIGHT.bold, fontSize: FONT_SIZE.sm, color: COLORS.text },
  location: { fontSize: 12, color: COLORS.textTertiary, marginTop: 1 },
  postImage: { width: '100%', aspectRatio: 1, backgroundColor: COLORS.border },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  leftActions: { flexDirection: 'row', gap: SPACING.xs },
  actionBtn: { padding: SPACING.xs },
  likesText: {
    paddingHorizontal: SPACING.lg,
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  captionRow: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: SPACING.lg, marginBottom: 6 },
  captionUsername: { fontWeight: FONT_WEIGHT.bold, fontSize: FONT_SIZE.sm, color: COLORS.text },
  captionText: { fontSize: FONT_SIZE.sm, color: COLORS.text },
  commentsDivider: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: 10,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.borderLight,
    marginTop: SPACING.xs,
  },
  commentsHeading: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.bold, color: COLORS.textSecondary },
  commentRow: { flexDirection: 'row', paddingHorizontal: 14, paddingVertical: SPACING.sm },
  commentAvatar: { width: 34, height: 34, borderRadius: 17, marginRight: 10, backgroundColor: COLORS.border },
  commentBody: { flex: 1 },
  commentBubble: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: BORDER_RADIUS.lg,
    padding: 10,
  },
  commentUsername: { fontWeight: FONT_WEIGHT.bold, fontSize: FONT_SIZE.sm, color: COLORS.text },
  commentContent: { fontSize: FONT_SIZE.sm, color: COLORS.text },
  commentMeta: { flexDirection: 'row', gap: SPACING.md, marginTop: 6, paddingHorizontal: SPACING.xs },
  commentTime: { fontSize: FONT_SIZE.xs, color: COLORS.textDisabled },
  commentLikes: { fontSize: FONT_SIZE.xs, color: COLORS.textDisabled },
  commentReply: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary, fontWeight: FONT_WEIGHT.semibold },
  commentLikeBtn: { paddingLeft: 10, paddingTop: SPACING.md },
  inputWrapper: { borderTopWidth: 0.5, borderTopColor: COLORS.border },
  replyIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.primaryLight,
  },
  replyText: { fontSize: 12, color: COLORS.primary, fontWeight: FONT_WEIGHT.semibold },
  cancelReply: { color: COLORS.textTertiary, fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.semibold },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    gap: 10,
  },
  inputAvatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: COLORS.border },
  commentInput: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: BORDER_RADIUS.xl,
    paddingHorizontal: 14,
    paddingVertical: 9,
    fontSize: FONT_SIZE.sm,
    color: COLORS.text,
    maxHeight: 90,
  },
  sendBtn: { paddingBottom: 9 },
  sendBtnDisabled: { opacity: 0.4 },
  sendText: { color: COLORS.primary, fontWeight: FONT_WEIGHT.extrabold, fontSize: FONT_SIZE.sm },
});

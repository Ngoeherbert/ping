import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, Text } from 'react-native';
import { PostCard } from '@/components/feed/PostCard';
import { API_URL, COLORS } from '@/lib/constants';
import { useFeedStore } from '@/store/feedStore';
import type { Post } from '@/types';

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const cachedPost = useFeedStore((state) => state.posts.find((post) => post.id === id));
  const [post, setPost] = useState<Post | null>(cachedPost ?? null);
  const [isLoading, setIsLoading] = useState(!cachedPost);

  useEffect(() => {
    if (!id || cachedPost) return;

    setIsLoading(true);
    fetch(`${API_URL}/api/posts/${id}`)
      .then((response) => response.json())
      .then((data) => setPost(data.post ?? null))
      .catch(() => setPost(null))
      .finally(() => setIsLoading(false));
  }, [cachedPost, id]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  if (!post) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.emptyText}>Post not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <PostCard post={post} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background },
  emptyText: { color: COLORS.textSecondary, fontSize: 15 },
});

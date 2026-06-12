import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect } from 'react';
import { FlatList, RefreshControl, StatusBar, StyleSheet } from 'react-native';
import { FeedHeader } from '@/components/feed/FeedHeader';
import { PostCard } from '@/components/feed/PostCard';
import { StoriesBar } from '@/components/stories/StoriesBar';
import { COLORS } from '@/lib/constants';
import { useFeedStore } from '@/store/feedStore';
import { useStoryStore } from '@/store/storyStore';

export default function HomeScreen() {
  const { posts, isRefreshing, fetchFeed, refreshFeed, loadMore } = useFeedStore();
  const { fetchStories } = useStoryStore();

  useEffect(() => {
    fetchFeed();
    fetchStories();
  }, [fetchFeed, fetchStories]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <FeedHeader />
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={<StoriesBar />}
        renderItem={({ item }) => <PostCard post={item} />}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={refreshFeed} tintColor={COLORS.primary} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  list: { paddingBottom: 80 },
});

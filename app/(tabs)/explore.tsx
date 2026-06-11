import { useRouter } from 'expo-router';
import { Search, X } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { API_URL, COLORS } from '@/lib/constants';
import type { Post, UserProfile } from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_SIZE = (SCREEN_WIDTH - 3) / 3;
const SEARCH_TABS = ['top', 'accounts', 'tags', 'places'] as const;

type SearchTab = (typeof SEARCH_TABS)[number];
type SearchResults = { posts: Post[]; users: UserProfile[] };

export default function ExploreScreen() {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<SearchTab>('top');
  const [results, setResults] = useState<SearchResults>({ posts: [], users: [] });
  const [trendingPosts, setTrendingPosts] = useState<Post[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetch(`${API_URL}/api/explore/trending`)
      .then((response) => response.json())
      .then((data) => setTrendingPosts(data.posts ?? []))
      .catch(() => setTrendingPosts([]));
  }, []);

  const search = useCallback(async (value: string) => {
    if (!value.trim()) {
      setResults({ posts: [], users: [] });
      return;
    }

    const response = await fetch(`${API_URL}/api/explore/search?q=${encodeURIComponent(value)}`);
    const data = await response.json();
    setResults({ posts: data.posts ?? [], users: data.users ?? [] });
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => search(query), 350);
    return () => clearTimeout(timeout);
  }, [query, search]);

  const showSearch = query.length > 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchBar}>
        <Search color={COLORS.muted} size={18} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search people, posts, tags..."
          placeholderTextColor={COLORS.muted}
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
        />
        {query.length > 0 ? (
          <TouchableOpacity onPress={() => setQuery('')}>
            <X color={COLORS.muted} size={18} />
          </TouchableOpacity>
        ) : null}
      </View>

      {showSearch ? (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs}>
            {SEARCH_TABS.map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, activeTab === tab && styles.tabActive]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {(activeTab === 'top' || activeTab === 'accounts') &&
            results.users.map((user) => (
              <TouchableOpacity
                key={user.id}
                style={styles.userRow}
                onPress={() => router.push(`/user/${user.id}`)}
              >
                {user.avatarUrl ? (
                  <Image source={{ uri: user.avatarUrl }} style={styles.userAvatar} />
                ) : (
                  <View style={styles.userAvatar} />
                )}
                <View>
                  <Text style={styles.userName}>{user.name}</Text>
                  <Text style={styles.userUsername}>@{user.username}</Text>
                </View>
              </TouchableOpacity>
            ))}
        </>
      ) : (
        <FlatList
          data={trendingPosts}
          keyExtractor={(item) => item.id}
          numColumns={3}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              onPress={() => router.push(`/post/${item.id}`)}
              style={[styles.gridItem, index % 3 === 1 && styles.gridItemMiddle]}
            >
              {item.media?.[0]?.url ? (
                <Image source={{ uri: item.media[0].url }} style={styles.gridImage} resizeMode="cover" />
              ) : (
                <View style={styles.gridImage} />
              )}
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={styles.gridSeparator} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    marginHorizontal: 12,
    marginVertical: 10,
    paddingHorizontal: 12,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: COLORS.text, paddingVertical: 12 },
  tabs: { paddingHorizontal: 12, marginBottom: 8 },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    marginRight: 8,
  },
  tabActive: { backgroundColor: COLORS.primary },
  tabText: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '600' },
  tabTextActive: { color: '#fff' },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F0F0F0',
  },
  userAvatar: { width: 44, height: 44, borderRadius: 22, marginRight: 12, backgroundColor: '#EEEEEE' },
  userName: { fontWeight: '700', fontSize: 14, color: COLORS.text },
  userUsername: { fontSize: 13, color: COLORS.muted, marginTop: 2 },
  gridItem: { flex: 1, margin: 0.75 },
  gridItemMiddle: {},
  gridImage: { width: '100%', height: GRID_SIZE, backgroundColor: '#EEEEEE' },
  gridSeparator: { height: 1.5 },
});

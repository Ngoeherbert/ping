import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Image, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '@/lib/constants';
import { useStoryStore } from '@/store/storyStore';

export default function StoryViewerScreen() {
  const router = useRouter();
  const { storyGroups, activeGroupIndex, activeStoryIndex, nextStory, prevStory } = useStoryStore();
  const group = storyGroups[activeGroupIndex];
  const story = group?.stories[activeStoryIndex];

  if (!group || !story) {
    return (
      <SafeAreaView style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeft color="#fff" size={28} />
        </TouchableOpacity>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Story unavailable</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <ChevronLeft color="#fff" size={28} />
      </TouchableOpacity>
      <View style={styles.header}>
        {group.user.avatarUrl ? <Image source={{ uri: group.user.avatarUrl }} style={styles.avatar} /> : <View style={styles.avatar} />}
        <Text style={styles.username}>{group.user.username}</Text>
      </View>
      <TouchableOpacity style={styles.leftTapZone} onPress={prevStory} />
      <TouchableOpacity style={styles.rightTapZone} onPress={nextStory} />
      {story.mediaUrl ? (
        <Image source={{ uri: story.mediaUrl }} style={styles.media} resizeMode="contain" />
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>{story.text}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  backButton: { position: 'absolute', top: 48, left: 12, zIndex: 3, padding: 8 },
  header: {
    position: 'absolute',
    top: 52,
    left: 56,
    right: 16,
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#333', marginRight: 8 },
  username: { color: '#fff', fontWeight: '700' },
  media: { width: '100%', height: '100%' },
  leftTapZone: { position: 'absolute', left: 0, top: 96, bottom: 0, width: '50%', zIndex: 1 },
  rightTapZone: { position: 'absolute', right: 0, top: 96, bottom: 0, width: '50%', zIndex: 1 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyText: { color: COLORS.background, fontSize: 16, textAlign: 'center' },
});

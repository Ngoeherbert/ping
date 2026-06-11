import { useRouter } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '@/lib/constants';
import { useAuthStore } from '@/store/authStore';
import { useStoryStore } from '@/store/storyStore';

export function StoriesBar() {
  const { storyGroups, setActiveGroup } = useStoryStore();
  const { user } = useAuthStore();
  const router = useRouter();

  const openStory = (index: number) => {
    setActiveGroup(index);
    router.push('/story-viewer');
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      <TouchableOpacity style={styles.item} onPress={() => router.push('/(tabs)/create')}>
        <View style={styles.addStoryWrapper}>
          {user?.avatarUrl ? (
            <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatar} />
          )}
          <View style={styles.addBadge}>
            <Plus color="#fff" size={12} />
          </View>
        </View>
        <Text style={styles.label} numberOfLines={1}>
          Your Story
        </Text>
      </TouchableOpacity>

      {storyGroups.map((group, index) => (
        <TouchableOpacity key={group.user.id} style={styles.item} onPress={() => openStory(index)}>
          <View style={styles.ringWrapper}>
            {group.user.avatarUrl ? (
              <Image source={{ uri: group.user.avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatar} />
            )}
          </View>
          <Text style={styles.label} numberOfLines={1}>
            {group.user.username}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 12, paddingVertical: 12, gap: 16 },
  item: { alignItems: 'center', width: 64 },
  addStoryWrapper: { position: 'relative', marginBottom: 6 },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#EEEEEE' },
  addBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    borderWidth: 2,
    borderColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringWrapper: {
    padding: 2,
    borderRadius: 32,
    borderWidth: 2.5,
    borderColor: COLORS.primary,
    marginBottom: 6,
  },
  label: { fontSize: 11, color: COLORS.text, textAlign: 'center' },
});

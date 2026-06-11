import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Send, X } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  Image,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { StoryActions } from '@/components/stories/StoryActions';
import { StoryViewersList } from '@/components/stories/StoryViewersList';
import { COLORS, FONT_SIZE, FONT_WEIGHT, SPACING } from '@/lib/constants';
import { useAuthStore } from '@/store/authStore';
import { useStoryStore } from '@/store/storyStore';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const STORY_DURATION = 5000;

export default function StoryViewerScreen() {
  const {
    storyGroups,
    activeGroupIndex,
    activeStoryIndex,
    nextStory,
    prevStory,
    viewStory,
  } = useStoryStore();
  const router = useRouter();
  const { user } = useAuthStore();
  const progress = useSharedValue(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  const group = storyGroups[activeGroupIndex];
  const story = group?.stories[activeStoryIndex];

  const activeProgressStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleNext = () => {
    if (!group) return;
    const atLastStory = activeStoryIndex >= group.stories.length - 1;
    const atLastGroup = activeGroupIndex >= storyGroups.length - 1;
    if (atLastStory && atLastGroup) {
      router.back();
    } else {
      nextStory();
    }
  };

  const startTimer = () => {
    clearTimer();
    progress.value = 0;
    progress.value = withTiming(1, { duration: STORY_DURATION });
    timerRef.current = setTimeout(handleNext, STORY_DURATION);
  };

  useEffect(() => {
    if (!story) return clearTimer;
    viewStory(story.id);
    startTimer();
    return clearTimer;
  }, [activeGroupIndex, activeStoryIndex, story?.id]);

  useEffect(() => {
    if (!story) return clearTimer;
    if (isPaused) {
      clearTimer();
    } else {
      startTimer();
    }
    return clearTimer;
  }, [isPaused]);

  if (!group || !story) {
    return (
      <View style={styles.container}>
        <StatusBar hidden />
        <SafeAreaView style={styles.progressContainer}>
          <View style={styles.userRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
              <X color={COLORS.white} size={22} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Story unavailable</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      <Image source={{ uri: story.mediaUrl }} style={styles.storyImage} resizeMode="cover" />

      <LinearGradient
        colors={['rgba(0,0,0,0.55)', 'rgba(0,0,0,0)']}
        style={styles.topGradient}
      />
      <LinearGradient
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.5)']}
        style={styles.bottomGradient}
      />

      <SafeAreaView style={styles.progressContainer}>
        <View style={styles.progressBars}>
          {group.stories.map((item, index) => (
            <View key={item.id} style={styles.progressBar}>
              {index < activeStoryIndex && <View style={styles.progressComplete} />}
              {index === activeStoryIndex && (
                <Animated.View style={[styles.progressActive, activeProgressStyle]} />
              )}
            </View>
          ))}
        </View>

        <View style={styles.userRow}>
          <Image source={{ uri: group.user.avatarUrl ?? undefined }} style={styles.avatar} />
          <Text style={styles.username}>{group.user.username}</Text>
          <Text style={styles.storyTime}>{formatRelativeTime(story.createdAt)}</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
            <X color={COLORS.white} size={22} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {story.text && (
        <View style={styles.textOverlay}>
          <Text style={[styles.overlayText, { color: story.textColor ?? COLORS.white }]}>
            {story.text}
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.leftTouch}
        onPress={prevStory}
        onLongPress={() => setIsPaused(true)}
        onPressOut={() => setIsPaused(false)}
        activeOpacity={1}
      />
      <TouchableOpacity
        style={styles.rightTouch}
        onPress={handleNext}
        onLongPress={() => setIsPaused(true)}
        onPressOut={() => setIsPaused(false)}
        activeOpacity={1}
      />

      <View style={styles.storyActionsWrapper}>
        <StoryActions story={story} />
      </View>

      {story.userId === user?.id && (
        <View style={styles.storyViewersWrapper}>
          <StoryViewersList storyId={story.id} viewsCount={story.viewsCount} />
        </View>
      )}

      <View style={styles.replyRow}>
        <TouchableOpacity style={styles.replyInput}>
          <Text style={styles.replyPlaceholder}>Reply to {group.user.username}…</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.replyBtn}>
          <Send color={COLORS.white} size={20} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function formatRelativeTime(date: string | Date) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.black },
  storyImage: { ...StyleSheet.absoluteFillObject, width: SCREEN_WIDTH, height: SCREEN_HEIGHT },
  topGradient: { position: 'absolute', top: 0, left: 0, right: 0, height: 180 },
  bottomGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 180 },
  progressContainer: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 3 },
  progressBars: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.sm,
    paddingTop: 10,
    gap: 3,
  },
  progressBar: {
    flex: 1,
    height: 2.5,
    backgroundColor: 'rgba(255,255,255,0.35)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressComplete: { height: '100%', width: '100%', backgroundColor: COLORS.white },
  progressActive: { height: '100%', backgroundColor: COLORS.white },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: COLORS.white,
    marginRight: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  username: { color: COLORS.white, fontWeight: FONT_WEIGHT.bold, fontSize: FONT_SIZE.sm, flex: 1 },
  storyTime: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginRight: SPACING.md },
  closeBtn: { padding: SPACING.xs },
  textOverlay: {
    position: 'absolute',
    bottom: SCREEN_HEIGHT * 0.25,
    left: SPACING.xl,
    right: SPACING.xl,
    alignItems: 'center',
    zIndex: 2,
  },
  overlayText: {
    fontSize: 22,
    fontWeight: FONT_WEIGHT.bold,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowRadius: 6,
  },
  leftTouch: { position: 'absolute', left: 0, top: 80, bottom: 100, width: '35%', zIndex: 2 },
  rightTouch: { position: 'absolute', right: 0, top: 80, bottom: 100, width: '35%', zIndex: 2 },
  storyActionsWrapper: { position: 'absolute', bottom: 100, right: SPACING.lg, zIndex: 4 },
  storyViewersWrapper: { position: 'absolute', bottom: 110, left: SPACING.lg, zIndex: 4 },
  replyRow: {
    position: 'absolute',
    bottom: 40,
    left: SPACING.lg,
    right: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    zIndex: 3,
  },
  replyInput: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.6)',
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  replyPlaceholder: { color: 'rgba(255,255,255,0.7)', fontSize: FONT_SIZE.sm },
  replyBtn: { padding: 6 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.xl },
  emptyText: { color: COLORS.white, fontSize: FONT_SIZE.md },
});

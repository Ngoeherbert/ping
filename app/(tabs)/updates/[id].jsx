import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as Haptics from "expo-haptics";
import { useVideoPlayer, VideoView } from "expo-video";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Easing,
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useTheme } from "../../../src/theme/useTheme";
import Avatar from "../../../src/components/Avatar";
import ReplySheet from "../../../src/components/ReplySheet";
import StoryViewersSheet from "../../../src/components/StoryViewersSheet";
import Icon from "../../../src/components/icons";
import { STORIES } from "../../../src/data/updates";

const SLIDE_MS = 5000; // how long each slide stays on screen
const FF_RATE = 3; // hold-to-fast-forward speed for video stories (max 16)
const CARD_RADIUS = 28;
const CLOSE_DISTANCE = 120; // drag down this far to dismiss

/* ---------- Progress bars ---------- */

function Segment({ state, progress, track, fill }) {
  const animated = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));
  return (
    <View style={[styles.segment, { backgroundColor: track }]}>
      {state === "done" ? (
        <View
          style={[styles.segmentFill, { backgroundColor: fill, width: "100%" }]}
        />
      ) : state === "active" ? (
        <Animated.View
          style={[styles.segmentFill, { backgroundColor: fill }, animated]}
        />
      ) : null}
    </View>
  );
}

/* ---------- Action button ---------- */

function ActionBtn({ icon, label, onPress, color = "#fff" }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.8 }]}
    >
      <Icon name={icon} color={color} size={20} />
    </Pressable>
  );
}

/* ---------- Slide media ---------- */

function SlideVideo({ uri, paused, fastForward }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    p.muted = false;
    p.play();
  });
  // Mirror the player into a ref: react-hooks/immutability forbids writing to
  // the hook's return value outside its initializer (same as reels/index.jsx).
  const playerRef = useRef(null);
  useEffect(() => {
    playerRef.current = player;
  });
  useEffect(() => {
    if (paused) {
      player.pause();
      return;
    }
    player.play();
    // Holding the story speeds the clip up instead of pausing it.
    if (playerRef.current) {
      playerRef.current.playbackRate = fastForward ? FF_RATE : 1;
    }
  }, [paused, fastForward, player]);
  return (
    <VideoView
      player={player}
      style={StyleSheet.absoluteFill}
      contentFit="cover"
      nativeControls={false}
      pointerEvents="none"
    />
  );
}

/* ---------- Screen ---------- */

export default function StoryViewerScreen() {
  const { id } = useLocalSearchParams();
  const { colors } = useTheme();

  // Stories browsed in this viewer, in list order: your own story walks the
  // mine list, a contact's story walks the others list (mirrors updates/index).
  const storyList = useMemo(() => {
    const current = STORIES.find((s) => s.id === id);
    if (current?.isMine) return STORIES.filter((s) => s.isMine);
    return STORIES.filter((s) => !s.isMine);
  }, [id]);

  // Story-to-story navigation is tracked in local state instead of
  // router.replace: when the target href resolves to the same route *name*
  // (updates/[id] -> updates/[id]), Expo's tab router only refocuses the
  // current route and drops the new params, so replacing the id would be a
  // silent no-op. Local state keeps the viewer mounted and swaps the story
  // underneath; the screen still opens from the right deep link.
  const [storyIdx, setStoryIdx] = useState(() =>
    storyList.findIndex((s) => s.id === id),
  );
  const story = storyList[storyIdx];

  // A story can carry `slides: [{ image, video, caption, time }]`.
  // Without it, the cover becomes a single slide.
  const slides = useMemo(() => {
    if (!story) return [];
    if (story.slides?.length) return story.slides;
    return [
      {
        image: story.cover ?? story.image ?? story.avatar,
        caption: story.caption ?? story.text,
        time: story.time,
      },
    ];
  }, [story]);

  const [index, setIndex] = useState(0);
  const [held, setHeld] = useState(false); // finger down on the story
  const [replying, setReplying] = useState(false);
  const [draft, setDraft] = useState("");
  const [restart, setRestart] = useState(0);
  const [reacted, setReacted] = useState(false);
  const [viewing, setViewing] = useState(false); // viewers sheet open (own story)

  const progress = useSharedValue(0);
  const ty = useSharedValue(0);
  const isVideoSlide = Boolean(slides[index]?.video);
  // Long-press hold: pauses image stories; video stories keep the clock and
  // fast-forward instead.
  const paused = replying || viewing || (held && !isVideoSlide);

  const close = useCallback(() => router.back(), []);

  // Last slide tapped forwards: move to the next story in the list (or close
  // the viewer past the end). Index resets are batched with the story change.
  const goNextStory = useCallback(() => {
    if (storyIdx < storyList.length - 1) {
      setIndex(0);
      setStoryIdx((i) => i + 1);
    } else {
      router.back();
    }
  }, [storyIdx, storyList.length]);

  // First slide tapped backwards: jump to the previous story in the list.
  // No previous story (first in the list, or your own): just replay.
  const goPrevStory = useCallback(() => {
    if (storyIdx > 0) {
      setIndex(0);
      setStoryIdx((i) => i - 1);
    } else {
      setRestart((r) => r + 1);
    }
  }, [storyIdx]);

  const next = useCallback(() => {
    if (index < slides.length - 1) setIndex(index + 1);
    else goNextStory();
  }, [index, slides.length, goNextStory]);

  const prev = () => {
    if (index > 0) setIndex(index - 1);
    else goPrevStory(); // first slide: previous story (or replay)
  };

  // new slide, new story (or replay) -> bar back to empty, any hold released
  useEffect(() => {
    progress.value = 0;
    setReacted(false);
    setHeld(false);
  }, [index, storyIdx, restart, progress]);

  // run / pause the bar; finishing it moves on
  useEffect(() => {
    if (!slides.length) return undefined;
    if (paused) {
      cancelAnimation(progress);
      return undefined;
    }
    const remaining = 1 - progress.value;
    progress.value = withTiming(
      1,
      { duration: SLIDE_MS * remaining, easing: Easing.linear },
      (finished) => {
        if (finished) runOnJS(next)();
      },
    );
    return () => cancelAnimation(progress);
  }, [index, restart, paused, next, slides.length, progress]);

  // swipe down to dismiss (off while the reply sheet is open)
  // Range is [start(neg), end(pos)]: the pan activates when dy < start or
  // dy > end. [-9999, 12] means "only after 12px downward" — writing [12, 9999]
  // instead made dy(0) < 12 true at touchdown, so the pan activated on every
  // touch and swallowed all presses (taps, hold, header buttons).
  const pan = Gesture.Pan()
    .enabled(!replying && !viewing)
    .activeOffsetY([-9999, 12])
    .failOffsetX([-24, 24])
    .onStart(() => {
      // a drag cancels any active long-press hold
      runOnJS(setHeld)(false);
    })
    .onUpdate((e) => {
      ty.value = Math.max(0, e.translationY);
    })
    .onEnd((e) => {
      if (e.translationY > CLOSE_DISTANCE || e.velocityY > 900) {
        runOnJS(close)();
      } else {
        ty.value = withSpring(0);
      }
    });

  const dragStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: ty.value }],
    opacity: 1 - Math.min(ty.value / 400, 0.4),
  }));

  const closeReply = () => {
    setDraft("");
    setReplying(false);
  };

  const sendReply = () => {
    const text = draft.trim();
    if (!text) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // TODO: send `text` as a reply to story.id / slides[index]
    closeReply();
  };

  const saveStory = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // TODO: save / download slides[index] (image or video) to the device
  };

  const repostStory = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // TODO: repost slides[index] to your own story
  };

  const toggleReaction = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setReacted((v) => !v);
    // TODO: send / remove a ❤️ reaction on story.id / slides[index]
  };

  const sendReaction = (emoji) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // TODO: send `emoji` as a reaction to story.id / slides[index]
    closeReply();
  };

  const openViewers = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setViewing(true);
  };

  // Long-press hold: pauses image stories / fast-forwards video ones.
  const startHold = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setHeld(true);
  };
  const endHold = () => setHeld(false);

  if (!story) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          styles.center,
          { backgroundColor: colors.background },
        ]}
      >
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={{ color: colors.text, fontSize: 16 }}>
          Story not found
        </Text>
        <Pressable onPress={close} style={{ padding: 12 }}>
          <Text style={{ color: colors.primary, fontWeight: "600" }}>
            Go back
          </Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const slide = slides[index];
  const viewerCount = story.viewers?.length ?? 0;
  const track = "rgba(128,128,128,0.35)";

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          headerShown: false,
          animation: "fade",
          gestureEnabled: false,
        }}
      />
      <StatusBar style="auto" />

      <GestureDetector gesture={pan}>
        <Animated.View style={[styles.flex, dragStyle]}>
          <SafeAreaView style={styles.flex} edges={["top", "bottom"]}>
            {/* Progress bars */}
            <View style={styles.segments}>
              {slides.map((_, i) => (
                <Segment
                  key={i}
                  state={i < index ? "done" : i === index ? "active" : "idle"}
                  progress={progress}
                  track={track}
                  fill={colors.text}
                />
              ))}
            </View>

            {/* Header */}
            <View style={styles.header}>
              <Avatar
                uri={story.avatar}
                name={story.name}
                size={36}
                online={false}
              />
              <View style={styles.headerMeta}>
                <Text
                  style={[styles.name, { color: colors.text }]}
                  numberOfLines={1}
                >
                  {story.isMine ? "Your story" : story.name}
                </Text>
                {slide?.time ? (
                  <Text style={[styles.time, { color: colors.textMuted }]}>
                    {slide.time}
                  </Text>
                ) : null}
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="More options"
                hitSlop={10}
                style={styles.headerBtn}
                // onPress={() => ...}
              >
                <Icon name="more" color={colors.text} size={22} />
              </Pressable>
              <Pressable
                onPress={close}
                accessibilityRole="button"
                accessibilityLabel="Close story"
                hitSlop={10}
                style={styles.headerBtn}
              >
                <Icon name="close" color={colors.text} size={22} />
              </Pressable>
            </View>

            {/* Story card */}
            <View style={[styles.card, { backgroundColor: colors.surface }]}>
              {slide?.video ? (
                // key: the viewer no longer remounts between stories, and
                // useVideoPlayer only reads its source once — force a fresh
                // player per clip.
                <SlideVideo
                  key={slide.video}
                  uri={slide.video}
                  paused={paused}
                  fastForward={held}
                />
              ) : (
                <Image
                  source={{ uri: slide?.image }}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                  transition={200}
                  cachePolicy="memory-disk"
                  recyclingKey={slide?.image ?? String(index)}
                  priority="high"
                  pointerEvents="none"
                />
              )}

              {/* Tap left = previous slide, then previous story; tap right =
                  next slide, then next story. Long-press holds the
                  story: it pauses an image slide, fast-forwards a video one
                  (RN suppresses onPress once long-press fires). */}
              <View style={styles.tapZones}>
                <Pressable
                  style={styles.tapLeft}
                  onPress={prev}
                  onLongPress={startHold}
                  onPressOut={endHold}
                  delayLongPress={250}
                  accessibilityLabel="Previous"
                />
                <Pressable
                  style={styles.tapRight}
                  onPress={next}
                  onLongPress={startHold}
                  onPressOut={endHold}
                  delayLongPress={250}
                  accessibilityLabel="Next"
                />
              </View>

              {/* Caption + reply */}
              <View pointerEvents="box-none" style={styles.cardBottom}>
                {slide?.caption ? (
                  <Text style={styles.caption} pointerEvents="none">
                    {slide.caption}
                  </Text>
                ) : null}

                {/* Actions: your story -> a viewers pill; otherwise
                    save / repost  ·  Reply (centered)  ·  react */}
                {story.isMine ? (
                  <View style={styles.actionsRow}>
                    <Pressable
                      onPress={openViewers}
                      accessibilityRole="button"
                      accessibilityLabel={`Viewers, ${viewerCount}`}
                      hitSlop={6}
                      style={({ pressed }) => [
                        styles.viewersPill,
                        pressed && { opacity: 0.8 },
                      ]}
                    >
                      <Icon name="viewers" color="#fff" size={18} />
                      <Text style={styles.viewersCount}>{viewerCount}</Text>
                    </Pressable>
                  </View>
                ) : (
                  <View style={styles.actionsRow}>
                    <View style={[styles.actionsSide, styles.actionsLeft]}>
                      <ActionBtn
                        icon="download"
                        label="Save story"
                        onPress={saveStory}
                      />
                      <ActionBtn
                        icon="repost"
                        label="Repost story"
                        onPress={repostStory}
                      />
                    </View>

                    <View style={styles.actionsCenter}>
                      <Pressable
                        onPress={() => setReplying(true)}
                        accessibilityRole="button"
                        accessibilityLabel="Reply to story"
                        style={({ pressed }) => [
                          styles.replyPill,
                          pressed && { opacity: 0.8 },
                        ]}
                      >
                        <Icon name="add" color="#fff" size={16} />
                        <Text style={styles.replyText}>Reply</Text>
                      </Pressable>
                    </View>

                    <View style={[styles.actionsSide, styles.actionsRight]}>
                      <ActionBtn
                        icon="heart"
                        label={reacted ? "Remove reaction" : "React"}
                        color={reacted ? "#F0457A" : "#fff"}
                        onPress={toggleReaction}
                      />
                    </View>
                  </View>
                )}
              </View>
            </View>
          </SafeAreaView>
        </Animated.View>
      </GestureDetector>

      {/* Reply bottom sheet */}
      {replying ? (
        <ReplySheet
          colors={colors}
          title="Reply"
          placeholder="Comment"
          quote={slide?.caption}
          draft={draft}
          setDraft={setDraft}
          onClose={closeReply}
          onSend={sendReply}
          onReact={sendReaction}
          onCamera={() => {
            // TODO: open camera / picker, then send as a reply
          }}
          onMic={() => {
            // TODO: start voice-note recording, then send as a reply
          }}
        />
      ) : null}

      {/* Viewers sheet (own story only) */}
      {story.isMine ? (
        <StoryViewersSheet
          visible={viewing}
          colors={colors}
          viewers={story.viewers ?? []}
          onClose={() => setViewing(false)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  center: { alignItems: "center", justifyContent: "center" },

  segments: {
    flexDirection: "row",
    gap: 4,
    marginHorizontal: 16,
    marginTop: 8,
  },
  segment: { flex: 1, height: 3, borderRadius: 2, overflow: "hidden" },
  segmentFill: { height: "100%", borderRadius: 2 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerMeta: { flex: 1, flexDirection: "row", alignItems: "baseline", gap: 8 },
  name: { fontSize: 15.5, fontWeight: "600", flexShrink: 1 },
  time: { fontSize: 13 },
  headerBtn: { padding: 4 },

  card: {
    flex: 1,
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: CARD_RADIUS,
    overflow: "hidden",
  },
  tapZones: { ...StyleSheet.absoluteFillObject, flexDirection: "row" },
  tapLeft: { flex: 1 },
  tapRight: { flex: 2 },

  cardBottom: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 22,
    gap: 16,
  },
  caption: {
    color: "#fff",
    fontSize: 15,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowRadius: 6,
    textShadowOffset: { width: 0, height: 1 },
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "stretch",
  },
  actionsSide: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  actionsLeft: { justifyContent: "flex-start" },
  actionsRight: { justifyContent: "flex-end" },
  actionsCenter: { alignItems: "center", justifyContent: "center" },
  actionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  replyPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 18,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  replyText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  viewersPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 16,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  viewersCount: { color: "#fff", fontSize: 15, fontWeight: "600" },
});

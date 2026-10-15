import { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { VideoView, useVideoPlayer } from "expo-video";
import Avatar from "../../../src/components/Avatar";
import Icon from "../../../src/components/icons";
import GlassButton from "../../../src/components/GlassButton";
import GlassSurface from "../../../src/components/GlassSurface";
import { REELS } from "../../../src/data/reels";
import { chromeStore } from "../../../src/state/chrome";

// Reels data ships images; any mp4/mov/... URL is played as video instead.
const VIDEO_RE = /\.(mp4|mov|m3u8|webm)(\?.*)?$/i;

// Playback speeds offered by the "Speed" option (long-press mode uses 2x).
const SPEEDS = [0.5, 1, 1.5, 2];

// Mirrors BottomBar geometry so overlays never hide behind the floating tab
// bar: wrap paddingBottom (max(insets.bottom, 10)) + bar height
// (8 pad + 30 icon pill + 3 gap + ~14 label + 8 pad = 63) + breathing room.
const barClearance = (insets) => Math.max(insets.bottom, 10) + 63 + 16;

// Module-level: FlatList requires these to stay stable across renders.
const VIEWABILITY_CONFIG = { itemVisiblePercentThreshold: 60 };

const fmtCount = (n) =>
  n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K` : `${n}`;

const SHADOW = {
  textShadowColor: "rgba(0,0,0,0.5)",
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 6,
};

// TikTok's signature accents.
const TT_RED = "#fe2c55";
const TT_GOLD = "#ffc107";
// Facebook blue: verified check, Follow button, active repost.
const FB_BLUE = "#1877f2";

// Thin blur materials (and iOS 26 Liquid Glass) sample whatever is behind
// them, so over a bright photo the glass turns milky and white icons vanish.
// A dark tint floors the luminance on every GlassSurface path while keeping
// the blur visible through it.
const GLASS_TINT = "rgba(10,12,16,0.55)";

/* ---------- Media ---------- */

function ReelVideo({ uri, isActive, paused, rate }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    p.muted = true;
  });

  // Keep the player in a ref so we can set playbackRate from effects/handlers
  // without tripping react-hooks/immutability (it forbids touching a value
  // returned by a hook outside its initializer).
  const playerRef = useRef(null);
  useEffect(() => {
    playerRef.current = player;
  });

  useEffect(() => {
    if (playerRef.current) playerRef.current.playbackRate = rate;
  }, [rate]);

  useEffect(() => {
    if (isActive && !paused) player.play();
    else player.pause();
  }, [isActive, paused, player]);

  return (
    <VideoView
      style={StyleSheet.absoluteFill}
      player={player}
      contentFit="cover"
      nativeControls={false}
    />
  );
}

function ReelMedia({ uri, isActive, paused, rate }) {
  if (VIDEO_RE.test(uri)) {
    return (
      <ReelVideo uri={uri} isActive={isActive} paused={paused} rate={rate} />
    );
  }
  return (
    <Image
      source={{ uri }}
      style={StyleSheet.absoluteFill}
      resizeMode="cover"
      fadeDuration={150}
    />
  );
}

/* ---------- Right rail ---------- */

function RailButton({ label, name, color, count, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.railBtn, pressed && styles.pressed]}
    >
      <View style={styles.railCircle}>
        <Icon name={name} color={color} size={26} />
      </View>
      {count != null && (
        <Text style={[styles.railCount, SHADOW]}>{fmtCount(count)}</Text>
      )}
    </Pressable>
  );
}

/* ---------- Options sheet (opened from the rail "more" button) ---------- */

function SheetOption({ icon, label, onPress, trailing }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.optRow, pressed && styles.optPressed]}
    >
      <View style={styles.optIcon}>
        <Icon name={icon} color="#fff" size={22} />
      </View>
      <Text style={styles.optLabel}>{label}</Text>
      {trailing ? <View style={styles.optTrailing}>{trailing}</View> : null}
    </Pressable>
  );
}

function OptionsSheet({
  visible,
  insets,
  reposted,
  onToggleRepost,
  autoScroll,
  onToggleAutoScroll,
  clearDisplay,
  onToggleClearDisplay,
  onCycleSpeed,
  onDownload,
  onNotInterested,
  onReport,
  onClose,
}) {
  const [slide] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.timing(slide, {
      toValue: visible ? 1 : 0,
      duration: visible ? 240 : 160,
      easing: visible ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [visible, slide]);

  if (!visible) return null;

  return (
    <Modal
      visible
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* flex:1 wrapper so the scrim is a guaranteed full-screen tap target
          (absoluteFill alone is unreliable inside a transparent Modal on some
          Android configs). The sheet floats above the scrim. */}
      <View style={styles.scrimWrap}>
        {/* Tap anywhere outside the sheet to dismiss. */}
        <Pressable
          style={styles.scrim}
          onPress={onClose}
          accessibilityLabel="Close options"
        />
        <Animated.View
          style={[
            styles.sheetWrap,
            {
              opacity: slide,
              transform: [
                {
                  translateY: slide.interpolate({
                    inputRange: [0, 1],
                    outputRange: [320, 0],
                  }),
                },
              ],
            },
          ]}
        >
        <GlassSurface
          scheme="dark"
          tint={GLASS_TINT}
          style={[
            styles.sheet,
            // Pad inside the glass so its surface paints flush to the bottom
            // edge (no gap), while the last row still clears the home bar.
            { paddingBottom: Math.max(insets.bottom, 12) + 12 },
          ]}
        >
          <View style={styles.sheetHandle} />

          <SheetOption icon="download" label="Download" onPress={onDownload} />
          <SheetOption
            icon="thumbs-down"
            label="Not interested"
            onPress={onNotInterested}
          />
          <SheetOption icon="report" label="Report" onPress={onReport} />

          <View style={styles.sheetDivider} />

          <SheetOption
            icon="repost"
            label="Repost"
            onPress={onToggleRepost}
            trailing={
              <View
                style={[
                  styles.checkDot,
                  reposted && { backgroundColor: FB_BLUE, borderColor: FB_BLUE },
                ]}
              >
                {reposted ? <Icon name="tick" color="#fff" size={12} /> : null}
              </View>
            }
          />
          <SheetOption
            icon="scroll"
            label="Auto scroll"
            onPress={onToggleAutoScroll}
            trailing={
              <View style={[styles.switchTrack, autoScroll && styles.switchOn]}>
                <View
                  style={[styles.switchKnob, autoScroll && styles.switchKnobOn]}
                />
              </View>
            }
          />
          <SheetOption
            icon="hide"
            label="Clear display"
            onPress={onToggleClearDisplay}
            trailing={
              <View
                style={[
                  styles.switchTrack,
                  clearDisplay && styles.switchOn,
                ]}
              >
                <View
                  style={[
                    styles.switchKnob,
                    clearDisplay && styles.switchKnobOn,
                  ]}
                />
              </View>
            }
          />
          <SheetOption icon="speed" label="Speed" onPress={onCycleSpeed} />
        </GlassSurface>
        </Animated.View>
      </View>
    </Modal>
  );
}


/* ---------- One reel ---------- */

function ReelCard({
  item,
  height,
  bottom,
  isActive,
  reaction,
  rate,
  paused,
  chromeVisible,
  onToggleLike,
  onToggleSave,
  onOpenOptions,
  onTogglePause,
  onPressIn,
  onPressOut,
}) {
  const isVideo = VIDEO_RE.test(item.uri);
  const [following, setFollowing] = useState(false);
  // TikTok-style handle: @wadewarren
  const handle = item.user.toLowerCase().replace(/\s+/g, "");
  // useState (not useRef): lint forbids reading refs during render — same
  // pattern as calls/index.jsx.
  const [pop] = useState(() => new Animated.Value(0));
  const tapTimer = useRef(null);
  const lastTap = useRef(0);
  const holdTimer = useRef(null);

  useEffect(
    () => () => {
      clearTimeout(tapTimer.current);
      clearTimeout(holdTimer.current);
    },
    [],
  );

  const flashHeart = () => {
    pop.setValue(0);
    Animated.sequence([
      Animated.spring(pop, {
        toValue: 1,
        useNativeDriver: true,
        friction: 4,
        tension: 140,
      }),
      Animated.delay(400),
      Animated.timing(pop, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start();
  };

  // Long press (350ms) → 2x speed mode. Tap → pause/play (video only).
  const handlePressIn = () => {
    holdTimer.current = setTimeout(() => {
      holdTimer.current = null;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onPressIn();
    }, 350);
  };
  const handlePressOut = () => {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
      return; // press ended before the long press fired → it was a tap
    }
    onPressOut();
  };

  const handleTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 280) {
      clearTimeout(tapTimer.current);
      tapTimer.current = null;
      lastTap.current = 0;
      if (!reaction.liked) onToggleLike(item.id);
      flashHeart();
      return;
    }
    lastTap.current = now;
    if (isVideo) {
      tapTimer.current = setTimeout(() => {
        onTogglePause();
        tapTimer.current = null;
      }, 280);
    }
  };

  return (
    <View style={[styles.card, { height }]}>
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={handleTap}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="button"
        accessibilityLabel={`Reel by ${item.user}. Double tap to like.`}
      >
        <ReelMedia
          uri={item.uri}
          isActive={isActive}
          paused={paused}
          rate={rate}
        />
      </Pressable>

      {isVideo && paused && isActive ? (
        <View pointerEvents="none" style={styles.pauseBadge}>
          <Icon name="play" color="rgba(255,255,255,0.95)" size={30} />
        </View>
      ) : null}

      <Animated.View
        pointerEvents="none"
        style={[
          styles.heartPop,
          {
            opacity: pop,
            transform: [
              {
                scale: pop.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.5, 1.1],
                }),
              },
            ],
          },
        ]}
      >
        <Icon name="heart" color={TT_RED} size={120} />
      </Animated.View>

      {/* Facebook-style profile block: avatar, full name + verified, username
          underneath, then a Follow button spaced off to the right. */}
      {chromeVisible ? (
      <View style={[styles.info, { bottom }]}>
        <View style={styles.userRow}>
          <Avatar uri={item.avatar} name={item.user} size={40} />
          <View style={styles.userMeta}>
            <View style={styles.nameLine}>
              <Text style={[styles.fullName, SHADOW]} numberOfLines={1}>
                {item.user}
              </Text>
              {item.verified ? (
                <View style={styles.verifiedBadge}>
                  <Icon name="tick" color="#fff" size={10} />
                </View>
              ) : null}
            </View>
            <Text style={[styles.username, SHADOW]} numberOfLines={1}>
              @{handle}
            </Text>
          </View>
          <Pressable
            onPress={() => setFollowing((f) => !f)}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={
              following ? `Unfollow ${item.user}` : `Follow ${item.user}`
            }
            style={[styles.followBtn, following && styles.followBtnActive]}
          >
            <Text
              style={[styles.followText, following && styles.followTextActive]}
            >
              {following ? "Following" : "Follow"}
            </Text>
          </Pressable>
        </View>

        <Text style={[styles.caption, SHADOW]} numberOfLines={2}>
          {item.caption}
        </Text>
        <Text style={[styles.sound, SHADOW]} numberOfLines={1}>
          ♫ original sound · {item.user}
        </Text>
      </View>
      ) : null}

      {/* Facebook-style action rail: circular buttons with counts. */}
      {chromeVisible ? (
      <View style={[styles.rail, { bottom }]}>
        <RailButton
          label={reaction.liked ? "Unlike" : "Like"}
          name="heart"
          color={reaction.liked ? TT_RED : "#fff"}
          count={reaction.likes}
          onPress={() => onToggleLike(item.id)}
        />
        <RailButton
          label="Comments"
          name="comment"
          color="#fff"
          count={item.comments}
        />
        <RailButton label="Share" name="share" color="#fff" />
        <RailButton
          label={reaction.saved ? "Remove from saved" : "Save"}
          name="bookmark"
          color={reaction.saved ? TT_GOLD : "#fff"}
          onPress={() => onToggleSave(item.id)}
        />
        <RailButton
          label="More options"
          name="more"
          color="#fff"
          onPress={onOpenOptions}
        />
      </View>
      ) : null}
    </View>
  );
}


/* ---------- Screen ---------- */

export default function ReelsScreen() {
  const insets = useSafeAreaInsets();
  const [pageHeight, setPageHeight] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef(null);

  // Feed switch. Both tabs show REELS for now; a real following feed plugs in
  // here later.
  const [feed, setFeed] = useState("forYou");

  // Reactions live up here so likes survive cell recycling.
  const [reactions, setReactions] = useState(() =>
    Object.fromEntries(
      REELS.map((r) => [
        r.id,
        { liked: r.liked, saved: r.saved, likes: r.likes },
      ]),
    ),
  );
  const [reposted, setReposted] = useState(() =>
    Object.fromEntries(REELS.map((r) => [r.id, false])),
  );

  // Playback / chrome state.
  const [pausedIds, setPausedIds] = useState(() => new Set());
  const [speed, setSpeed] = useState(1);
  const [speedMode, setSpeedMode] = useState(false);
  const [autoScroll, setAutoScroll] = useState(false);
  const [clearDisplay, setClearDisplay] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  const toggleLike = useCallback((id) => {
    setReactions((prev) => {
      const r = prev[id];
      const liked = !r.liked;
      return { ...prev, [id]: { ...r, liked, likes: r.likes + (liked ? 1 : -1) } };
    });
  }, []);

  const toggleSave = useCallback((id) => {
    setReactions((prev) => ({
      ...prev,
      [id]: { ...prev[id], saved: !prev[id].saved },
    }));
  }, []);

  const toggleRepost = useCallback((id) => {
    setReposted((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const togglePause = useCallback((id) => {
    setPausedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // Long-press: 2x speed + hide the whole tab bar, showing only the 2x badge.
  const startSpeedMode = useCallback(() => {
    setSpeedMode(true);
    chromeStore.set(true);
  }, []);
  const stopSpeedMode = useCallback(() => {
    setSpeedMode(false);
    chromeStore.set(false);
  }, []);

  // Always clear the shared flag when the screen unmounts.
  useEffect(() => () => chromeStore.set(false), []);

  const cycleSpeed = useCallback(() => {
    setSpeed((s) => SPEEDS[(SPEEDS.indexOf(s) + 1) % SPEEDS.length]);
  }, []);

  const activeId = REELS[activeIndex]?.id;

  const goTo = useCallback(
    (i) => {
      const clamped = Math.max(0, Math.min(REELS.length - 1, i));
      listRef.current?.scrollToOffset({
        offset: clamped * pageHeight,
        animated: true,
      });
    },
    [pageHeight],
  );

  // Auto scroll: advance to the next reel every few seconds.
  useEffect(() => {
    if (!autoScroll) return undefined;
    const t = setInterval(
      () => setActiveIndex((i) => Math.min(i + 1, REELS.length - 1)),
      4000,
    );
    return () => clearInterval(t);
  }, [autoScroll]);

  useEffect(() => {
    if (autoScroll && activeIndex < REELS.length - 1) goTo(activeIndex);
  }, [activeIndex, autoScroll, goTo]);

  const onViewableItemsChanged = useCallback(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index ?? 0);
    }
  }, []);

  // Effective playback rate for the active reel (long-press forces 2x).
  const activeRate = speedMode ? 2 : speed;

  const renderItem = useCallback(
    ({ item, index }) => (
      <ReelCard
        item={item}
        height={pageHeight}
        bottom={barClearance(insets)}
        isActive={index === activeIndex}
        reaction={reactions[item.id]}
        rate={index === activeIndex ? activeRate : 1}
        paused={pausedIds.has(item.id)}
        chromeVisible={!speedMode}
        onToggleLike={toggleLike}
        onToggleSave={toggleSave}
        onTogglePause={() => togglePause(item.id)}
        onOpenOptions={() => setSheetOpen(true)}
        onPressIn={startSpeedMode}
        onPressOut={stopSpeedMode}
      />
    ),
    [
      pageHeight,
      insets,
      activeIndex,
      reactions,
      activeRate,
      pausedIds,
      speedMode,
      toggleLike,
      toggleSave,
      togglePause,
      startSpeedMode,
      stopSpeedMode,
    ],
  );

  return (
    <View
      style={styles.screen}
      onLayout={(e) => setPageHeight(e.nativeEvent.layout.height)}
    >
      <StatusBar style="light" />

      {pageHeight > 0 && (
        <FlatList
          ref={listRef}
          data={REELS}
          keyExtractor={(r) => r.id}
          renderItem={renderItem}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          viewabilityConfig={VIEWABILITY_CONFIG}
          onViewableItemsChanged={onViewableItemsChanged}
          getItemLayout={(_, i) => ({
            length: pageHeight,
            offset: i * pageHeight,
            index: i,
          })}
        />
      )}

      {/* Glassy top bar: Reels title, glass Following/For You pill, glass
          plus button. Hidden in long-press speed mode. */}
      {!speedMode ? (
      <View
        pointerEvents="box-none"
        style={[styles.topBar, { top: insets.top + 8 }]}
      >
        <Text style={[styles.title, SHADOW]}>Reels</Text>
        <View pointerEvents="box-none" style={styles.centerSlot}>
          <GlassSurface scheme="dark" tint={GLASS_TINT} style={styles.pill}>
            <Pressable
              onPress={() => setFeed("following")}
              accessibilityRole="tab"
              accessibilityState={{ selected: feed === "following" }}
              style={[styles.segment, feed === "following" && styles.segActive]}
            >
              <Text
                style={[
                  styles.segmentText,
                  SHADOW,
                  feed === "following" && styles.segTextActive,
                ]}
              >
                Following
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setFeed("forYou")}
              accessibilityRole="tab"
              accessibilityState={{ selected: feed === "forYou" }}
              style={[styles.segment, feed === "forYou" && styles.segActive]}
            >
              <Text
                style={[
                  styles.segmentText,
                  SHADOW,
                  feed === "forYou" && styles.segTextActive,
                ]}
              >
                For You
              </Text>
            </Pressable>
          </GlassSurface>
        </View>
        <GlassButton
          size={40}
          scheme="dark"
          tint={GLASS_TINT}
          label="Create reel"
          // TODO: wire the camera / media-picker creation flow here.
        >
          <Icon name="add" color="#fff" size={22} />
        </GlassButton>
      </View>
      ) : null}

      {/* Long-press speed mode: hide all chrome, show only the 2x badge. */}
      {speedMode ? (
        <View
          pointerEvents="none"
          style={[styles.speedBadge, { top: insets.top + 8 }]}
        >
          <Icon name="fast-forward" color="#fff" size={14} />
          <Text style={styles.speedBadgeText}>2x</Text>
        </View>
      ) : null}

      {/* Clear display: dark veil so all text/rail are hidden; tap to exit. */}
      {clearDisplay ? (
        <Pressable
          style={styles.clearVeil}
          onPress={() => setClearDisplay(false)}
          accessibilityLabel="Exit clear display"
        />
      ) : null}

      <OptionsSheet
        visible={sheetOpen}
        insets={insets}
        reposted={!!(activeId && reposted[activeId])}
        onToggleRepost={() => activeId && toggleRepost(activeId)}
        autoScroll={autoScroll}
        onToggleAutoScroll={() => setAutoScroll((v) => !v)}
        clearDisplay={clearDisplay}
        onToggleClearDisplay={() => setClearDisplay((v) => !v)}
        onCycleSpeed={cycleSpeed}
        // TODO: real download / "not interested" / report flows.
        onDownload={() => setSheetOpen(false)}
        onNotInterested={() => setSheetOpen(false)}
        onReport={() => setSheetOpen(false)}
        onClose={() => setSheetOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#000" },
  card: { width: "100%", backgroundColor: "#000", overflow: "hidden" },

  // Top bar
  topBar: {
    position: "absolute",
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 10,
  },
  centerSlot: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    padding: 3,
    minWidth: 210,
  },
  segment: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 7,
    borderRadius: 999,
  },
  segActive: { backgroundColor: "rgba(255,255,255,0.18)" },
  segmentText: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 14,
    fontWeight: "600",
  },
  segTextActive: { color: "#fff", fontWeight: "700" },

  // Long-press speed badge
  speedBadge: {
    position: "absolute",
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    zIndex: 20,
  },
  speedBadgeText: { color: "#fff", fontWeight: "700", fontSize: 13 },

  // Clear display veil
  clearVeil: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.96)",
    zIndex: 30,
  },

  // Pause badge
  pauseBadge: {
    position: "absolute",
    top: "48%",
    left: "50%",
    marginLeft: -22,
    marginTop: -22,
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 5,
  },
  heartPop: {
    position: "absolute",
    top: "45%",
    left: "50%",
    marginLeft: -60,
    marginTop: -60,
    zIndex: 6,
  },

  // Bottom-left profile block
  info: { position: "absolute", left: 14, right: 90, zIndex: 8 },
  userRow: { flexDirection: "row", alignItems: "center" },
  userMeta: { flex: 1, minWidth: 0, marginLeft: 10 },
  nameLine: { flexDirection: "row", alignItems: "center", minWidth: 0 },
  fullName: { color: "#fff", fontSize: 15.5, fontWeight: "700", flexShrink: 1 },
  verifiedBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: FB_BLUE,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 4,
  },
  username: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    marginTop: 1,
  },
  followBtn: {
    marginLeft: 12,
    height: 30,
    paddingHorizontal: 14,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.9)",
    backgroundColor: "transparent",
  },
  followBtnActive: { backgroundColor: "rgba(255,255,255,0.16)" },
  followText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  followTextActive: { fontWeight: "700" },
  caption: {
    color: "#fff",
    fontSize: 14,
    lineHeight: 19,
    marginTop: 10,
  },
  sound: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
    marginTop: 8,
  },

  // Right rail
  rail: {
    position: "absolute",
    right: 10,
    alignItems: "center",
    zIndex: 8,
  },
  railBtn: { alignItems: "center", marginBottom: 18, minWidth: 52 },
  railCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  railCount: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 5,
  },
  pressed: { opacity: 0.6 },

  // Options sheet
  scrimWrap: { flex: 1 },
  scrim: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
  sheetWrap: { position: "absolute", left: 0, right: 0, bottom: 0, zIndex: 40 },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
    paddingHorizontal: 8,
    backgroundColor: "rgba(20,22,26,0.9)",
  },
  sheetHandle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.3)",
    marginBottom: 8,
  },
  sheetDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.14)",
    marginVertical: 4,
    marginHorizontal: 8,
  },
  optRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  optPressed: { backgroundColor: "rgba(255,255,255,0.08)" },
  optIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  optLabel: { color: "#fff", fontSize: 15, fontWeight: "600", flex: 1 },
  optTrailing: { marginLeft: 12 },
  checkDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  switchTrack: {
    width: 44,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  switchOn: { backgroundColor: FB_BLUE },
  switchKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#fff",
  },
  switchKnobOn: { alignSelf: "flex-end" },
});


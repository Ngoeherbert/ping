import { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { VideoView, useVideoPlayer } from "expo-video";
import Avatar from "../../../src/components/Avatar";
import Icon from "../../../src/components/icons";
import GlassButton from "../../../src/components/GlassButton";
import GlassSurface from "../../../src/components/GlassSurface";
import { REELS } from "../../../src/data/reels";

// Reels data ships images; any mp4/mov/... URL is played as video instead.
const VIDEO_RE = /\.(mp4|mov|m3u8|webm)(\?.*)?$/i;

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

function ReelVideo({ uri, isActive, paused }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    p.muted = true;
  });

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

function ReelMedia({ uri, isActive, paused }) {
  if (VIDEO_RE.test(uri)) {
    return <ReelVideo uri={uri} isActive={isActive} paused={paused} />;
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

/* ---------- One reel ---------- */

function ReelCard({
  item,
  height,
  bottom,
  isActive,
  reaction,
  onToggleLike,
  onToggleSave,
}) {
  const isVideo = VIDEO_RE.test(item.uri);
  const [paused, setPaused] = useState(false);
  const [following, setFollowing] = useState(false);
  const [reposted, setReposted] = useState(false);
  // TikTok-style handle: @wadewarren
  const handle = item.user.toLowerCase().replace(/\s+/g, "");
  // useState (not useRef): lint forbids reading refs during render — same
  // pattern as calls/index.jsx.
  const [pop] = useState(() => new Animated.Value(0));
  const tapTimer = useRef(null);
  const lastTap = useRef(0);

  useEffect(
    () => () => {
      clearTimeout(tapTimer.current);
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

  // Double tap = like + heart pop. Single tap (video only) = pause/play.
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
        setPaused((p) => !p);
        tapTimer.current = null;
      }, 280);
    }
  };

  return (
    <View style={[styles.card, { height }]}>
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={handleTap}
        accessibilityRole="button"
        accessibilityLabel={`Reel by ${item.user}. Double tap to like.`}
      >
        <ReelMedia uri={item.uri} isActive={isActive} paused={paused} />
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

      {/* Facebook-style action rail: circular buttons with counts. */}
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
        <RailButton label="Share" name="forward" color="#fff" />
        <RailButton
          label={reaction.saved ? "Remove from saved" : "Save"}
          name="bookmark"
          color={reaction.saved ? TT_GOLD : "#fff"}
          onPress={() => onToggleSave(item.id)}
        />
        <RailButton label="More options" name="more" color="#fff" />
      </View>
    </View>
  );
}
/* ---------- Screen ---------- */

export default function ReelsScreen() {
  const insets = useSafeAreaInsets();
  const [pageHeight, setPageHeight] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  // Feed switch. Both tabs show REELS for now; a real following feed plugs in
  // here later.
  const [feed, setFeed] = useState("forYou");

  // Reactions live up here so likes survive cell recycling.
  const [reactions, setReactions] = useState(() =>
    Object.fromEntries(
      REELS.map((r) => [r.id, { liked: r.liked, saved: r.saved, likes: r.likes }]),
    ),
  );

  const toggleLike = useCallback((id) => {
    setReactions((prev) => {
      const cur = prev[id];
      const liked = !cur.liked;
      return {
        ...prev,
        [id]: { ...cur, liked, likes: cur.likes + (liked ? 1 : -1) },
      };
    });
  }, []);

  const toggleSave = useCallback((id) => {
    setReactions((prev) => {
      const cur = prev[id];
      return { ...prev, [id]: { ...cur, saved: !cur.saved } };
    });
  }, []);

  const onViewableItemsChanged = useCallback(({ viewableItems }) => {
    const first = viewableItems[0];
    if (first?.index != null) setActiveIndex(first.index);
  }, []);

  const bottom = barClearance(insets);

  return (
    <View
      style={styles.root}
      onLayout={(e) => setPageHeight(Math.round(e.nativeEvent.layout.height))}
    >
      <StatusBar style="light" />

      {/* Glass top bar: title | centered feed pill | create. */}
      <View style={[styles.topBar, { top: insets.top + 8 }]}>
        <Text style={styles.title}>Reels</Text>

        {/* Absolute slot keeps the pill on the true center regardless of the
            side items' widths. */}
        <View style={styles.centerSlot}>
          <GlassSurface scheme="dark" tint={GLASS_TINT} style={styles.pill}>
            <Pressable
              onPress={() => setFeed("following")}
              accessibilityRole="tab"
              accessibilityState={{ selected: feed === "following" }}
              style={[
                styles.segment,
                feed === "following" && styles.segmentActive,
              ]}
            >
              <Text
                style={[
                  styles.segmentText,
                  SHADOW,
                  feed === "following" && styles.segmentTextActive,
                ]}
              >
                Following
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setFeed("forYou")}
              accessibilityRole="tab"
              accessibilityState={{ selected: feed === "forYou" }}
              style={[
                styles.segment,
                feed === "forYou" && styles.segmentActive,
              ]}
            >
              <Text
                style={[
                  styles.segmentText,
                  SHADOW,
                  feed === "forYou" && styles.segmentTextActive,
                ]}
              >
                For You
              </Text>
            </Pressable>
          </GlassSurface>
        </View>

        {/* Creation flow hooks in here (camera / picker). */}
        <GlassButton
          size={40}
          scheme="dark"
          tint={GLASS_TINT}
          label="Create reel"
        >
          <Icon name="add" color="#fff" size={22} />
        </GlassButton>
      </View>

      {/* Render only once the page height is known so paging snaps exactly. */}
      {pageHeight > 0 ? (
        <FlatList
          data={REELS}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <ReelCard
              item={item}
              height={pageHeight}
              bottom={bottom}
              isActive={index === activeIndex}
              reaction={reactions[item.id]}
              onToggleLike={toggleLike}
              onToggleSave={toggleSave}
            />
          )}
          getItemLayout={(_, index) => ({
            length: pageHeight,
            offset: pageHeight * index,
            index,
          })}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={VIEWABILITY_CONFIG}
          pagingEnabled
          decelerationRate="fast"
          showsVerticalScrollIndicator={false}
          initialNumToRender={2}
          maxToRenderPerBatch={2}
          windowSize={3}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },
  topBar: {
    position: "absolute",
    left: 20,
    right: 16,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
    ...SHADOW,
  },
  centerSlot: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  pill: {
    flexDirection: "row",
    borderRadius: 19,
    padding: 3,
  },
  segment: {
    paddingHorizontal: 14,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentActive: { backgroundColor: "rgba(255,255,255,0.18)" },
  segmentText: {
    fontSize: 13.5,
    fontWeight: "600",
    color: "rgba(255,255,255,0.65)",
  },
  segmentTextActive: { color: "#fff", fontWeight: "700" },

  card: { width: "100%", backgroundColor: "#000" },

  pauseBadge: {
    position: "absolute",
    top: "40%",
    left: "50%",
    marginLeft: -36,
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  heartPop: {
    position: "absolute",
    top: "34%",
    left: 0,
    right: 0,
    alignItems: "center",
  },

  info: { position: "absolute", left: 16, right: 84 },
  caption: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 19,
    color: "rgba(255,255,255,0.95)",
  },
  sound: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(255,255,255,0.9)",
  },

  rail: { position: "absolute", right: 10, alignItems: "center", gap: 14 },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 6,
  },
  userMeta: { flex: 1, minWidth: 0 },
  nameLine: { flexDirection: "row", alignItems: "center", gap: 6 },
  fullName: { fontSize: 15.5, fontWeight: "700", color: "#fff" },
  username: { fontSize: 13, color: "rgba(255,255,255,0.7)", marginTop: 1 },
  verifiedBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: FB_BLUE,
    alignItems: "center",
    justifyContent: "center",
  },
  followBtn: {
    marginLeft: 12, // breathing room between profile info and the button
    height: 30,
    borderRadius: 15, // pill
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.9)",
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  followBtnActive: { backgroundColor: "rgba(255,255,255,0.16)" },
  followText: { fontSize: 13.5, fontWeight: "700", color: "#fff" },
  followTextActive: { color: "rgba(255,255,255,0.9)" },
  railBtn: { alignItems: "center", gap: 5 },
  railCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  railCount: { fontSize: 12.5, fontWeight: "700", color: "#fff" },
  pressed: { opacity: 0.55 },
});



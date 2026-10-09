import { useState } from "react";
import {
  FlatList,
  Image,
  ImageBackground,
  Pressable,
  Text,
  View,
  StyleSheet,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useEvent } from "expo";
import { useVideoPlayer, VideoView } from "expo-video";
import { useTheme } from "../../../src/theme/useTheme";
import Avatar from "../../../src/components/Avatar";
import GlassButton from "../../../src/components/GlassButton";
import { SearchIcon } from "../../../src/components/Icons";
import { STORIES, UPDATES } from "../../../src/data/updates";

// Brand colors
const STORY_BLUE = "#1E88FF";
const LIKE_PINK = "#F0457A";
const RING_PINK = "#F27BA5";

// Header buttons
const HEADER_BTN = 38;
const UNREAD_NOTIFICATIONS = 3; // swap for real state; 0 hides the red dot
const BELL_RED = "#FF3B30";

// Story card dimensions
const CARD_W = 120;
const CARD_H = 170;
const CARD_RADIUS = 18;
const CARD_AVATAR = 28;

// Feed post
const POST_AVATAR = 46;
const POST_RADIUS = 28;
const MEDIA_RADIUS = 24;
const COLLAB_AVATAR = 28;
const COLLAB_RING = 36;
const TRUNCATE_AT = 66; // characters shown before "… see more"
const PHOTO_ASPECT = 1; // photo posts are square
const VIDEO_ASPECT = 1.5; // video posts are landscape

const MUTED_LINE = "rgba(128,128,128,0.25)";
const PILL_BG = "rgba(40,40,40,0.62)";

/* ---------- Helpers ---------- */

// Pulls "#tags" out of the text so they can be styled on their own line.
// Posts can also provide an explicit `tags` array.
function splitText(text = "", tags) {
  const found = tags ?? text.match(/#\w+/g) ?? [];
  const body = text
    .replace(/#\w+/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  return { body, tags: found };
}

// 120 -> "120+", 1500 -> "1.5K"
function formatCount(n = 0) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(".0", "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(".0", "")}K`;
  if (n >= 100) return `${n}+`;
  return String(n);
}

/* ---------- Small View-built glyphs ---------- */

function PlusGlyph({ color, size = 20 }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <View style={[styles.plusBar, { width: size, backgroundColor: color }]} />
      <View
        style={[
          styles.plusBar,
          {
            width: size,
            backgroundColor: color,
            position: "absolute",
            transform: [{ rotate: "90deg" }],
          },
        ]}
      />
    </View>
  );
}

function BellGlyph({ color }) {
  return (
    <View style={styles.bellWrap}>
      <View style={[styles.bellKnob, { backgroundColor: color }]} />
      <View style={[styles.bellBody, { borderColor: color }]} />
      <View style={[styles.bellClapper, { backgroundColor: color }]} />
    </View>
  );
}

// Small globe shown next to the post time
function GlobeGlyph({ color }) {
  return (
    <View style={[styles.globe, { borderColor: color }]}>
      <View style={[styles.globeMeridian, { borderColor: color }]} />
      <View style={[styles.globeEquator, { backgroundColor: color }]} />
    </View>
  );
}

// Speaker for the video pill; shows a slash when muted
function SpeakerGlyph({ muted }) {
  return (
    <View style={styles.speaker}>
      <View style={styles.speakerBody} />
      <View style={styles.speakerCone} />
      {muted ? (
        <Text style={styles.speakerMute}>×</Text>
      ) : (
        <View style={styles.speakerWave} />
      )}
    </View>
  );
}

function CommentGlyph({ color }) {
  return (
    <View style={styles.commentWrap}>
      <View style={[styles.commentBubble, { borderColor: color }]} />
      <View style={[styles.commentTail, { borderColor: color }]} />
    </View>
  );
}

function ShareGlyph({ color }) {
  return (
    <View style={styles.shareWrap}>
      <Text style={[styles.shareArrow, { color }]}>↑</Text>
      <View style={[styles.shareBox, { borderColor: color }]} />
    </View>
  );
}

function BookmarkGlyph({ color, filled }) {
  return (
    <View
      style={{
        width: 15,
        height: 20,
        borderWidth: 1.8,
        borderColor: color,
        borderRadius: 3,
        backgroundColor: filled ? color : "transparent",
      }}
    />
  );
}

/* ---------- Video ---------- */

// Autoplays muted on a loop. Tap the video to pause / resume, tap the pill to
// mute / unmute.
function VideoMedia({ uri, aspect, duration }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });
  const { isPlaying } = useEvent(player, "playingChange", {
    isPlaying: player.playing,
  });
  const { muted } = useEvent(player, "mutedChange", { muted: player.muted });

  return (
    <View style={[styles.mediaBox, { aspectRatio: aspect }]}>
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        nativeControls={false}
      />

      <Pressable
        onPress={() => (isPlaying ? player.pause() : player.play())}
        accessibilityRole="button"
        accessibilityLabel={isPlaying ? "Pause video" : "Play video"}
        style={styles.videoTap}
      >
        {!isPlaying && (
          <View style={styles.playCircle}>
            <Text style={styles.playGlyph}>▶</Text>
          </View>
        )}
      </Pressable>

      <SoundPill
        muted={muted}
        duration={duration}
        onPress={() => {
          player.muted = !player.muted;
        }}
      />
    </View>
  );
}

function SoundPill({ muted, duration, onPress }) {
  const content = (
    <>
      <SpeakerGlyph muted={muted} />
      {duration ? <Text style={styles.pillText}>{duration}</Text> : null}
    </>
  );
  return onPress ? (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={muted ? "Unmute" : "Mute"}
      hitSlop={8}
      style={styles.pill}
    >
      {content}
    </Pressable>
  ) : (
    <View style={styles.pill}>{content}</View>
  );
}

/* ---------- Story cards ---------- */

function StartStoryCard({ item, colors }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Start a story"
      style={({ pressed }) => [
        styles.card,
        styles.startCard,
        { backgroundColor: colors.surface },
        pressed && { opacity: 0.85 },
      ]}
    >
      <View style={styles.startAvatar}>
        <Avatar uri={item.avatar} name={item.name} size={68} online={false} />
      </View>

      <View
        style={[
          styles.startPlus,
          { backgroundColor: STORY_BLUE, borderColor: colors.surface },
        ]}
      >
        <Text style={styles.startPlusText}>+</Text>
      </View>

      <Text
        style={[styles.startLabel, { color: colors.text }]}
        numberOfLines={1}
      >
        Start a story
      </Text>
    </Pressable>
  );
}

function StoryCard({ item, colors }) {
  const cover = item.cover ?? item.image ?? item.avatar;
  const ringColor = item.seen ? "rgba(255,255,255,0.55)" : STORY_BLUE;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`View ${item.name}'s story`}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
    >
      <ImageBackground
        source={{ uri: cover }}
        style={[styles.cardImage, { backgroundColor: colors.surface }]}
        imageStyle={{ borderRadius: CARD_RADIUS }}
        resizeMode="cover"
      >
        <View style={styles.cardFooter}>
          <View style={[styles.cardRing, { borderColor: ringColor }]}>
            <Avatar
              uri={item.avatar}
              name={item.name}
              size={CARD_AVATAR}
              online={false}
            />
          </View>
          <Text style={styles.cardName} numberOfLines={1}>
            {item.name}
          </Text>
        </View>
      </ImageBackground>
    </Pressable>
  );
}

/* ---------- Feed post cards ---------- */

// Photo post:  verified badge on the avatar + "Follow" button (set `verified`).
// Video post:  two collaborator avatars instead of Follow (set `collaborators`),
//              autoplaying muted video (`video`) with the sound / duration pill.
//              With only `image` + `videoDuration` it shows a still poster.
//
// Fields read from each UPDATES item (all have fallbacks):
//   name, avatar, verified, time
//   text (falls back to preview) - "#tags" inside it are styled automatically
//   tags[]                       - optional explicit tags
//   image (falls back to cover)  - photo / poster
//   video                        - video uri
//   videoDuration                - e.g. "0:32"
//   aspect                       - width / height (default 1 photo, 1.5 video)
//   collaborators[]              - [{ id, avatar, name }]
//   likes, comments, liked, saved, following
function PostHeader({ item, colors, following, onToggleFollow }) {
  const collaborators = item.collaborators ?? [];

  return (
    <View style={styles.postHeader}>
      <Avatar
        uri={item.avatar}
        name={item.name}
        size={POST_AVATAR}
        online={false}
      />

      <View style={styles.postMeta}>
        <View style={styles.nameRow}>
          <Text
            style={[styles.postName, { color: colors.text, flexShrink: 1 }]}
            numberOfLines={1}
          >
            {item.name}
          </Text>
          {item.verified && (
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedTick}>✓</Text>
            </View>
          )}
        </View>
        <View style={styles.timeRow}>
          <Text style={[styles.postTime, { color: colors.textMuted }]}>
            {item.time}
          </Text>
          <View style={[styles.timeDivider, { backgroundColor: MUTED_LINE }]} />
          <GlobeGlyph color={colors.textMuted} />
        </View>
      </View>

      {collaborators.length > 0 ? (
        <View style={styles.collabs}>
          {collaborators.slice(0, 2).map((c, i) => (
            <View
              key={c.id ?? i}
              style={[
                styles.collabRing,
                { backgroundColor: colors.surface },
                i > 0 && { marginLeft: -4 },
              ]}
            >
              <Avatar
                uri={c.avatar}
                name={c.name}
                size={COLLAB_AVATAR}
                online={false}
              />
            </View>
          ))}
        </View>
      ) : (
        <Pressable
          onPress={onToggleFollow}
          accessibilityRole="button"
          accessibilityLabel={following ? "Unfollow" : "Follow"}
          style={[styles.followBtn, { borderColor: MUTED_LINE }]}
        >
          <Text style={[styles.followText, { color: colors.text }]}>
            {following ? "Following" : "Follow"}
          </Text>
        </Pressable>
      )}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="More options"
        hitSlop={10}
        style={styles.moreBtn}
      >
        <Text style={[styles.moreText, { color: colors.text }]}>···</Text>
      </Pressable>
    </View>
  );
}

function PostCard({ item, colors }) {
  const [liked, setLiked] = useState(!!item.liked);
  const [saved, setSaved] = useState(!!item.saved);
  const [following, setFollowing] = useState(!!item.following);
  const [expanded, setExpanded] = useState(false);

  const { body, tags } = splitText(item.text ?? item.preview ?? "", item.tags);
  const isVideo = !!item.video || !!item.videoDuration;
  const image = item.image ?? item.cover;
  const aspect = item.aspect ?? (isVideo ? VIDEO_ASPECT : PHOTO_ASPECT);
  const baseLikes = (item.likes ?? 0) - (item.liked ? 1 : 0);
  const likeCount = baseLikes + (liked ? 1 : 0);

  const isCut = body.length > TRUNCATE_AT && !expanded;
  const shownBody = isCut ? `${body.slice(0, TRUNCATE_AT).trimEnd()}…` : body;

  return (
    <View style={[styles.post, { backgroundColor: colors.surface }]}>
      <PostHeader
        item={item}
        colors={colors}
        following={following}
        onToggleFollow={() => setFollowing((v) => !v)}
      />

      {/* Text: "man, an… see more" */}
      {body ? (
        <Text style={[styles.postBody, { color: colors.text }]}>
          {shownBody}
          {isCut ? (
            <Text
              onPress={() => setExpanded(true)}
              style={{ color: colors.textMuted }}
            >
              {" see more"}
            </Text>
          ) : null}
        </Text>
      ) : null}

      {tags.length > 0 && <Text style={styles.tags}>{tags.join(" ")}</Text>}

      {/* Media */}
      {item.video ? (
        <View style={styles.mediaWrap}>
          <VideoMedia
            uri={item.video}
            aspect={aspect}
            duration={item.videoDuration}
          />
        </View>
      ) : image ? (
        <View style={styles.mediaWrap}>
          <View style={[styles.mediaBox, { aspectRatio: aspect }]}>
            <Image
              source={{ uri: image }}
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: colors.background },
              ]}
              resizeMode="cover"
            />
            {isVideo ? <SoundPill muted={false} duration={item.videoDuration} /> : null}
          </View>
        </View>
      ) : null}

      {/* Actions */}
      <View
        style={[
          styles.actions,
          { borderTopColor: MUTED_LINE, borderBottomColor: MUTED_LINE },
        ]}
      >
        <Pressable
          onPress={() => setLiked((v) => !v)}
          accessibilityRole="button"
          accessibilityLabel={liked ? "Unlike" : "Like"}
          hitSlop={8}
          style={styles.action}
        >
          <Text
            style={[
              styles.heart,
              { color: liked ? LIKE_PINK : colors.textMuted },
            ]}
          >
            {liked ? "♥" : "♡"}
          </Text>
          <Text style={[styles.actionCount, { color: colors.text }]}>
            {formatCount(likeCount)}
            <Text style={[styles.actionLabel, { color: colors.textMuted }]}>
              {" Likes"}
            </Text>
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Comments"
          hitSlop={8}
          style={[styles.action, { marginLeft: 20 }]}
        >
          <CommentGlyph color={colors.text} />
          <Text style={[styles.actionCount, { color: colors.text }]}>
            {formatCount(item.comments ?? 0)}
            <Text style={[styles.actionLabel, { color: colors.textMuted }]}>
              {" Comments"}
            </Text>
          </Text>
        </Pressable>

        <View style={styles.flex} />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Share"
          hitSlop={10}
          style={styles.iconBtn}
        >
          <ShareGlyph color={colors.text} />
        </Pressable>
        <Pressable
          onPress={() => setSaved((v) => !v)}
          accessibilityRole="button"
          accessibilityLabel={saved ? "Remove bookmark" : "Bookmark"}
          hitSlop={10}
          style={styles.iconBtn}
        >
          <BookmarkGlyph color={colors.text} filled={saved} />
        </Pressable>
      </View>
    </View>
  );
}

/* ---------- Screen ---------- */

export default function UpdatesScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const mine = STORIES.find((s) => s.isMine);
  const others = STORIES.filter((s) => !s.isMine);
  const storyData = mine ? [mine, ...others] : others;

  const ListHeader = (
    <View>
      {/* Status / stories */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Status
        </Text>
      </View>

      <FlatList
        data={storyData}
        keyExtractor={(s) => s.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.storiesRow}
        renderItem={({ item }) =>
          item.isMine ? (
            <StartStoryCard item={item} colors={colors} />
          ) : (
            <StoryCard item={item} colors={colors} />
          )
        }
      />

      <View style={[styles.divider, { backgroundColor: colors.surface }]} />

      {/* Feeds */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Feeds</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Updates</Text>
        <View style={styles.headerActions}>
          <View>
            <GlassButton
              size={HEADER_BTN}
              label={
                UNREAD_NOTIFICATIONS > 0
                  ? `Notifications, ${UNREAD_NOTIFICATIONS} unread`
                  : "Notifications"
              }
              // onPress={() => router.push("/notifications")}
            >
              <BellGlyph color={colors.text} />
            </GlassButton>
            {UNREAD_NOTIFICATIONS > 0 && (
              <View
                pointerEvents="none"
                style={[styles.bellDot, { borderColor: colors.background }]}
              />
            )}
          </View>
          <GlassButton size={HEADER_BTN} label="Search updates">
            <SearchIcon color={colors.text} size={19} />
          </GlassButton>
          <GlassButton size={HEADER_BTN} label="Add status">
            <PlusGlyph color={colors.text} size={17} />
          </GlassButton>
        </View>
      </View>

      <FlatList
        data={UPDATES}
        keyExtractor={(u) => u.id}
        ListHeaderComponent={ListHeader}
        renderItem={({ item }) => <PostCard item={item} colors={colors} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 110 }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },

  // header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  title: { fontSize: 26, fontWeight: "700" },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 8 },

  // notification bell
  bellWrap: { width: 18, height: 20, alignItems: "center" },
  bellKnob: { width: 3, height: 2.5, borderRadius: 1.5 },
  bellBody: {
    width: 15,
    height: 13,
    borderWidth: 1.8,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
  bellClapper: {
    width: 6,
    height: 3,
    marginTop: 1.5,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
  },
  bellDot: {
    position: "absolute",
    top: 1,
    right: 1,
    width: 11,
    height: 11,
    borderRadius: 6,
    borderWidth: 2,
    backgroundColor: BELL_RED,
  },

  // plus glyph
  plusBar: { height: 2.2, borderRadius: 1.5 },

  // sections
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },
  sectionTitle: { fontSize: 19, fontWeight: "700" },
  divider: { height: StyleSheet.hairlineWidth, marginTop: 14 },

  // story cards
  storiesRow: { gap: 10, paddingHorizontal: 16, paddingVertical: 4 },
  card: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: CARD_RADIUS,
    overflow: "hidden",
  },
  cardImage: { flex: 1, padding: 8 },
  cardFooter: {
    position: "absolute",
    left: 8,
    right: 8,
    bottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  cardName: {
    flex: 1,
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  cardRing: {
    width: CARD_AVATAR + 6,
    height: CARD_AVATAR + 6,
    borderRadius: (CARD_AVATAR + 6) / 2,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },

  // "Start a story" card
  startCard: { alignItems: "center" },
  startAvatar: { marginTop: 20 },
  startPlus: {
    position: "absolute",
    bottom: 44,
    alignSelf: "center",
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2.5,
    alignItems: "center",
    justifyContent: "center",
  },
  startPlusText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
    lineHeight: 19,
  },
  startLabel: {
    position: "absolute",
    bottom: 14,
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
    paddingHorizontal: 4,
  },

  // feed post
  post: {
    marginHorizontal: 12,
    marginBottom: 14,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 6,
    borderRadius: POST_RADIUS,
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },
  postMeta: { flex: 1, gap: 2 },
  postName: { fontSize: 16.5, fontWeight: "600" },
  timeRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  postTime: { fontSize: 12.5 },
  timeDivider: { width: StyleSheet.hairlineWidth * 2, height: 12 },

  globe: {
    width: 13,
    height: 13,
    borderRadius: 7,
    borderWidth: 1.2,
    alignItems: "center",
    justifyContent: "center",
  },
  globeMeridian: {
    position: "absolute",
    width: 5,
    height: 11,
    borderRadius: 3,
    borderWidth: 1.1,
  },
  globeEquator: { position: "absolute", width: 11, height: 1.1 },

  nameRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  verifiedBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: STORY_BLUE,
    alignItems: "center",
    justifyContent: "center",
  },
  verifiedTick: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
    lineHeight: 12,
  },
  followBtn: {
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 17,
    borderWidth: 1,
  },
  followText: { fontSize: 13, fontWeight: "500" },

  collabs: { flexDirection: "row", alignItems: "center" },
  collabRing: {
    width: COLLAB_RING,
    height: COLLAB_RING,
    borderRadius: COLLAB_RING / 2,
    borderWidth: 2,
    borderColor: RING_PINK,
    alignItems: "center",
    justifyContent: "center",
  },

  moreBtn: { paddingHorizontal: 2 },
  moreText: { fontSize: 20, fontWeight: "700", letterSpacing: 1 },

  postBody: { fontSize: 14.5, lineHeight: 21 },
  tags: {
    color: STORY_BLUE,
    fontSize: 13.5,
    marginTop: 12,
  },

  // media
  mediaWrap: { marginTop: 12 },
  mediaBox: {
    width: "100%",
    borderRadius: MEDIA_RADIUS,
    overflow: "hidden",
    backgroundColor: "#000",
  },
  videoTap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  playCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  playGlyph: { color: "#fff", fontSize: 22, marginLeft: 3 },

  // sound / duration pill
  pill: {
    position: "absolute",
    top: 14,
    right: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: PILL_BG,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 18,
  },
  pillText: { color: "#fff", fontSize: 14, fontWeight: "500" },
  speaker: { width: 20, height: 16, flexDirection: "row", alignItems: "center" },
  speakerBody: { width: 4, height: 7, backgroundColor: "#fff" },
  speakerCone: {
    width: 0,
    height: 0,
    borderTopWidth: 6,
    borderBottomWidth: 6,
    borderRightWidth: 7,
    borderTopColor: "transparent",
    borderBottomColor: "transparent",
    borderRightColor: "#fff",
    transform: [{ rotate: "180deg" }],
  },
  speakerWave: {
    width: 6,
    height: 12,
    marginLeft: 1,
    borderWidth: 1.6,
    borderLeftWidth: 0,
    borderColor: "#fff",
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6,
  },
  speakerMute: {
    color: "#fff",
    fontSize: 16,
    lineHeight: 16,
    marginLeft: 2,
  },

  // actions
  actions: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  action: { flexDirection: "row", alignItems: "center", gap: 7 },
  heart: { fontSize: 23, lineHeight: 25 },
  actionCount: { fontSize: 14, fontWeight: "700" },
  actionLabel: { fontWeight: "400" },
  iconBtn: { marginLeft: 20 },

  commentWrap: { width: 20, height: 20 },
  commentBubble: {
    width: 19,
    height: 19,
    borderRadius: 10,
    borderWidth: 1.8,
  },
  commentTail: {
    position: "absolute",
    left: 1,
    bottom: 0,
    width: 7,
    height: 7,
    borderLeftWidth: 1.8,
    borderBottomWidth: 1.8,
    borderBottomLeftRadius: 2,
    backgroundColor: "transparent",
  },

  shareWrap: { width: 20, height: 22, alignItems: "center" },
  shareArrow: { fontSize: 13, lineHeight: 14, fontWeight: "700" },
  shareBox: {
    position: "absolute",
    bottom: 1,
    width: 18,
    height: 12,
    borderWidth: 1.8,
    borderTopWidth: 0,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
});
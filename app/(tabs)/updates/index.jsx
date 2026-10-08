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
import { useTheme } from "../../../src/theme/useTheme";
import Avatar from "../../../src/components/Avatar";
import GlassButton from "../../../src/components/GlassButton";
import { SearchIcon } from "../../../src/components/Icons";
import { STORIES, UPDATES } from "../../../src/data/updates";

// Brand colors
const STORY_BLUE = "#1E88FF";
const LIKE_PINK = "#E8416B";

// Story card dimensions
const CARD_W = 120;
const CARD_H = 170;
const CARD_RADIUS = 18;
const CARD_AVATAR = 28;

// Feed post
const POST_AVATAR = 44;
const POST_RADIUS = 24;
const MEDIA_RADIUS = 20;
const COLLAB_AVATAR = 30;
const SEE_MORE_AFTER = 90; // characters before we offer "see more"

const MUTED_LINE = "rgba(128,128,128,0.25)";

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

function formatCount(n = 0) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(".0", "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(".0", "")}K`;
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

function CommentGlyph({ color }) {
  return (
    <View
      style={{
        width: 19,
        height: 17,
        borderRadius: 9,
        borderWidth: 1.8,
        borderColor: color,
      }}
    />
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
        width: 14,
        height: 19,
        borderWidth: 1.8,
        borderColor: color,
        borderRadius: 3,
        backgroundColor: filled ? color : "transparent",
      }}
    />
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

/* ---------- Feed ---------- */

// Reads these optional fields from each UPDATES item (all have fallbacks):
//   name, avatar, verified, time
//   text (falls back to preview) - "#tags" inside it are styled automatically
//   tags[]                       - optional explicit tags
//   image (falls back to cover), aspect (width / height, default 1)
//   videoDuration                - e.g. "0:32", shows the sound pill on the media
//   collaborators[]              - [{ id, avatar, name }] shown instead of Follow
//   likes, comments, liked, saved, following
function PostCard({ item, colors }) {
  const [liked, setLiked] = useState(!!item.liked);
  const [saved, setSaved] = useState(!!item.saved);
  const [following, setFollowing] = useState(!!item.following);
  const [expanded, setExpanded] = useState(false);

  const { body, tags } = splitText(item.text ?? item.preview ?? "", item.tags);
  const canExpand = body.length > SEE_MORE_AFTER;
  const media = item.image ?? item.cover;
  const baseLikes = (item.likes ?? 0) - (item.liked ? 1 : 0);
  const likeCount = baseLikes + (liked ? 1 : 0);
  const collaborators = item.collaborators ?? [];

  const toggleLike = () => setLiked((v) => !v);

  return (
    <View style={[styles.post, { backgroundColor: colors.surface }]}>
      {/* Header */}
      <View style={styles.postHeader}>
        <View>
          <Avatar
            uri={item.avatar}
            name={item.name}
            size={POST_AVATAR}
            online={false}
          />
          {item.verified && (
            <View
              style={[styles.verifiedBadge, { borderColor: colors.surface }]}
            >
              <Text style={styles.verifiedTick}>✓</Text>
            </View>
          )}
        </View>

        <View style={styles.postMeta}>
          <Text
            style={[styles.postName, { color: colors.text }]}
            numberOfLines={1}
          >
            {item.name}
          </Text>
          <Text style={[styles.postTime, { color: colors.textMuted }]}>
            {item.time}
          </Text>
        </View>

        {collaborators.length > 0 ? (
          <View style={styles.collabs}>
            {collaborators.slice(0, 2).map((c, i) => (
              <View
                key={c.id ?? i}
                style={[
                  styles.collab,
                  { borderColor: colors.surface },
                  i > 0 && { marginLeft: -8 },
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
            onPress={() => setFollowing((v) => !v)}
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

      {/* Text */}
      {body ? (
        <Text
          style={[styles.postBody, { color: colors.text }]}
          numberOfLines={expanded ? undefined : 2}
        >
          {body}
          {canExpand && !expanded ? (
            <Text
              onPress={() => setExpanded(true)}
              style={{ color: colors.textMuted }}
            >
              {"  see more"}
            </Text>
          ) : null}
        </Text>
      ) : null}

      {tags.length > 0 && <Text style={styles.tags}>{tags.join(" ")}</Text>}

      {/* Media */}
      {media ? (
        <View style={styles.mediaWrap}>
          <Image
            source={{ uri: media }}
            style={[
              styles.media,
              {
                aspectRatio: item.aspect ?? 1,
                backgroundColor: colors.background,
              },
            ]}
            resizeMode="cover"
          />
          {item.videoDuration ? (
            <View style={styles.videoPill}>
              <Text style={styles.videoPillText}>🔊 {item.videoDuration}</Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {/* Actions */}
      <View style={[styles.actions, { borderTopColor: MUTED_LINE }]}>
        <Pressable
          onPress={toggleLike}
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
            <Text style={{ color: colors.textMuted }}> Likes</Text>
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Comments"
          hitSlop={8}
          style={[styles.action, { marginLeft: 18 }]}
        >
          <CommentGlyph color={colors.text} />
          <Text style={[styles.actionCount, { color: colors.text }]}>
            {formatCount(item.comments ?? 0)}
            <Text style={{ color: colors.textMuted }}> Comments</Text>
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
          <GlassButton size={44} label="Search updates">
            <SearchIcon color={colors.text} size={22} />
          </GlassButton>
          <GlassButton size={44} label="Add status">
            <PlusGlyph color={colors.text} size={20} />
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
  headerActions: { flexDirection: "row", gap: 10 },

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
    padding: 12,
    borderRadius: POST_RADIUS,
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  postMeta: { flex: 1, gap: 1 },
  postName: { fontSize: 16, fontWeight: "700" },
  postTime: { fontSize: 12.5 },
  verifiedBadge: {
    position: "absolute",
    right: -2,
    top: -2,
    width: 17,
    height: 17,
    borderRadius: 9,
    borderWidth: 2,
    backgroundColor: STORY_BLUE,
    alignItems: "center",
    justifyContent: "center",
  },
  verifiedTick: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "800",
    lineHeight: 11,
  },
  followBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  followText: { fontSize: 13, fontWeight: "500" },
  collabs: { flexDirection: "row", alignItems: "center" },
  collab: {
    borderWidth: 2,
    borderRadius: (COLLAB_AVATAR + 4) / 2,
  },
  moreBtn: { paddingHorizontal: 2 },
  moreText: { fontSize: 20, fontWeight: "700", letterSpacing: 1 },

  postBody: { fontSize: 14.5, lineHeight: 21 },
  tags: {
    color: STORY_BLUE,
    fontSize: 13.5,
    marginTop: 8,
  },
  mediaWrap: { marginTop: 12 },
  media: {
    width: "100%",
    borderRadius: MEDIA_RADIUS,
  },
  videoPill: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
  },
  videoPillText: { color: "#fff", fontSize: 13, fontWeight: "500" },

  actions: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  action: { flexDirection: "row", alignItems: "center", gap: 6 },
  heart: { fontSize: 22, lineHeight: 24 },
  actionCount: { fontSize: 14, fontWeight: "600" },
  iconBtn: { marginLeft: 18 },

  shareWrap: { width: 20, height: 20, alignItems: "center" },
  shareArrow: { fontSize: 13, lineHeight: 14, fontWeight: "700" },
  shareBox: {
    position: "absolute",
    bottom: 1,
    width: 17,
    height: 10,
    borderWidth: 1.8,
    borderTopWidth: 0,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
});

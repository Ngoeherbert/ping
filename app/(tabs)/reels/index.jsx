import { useCallback, useEffect, useState } from "react";
import { FlatList, Pressable, Text, View, StyleSheet, Dimensions } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../../src/theme/useTheme";
import Avatar from "../../../src/components/Avatar";
import GlassButton from "../../../src/components/GlassButton";
import {
  HeartIcon2,
  CommentIcon,
  ShareIcon,
  BookmarkIcon,
} from "../../../src/components/Icons";
import { MoreVerticalGlyph } from "../../../src/components/ChatIcons";
import { REELS } from "../../../src/data/reels";
import { VideoView, useVideoPlayer } from "expo-video";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const ReelPlayer = ({ uri, isActive }) => {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    p.muted = true;
    p.volume = 0;
  });

  useEffect(() => {
    if (isActive) {
      player.play();
    } else {
      player.pause();
    }
  }, [isActive, player]);

  return (
    <VideoView
      style={StyleSheet.absoluteFill}
      player={player}
      contentFit="cover"
      nativeControls={false}
    />
  );
};

function SideActions({ isLiked, isSaved, onLike, onSave, onShare }) {
  const { colors } = useTheme();

  return (
    <View style={styles.sideActions}>
      <GlassButton size={56} label="Like" onPress={onLike}>
        <HeartIcon2 color={isLiked ? colors.danger : colors.text} size={28} />
      </GlassButton>

      <GlassButton size={56} label="Comment">
        <CommentIcon color={colors.text} size={26} />
      </GlassButton>

      <GlassButton size={56} label="Share" onPress={onShare}>
        <ShareIcon color={colors.text} size={26} />
      </GlassButton>

      <GlassButton size={56} label="Save" onPress={onSave}>
        <BookmarkIcon
          color={isSaved ? colors.primary : colors.text}
          size={26}
        />
      </GlassButton>

      <View style={styles.moreContainer}>
        <GlassButton size={56} label="More">
          <MoreVerticalGlyph color={colors.text} size={24} />
        </GlassButton>
      </View>
    </View>
  );
}

function ReelCard({ item, index, activeIndex, onLike, onSave }) {
  const { colors } = useTheme();
  const isActive = index === activeIndex;
  const [liked, setLiked] = useState(item.liked);
  const [saved, setSaved] = useState(item.saved);
  const [likes, setLikes] = useState(item.likes);
  const [showHeart, setShowHeart] = useState(false);

  const toggleLike = () => {
    setLiked(!liked);
    setLikes((n) => (liked ? n - 1 : n + 1));
    setShowHeart(true);
    setTimeout(() => setShowHeart(false), 800);
    onLike(item.id);
  };

  const toggleSave = () => {
    setSaved(!saved);
    onSave(item.id);
  };

  const handleShare = () => {
    // share sheet would go here
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.background }]}>
      <ReelPlayer uri={item.uri} isActive={isActive} />

      <View style={styles.info}>
        <View style={styles.userInfo}>
          <Avatar uri={item.avatar} name={item.user} size={40} />
          <View>
            <Text style={[styles.userName, { color: colors.text }]}>{item.user}</Text>
            {item.verified && <View style={[styles.verifiedBadge, { backgroundColor: colors.primary }]} />}
          </View>
          <Pressable style={[styles.followBtn, { backgroundColor: colors.primarySoft }]}>
            <Text style={[styles.followText, { color: colors.primary }]}>Follow</Text>
          </Pressable>
        </View>

        <View style={styles.caption}>
          {showHeart && <Text style={styles.heartPop}>❤️</Text>}
          <Text style={[styles.captionText, { color: colors.text }]}>{item.caption}</Text>
        </View>

        <View style={styles.stats}>
          <Text style={[styles.stat, { color: colors.textMuted }]}>{likes} likes</Text>
          <Text style={[styles.stat, { color: colors.textMuted }]}>{item.comments} comments</Text>
        </View>
      </View>

      <SideActions
        isLiked={liked}
        isSaved={saved}
        onLike={toggleLike}
        onSave={toggleSave}
        onShare={handleShare}
      />
    </View>
  );
}

export default function ReelsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [activeIndex, setActiveIndex] = useState(0);

  const handleLike = useCallback((_id) => {
    // persisted via parent state in a real app
  }, []);

  const handleSave = useCallback((_id) => {
    // persisted via parent state in a real app
  }, []);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }) => {
      if (viewableItems.length > 0) {
        setActiveIndex(viewableItems[0].index);
      }
    },
    [],
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
      <View style={styles.topBar}>
        <Text style={[styles.title, { color: colors.text }]}>Reels</Text>
      </View>

      <FlatList
        data={REELS}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <ReelCard
            item={item}
            index={index}
            activeIndex={activeIndex}
            onLike={handleLike}
            onSave={handleSave}
          />
        )}
        pagingEnabled
        decelerationRate="fast"
        snapToInterval={SCREEN_HEIGHT - insets.top}
        snapToAlignment="start"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{
          itemVisiblePercentThreshold: 50,
        }}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 10,
    zIndex: 10,
  },
  title: { fontSize: 26, fontWeight: "700" },
  card: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: "#000",
  },
  info: {
    position: "absolute",
    bottom: 100,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  userName: { fontSize: 15, fontWeight: "700" },
  verifiedBadge: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginLeft: 4,
  },
  followBtn: {
    marginLeft: "auto",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  followText: { fontSize: 13, fontWeight: "700" },
  caption: {
    marginBottom: 10,
    position: "relative",
    minHeight: 20,
  },
  captionText: { fontSize: 14, lineHeight: 19 },
  heartPop: {
    position: "absolute",
    top: -10,
    left: 0,
    fontSize: 36,
    fontWeight: "700",
  },
  stats: {
    flexDirection: "row",
    gap: 16,
  },
  stat: { fontSize: 12.5 },
  sideActions: {
    position: "absolute",
    right: 16,
    top: 300,
    alignItems: "center",
    gap: 8,
  },
  moreContainer: {
    marginTop: 12,
  },
});

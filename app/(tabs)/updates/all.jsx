import { useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useTheme } from "../../../src/theme/useTheme";
import Avatar from "../../../src/components/Avatar";
import GlassSurface from "../../../src/components/GlassSurface";
import Icon from "../../../src/components/icons";
import { STORIES } from "../../../src/data/updates";

// Brand blue - same story-ring color as the feed's story row.
const STORY_BLUE = "#1E88FF";

const GUTTER = 16;
const GAP = 13;
const AVATAR = 48;
const RING = AVATAR + 6; // ring container width/height
const SEP_LEFT = GUTTER + RING + GAP; // divider starts at the text column

// Header filter menu options.
const FILTERS = [
  { key: "all", label: "All stories" },
  { key: "muted", label: "Muted" },
];

/* ---------- List row ---------- */

// WhatsApp-style status row: ringed avatar + name + time, hairline divider
// inset to the text column. Tapping plays the story.
function StoryRow({ item, colors }) {
  const ringColor = item.seen ? colors.border : STORY_BLUE;

  return (
    <Pressable
      onPress={() => router.push(`/updates/${item.id}`)}
      accessibilityRole="button"
      accessibilityLabel={
        item.isMine ? "View your story" : `View ${item.name}'s story`
      }
      style={({ pressed }) => [
        styles.row,
        pressed && { backgroundColor: colors.surface },
      ]}
    >
      <View style={[styles.ring, { borderColor: ringColor }]}>
        <Avatar
          uri={item.avatar}
          name={item.name}
          size={AVATAR}
          online={false}
        />
      </View>
      <View style={styles.rowText}>
        <Text
          style={[styles.rowName, { color: colors.text }]}
          numberOfLines={1}
        >
          {item.name}
        </Text>
        <Text
          style={[styles.rowTime, { color: colors.textMuted }]}
          numberOfLines={1}
        >
          {item.isMine ? `Your story · ${item.time}` : item.time}
        </Text>
      </View>
    </Pressable>
  );
}

/* ---------- Screen ---------- */

// Every story in one list, laid out like WhatsApp's muted-stories screen.
// Reached from the "View more" tile at the end of the feed's story row.
export default function AllStoriesScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  // "all" = every story; "muted" = only muted contacts' stories.
  const [filter, setFilter] = useState("all");
  const [menuOpen, setMenuOpen] = useState(false);

  const data = filter === "muted" ? STORIES.filter((s) => s.muted) : STORIES;
  const filterActive = menuOpen || filter !== "all";

  const toggleMenu = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMenuOpen((v) => !v);
  };
  const choose = (key) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFilter(key);
    setMenuOpen(false);
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      {/* App bar: centered title with glassy circular icon buttons.
          The filter menu hangs below it inside this wrapper. */}
      <View style={[styles.appBarWrap, menuOpen && styles.appBarWrapOpen]}>
        <View style={styles.appBar}>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Back"
            hitSlop={10}
            style={({ pressed }) => [
              styles.appBarBtn,
              pressed && { opacity: 0.6 },
            ]}
          >
            <GlassSurface style={styles.circleBtn}>
              <Icon name="back" color={colors.text} size={22} />
            </GlassSurface>
          </Pressable>
          <View style={styles.sideSpacer} />
          <Text
            style={[styles.appBarTitle, { color: colors.text }]}
            numberOfLines={1}
          >
            All stories
          </Text>
          <View style={styles.sideSpacer} />
          <Pressable
            onPress={toggleMenu}
            accessibilityRole="button"
            accessibilityLabel="Filter stories"
            accessibilityState={{ expanded: menuOpen }}
            hitSlop={10}
            style={({ pressed }) => [
              styles.appBarBtn,
              pressed && { opacity: 0.6 },
            ]}
          >
            <GlassSurface style={styles.circleBtn}>
              <Icon
                name="filter"
                color={filterActive ? colors.primary : colors.text}
                size={22}
              />
            </GlassSurface>
          </Pressable>
        </View>

        {menuOpen && (
          <GlassSurface style={styles.menu}>
            {FILTERS.map((option) => (
              <Pressable
                key={option.key}
                onPress={() => choose(option.key)}
                accessibilityRole="button"
                accessibilityLabel={option.label}
                accessibilityState={{ selected: filter === option.key }}
                style={({ pressed }) => [
                  styles.menuItem,
                  pressed && { backgroundColor: colors.background },
                ]}
              >
                <Text
                  style={[
                    styles.menuLabel,
                    { color: colors.text },
                    filter === option.key && styles.menuLabelActive,
                  ]}
                >
                  {option.label}
                </Text>
                <View style={styles.menuTickSlot}>
                  {filter === option.key && (
                    <Icon name="tick" color={colors.primary} size={18} />
                  )}
                </View>
              </Pressable>
            ))}
          </GlassSurface>
        )}
      </View>

      <FlatList
        data={data}
        keyExtractor={(s) => s.id}
        contentContainerStyle={[{ paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => (
          <View
            style={[styles.sep, { backgroundColor: colors.border }]}
          />
        )}
        ListEmptyComponent={
          <Text style={[styles.empty, { color: colors.textMuted }]}>
            No muted stories
          </Text>
        }
        renderItem={({ item }) => <StoryRow item={item} colors={colors} />}
      />

      {/* Tap-away backdrop that closes the filter menu */}
      {menuOpen && (
        <Pressable
          onPress={() => setMenuOpen(false)}
          accessibilityRole="button"
          accessibilityLabel="Close filter menu"
          style={styles.backdrop}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // app bar wrapper (keeps the filter menu pinned below the bar)
  appBarWrap: { position: "relative" },
  appBarWrapOpen: { zIndex: 10, elevation: 10 },
  appBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  appBarBtn: { padding: 4 },
  appBarTitle: { fontSize: 20, fontWeight: "600" },
  // equal flex spacers keep the title optically centered between the buttons
  sideSpacer: { flex: 1 },
  // glassy circular buttons behind the back / filter icons
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  // filter menu (glass popover)
  menu: {
    position: "absolute",
    right: 12,
    // 68pt bar (10 + 48 + 10) + 4pt gap
    top: 72,
    minWidth: 190,
    borderRadius: 14,
    paddingVertical: 4,
    zIndex: 10,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  menuLabel: { fontSize: 15 },
  menuLabelActive: { fontWeight: "600" },
  menuTickSlot: {
    width: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  backdrop: { ...StyleSheet.absoluteFillObject },
  empty: { textAlign: "center", fontSize: 14.5, paddingTop: 40 },

  // list
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: GAP,
    paddingHorizontal: GUTTER,
    paddingVertical: 11,
  },
  ring: {
    width: RING,
    height: RING,
    borderRadius: RING / 2,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  rowText: { flex: 1, gap: 2 },
  rowName: { fontSize: 16.5, fontWeight: "600" },
  rowTime: { fontSize: 13.5 },
  sep: {
    height: StyleSheet.hairlineWidth,
    marginLeft: SEP_LEFT,
  },
});

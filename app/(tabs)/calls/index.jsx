import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  FlatList,
  ImageBackground,
  LayoutAnimation,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import * as Haptics from "expo-haptics";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useTheme } from "../../../src/theme/useTheme";
import Avatar from "../../../src/components/Avatar";
import GlassSurface from "../../../src/components/GlassSurface";
import {
  SearchIcon,
  InfoCircleIcon,
  CallIncomingIcon,
  CallOutgoingIcon,
  CallMissedIcon,
} from "../../../src/components/Icons";
import { RECENT_CALLS } from "../../../src/data/calls";

const IOS_BLUE = "#007AFF";
const MISSED_RED = "#FF3B30";
const FAV_ORANGE = "#FF9F0A";

const FAV_W = 92;
const FAV_H = 118;
const FAV_RADIUS = 22;

const META_ICON_SIZE = 14;

// Width of the round action buttons revealed by swiping a row left
const ACTIONS_W = 136;

const CALL_LABELS = {
  outgoing: "Outgoing",
  incoming: "Incoming",
  missed: "Missed",
  group: "Group",
};

/* ---------- View-built glyphs ---------- */

function VideoGlyph({ color, size = 18 }) {
  const w = size;
  const h = size * 0.72;
  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <View
        style={{
          width: w * 0.68,
          height: h,
          borderRadius: size * 0.2,
          backgroundColor: color,
        }}
      />
      <View
        style={{
          width: 0,
          height: 0,
          marginLeft: 1,
          borderTopWidth: h * 0.32,
          borderBottomWidth: h * 0.32,
          borderRightWidth: w * 0.3,
          borderTopColor: "transparent",
          borderBottomColor: "transparent",
          borderRightColor: color,
        }}
      />
    </View>
  );
}

function TrashGlyph({ color, size = 22 }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "flex-end",
      }}
    >
      {/* handle */}
      <View
        style={{
          position: "absolute",
          top: size * 0.06,
          width: size * 0.32,
          height: size * 0.14,
          borderWidth: 2,
          borderBottomWidth: 0,
          borderTopLeftRadius: 2,
          borderTopRightRadius: 2,
          borderColor: color,
        }}
      />
      {/* lid */}
      <View
        style={{
          position: "absolute",
          top: size * 0.2,
          width: size * 0.86,
          height: 2.2,
          borderRadius: 1.1,
          backgroundColor: color,
        }}
      />
      {/* bin */}
      <View
        style={{
          width: size * 0.62,
          height: size * 0.78,
          borderWidth: 2,
          borderTopWidth: 0,
          borderBottomLeftRadius: 4,
          borderBottomRightRadius: 4,
          borderColor: color,
        }}
      />
    </View>
  );
}

/* ---------- Date formatting ---------- */

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function startOfDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

// today -> time (9:22AM) | yesterday -> "Yesterday" | this week -> "Mon"
// older -> day/Mon/year (08/Mar/2025)
// Reads item.timestamp (or item.date); falls back to item.time if neither is set.
function formatCallTime(item) {
  const raw = item.timestamp ?? item.date;
  if (raw == null) return item.time;

  const d = new Date(raw);
  if (isNaN(d.getTime())) return item.time;

  const days = Math.round((startOfDay(new Date()) - startOfDay(d)) / 86400000);

  if (days <= 0) {
    const h = d.getHours();
    const m = String(d.getMinutes()).padStart(2, "0");
    return `${h % 12 || 12}:${m}${h < 12 ? "AM" : "PM"}`;
  }
  if (days === 1) return "Yesterday";
  if (days < 7) return WEEKDAYS[d.getDay()];

  const day = String(d.getDate()).padStart(2, "0");
  return `${day}/${MONTHS[d.getMonth()]}/${d.getFullYear()}`;
}

/* ---------- Pieces ---------- */

function CallTypeIcon({ type, color }) {
  if (type === "incoming")
    return <CallIncomingIcon color={color} size={META_ICON_SIZE} />;
  if (type === "outgoing")
    return <CallOutgoingIcon color={color} size={META_ICON_SIZE} />;
  if (type === "missed" || type === "group")
    return <CallMissedIcon color={color} size={META_ICON_SIZE} />;
  return null;
}

function CircleButton({ label, onPress, disabled, children }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [pressed && { opacity: 0.6 }]}
    >
      <GlassSurface style={styles.circleButton}>{children}</GlassSurface>
    </Pressable>
  );
}

function SelectCircle({ selected, colors }) {
  return (
    <View
      style={[
        styles.selectCircle,
        { borderColor: selected ? IOS_BLUE : colors.textMuted },
        selected && { backgroundColor: IOS_BLUE },
      ]}
    >
      {selected ? <Text style={styles.selectTick}>✓</Text> : null}
    </View>
  );
}

function InfoButton({ item }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Call info for ${item.name}`}
      style={({ pressed }) => [styles.callButton, pressed && { opacity: 0.6 }]}
    >
      <InfoCircleIcon color={IOS_BLUE} size={24} />
    </Pressable>
  );
}

function FavoriteCardBody({ item, colors }) {
  const cover = item.cover ?? item.image ?? item.avatar;
  return (
    <>
      <ImageBackground
        source={{ uri: cover }}
        style={[styles.favCard, { backgroundColor: colors.surface }]}
        imageStyle={{ borderRadius: FAV_RADIUS }}
        resizeMode="cover"
      />
      <View style={styles.favLabelRow}>
        {item.video ? (
          <VideoGlyph color={colors.textMuted} size={13} />
        ) : (
          <CallOutgoingIcon color={colors.textMuted} size={12} />
        )}
        <Text
          style={[styles.favName, { color: colors.textMuted }]}
          numberOfLines={1}
        >
          {item.name}
        </Text>
      </View>
    </>
  );
}

function FavoriteCard({ item, colors, hidden, onFocus }) {
  const ref = useRef(null);

  // Long press: firm haptic tap (like WhatsApp), then the card pops out
  function handleLongPress() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    ref.current?.measureInWindow((x, y, w, h) => onFocus({ item, x, y, w, h }));
  }

  return (
    <Pressable
      ref={ref}
      accessibilityRole="button"
      accessibilityLabel={`Call ${item.name}`}
      accessibilityHint="Long press for more options"
      delayLongPress={350}
      onLongPress={handleLongPress}
      style={({ pressed }) => [
        styles.favWrap,
        hidden && { opacity: 0 },
        pressed && { opacity: 0.85, transform: [{ scale: 0.96 }] },
      ]}
    >
      <FavoriteCardBody item={item} colors={colors} />
    </Pressable>
  );
}

// Focused "pop out" view: the screen dims, the pressed card lifts and scales up
// where it was, and a small menu appears next to it.
function FavoritePopOut({ focus, colors, onClose, onRemove }) {
  const { width: screenW, height: screenH } = useWindowDimensions();
  const [anim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (focus) {
      anim.setValue(0);
      Animated.spring(anim, {
        toValue: 1,
        useNativeDriver: true,
        bounciness: 9,
        speed: 16,
      }).start();
    }
  }, [focus, anim]);

  if (!focus) return null;

  function dismiss(after) {
    Animated.timing(anim, {
      toValue: 0,
      duration: 140,
      useNativeDriver: true,
    }).start(() => {
      onClose();
      if (after) after();
    });
  }

  const POP_SCALE = 1.14;
  const MENU_W = 240;
  const MENU_H = 56;

  const cardScale = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, POP_SCALE],
  });
  const menuScale = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.85, 1],
  });
  const menuShift = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [-8, 0],
  });

  const extra = (focus.h * (POP_SCALE - 1)) / 2;
  const below = focus.y + focus.h + extra + 14;
  const fitsBelow = below + MENU_H < screenH - 40;
  const menuTop = fitsBelow ? below : focus.y - extra - 14 - MENU_H;
  const menuLeft = Math.min(Math.max(16, focus.x), screenW - MENU_W - 16);

  return (
    <Modal
      transparent
      visible
      animationType="none"
      statusBarTranslucent
      onRequestClose={() => dismiss()}
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: "rgba(0,0,0,0.6)", opacity: anim },
        ]}
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          accessibilityLabel="Close"
          onPress={() => dismiss()}
        />
      </Animated.View>

      <Animated.View
        pointerEvents="none"
        style={[
          styles.popCard,
          {
            left: focus.x,
            top: focus.y,
            width: focus.w,
            transform: [{ scale: cardScale }],
          },
        ]}
      >
        <FavoriteCardBody item={focus.item} colors={colors} />
      </Animated.View>

      <Animated.View
        style={[
          styles.popMenu,
          {
            left: menuLeft,
            top: menuTop,
            width: MENU_W,
            height: MENU_H,
            backgroundColor: colors.surface,
            opacity: anim,
            transform: [{ translateY: menuShift }, { scale: menuScale }],
          },
        ]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Remove ${focus.item.name} from favorites`}
          onPress={() => dismiss(onRemove)}
          style={({ pressed }) => [
            styles.popMenuItem,
            pressed && { opacity: 0.6 },
          ]}
        >
          <Text style={[styles.popMenuText, { color: MISSED_RED }]}>
            Remove from Favorites
          </Text>
          <TrashGlyph color={MISSED_RED} size={18} />
        </Pressable>
      </Animated.View>
    </Modal>
  );
}

function CallRow({
  item,
  colors,
  editing,
  selected,
  onToggle,
  onPress,
  onLongPress,
}) {
  const missed = item.type === "missed";
  const label = CALL_LABELS[item.type] ?? "Call";
  const metaColor = missed ? MISSED_RED : colors.textMuted;

  return (
    <Pressable
      accessibilityRole={editing ? "checkbox" : "button"}
      accessibilityState={editing ? { checked: selected } : undefined}
      accessibilityLabel={
        editing
          ? `Select call with ${item.name}`
          : `Open call with ${item.name}`
      }
      onPress={editing ? onToggle : onPress}
      onLongPress={onLongPress}
      delayLongPress={350}
      style={({ pressed }) => [
        styles.row,
        pressed && { backgroundColor: colors.surface },
      ]}
    >
      {editing ? (
        <SelectCircle selected={selected} colors={colors} />
      ) : item.unread ? (
        <View style={[styles.unreadDot, { backgroundColor: IOS_BLUE }]} />
      ) : null}

      <Avatar uri={item.avatar} name={item.name} size={52} online={false} />

      <View style={styles.middle}>
        <Text
          style={[styles.name, { color: missed ? MISSED_RED : colors.text }]}
          numberOfLines={1}
        >
          {item.name}
        </Text>

        <View style={styles.metaRow}>
          {item.video ? (
            <VideoGlyph color={metaColor} size={15} />
          ) : (
            <CallTypeIcon type={item.type} color={metaColor} />
          )}
          <Text
            style={[styles.meta, { color: colors.textMuted }]}
            numberOfLines={1}
          >
            {label}
          </Text>
        </View>

        {item.preview ? (
          <Text
            style={[styles.preview, { color: colors.textMuted }]}
            numberOfLines={2}
          >
            {item.preview}
          </Text>
        ) : null}
      </View>

      <View style={styles.right}>
        <Text style={[styles.time, { color: colors.textMuted }]}>
          {formatCallTime(item)}
        </Text>
        {editing ? (
          <View style={styles.callButton} />
        ) : (
          <InfoButton item={item} />
        )}
      </View>
    </Pressable>
  );
}

/* ---------- Swipeable row ---------- */

// Swipe a row left to reveal a Delete action. This uses a horizontal ScrollView that
// snaps open/closed, so the native scroll system handles the gesture (no JS gesture
// code, no extra libraries) and it cooperates with the vertical list.
function SwipeRow({
  item,
  colors,
  editing,
  selected,
  onToggle,
  isOpen,
  onOpenChange,
  onDelete,
  isFavorite,
  onToggleFavorite,
  onLongPress,
}) {
  const { width } = useWindowDimensions();
  const scrollRef = useRef(null);

  // close when another row opens or edit mode starts
  useEffect(() => {
    if (!isOpen || editing) {
      scrollRef.current?.scrollTo({ x: 0, animated: true });
    }
  }, [isOpen, editing]);

  function settle(e) {
    const open = e.nativeEvent.contentOffset.x > ACTIONS_W / 2;
    if (open !== isOpen) onOpenChange(open);
  }

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      scrollEnabled={!editing}
      showsHorizontalScrollIndicator={false}
      bounces={false}
      overScrollMode="never"
      decelerationRate="fast"
      snapToOffsets={[0, ACTIONS_W]}
      snapToEnd={false}
      onMomentumScrollEnd={settle}
      onScrollEndDrag={settle}
    >
      <View style={{ width, backgroundColor: colors.background }}>
        <CallRow
          item={item}
          colors={colors}
          editing={editing}
          selected={selected}
          onToggle={onToggle}
          onLongPress={onLongPress}
          onPress={() => {
            if (isOpen) onOpenChange(false);
          }}
        />
      </View>

      <View style={styles.actionsSlot}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            isFavorite
              ? `Remove ${item.name} from favorites`
              : `Add ${item.name} to favorites`
          }
          onPress={onToggleFavorite}
          style={({ pressed }) => [
            styles.actionCircle,
            { backgroundColor: isFavorite ? "#8E8E93" : FAV_ORANGE },
            pressed && { opacity: 0.7 },
          ]}
        >
          <Text style={styles.favGlyph}>{isFavorite ? "☆" : "★"}</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Delete call with ${item.name}`}
          onPress={onDelete}
          style={({ pressed }) => [
            styles.actionCircle,
            { backgroundColor: MISSED_RED },
            pressed && { opacity: 0.7 },
          ]}
        >
          <TrashGlyph color="#fff" size={22} />
        </Pressable>
      </View>
    </ScrollView>
  );
}

/* ---------- Screen ---------- */

export default function CallsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [calls, setCalls] = useState(RECENT_CALLS);
  const [editing, setEditing] = useState(false);
  const [selected, setSelected] = useState({});
  const [openId, setOpenId] = useState(null);
  const [focus, setFocus] = useState(null);

  const selectedCount = calls.filter((c) => selected[c.id]).length;

  function exitEdit() {
    setEditing(false);
    setSelected({});
  }

  function toggleEdit() {
    setOpenId(null);
    if (editing) exitEdit();
    else setEditing(true);
  }

  // Long press a call: haptic tap, enter edit mode and select it
  // (if already editing, it just toggles that row)
  function selectFromLongPress(id) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setOpenId(null);
    if (editing) {
      toggleSelect(id);
    } else {
      setEditing(true);
      setSelected({ [id]: true });
    }
  }

  function deleteOne(id) {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenId(null);
    setCalls((prev) => prev.filter((c) => c.id !== id));
  }

  function toggleSelect(id) {
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function confirmDelete() {
    if (selectedCount === 0) return;
    Alert.alert(
      `Delete ${selectedCount} call${selectedCount > 1 ? "s" : ""}?`,
      "This can't be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            setCalls((prev) => prev.filter((c) => !selected[c.id]));
            exitEdit();
          },
        },
      ],
    );
  }

  // Favorites shown in the top card row. Starts with the first few contacts from
  // your recent calls; swiping a call and tapping the star adds (or removes) one.
  // Swap the seed for a saved favorites list when you have one.
  const [favorites, setFavorites] = useState(() => {
    const seen = new Set();
    return RECENT_CALLS.filter((c) => {
      if (seen.has(c.name)) return false;
      seen.add(c.name);
      return true;
    }).slice(0, 4);
  });

  function toggleFavorite(item) {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenId(null);
    setFavorites((prev) =>
      prev.some((f) => f.name === item.name)
        ? prev.filter((f) => f.name !== item.name)
        : [item, ...prev],
    );
  }

  const ListHeader = (
    <View>
      {favorites.length > 0 && (
        <FlatList
          data={favorites}
          keyExtractor={(c) => `fav-${c.name}`}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.favRow}
          renderItem={({ item }) => (
            <FavoriteCard
              item={item}
              colors={colors}
              hidden={focus?.item.name === item.name}
              onFocus={setFocus}
            />
          )}
        />
      )}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Recents</Text>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={editing ? "Done editing" : "Edit calls"}
          onPress={toggleEdit}
          hitSlop={6}
        >
          <GlassSurface style={styles.editPill}>
            <Text style={[styles.editText, { color: colors.text }]}>
              {editing ? "Done" : "Edit"}
            </Text>
          </GlassSurface>
        </Pressable>

        <Text
          style={[styles.title, { color: colors.text }]}
          pointerEvents="none"
        >
          {editing && selectedCount > 0 ? `${selectedCount} Selected` : "Calls"}
        </Text>

        {editing ? (
          <CircleButton
            label="Delete selected calls"
            onPress={confirmDelete}
            disabled={selectedCount === 0}
          >
            <View style={{ opacity: selectedCount === 0 ? 0.4 : 1 }}>
              <TrashGlyph
                color={selectedCount === 0 ? colors.textMuted : MISSED_RED}
              />
            </View>
          </CircleButton>
        ) : (
          <CircleButton label="Search calls">
            <SearchIcon color={colors.text} size={22} />
          </CircleButton>
        )}
      </View>

      <FlatList
        data={calls}
        keyExtractor={(c) => String(c.id)}
        extraData={{ editing, selected, openId, favorites }}
        ListHeaderComponent={ListHeader}
        renderItem={({ item }) => (
          <SwipeRow
            item={item}
            colors={colors}
            editing={editing}
            selected={!!selected[item.id]}
            onToggle={() => toggleSelect(item.id)}
            isOpen={openId === item.id}
            onOpenChange={(open) => setOpenId(open ? item.id : null)}
            onDelete={() => deleteOne(item.id)}
            isFavorite={favorites.some((f) => f.name === item.name)}
            onToggleFavorite={() => toggleFavorite(item)}
            onLongPress={() => selectFromLongPress(item.id)}
          />
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 110 }}
      />

      <FavoritePopOut
        focus={focus}
        colors={colors}
        onClose={() => setFocus(null)}
        onRemove={() => toggleFavorite(focus.item)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // header
  header: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  title: {
    position: "absolute",
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 17,
    fontWeight: "700",
  },
  editPill: {
    height: 40,
    paddingHorizontal: 18,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  editText: { fontSize: 16, fontWeight: "500" },
  circleButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },

  // favorites
  favRow: { gap: 12, paddingHorizontal: 16, paddingTop: 6, paddingBottom: 4 },
  favWrap: { width: FAV_W },
  favCard: {
    width: FAV_W,
    height: FAV_H,
    borderRadius: FAV_RADIUS,
    overflow: "hidden",
  },
  favLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    marginTop: 7,
  },
  favName: { fontSize: 13, fontWeight: "500", flexShrink: 1 },

  // recents
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    paddingHorizontal: 16,
    paddingTop: 22,
    paddingBottom: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  // sits in the left margin so it never pushes the avatar over
  unreadDot: {
    position: "absolute",
    left: 4,
    top: "50%",
    marginTop: -4.5,
    width: 9,
    height: 9,
    borderRadius: 4.5,
  },
  selectCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.8,
    alignItems: "center",
    justifyContent: "center",
  },
  selectTick: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 15,
  },
  middle: { flex: 1, gap: 2 },
  name: { fontSize: 17, fontWeight: "600" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  meta: { fontSize: 14.5 },
  preview: { fontSize: 14, lineHeight: 18 },
  right: { alignItems: "flex-end", gap: 6 },
  time: { fontSize: 13 },
  callButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  // swipe actions: round buttons revealed to the right of the row
  actionsSlot: {
    width: ACTIONS_W,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  actionCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
  },
  favGlyph: { color: "#fff", fontSize: 26, lineHeight: 30 },

  // favorite pop-out
  popCard: {
    position: "absolute",
    shadowColor: "#000",
    shadowOpacity: 0.45,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 14,
  },
  popMenu: {
    position: "absolute",
    borderRadius: 18,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  popMenuItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
  },
  popMenuText: { fontSize: 16, fontWeight: "500" },
});

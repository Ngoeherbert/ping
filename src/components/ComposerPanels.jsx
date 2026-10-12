import { useCallback, useEffect, useState } from "react";
import {
  BackHandler,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../theme/useTheme";
import Icon from "./icons";
import GlassSurface from "./GlassSurface";

const DEFAULT_PANEL_HEIGHT = 300;
const MIN_PANEL_HEIGHT = 260;

/* ---------- Hook: keeps the panel in the keyboard's place ---------- */

// panel: null | "attach" | "sticker"
export function useComposerPanel(inputRef) {
  const [panel, setPanel] = useState(null);
  const [panelHeight, setPanelHeight] = useState(DEFAULT_PANEL_HEIGHT);

  // remember the real keyboard height so the panel matches it exactly
  useEffect(() => {
    const evt = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const sub = Keyboard.addListener(evt, (e) =>
      setPanelHeight(Math.max(MIN_PANEL_HEIGHT, e.endCoordinates.height)),
    );
    return () => sub.remove();
  }, []);

  // Android back closes the panel first
  useEffect(() => {
    if (!panel) return undefined;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      setPanel(null);
      return true;
    });
    return () => sub.remove();
  }, [panel]);

  const close = useCallback(() => setPanel(null), []);

  // Tap the same button again -> back to the keyboard (icon toggles)
  const toggle = useCallback(
    (name) => {
      if (panel === name) {
        setPanel(null);
        inputRef?.current?.focus();
      } else {
        setPanel(name);
        Keyboard.dismiss();
      }
    },
    [panel, inputRef],
  );

  return { panel, panelHeight, toggle, close };
}

/* ---------- Attach panel ---------- */

// `icon` is a name from your own ./icons set. Rename here if yours differ.
const ATTACH_ITEMS = [
  { key: "photo", label: "Photo", icon: "image", color: "#34C759" },
  { key: "camera", label: "Camera", icon: "camera", color: "#0A84FF" },
  { key: "files", label: "Files", icon: "file", color: "#5E5CE6" },
  { key: "games", label: "Games", icon: "game", color: "#FF9F0A" },
  { key: "location", label: "Location", icon: "location", color: "#FF3B30" },
  { key: "contact", label: "Contact", icon: "contact", color: "#30B0C7" },
];

function AttachPanel({ onSelect }) {
  const { colors } = useTheme();
  return (
    <View style={styles.attachGrid}>
      {ATTACH_ITEMS.map((item) => (
        <Pressable
          key={item.key}
          onPress={() => onSelect?.(item.key)}
          accessibilityRole="button"
          accessibilityLabel={item.label}
          style={({ pressed }) => [
            styles.attachItem,
            pressed && { opacity: 0.6 },
          ]}
        >
          <View style={[styles.attachCircle, { backgroundColor: item.color }]}>
            <Icon name={item.icon} size={26} color="#fff" />
          </View>
          <Text style={[styles.attachLabel, { color: colors.text }]}>
            {item.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

/* ---------- Sticker / GIF panel ---------- */

// Stickers and GIFs are images. Each item is one of:
//   { id, uri: "https://..." }                       (remote)
//   { id, source: require("../../assets/x.webp") }   (bundled)
// GIFs can also carry a `title` used by the search box.
function itemSource(item) {
  return item.source ?? { uri: item.uri };
}

function StickerPanel({ stickers, gifs, onSend, searching, setSearching }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState("gifs"); // "gifs" | "stickers"
  const [query, setQuery] = useState("");

  const isGifs = tab === "gifs";
  const list = isGifs ? gifs : stickers;
  const data =
    isGifs && query.trim()
      ? list.filter((g) =>
          (g.title ?? "").toLowerCase().includes(query.trim().toLowerCase()),
        )
      : list;

  const renderItem = ({ item }) => (
    <Pressable
      onPress={() => onSend?.({ type: isGifs ? "gif" : "sticker", ...item })}
      accessibilityRole="button"
      accessibilityLabel={item.title ?? (isGifs ? "GIF" : "Sticker")}
      style={({ pressed }) => [
        styles.cell,
        isGifs && { backgroundColor: colors.surface },
        pressed && { opacity: 0.6 },
      ]}
    >
      <Image
        source={itemSource(item)}
        style={styles.cellImg}
        resizeMode={isGifs ? "cover" : "contain"}
      />
    </Pressable>
  );

  const tabs = (
    <View style={[styles.tabsWrap, { backgroundColor: colors.surface }]}>
      {[
        { key: "gifs", label: "GIFs" },
        { key: "stickers", label: "Stickers" },
      ].map((t) => {
        const selected = tab === t.key;
        return (
          <Pressable
            key={t.key}
            onPress={() => setTab(t.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            style={[
              styles.stickerTab,
              selected && { backgroundColor: colors.primary },
            ]}
          >
            <Text
              style={[
                styles.stickerTabText,
                { color: selected ? colors.onPrimary : colors.textMuted },
              ]}
            >
              {t.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );

  const grid = (
    <FlatList
      key={tab}
      data={data}
      keyExtractor={(i) => String(i.id)}
      renderItem={renderItem}
      numColumns={isGifs ? 2 : 4}
      columnWrapperStyle={styles.row}
      contentContainerStyle={styles.list}
      keyboardShouldPersistTaps="handled"
      ListEmptyComponent={
        <Text style={[styles.emptyText, { color: colors.textMuted }]}>
          {isGifs
            ? query.trim()
              ? "No GIFs match your search."
              : "No GIFs yet. Connect GIPHY or Tenor and pass them in `gifs`."
            : "No stickers yet. Pass your sticker images in `stickers`."}
        </Text>
      }
    />
  );

  return (
    <View style={styles.flex}>
      {/* Normal size: tabs, a search field that opens the full-screen search, grid */}
      {tabs}
      {isGifs ? (
        <Pressable
          onPress={() => setSearching(true)}
          accessibilityRole="search"
          accessibilityLabel="Search GIFs"
          style={[
            styles.search,
            styles.searchFake,
            { backgroundColor: colors.surface },
          ]}
        >
          <Text
            numberOfLines={1}
            style={{
              fontSize: 14.5,
              color: query.trim() ? colors.text : colors.textMuted,
            }}
          >
            {query.trim() || "Search GIFs"}
          </Text>
        </Pressable>
      ) : null}
      {grid}

      {/* Full screen while searching: covers the header and the composer row */}
      <Modal
        visible={searching}
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setSearching(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={[
            styles.fullScreen,
            {
              backgroundColor: colors.background,
              paddingTop: insets.top + 8,
            },
          ]}
        >
          <View style={styles.searchRow}>
            <TextInput
              value={query}
              onChangeText={setQuery}
              autoFocus
              placeholder="Search GIFs"
              placeholderTextColor={colors.textMuted}
              returnKeyType="search"
              onSubmitEditing={() => Keyboard.dismiss()}
              style={[
                styles.search,
                styles.searchInModal,
                { backgroundColor: colors.surface, color: colors.text },
              ]}
            />
            <Pressable
              onPress={() => setSearching(false)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Close search"
            >
              <Text style={[styles.cancel, { color: colors.primary }]}>
                Cancel
              </Text>
            </Pressable>
          </View>
          {tabs}
          {grid}
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

/* ---------- The panel that replaces the keyboard ---------- */

export default function ComposerPanel({
  mode, // "attach" | "sticker"
  height,
  onAttach, // (key) => void  key: photo|camera|files|games|location|contact
  onSend, // ({ type: "gif" | "sticker", id, uri?, source? }) => void
  stickers = [],
  gifs = [],
}) {
  const [searching, setSearching] = useState(false);
  // Reset search whenever the panel closes or switches. Derived during render
  // (adjust state while rendering): if the mode changed since the last render,
  // drop search state. No effect-time setState, no cascading render.
  const [seenMode, setSeenMode] = useState(mode);
  if (mode !== seenMode) {
    setSeenMode(mode);
    if (searching) setSearching(false);
  }

  if (!mode) return null;

  return (
    <GlassSurface
      style={[
        styles.panel,
        {
          height,
          borderTopWidth: 0, // GlassSurface paints its own hairline border
        },
      ]}
    >
      {mode === "attach" ? (
        <AttachPanel onSelect={onAttach} />
      ) : (
        <StickerPanel
          stickers={stickers}
          gifs={gifs}
          onSend={(item) => {
            setSearching(false);
            onSend?.(item);
          }}
          searching={searching}
          setSearching={setSearching}
        />
      )}
    </GlassSurface>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  panel: { overflow: "hidden" },
  fullScreen: { flex: 1 },

  attachGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 12,
    paddingTop: 20,
  },
  attachItem: {
    width: "33.33%",
    alignItems: "center",
    gap: 8,
    marginBottom: 22,
  },
  attachCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
  },
  attachLabel: { fontSize: 13, fontWeight: "500" },

  tabsWrap: {
    flexDirection: "row",
    alignSelf: "center",
    marginTop: 12,
    padding: 3,
    borderRadius: 18,
  },
  stickerTab: {
    paddingHorizontal: 22,
    height: 32,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  stickerTabText: { fontSize: 14, fontWeight: "700" },

  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: 16,
  },
  search: {
    height: 38,
    paddingHorizontal: 14,
    borderRadius: 19,
    fontSize: 14.5,
  },
  searchFake: {
    marginHorizontal: 16,
    marginTop: 10,
    justifyContent: "center",
  },
  searchInModal: { flex: 1 },
  cancel: { fontSize: 15, fontWeight: "600" },

  list: { padding: 12, gap: 8, flexGrow: 1 },
  row: { gap: 8 },
  cell: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  cellImg: { width: "100%", height: "100%" },
  emptyText: { textAlign: "center", marginTop: 30, paddingHorizontal: 30 },
});

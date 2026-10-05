import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, Text, TextInput, Pressable, FlatList } from "react-native";
import Icon from "../../Icon";
import { useOverlayTheme } from "../overlayTheme";
import { haptic } from "../../../utils/haptics";
import { EMOJI_CATEGORIES, ALL_EMOJI, TONEABLE, withTone } from "./emojiData";
import { loadEmojiRecents, saveEmojiRecents, loadSkinTone, saveSkinTone } from "./panelStorage";

export default function EmojiPanel({ inputRef = null, onSelect = null, height, stickerSlot = null, gifSlot = null }) {
  const theme = useOverlayTheme();
  const { colors, spacing, fontSize } = theme;
  const [tab, setTab] = useState("recent");
  const [query, setQuery] = useState("");
  const [recents, setRecents] = useState([]);
  const [tone, setTone] = useState(0);
  const [toneFor, setToneFor] = useState(null);
  const toneTimer = useRef(null);

  useEffect(() => {
    let live = true;
    loadEmojiRecents().then((r) => live && setRecents(r));
    loadSkinTone().then((t) => live && setTone(t));
    return () => { live = false; if (toneTimer.current) clearTimeout(toneTimer.current); };
  }, []);

  const insertAtCursor = useCallback((raw) => {
    const emoji = TONEABLE.has(raw) ? withTone(raw, tone) : raw;
    const node = inputRef?.current;
    if (node && typeof node.focus === "function") {
      const text = typeof node.value === "string" ? node.value : "";
      const start = node.selectionStart ?? text.length;
      const end = node.selectionEnd ?? text.length;
      node.value = text.slice(0, start) + emoji + text.slice(end);
      const pos = start + emoji.length;
      node.selectionStart = pos;
      node.selectionEnd = pos;
      node.onChangeText?.(node.value);
      node.focus();
    }
    onSelect?.(emoji);
    setRecents((prev) => {
      const next = [emoji, ...prev.filter((e) => e !== emoji)].slice(0, 30);
      saveEmojiRecents(next);
      return next;
    });
  }, [inputRef, onSelect, tone]);

  const backspace = useCallback(() => {
    const node = inputRef?.current;
    if (!node || typeof node.focus !== "function") return;
    const text = typeof node.value === "string" ? node.value : "";
    let pos = node.selectionStart ?? text.length;
    const end = node.selectionEnd ?? text.length;
    if (pos !== end) {
      node.value = text.slice(0, pos) + text.slice(end);
    } else if (pos > 0) {
      const chars = Array.from(text.slice(0, pos));
      chars.pop();
      const next = chars.join("");
      node.value = next + text.slice(pos);
      pos = next.length;
    } else {
      return;
    }
    node.selectionStart = pos;
    node.selectionEnd = pos;
    node.onChangeText?.(node.value);
    node.focus();
    haptic.light();
  }, [inputRef]);

  const results = useMemo(() => {
    const q = query.trim();
    if (q) return ALL_EMOJI.filter((e) => e.includes(q)).slice(0, 240);
    if (tab === "recent") return recents;
    if (tab === "stickers" || tab === "gifs") return [];
    const cat = EMOJI_CATEGORIES.find((c) => c.id === tab);
    return cat ? cat.emoji : [];
  }, [query, tab, recents]);

  const pickTone = useCallback((index) => {
    setTone(index);
    saveSkinTone(index);
    setToneFor(null);
    haptic.select();
  }, []);

  const tabs = useMemo(() => {
    const base = [{ id: "recent", label: "Recent", icon: "backspace" }];
    const cats = EMOJI_CATEGORIES.map((c) => ({ id: c.id, label: c.label, icon: c.icon }));
    if (stickerSlot) base.push({ id: "stickers", label: "Stickers", icon: "sticker" });
    if (gifSlot) base.push({ id: "gifs", label: "GIFs", icon: "image" });
    return [...base, ...cats];
  }, [stickerSlot, gifSlot]);

  const renderCell = useCallback(({ item }) => (
    <EmojiCell
      emoji={item}
      onPress={() => { haptic.select(); insertAtCursor(item); }}
      onLongPress={() => {
        if (TONEABLE.has(item)) {
          haptic.medium();
          setToneFor(item);
          if (toneTimer.current) clearTimeout(toneTimer.current);
          toneTimer.current = setTimeout(() => setToneFor(null), 4000);
        }
      }}
    />
  ), [insertAtCursor]);

  return (
    <View style={{ flex: 1, height, backgroundColor: colors.background }}>
      <View style={{ paddingHorizontal: spacing.md, paddingTop: spacing.sm }}>
        <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: colors.surface, borderRadius: 20, paddingHorizontal: spacing.md, height: 40 }}>
          <Icon name="search" size={18} color={colors.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search emoji"
            placeholderTextColor={colors.textMuted}
            returnKeyType="search"
            style={{ flex: 1, marginStart: spacing.sm, fontSize: fontSize.md, color: colors.text }}
            accessibilityLabel="Search emoji"
          />
          <Pressable onPress={backspace} accessibilityRole="button" accessibilityLabel="Backspace, delete character before cursor" hitSlop={8} style={{ padding: 6 }}>
            <Icon name="backspace" size={22} color={colors.text} />
          </Pressable>
        </View>
      </View>
      <View style={{ flex: 1, paddingTop: spacing.sm }}>
        {tab === "stickers" && stickerSlot ? stickerSlot()
          : tab === "gifs" && gifSlot ? gifSlot()
          : results.length === 0 ? (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl }}>
              <Text style={{ fontSize: fontSize.md, color: colors.textMuted }}>
                {tab === "recent" && !query ? "Emoji you use will appear here" : "No emoji found"}
              </Text>
            </View>
          ) : (
            <FlatList
              data={results}
              keyExtractor={(item, index) => `${item}-${index}`}
              renderItem={renderCell}
              numColumns={8}
              keyboardShouldPersistTaps="handled"
              removeClippedSubviews
              initialNumToRender={64}
              maxToRenderPerBatch={64}
              windowSize={5}
              getItemLayout={(_, index) => ({ length: 44, offset: 44 * Math.floor(index / 8), index })}
            />
          )}
      </View>
      {toneFor ? (
        <View style={{ position: "absolute", top: 52, alignSelf: "center", flexDirection: "row", backgroundColor: colors.elevated, borderRadius: 24, padding: spacing.sm, shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 12, elevation: 6 }} accessibilityRole="menu" accessibilityLabel={`Skin tone for ${toneFor}`}>
          {[0, 1, 2, 3, 4].map((i) => (
            <Pressable key={i} onPress={() => pickTone(i)} accessibilityRole="button" accessibilityLabel={`Skin tone ${i + 1}${i === tone ? ", selected" : ""}`} accessibilityState={{ selected: i === tone }} style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center", borderRadius: 22, backgroundColor: i === tone ? colors.surface : "transparent" }}>
              <Text style={{ fontSize: 26 }}>{withTone(toneFor, i)}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      <View style={{ flexDirection: "row", borderTopWidth: 1, borderTopColor: colors.border }}>
        <FlatList
          data={tabs}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyExtractor={(t) => t.id}
          renderItem={({ item }) => {
            const selected = (query ? "search" : tab) === item.id;
            return (
              <Pressable onPress={() => { setQuery(""); setTab(item.id); haptic.light(); }} accessibilityRole="tab" accessibilityLabel={item.label} accessibilityState={{ selected }} style={{ minWidth: 44, minHeight: 44, paddingHorizontal: spacing.sm, alignItems: "center", justifyContent: "center", borderBottomWidth: 2, borderBottomColor: selected ? colors.primary : "transparent" }}>
                <Icon name={item.icon} size={22} color={selected ? colors.primary : colors.textMuted} />
              </Pressable>
            );
          }}
        />
      </View>
    </View>
  );
}

function EmojiCell({ emoji, onPress, onLongPress }) {
  return (
    <Pressable onPress={onPress} onLongPress={onLongPress} delayLongPress={350} accessibilityRole="button" accessibilityLabel={`Emoji ${emoji}`} style={{ width: "12.5%", height: 44, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ fontSize: 26 }}>{emoji}</Text>
    </Pressable>
  );
}

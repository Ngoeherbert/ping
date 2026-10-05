import { useMemo, useRef, useState } from "react";
import { View, Text, Pressable, FlatList, useWindowDimensions } from "react-native";
import Icon from "../../Icon";
import { useOverlayTheme } from "../overlayTheme";
import { haptic } from "../../../utils/haptics";

const PAGE_SIZE = 8;

/**
 * Generic data-driven attachment grid. Screens pass the tiles; nothing is
 * hardcoded (files, images, camera, games, location, contact, poll arrive
 * later as `items`).
 *
 * - Same `items` array can also render inside an ActionSheet (layout="grid")
 *   or a BottomSheet child.
 * - `paged` splits overflow onto swipeable pages with dots.
 * - `expanded` (with `onExpand`) lets a screen drag it to full height; height
 *   is fixed to the keyboard height by default so it fits the shared area.
 * - Tiles call their own handler then close the panel by default
 *   (`keepOpen: true` opts out).
 */
export default function AttachmentPanel(props) {
  const { items = [], paged = false, expanded = false, onExpand = null, onClosePanel = null, testID } = props;
  const theme = useOverlayTheme();
  const { colors, spacing, fontSize } = theme;
  const { width } = useWindowDimensions();
  const [page, setPage] = useState(0);
  const listRef = useRef(null);

  const pages = useMemo(() => {
    if (!paged || items.length <= PAGE_SIZE) return [items];
    const out = [];
    for (let i = 0; i < items.length; i += PAGE_SIZE) out.push(items.slice(i, i + PAGE_SIZE));
    return out;
  }, [items, paged]);

  const press = (item) => {
    if (item.disabled) return;
    haptic.select();
    item.onPress?.(item.id);
    if (!item.keepOpen) onClosePanel?.();
  };

  const renderTile = (item) => (
    <Pressable
      key={item.id}
      onPress={() => press(item)}
      disabled={!!item.disabled}
      accessibilityRole="button"
      accessibilityLabel={item.label}
      accessibilityState={{ disabled: !!item.disabled }}
      style={{ width: (width - spacing.lg * 2) / 4, alignItems: "center", paddingVertical: spacing.md, opacity: item.disabled ? 0.45 : 1 }}
    >
      <View style={{ width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center", backgroundColor: item.color ?? colors.surface }}>
        <Icon name={item.icon} size={26} color={item.color ? "#FFFFFF" : colors.primary} />
      </View>
      <Text numberOfLines={1} style={{ marginTop: spacing.xs, fontSize: fontSize.sm, color: colors.text }}>
        {item.label}
      </Text>
    </Pressable>
  );

  return (
    <View testID={testID} style={{ flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing.sm, paddingTop: spacing.sm }}>
      {expanded && onExpand ? (
        <Pressable onPress={onExpand} accessibilityRole="button" accessibilityLabel="Expand attachment panel" style={{ alignSelf: "center", width: 44, height: 20, alignItems: "center", justifyContent: "center" }}>
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border }} />
        </Pressable>
      ) : null}
      {pages.length === 1 ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
          {pages[0].map(renderTile)}
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <FlatList
            ref={listRef}
            data={pages}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(_, i) => `page-${i}`}
            onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / Math.max(1, width)))}
            renderItem={({ item: pg }) => (
              <View style={{ width: width - spacing.sm * 2, flexDirection: "row", flexWrap: "wrap" }}>
                {pg.map(renderTile)}
              </View>
            )}
          />
          <View style={{ flexDirection: "row", justifyContent: "center", paddingVertical: spacing.sm }} accessibilityRole="tablist" accessibilityLabel="Attachment pages">
            {pages.map((_, i) => (
              <View key={i} style={{ width: 6, height: 6, borderRadius: 3, marginHorizontal: 3, backgroundColor: i === page ? colors.primary : colors.border }} />
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

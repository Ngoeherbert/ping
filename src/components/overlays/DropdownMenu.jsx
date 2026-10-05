import { useCallback, useEffect, useMemo, useState } from "react";
import { View, StyleSheet, ScrollView, useWindowDimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  useReducedMotion,
} from "react-native-reanimated";
import Backdrop from "./Backdrop";
import { useOverlayTheme } from "./overlayTheme";
import { FADE_DURATION } from "./animations";
import { useBackHandler } from "./useBackHandler";
import { MenuRow, MenuSeparator, MenuSectionHeader, isDivider, isHeader } from "./menuItems";
import { haptic } from "../../utils/haptics";

const MENU_WIDTH = 250;
const MENU_MARGIN = 8;
const ITEM_HEIGHT = 48;
const HEADER_HEIGHT = 34;
const DIVIDER_HEIGHT = 1;
const PADDING_VERTICAL = 12;
const MAX_WIDTH_TABLET = 320;

export function estimateMenuHeight(items = []) {
  let height = PADDING_VERTICAL;
  items.forEach((entry) => {
    if (isDivider(entry)) height += DIVIDER_HEIGHT + 8;
    else if (isHeader(entry)) height += HEADER_HEIGHT;
    else height += entry?.subtitle ? 58 : ITEM_HEIGHT;
  });
  return height;
}

export function placeMenu({ anchor, menuWidth, menuHeight, screenWidth, screenHeight, insets, placement = "bottom-end" }) {
  const safeLeft = MENU_MARGIN + (insets?.left ?? 0);
  const safeRight = screenWidth - MENU_MARGIN - (insets?.right ?? 0);
  const safeTop = MENU_MARGIN + (insets?.top ?? 0);
  const safeBottom = screenHeight - MENU_MARGIN - (insets?.bottom ?? 0);
  const [vHint, hHint] = String(placement).split("-");
  const ax = anchor?.x ?? screenWidth / 2;
  const ay = anchor?.y ?? 100;
  const aw = anchor?.width ?? 0;
  const ah = anchor?.height ?? 0;
  let top = vHint === "top" ? ay - menuHeight - 6 : ay + ah + 6;
  if (top + menuHeight > safeBottom) top = ay - menuHeight - 6;
  if (top < safeTop) top = Math.max(safeTop, Math.min(safeBottom - menuHeight, ay));
  let left;
  if (hHint === "start") left = ax;
  else if (hHint === "center") left = ax + aw / 2 - menuWidth / 2;
  else left = ax + aw - menuWidth;
  const maxLeft = Math.max(safeLeft, safeRight - menuWidth);
  left = Math.max(safeLeft, Math.min(maxLeft, left));
  const growFromTop = top <= ay;
  return { top: Math.round(top), left: Math.round(left), growFromTop };
}

const DropdownMenu = ({
  visible = false,
  onClose,
  items = [],
  anchor = null, touchPoint = null, placement = "bottom-end",
  preview = null, reactionRow = null, dimmed = false, backdropOpacity = 0.25,
  closeOnSelect = true, enableBackdropDismiss = true, dismissable = true,
  maxHeightRatio = 0.6, testID, rootInsets = null,
}) => {
  const theme = useOverlayTheme();
  const { colors, radius } = theme;
  const fallbackInsets = { top: 0, bottom: 0, left: 0, right: 0 };
  const insets = rootInsets ?? fallbackInsets;
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const reducedMotion = useReducedMotion();
  const [mounted, setMounted] = useState(visible);
  const progress = useSharedValue(0);
  const menuItems = useMemo(() => items ?? [], [items]);
  const naturalHeight = useMemo(() => estimateMenuHeight(menuItems), [menuItems]);
  const width = Math.min(MENU_WIDTH, screenWidth - MENU_MARGIN * 2, MAX_WIDTH_TABLET);
  const maxHeight = Math.round((screenHeight - insets.top - insets.bottom) * maxHeightRatio);
  const menuHeight = Math.max(56, Math.min(naturalHeight, maxHeight));
  const needsScroll = naturalHeight > maxHeight;
  const resolvedAnchor = useMemo(() => {
    if (touchPoint) return { x: touchPoint.x ?? 0, y: touchPoint.y ?? 0, width: 0, height: 0 };
    if (anchor) return anchor;
    return { x: screenWidth - 60, y: 80, width: 40, height: 40 };
  }, [touchPoint, anchor, screenWidth]);
  const pos = useMemo(() => placeMenu({ anchor: resolvedAnchor, menuWidth: width, menuHeight, screenWidth, screenHeight, insets, placement }), [resolvedAnchor, width, menuHeight, screenWidth, screenHeight, insets, placement]);
  const close = useCallback(() => { if (!dismissable) return; haptic.light(); onClose?.(); }, [dismissable, onClose]);
  useEffect(() => {
    if (visible) {
      setMounted(true);
      haptic.light();
      const t = setTimeout(() => {
        progress.value = withTiming(1, { duration: FADE_DURATION });
      }, 20);
      return () => clearTimeout(t);
    }
    if (mounted) {
      progress.value = withTiming(0, { duration: 140 });
      const t = setTimeout(() => setMounted(false), 150);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [visible, mounted, progress]);
  useBackHandler(mounted && visible, close);
  const handleSelect = useCallback((item) => { try { item?.onPress?.(item.id); } catch {} if (closeOnSelect && !item?.keepOpen) close(); }, [close, closeOnSelect]);
  const scaleStyle = useAnimatedStyle(() => {
    if (reducedMotion) return { opacity: progress.value };
    // Grow from the anchor corner: scale the card and slide its top edge so
    // it appears to expand out of the trigger (RN has no transform-origin).
    const slide = (1 - progress.value) * (pos.growFromTop ? -10 : 10);
    return { opacity: progress.value, transform: [{ scale: 0.85 + progress.value * 0.15 }, { translateY: slide }] };
  });
  if (!mounted) return null;
  const list = (
    <View style={{ maxHeight: menuHeight - (reactionRow ? 52 : 0) }}>
      {needsScroll ? (
        <ScrollView showsVerticalScrollIndicator={false} bounces={false} style={{ maxHeight: menuHeight - (reactionRow ? 52 : 0) }}>
          {menuItems.map((entry, i) => renderEntry(entry, i, handleSelect))}
        </ScrollView>
      ) : (menuItems.map((entry, i) => renderEntry(entry, i, handleSelect)))}
    </View>
  );
  return (
    <View style={styles.root} pointerEvents="box-none" accessibilityViewIsModal>
      <Backdrop progress={progress} dimmed={dimmed || !!preview} maxOpacity={preview ? 0.45 : backdropOpacity} onPress={enableBackdropDismiss ? close : null} />
      {preview ? <View pointerEvents="none" style={[styles.preview, { top: Math.max(60, pos.top - 140), left: pos.left, width }]}>{preview}</View> : null}
      <Animated.View
        style={[
          {
            position: "absolute",
            top: pos.top,
            left: pos.left,
            width,
            backgroundColor: colors.elevated,
            borderRadius: radius.lg,
            paddingVertical: 6,
            shadowColor: "#000",
            shadowOpacity: 0.18,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: 8 },
            elevation: 8,
            overflow: "hidden",
          },
          scaleStyle,
        ]}
        accessibilityRole="menu"
        testID={testID}
      >
        {reactionRow ? <View style={[styles.reactions, { borderBottomColor: colors.divider }]}>{reactionRow}</View> : null}
        {list}
      </Animated.View>
    </View>
  );
};

function renderEntry(entry, index, handleSelect) {
  if (!entry) return null;
  const key = entry.id ?? `entry_${index}`;
  if (isDivider(entry)) return <View key={key} style={{ paddingVertical: 4 }}><MenuSeparator /></View>;
  if (isHeader(entry)) return <MenuSectionHeader key={key} title={entry.title} />;
  return <MenuRow key={key} item={entry} onSelect={handleSelect} />;
}

const styles = StyleSheet.create({
  root: { ...StyleSheet.absoluteFillObject, zIndex: 1001 },
  preview: { position: "absolute", zIndex: 1002 },
  reactions: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1 },
});

export default DropdownMenu;

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Keyboard,
  useWindowDimensions,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  useReducedMotion,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Backdrop from "./Backdrop";
import SheetScroll from "./SheetScroll";
import Icon from "../Icon";
import { useOverlayTheme } from "./overlayTheme";
import { SHEET_SPRING, FADE_DURATION } from "./animations";
import { useBackHandler } from "./useBackHandler";
import { haptic } from "../../utils/haptics";

/**
 * Slide-up modal, TikTok/Facebook style.
 *
 * Works declaratively (`visible` + `onClose`) and imperatively through
 * `useBottomSheet()`. All animation runs on the UI thread via Reanimated;
 * gestures run through Gesture Handler.
 *
 * Snap points are fractions of the screen height (0.5 = 50%). Use "auto" in
 * the list for content-sized height. Dragging moves between points;
 * a fast flick down dismisses; a slow drag snaps to the nearest point.
 */

export const SHEET_MAX_WIDTH = 560;

function resolveHeights(snapPoints, screenHeight, contentHeight) {
  return snapPoints.map((point) => {
    if (point === "auto") return Math.max(120, Math.min(contentHeight, screenHeight));
    if (typeof point === "number") {
      return point <= 1 ? Math.round(point * screenHeight) : point;
    }
    return Math.round(screenHeight * 0.5);
  });
}

function headerSpace(hasHeader) {
  return hasHeader ? 120 : 40;
}

const BottomSheet = forwardRef(function BottomSheet(props, ref) {
  const {
    visible = false,
    onClose,
    onOpened,
    onSnapChange,
    children,
    scrollable = false,
    ScrollComponent = null,
    snapPoints = [0.5, 0.9],
    initialSnapIndex = 0,
    enableDragToDismiss = true,
    enableBackdropDismiss = true,
    showHandle = true,
    backdropOpacity = 0.4,
    fullScreen = false,
    title = null,
    subtitle = null,
    headerRight = null,
    showCloseButton = true,
    footer = null,
    expandOnFocus = true,
    dismissable = true,
    testID,
    rootInsets = null,
  } = props;

  const { colors, spacing, radius, fontSize } = useOverlayTheme();
  const fallbackInsets = useSafeAreaInsets();
  const insets = rootInsets ?? fallbackInsets;
  const { height: screenHeight, width: screenWidth } = useWindowDimensions();
  const reducedMotion = useReducedMotion();

  const [mounted, setMounted] = useState(visible);
  const [contentHeight, setContentHeight] = useState(0);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [focused, setFocused] = useState(false);

  // 1 = fully open at the target snap, 0 = dismissed (off screen bottom).
  const progress = useSharedValue(0);
  const offset = useSharedValue(screenHeight);
  const snapIndex = useSharedValue(initialSnapIndex);
  const dismissedByGesture = useRef(false);

  const heights = useMemo(
    () => resolveHeights(fullScreen ? [1] : snapPoints, screenHeight, Math.max(contentHeight, 1)),
    // resolveHeights reads only these values; snapPoints array identity may be
    // stable while contents change, so compare contents instead.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fullScreen, JSON.stringify(snapPoints), screenHeight, contentHeight],
  );

  const animateTo = useCallback(
    (height, onDone) => {
      "worklet";
      const done = onDone;
      if (reducedMotion) {
        offset.value = withTiming(screenHeight - height, { duration: 160 }, (finished) => {
          if (finished && done) runOnJS(done)();
        });
        progress.value = withTiming(height > 0 ? 1 : 0, { duration: 160 });
      } else {
        offset.value = withSpring(screenHeight - height, SHEET_SPRING, (finished) => {
          if (finished && done) runOnJS(done)();
        });
        progress.value = withTiming(height > 0 ? 1 : 0, { duration: FADE_DURATION });
      }
    },
    [offset, progress, reducedMotion, screenHeight],
  );

  const notifySnap = useCallback(
    (index) => {
      snapIndex.value = index;
      onSnapChange?.(index);
    },
    [onSnapChange, snapIndex],
  );
  // Open / close on `visible` flips. Rapid open/close just retargets the
  // same shared values, so no stuck backdrop is possible.
  useEffect(() => {
    if (visible) {
      dismissedByGesture.current = false;
      setMounted(true);
      const timer = setTimeout(() => {
        const target = heights[Math.min(initialSnapIndex, heights.length - 1)] ?? heights[0] ?? 0;
        snapIndex.value = initialSnapIndex;
        animateTo(target, () => onOpened?.());
      }, 30);
      return () => clearTimeout(timer);
    }
    if (mounted) animateTo(0, () => setMounted(false));
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // Keep the sheet glued to snap changes (rotation, content measuring).
  const heightsKey = heights.join(",");
  useEffect(() => {
    if (mounted && visible) {
      const list = heightsKey.split(",").map(Number);
      const height = list[Math.min(snapIndex.value, list.length - 1)] ?? list[0] ?? 0;
      offset.value = screenHeight - height;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screenHeight, heightsKey]);

  const close = useCallback(() => {
    if (!dismissable && !dismissedByGesture.current) return;
    haptic.light();
    onClose?.();
  }, [dismissable, onClose]);

  // Keyboard: keep the footer above it, expand to the largest snap on focus.
  useEffect(() => {
    const show = Keyboard.addListener("keyboardDidShow", (e) => {
      setKeyboardHeight(e.endCoordinates?.height ?? 0);
      setFocused(true);
      if (expandOnFocus && !fullScreen && heights.length > 1) {
        const last = heights.length - 1;
        snapIndex.value = last;
        animateTo(heights[last], null);
        onSnapChange?.(last);
      }
    });
    const hide = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardHeight(0);
      setFocused(false);
    });
    return () => {
      show.remove();
      hide.remove();
    };
  }, [animateTo, expandOnFocus, fullScreen, heights, onSnapChange, snapIndex]);

  useBackHandler(mounted && visible, close);

  useImperativeHandle(ref, () => ({
    snapTo: (index) => {
      const clamped = Math.max(0, Math.min(index, heights.length - 1));
      notifySnap(clamped);
      animateTo(heights[clamped], null);
    },
    expand: () => {
      const last = heights.length - 1;
      notifySnap(last);
      animateTo(heights[last], null);
    },
    collapse: () => {
      notifySnap(0);
      animateTo(heights[0], null);
    },
    close,
  }));
  // Drag: the handle + header zone always drags the sheet. The body drags
  // the sheet only when content is not scrollable, so a scrollable list
  // never fights the gesture — content scrolls first, the sheet moves from
  // the drag zone. Velocity-aware: a fast flick down dismisses, a slow drag
  // snaps to the nearest point.
  const dragGesture = useMemo(() => {
    let startOffset = screenHeight;
    return Gesture.Pan()
      .activeOffsetY([-12, 12])
      .onBegin(() => {
        startOffset = offset.value;
      })
      .onUpdate((e) => {
        const next = startOffset + e.translationY;
        const minOffset = screenHeight - (heights[heights.length - 1] ?? screenHeight);
        offset.value = Math.max(minOffset - 80, Math.min(screenHeight, next));
        const openHeight = heights[heights.length - 1] ?? 1;
        progress.value = openHeight > 0 ? 1 - (offset.value - minOffset) / openHeight : 0;
      })
      .onEnd((e) => {
        const last = heights.length - 1;
        const minOffset = screenHeight - (heights[last] ?? screenHeight);
        const currentHeight = screenHeight - offset.value;
        if (enableDragToDismiss && dismissable && (e.velocityY > 900 || currentHeight < (heights[0] ?? 0) * 0.55)) {
          dismissedByGesture.current = true;
          runOnJS(close)();
          return;
        }
        let nearest = 0;
        let best = Infinity;
        heights.forEach((height, index) => {
          const distance = Math.abs(height - currentHeight);
          if (distance < best) {
            best = distance;
            nearest = index;
          }
        });
        snapIndex.value = nearest;
        const height = heights[nearest] ?? 0;
        if (reducedMotion) {
          offset.value = withTiming(screenHeight - height, { duration: SNAP_DURATION });
        } else {
          offset.value = withSpring(screenHeight - height, SHEET_SPRING);
        }
        runOnJS(notifySnap)(nearest);
      });
  }, [
    screenHeight,
    heights,
    offset,
    progress,
    snapIndex,
    enableDragToDismiss,
    dismissable,
    reducedMotion,
    close,
    notifySnap,
  ]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: offset.value }],
  }));

  const footerHeight = keyboardHeight > 0 ? keyboardHeight : insets.bottom;

  const renderHeader = () => {
    if (!title && !subtitle && !headerRight && !showCloseButton) return null;
    return (
      <View style={[bs.header, { paddingHorizontal: spacing.lg }]}>
        <View style={bs.headerText}>
          {title ? (
            <Text numberOfLines={1} style={[bs.title, { color: colors.text, fontSize: fontSize.lg }]}>
              {title}
            </Text>
          ) : null}
          {subtitle ? (
            <Text numberOfLines={1} style={{ color: colors.textMuted, fontSize: fontSize.sm, marginTop: 2 }}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {headerRight ?? (showCloseButton ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close"
            onPress={close}
            hitSlop={8}
            style={bs.closeBtn}
          >
            <Icon name="close" size={22} color={colors.textMuted} />
          </Pressable>
        ) : null)}
      </View>
    );
  };

  const renderBody = () => {
    if (!scrollable || ScrollComponent) {
      return ScrollComponent ? (
        <SheetScroll ScrollComponent={ScrollComponent} onContentHeight={setContentHeight}>
          {children}
        </SheetScroll>
      ) : (
        <View
          onLayout={(e) => setContentHeight(e.nativeEvent.layout.height)}
          style={{ flex: 1 }}
        >
          {children}
        </View>
      );
    }
    return (
      <SheetScroll onContentHeight={setContentHeight}>{children}</SheetScroll>
    );
  };
  if (!mounted) return null;

  const sheetHeight = heights[Math.min(snapIndex.value, heights.length - 1)] ?? heights[0] ?? 0;

  return (
    <View style={styles.root} accessibilityViewIsModal testID={testID}>
      <Backdrop
        progress={progress}
        maxOpacity={backdropOpacity}
        dimmed
        onPress={enableBackdropDismiss ? close : null}
      />
      <Animated.View style={[sheetStyle, { maxHeight: screenHeight - insets.top }]}>
        <GestureDetector gesture={dragGesture}>
          <Animated.View
            style={{
              width: Math.min(screenWidth, SHEET_MAX_WIDTH),
              alignSelf: "center",
              height: sheetHeight,
              backgroundColor: colors.background,
              borderTopLeftRadius: fullScreen ? 0 : radius.xl,
              borderTopRightRadius: fullScreen ? 0 : radius.xl,
              paddingTop: fullScreen ? insets.top : 0,
              overflow: "hidden",
            }}
          >
            <View style={bs.dragZone}>
              {showHandle && !fullScreen ? (
                <View style={[bs.handle, { backgroundColor: colors.border }]} />
              ) : null}
            </View>
            {renderHeader()}
            <View style={{ flex: 1 }}>{renderBody()}</View>
            {footer ? (
              <View style={{ paddingBottom: footerHeight, backgroundColor: colors.background }}>
                {footer}
              </View>
            ) : (
              <View style={{ height: footerHeight }} />
            )}
          </Animated.View>
        </GestureDetector>
      </Animated.View>
    </View>
  );
});

const bs = StyleSheet.create({
  dragZone: { alignItems: "center", paddingTop: 8, paddingBottom: 4 },
  handle: { width: 40, height: 4, borderRadius: 2 },
  header: { flexDirection: "row", alignItems: "center", paddingVertical: 8 },
  headerText: { flex: 1 },
  title: { fontWeight: "700" },
  closeBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    marginEnd: -8,
  },
});

const styles = StyleSheet.create({
  root: { ...StyleSheet.absoluteFillObject, justifyContent: "flex-end" },
});

export default BottomSheet;

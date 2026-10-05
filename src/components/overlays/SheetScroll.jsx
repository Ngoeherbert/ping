import { forwardRef, useCallback } from "react";
import { ScrollView, FlatList } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { useSharedValue } from "react-native-reanimated";

/**
 * Scroll/drag coordination inside a BottomSheet.
 *
 * The content scrolls first. The sheet's drag gesture only takes over when
 * the list is pinned at the top (offset <= 0) and the finger moves down.
 * Wire like this:
 *
 *   const sheet = SheetScroll.useBridge();
 *   <SheetScroll.ScrollView dragGesture={sheet.drag} scrollBridge={sheet} … />
 *
 * Pass `sheet.drag` into BottomSheet's `simultaneousWith` prop so both
 * gestures negotiate on the UI thread — no setState animation involved.
 *
 * Note for later: FlashList accepts the same bridge through its
 * `renderScrollComponent` prop, so no separate bridge is needed.
 */

function useBridge() {
  const scrollAtTop = useSharedValue(true);
  const drag = Gesture.Pan().enabled(true);
  return { scrollAtTop, drag };
}

function trackTop(bridge) {
  return (event) => {
    const y = event?.nativeEvent?.contentOffset?.y ?? 0;
    if (bridge?.scrollAtTop) bridge.scrollAtTop.value = y <= 1;
  };
}

const SheetScrollView = forwardRef(function SheetScrollView(
  { dragGesture, scrollBridge, onScroll, ...rest },
  ref,
) {
  const handleScroll = useCallback(
    (event) => {
      trackTop(scrollBridge)(event);
      onScroll?.(event);
    },
    [scrollBridge, onScroll],
  );

  const inner = (
    <ScrollView
      ref={ref}
      onScroll={handleScroll}
      scrollEventThrottle={16}
      showsVerticalScrollIndicator={false}
      {...rest}
    />
  );

  if (!dragGesture) return inner;
  return <GestureDetector gesture={dragGesture}>{inner}</GestureDetector>;
});

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

const SheetFlatList = forwardRef(function SheetFlatList(
  { dragGesture, scrollBridge, onScroll, ...rest },
  ref,
) {
  const handleScroll = useCallback(
    (event) => {
      trackTop(scrollBridge)(event);
      onScroll?.(event);
    },
    [scrollBridge, onScroll],
  );

  const list = (
    <AnimatedFlatList
      ref={ref}
      onScroll={handleScroll}
      scrollEventThrottle={16}
      showsVerticalScrollIndicator={false}
      {...rest}
    />
  );

  if (!dragGesture) return list;
  return <GestureDetector gesture={dragGesture}>{list}</GestureDetector>;
});

const SheetScroll = {
  useBridge,
  ScrollView: SheetScrollView,
  FlatList: SheetFlatList,
};

export default SheetScroll;

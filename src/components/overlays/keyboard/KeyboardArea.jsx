import { useEffect, useRef, useState } from "react";
import { View, Keyboard, AppState, Platform, useWindowDimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  FadeIn,
  useReducedMotion,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PANEL_KEYBOARD, PANEL_NONE, useKeyboardPanelStore } from "./useKeyboardPanel";
import { loadKeyboardHeights, saveKeyboardHeight } from "./panelStorage";
import { useBackHandler } from "../useBackHandler";

/**
 * Container wrapping the input bar and the shared keyboard/panel area.
 *
 * Layout is a column: [input bar] [panel area]. The panel area is 0 when the
 * keyboard (or nothing) is open and `panelHeight` when a panel is open, so
 * the input bar stays pinned during keyboard <-> panel swaps with no drop
 * and no gap: the panel grows as the keyboard shrinks.
 *
 * - Panel height = last real keyboard height for the current orientation
 *   (persisted via panelStorage), clamped to [minHeight, maxHeight].
 * - `panels` is a registry: [{ id, render, hideInputBar }]. New panels
 *   (stickers, GIFs, games, voice recorder) register without container edits.
 * - `onInsetChange(extra)` reports the offset above the resting input bar so
 *   a message list can pad itself: panel height when a panel is open, live
 *   keyboard height when the keyboard is open, 0 otherwise.
 *
 * Keyboard events + Reanimated only (no extra dependency); see the summary
 * for the deliberate trade-off this implies on Android.
 */
export default function KeyboardArea(props) {
  const {
    inputRef = null,
    panels = [],
    children = null,
    defaultHeight = 320,
    minHeight = 260,
    maxHeight = 480,
    onInsetChange = null,
    testID,
  } = props;

  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const reducedMotion = useReducedMotion();
  const orientation = width > height ? "landscape" : "portrait";

  const activePanel = useKeyboardPanelStore((s) => s.activePanel);

  const [remembered, setRemembered] = useState({ portrait: 0, landscape: 0 });
  const [kbVisible, setKbVisible] = useState(false);
  const [kbHeight, setKbHeight] = useState(0);
  const [shownPanel, setShownPanel] = useState(null);

  const swapping = useRef(false);
  const areaAnim = useSharedValue(0);

  const panelHeight = Math.max(
    minHeight,
    Math.min(maxHeight, remembered[orientation] || defaultHeight),
  );

  const isCustomPanel = activePanel !== PANEL_NONE && activePanel !== PANEL_KEYBOARD;
  const activeDef = panels.find((p) => p.id === (isCustomPanel ? activePanel : shownPanel));
  const takeover = !!activeDef?.hideInputBar && !!shownPanel;

  useEffect(() => {
    let live = true;
    loadKeyboardHeights().then((saved) => {
      if (live) setRemembered(saved);
    });
    return () => {
      live = false;
    };
  }, []);

  useEffect(() => {
    const show = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e) => {
        const h = e?.endCoordinates?.height ?? 0;
        setKbVisible(true);
        setKbHeight(h);
        if (h > 200) {
          saveKeyboardHeight(orientation, h);
          setRemembered((prev) => ({ ...prev, [orientation]: Math.round(h) }));
        }
        if (!swapping.current) {
          const current = useKeyboardPanelStore.getState().activePanel;
          if (current === PANEL_NONE) useKeyboardPanelStore.getState().showKeyboard();
        }
      },
    );
    const hide = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => {
        setKbVisible(false);
        setKbHeight(0);
        if (!swapping.current) {
          const current = useKeyboardPanelStore.getState().activePanel;
          if (current === PANEL_KEYBOARD) useKeyboardPanelStore.getState().close();
        }
        swapping.current = false;
      },
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, [orientation]);
  // Panel <-> keyboard state sync: focus/blur the input so the OS
  // keyboard and our panel never render stacked.
  useEffect(() => {
    if (isCustomPanel) {
      setShownPanel(activePanel);
      if (kbVisible) {
        swapping.current = true;
        inputRef?.current?.blur?.();
        Keyboard.dismiss();
      }
    } else if (activePanel === PANEL_KEYBOARD) {
      setShownPanel(null);
      inputRef?.current?.focus?.();
    } else {
      setShownPanel(null);
      swapping.current = true;
      inputRef?.current?.blur?.();
      Keyboard.dismiss();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePanel]);

  // Backgrounding: drop the keyboard flag since the hide event may not fire.
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state !== "active") {
        setKbVisible(false);
        setKbHeight(0);
        swapping.current = false;
      }
    });
    return () => sub.remove();
  }, []);

  const areaHeight = shownPanel ? panelHeight + insets.bottom : 0;

  useEffect(() => {
    areaAnim.value = withTiming(areaHeight, {
      duration: reducedMotion ? 120 : 240,
    });
  }, [areaHeight, areaAnim, reducedMotion]);

  const extra = shownPanel ? panelHeight : kbVisible ? kbHeight : 0;
  useEffect(() => {
    onInsetChange?.(extra);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [extra]);

  // Android back: close the open panel first, then the keyboard. Consuming
  // the press (returning true) keeps the screen from popping while either is
  // open; otherwise the press bubbles to navigation.
  const backOpen = isCustomPanel || activePanel === PANEL_KEYBOARD || kbVisible;
  useBackHandler(backOpen, () => {
    const closePanel = useKeyboardPanelStore.getState().close;
    if (isCustomPanel) {
      closePanel();
      return true;
    }
    if (kbVisible) {
      swapping.current = true;
      inputRef?.current?.blur?.();
      Keyboard.dismiss();
      closePanel();
      return true;
    }
    if (activePanel === PANEL_KEYBOARD) {
      closePanel();
      return true;
    }
    return false;
  });

  const areaStyle = useAnimatedStyle(() => ({ height: areaAnim.value }));

  return (
    <View testID={testID}>
      {/* Input bar. Flush on the panel when one is open, on the safe-area
          inset otherwise (the keyboard pads itself). */}
      {takeover ? null : (
        <View style={{ paddingBottom: shownPanel ? 0 : insets.bottom }}>{children}</View>
      )}
      {/* Panel area: constant height during swaps, crossfades panel content. */}
      <Animated.View style={[{ overflow: "hidden" }, areaStyle]}>
        {activeDef && shownPanel ? (
          <Animated.View
            key={shownPanel}
            entering={reducedMotion ? FadeIn.duration(120) : undefined}
            style={{ height: panelHeight + insets.bottom, paddingBottom: insets.bottom }}
          >
            {activeDef.render?.({ height: panelHeight, close: useKeyboardPanelStore.getState().close })}
          </Animated.View>
        ) : null}
      </Animated.View>
    </View>
  );
}

/**
 * Props for a scrollable message list sitting above KeyboardArea.
 * Spread onto the list container so taps and drags dismiss open panels and
 * the keyboard: `<ScrollView keyboardShouldPersistTaps="handled"
 * onScrollBeginDrag={dismissProps.onScrollBeginDrag} … />`.
 * Tapping content calls `close()` (panel + keyboard both dismiss).
 */
export function useKeyboardDismiss(inputRef) {
  return {
    onPress: () => {
      useKeyboardPanelStore.getState().close();
      inputRef?.current?.blur?.();
      Keyboard.dismiss();
    },
    onScrollBeginDrag: () => {
      useKeyboardPanelStore.getState().close();
      Keyboard.dismiss();
    },
  };
}


import { useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import BottomSheet from "./BottomSheet";
import DropdownMenu from "./DropdownMenu";
import ActionSheet from "./ActionSheet";
import ConfirmDialog from "./ConfirmDialog";
import { useOverlaysStore, selectOverlays, settleConfirm } from "../../store/overlays";
import { useOverlayBackHandler } from "./useBackHandler";

/**
 * Mounted once at the app root (see app/_layout.jsx). Renders the stack of
 * imperatively opened overlays above navigation, headers and the tab bar.
 * Later entries render on top of earlier ones; closing one never affects
 * the others.
 */
export default function OverlayHost() {
  const stack = useOverlaysStore(selectOverlays);
  const insets = useSafeAreaInsets();

  const closeTop = useCallback(() => {
    const state = useOverlaysStore.getState();
    const top = state.stack[state.stack.length - 1];
    if (!top) return false;
    if (top.kind === "confirm") {
      settleConfirm(top.id, false);
      return true;
    }
    if (top.props?.dismissable === false) return false;
    state.close(top.id);
    top.props?.onClose?.();
    return true;
  }, []);

  useOverlayBackHandler(stack.length > 0, closeTop);

  if (stack.length === 0) return null;

  return (
    <View style={styles.root} pointerEvents="box-none">
      {stack.map((entry) => (
        <View key={entry.id} style={styles.layer} pointerEvents="box-none">
          {renderEntry(entry, insets)}
        </View>
      ))}
    </View>
  );
}

function renderEntry(entry, insets) {
  const { id, kind, props } = entry;
  const close = () => useOverlaysStore.getState().close(id);

  switch (kind) {
    case "sheet":
      return <BottomSheet {...props} visible onClose={chain(props.onClose, close)} rootInsets={insets} />;
    case "menu":
      return <DropdownMenu {...props} visible onClose={chain(props.onClose, close)} rootInsets={insets} />;
    case "action":
      return <ActionSheet {...props} visible onClose={chain(props.onClose, close)} rootInsets={insets} />;
    case "confirm":
      return (
        <ConfirmDialog
          {...props}
          visible
          onCancel={() => settleConfirm(id, false)}
          onConfirm={() => settleConfirm(id, true)}
          rootInsets={insets}
        />
      );
    default:
      return null;
  }
}

function chain(first, second) {
  return (...args) => {
    first?.(...args);
    second?.(...args);
  };
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    elevation: 1000,
  },
  layer: {
    ...StyleSheet.absoluteFillObject,
  },
});

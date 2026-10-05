import { useCallback } from "react";
import { useOverlaysStore } from "../../store/overlays";

/**
 * Imperative BottomSheet. Screens call `openSheet({ title, children, ...
 * })` and get back an id; `closeSheet(id)` dismisses it.
 *
 * @example
 * const { openSheet, closeSheet } = useBottomSheet();
 * const id = openSheet({ title: "Comments", snapPoints: [0.5, 0.9], children: <Comments /> });
 */
export function useBottomSheet() {
  const open = useOverlaysStore((s) => s.open);
  const close = useOverlaysStore((s) => s.close);

  const openSheet = useCallback((props) => open("sheet", props), [open]);
  const closeSheet = useCallback((id) => close(id), [close]);

  return { openSheet, closeSheet, open, close };
}

export default useBottomSheet;

import { useCallback } from "react";
import { useOverlaysStore } from "../../store/overlays";

/**
 * Imperative ActionSheet. Shares the MenuEntry item shape with DropdownMenu,
 * so one option list can be shown either way.
 *
 * @example
 * const { openActions } = useActionSheet();
 * openActions({ title: "Share", items, layout: "grid" });
 */
export function useActionSheet() {
  const open = useOverlaysStore((s) => s.open);
  const close = useOverlaysStore((s) => s.close);

  const openActions = useCallback((props) => open("action", props), [open]);
  const closeActions = useCallback((id) => close(id), [close]);

  return { openActions, closeActions, open, close };
}

export default useActionSheet;

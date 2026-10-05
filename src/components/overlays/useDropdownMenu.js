import { useCallback } from "react";
import { useOverlaysStore } from "../../store/overlays";

/**
 * Imperative DropdownMenu. Screens anchor it to a trigger rect
 * (`measureInWindow`) or a long-press touch point.
 *
 * @example
 * const { openMenu } = useDropdownMenu();
 * ref.current.measureInWindow((x, y, w, h) =>
 *   openMenu({ anchor: { x, y, width: w, height: h }, items }));
 */
export function useDropdownMenu() {
  const open = useOverlaysStore((s) => s.open);
  const close = useOverlaysStore((s) => s.close);

  const openMenu = useCallback((props) => open("menu", props), [open]);
  const closeMenu = useCallback((id) => close(id), [close]);

  return { openMenu, closeMenu, open, close };
}

export default useDropdownMenu;

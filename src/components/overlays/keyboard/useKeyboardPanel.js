import { create } from "zustand";

/**
 * Active-panel controller for the shared keyboard area.
 *
 * States: `none | keyboard | <panel id>` (e.g. `emoji`, `attachments`, or any
 * custom id registered later — stickers, GIFs, games, a voice recorder).
 * Generic and not tied to a chat screen; also works for a comment input
 * inside a BottomSheet footer.
 *
 * Behaviour contract (implemented by KeyboardArea):
 * - keyboard -> panel: panel appears at remembered keyboard height while the
 *   keyboard dismisses; the input bar stays pinned, no drop, no gap.
 * - panel -> keyboard: input is focused, the keyboard rises, the panel is
 *   replaced without a flash.
 * - panel -> panel: crossfade at constant height.
 *
 * Follows the project store style: `create((set, get) => …)` with selectors.
 */

export const PANEL_NONE = "none";
export const PANEL_KEYBOARD = "keyboard";

export const useKeyboardPanelStore = create((set, get) => ({
  activePanel: PANEL_NONE,

  /** Open a panel by id, closing any other panel. */
  open: (id) => set({ activePanel: id ?? PANEL_NONE }),

  /** Toggle: tap the active panel's icon again to go back to the keyboard. */
  toggle: (id) =>
    set((state) => ({
      activePanel: state.activePanel === id ? PANEL_KEYBOARD : (id ?? PANEL_NONE),
    })),

  /** Bring the keyboard back (input is focused by the container). */
  showKeyboard: () => set({ activePanel: PANEL_KEYBOARD }),

  /** Close everything (also dismisses the keyboard via the container). */
  close: () => set({ activePanel: PANEL_NONE }),

  isOpen: (id) => get().activePanel === id,
}));

/** Currently active panel id (`none`, `keyboard`, or a panel id). */
export const selectActivePanel = (state) => state.activePanel;

/** True when any panel or the keyboard is active. */
export const selectIsPanelOpen = (state) => state.activePanel !== PANEL_NONE;

/**
 * Hook screens use for toggle-icon state:
 * `const { activePanel, toggle, showKeyboard } = useKeyboardPanel();`
 */
export function useKeyboardPanel() {
  const activePanel = useKeyboardPanelStore(selectActivePanel);
  const open = useKeyboardPanelStore((s) => s.open);
  const toggle = useKeyboardPanelStore((s) => s.toggle);
  const showKeyboard = useKeyboardPanelStore((s) => s.showKeyboard);
  const close = useKeyboardPanelStore((s) => s.close);
  return {
    activePanel,
    open,
    toggle,
    showKeyboard,
    close,
    isPanelOpen: (id) => activePanel === id,
    isKeyboard: activePanel === PANEL_KEYBOARD,
  };
}

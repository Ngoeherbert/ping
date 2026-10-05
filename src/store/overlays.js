import { create } from "zustand";

/**
 * The stack of imperatively opened overlays.
 *
 * Screens mostly use the hooks (`useBottomSheet`, `useDropdownMenu`,
 * `useActionSheet`, `useConfirm`), which push entries here. `OverlayHost`,
 * mounted once at the app root, renders the stack above navigation so
 * overlays appear over headers and the tab bar and can layer (a confirm
 * dialog over a bottom sheet).
 *
 * Entries are plain data plus renderable content:
 * `{ id, kind: "sheet"|"menu"|"action"|"confirm", props }`.
 * The promise resolver for confirms lives in module scope, not in state, so
 * the state stays serialisable.
 *
 * Follows the project's store conventions: `create((set, get) => …)` with
 * typed selectors exported alongside.
 */

let overlaySeq = 0;

/** Confirm id -> promise resolver. Never stored in zustand state. */
const confirmResolvers = new Map();

export const useOverlaysStore = create((set, get) => ({
  stack: [],

  /**
   * Push an overlay. Returns its id for targeted closing.
   * @param {"sheet"|"menu"|"action"|"confirm"} kind
   * @param {Object} [props]
   */
  open: (kind, props = {}) => {
    const id = `ov_${(overlaySeq += 1)}`;
    set((state) => ({ stack: [...state.stack, { id, kind, props }] }));
    return id;
  },

  /** Remove one overlay by id. Never touches the others. */
  close: (id) => {
    confirmResolvers.delete(id);
    set((state) => ({ stack: state.stack.filter((entry) => entry.id !== id) }));
  },

  /** Remove every overlay, e.g. on sign-out. */
  closeAll: () => {
    confirmResolvers.clear();
    set({ stack: [] });
  },

  /** Patch one entry's props without remounting the rest. */
  update: (id, patch) =>
    set((state) => ({
      stack: state.stack.map((entry) =>
        entry.id === id ? { ...entry, props: { ...entry.props, ...patch } } : entry,
      ),
    })),

  /** The entry on top, or null when nothing is open. */
  top: () => {
    const { stack } = get();
    return stack.length > 0 ? stack[stack.length - 1] : null;
  },
}));

/** Every open overlay, bottom-first. */
export const selectOverlays = (state) => state.stack;

/** The topmost overlay, or null. */
export const selectTopOverlay = (state) =>
  state.stack.length > 0 ? state.stack[state.stack.length - 1] : null;

/** True while at least one overlay is open. */
export const selectHasOverlay = (state) => state.stack.length > 0;

/**
 * Open a confirm dialog and wait for the answer.
 * Resolves `true` on confirm, `false` on cancel, backdrop tap or back button.
 * @param {Object} props Props forwarded to ConfirmDialog (minus callbacks).
 * @returns {Promise<boolean>}
 */
export function requestConfirm(props) {
  const store = useOverlaysStore.getState();
  return new Promise((resolve) => {
    const id = store.open("confirm", props);
    confirmResolvers.set(id, resolve);
  });
}

/** Resolve a pending confirm and remove it. Called by the dialog. */
export function settleConfirm(id, value) {
  const resolve = confirmResolvers.get(id);
  confirmResolvers.delete(id);
  if (resolve) resolve(value);
  useOverlaysStore.getState().close(id);
}

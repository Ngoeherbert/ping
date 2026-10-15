import { useSyncExternalStore } from "react";

// Tiny external store so any screen can hide/show the floating BottomBar that
// lives in app/(tabs)/_layout.jsx (outside the screen's own tree). Kept
// dependency-free — the project has no state library.
let hidden = false;
const listeners = new Set();

const emit = () => {
  for (const l of listeners) l();
};

export const chromeStore = {
  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot() {
    return hidden;
  },
  getServerSnapshot() {
    return hidden;
  },
  // Terse alias used as chromeStore.set(true/false).
  set(next) {
    if (hidden === next) return;
    hidden = next;
    emit();
  },
  setHidden(next) {
    chromeStore.set(next);
  },
};

export function useChromeHidden() {
  return useSyncExternalStore(
    chromeStore.subscribe,
    chromeStore.getSnapshot,
    chromeStore.getServerSnapshot,
  );
}

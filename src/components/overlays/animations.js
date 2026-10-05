import { useReducedMotion } from "react-native-reanimated";

/**
 * Shared animation presets so every overlay opens, closes and snaps the same
 * way. All animation runs on the UI thread via Reanimated worklets; screens
 * never call setState to animate.
 */

export const SHEET_SPRING = { damping: 30, stiffness: 340, mass: 0.9 };

export const MENU_SPRING = { damping: 24, stiffness: 420, mass: 0.8 };

export const FADE_DURATION = 180;

export const SNAP_DURATION = 260;

/** True when the OS asks for reduced motion. Replaces springs with fades. */
export function useReduced() {
  return useReducedMotion();
}

/**
 * Easing curve name passed to withTiming for fades. Kept in one place so a
 * future change applies everywhere.
 */
export const FADE_EASING_NAME = "easeOut";

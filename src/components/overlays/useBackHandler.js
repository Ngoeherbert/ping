import { useEffect } from "react";
import { BackHandler } from "react-native";

/**
 * Runs `handler` when the Android hardware back button is pressed.
 * Return true from the handler to consume the press, false to let it bubble.
 */
export function useBackHandler(enabled, handler) {
  useEffect(() => {
    if (!enabled) return undefined;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      try {
        return handler() === true;
      } catch {
        return false;
      }
    });
    return () => sub.remove();
  }, [enabled, handler]);
}

/**
 * Closes the topmost overlay on Android back. Mounted once inside
 * OverlayHost so every overlay kind gets back-button behaviour for free.
 */
export function useOverlayBackHandler(canClose, onBack) {
  useBackHandler(canClose, onBack);
}

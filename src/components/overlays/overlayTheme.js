import { useColorScheme } from "react-native";
import { colors, spacing, radius, fontSize } from "../../theme";

/**
 * Theme tokens for overlays.
 *
 * The project ships light-only tokens (`userInterfaceStyle: "light"` in
 * app.json), so light mode reuses them verbatim. Dark values are conservative
 * fallbacks so overlays still work if the OS scheme ever changes.
 */

const darkOverrides = {
  background: "#000000",
  surface: "#1C1C1E",
  border: "#38383A",
  text: "#FFFFFF",
  textMuted: "#9A9AA0",
  primary: "#0A84FF",
  danger: "#FF453A",
  success: "#30D158",
};

/**
 * @returns {{
 *   colors: Record<string, string>,
 *   spacing: typeof spacing,
 *   radius: typeof radius,
 *   fontSize: typeof fontSize,
 *   darkMode: boolean,
 * }}
 */
export function useOverlayTheme() {
  const scheme = useColorScheme();
  const darkMode = scheme === "dark";
  const base = darkMode ? { ...colors, ...darkOverrides } : colors;

  return {
    colors: {
      ...base,
      // Backdrop tint behind sheets and dialogs.
      backdrop: darkMode ? "rgba(0, 0, 0, 0.6)" : "rgba(0, 0, 0, 0.4)",
      // Elevated card surface for menus and dialogs.
      elevated: darkMode ? "#2C2C2E" : "#FFFFFF",
      // Dividers and disabled states derive from project tokens.
      divider: base.border,
      disabled: base.textMuted,
      // Destructive rows use the project danger colour.
      destructive: base.danger,
    },
    spacing,
    radius,
    fontSize,
    darkMode,
  };
}

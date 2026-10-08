import { useColorScheme } from "react-native";
import { colors } from "./colors";

// Returns the palette for the phone's current light/dark setting.
export function useTheme() {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  return { colors: isDark ? colors.dark : colors.light, isDark };
}

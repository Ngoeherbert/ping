import { Pressable } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { useOverlayTheme } from "./overlayTheme";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Full-screen scrim behind an overlay.
 *
 * @param {{
 *   progress: { value: number },
 *   maxOpacity?: number,
 *   dimmed?: boolean,
 *   onPress?: (() => void) | null,
 *   testID?: string,
 * }} props
 */
export default function Backdrop({ progress, maxOpacity = 0.4, dimmed = true, onPress = null, testID }) {
  const theme = useOverlayTheme();

  const style = useAnimatedStyle(() => ({
    opacity: (progress?.value ?? 1) * (dimmed ? maxOpacity : 0),
  }));

  if (!onPress) {
    return (
      <Animated.View
        testID={testID}
        pointerEvents="none"
        style={[
          {
            ...StyleSheetAbsoluteFill,
            backgroundColor: theme.colors.backdrop,
          },
          style,
        ]}
      />
    );
  }

  return (
    <AnimatedPressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel="Close"
      onPress={onPress}
      style={[
        {
          ...StyleSheetAbsoluteFill,
          backgroundColor: theme.colors.backdrop,
        },
        style,
      ]}
    />
  );
}

const StyleSheetAbsoluteFill = {
  position: "absolute",
  left: 0,
  right: 0,
  top: 0,
  bottom: 0,
};

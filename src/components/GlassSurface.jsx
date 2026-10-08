import { useEffect, useState } from "react";
import { AccessibilityInfo, Platform, StyleSheet, View } from "react-native";
import { GlassView, isLiquidGlassAvailable, isGlassEffectAPIAvailable } from "expo-glass-effect";
import { BlurView } from "expo-blur";
import { useTheme } from "../theme/useTheme";

// True only on iOS 26+ builds that really have the Liquid Glass API.
// (Some early iOS 26 betas lack it, and calling GlassView there crashes.)
const HAS_LIQUID_GLASS = (() => {
  if (Platform.OS !== "ios") return false;
  try {
    return !!(isLiquidGlassAvailable() && isGlassEffectAPIAvailable());
  } catch {
    return false;
  }
})();

// Respect the iOS "Reduce Transparency" accessibility setting.
function useReduceTransparency() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    if (Platform.OS !== "ios") return undefined;
    let alive = true;
    AccessibilityInfo.isReduceTransparencyEnabled()
      .then((v) => alive && setReduce(v))
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener("reduceTransparencyChanged", setReduce);
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);
  return reduce;
}

// One surface used everywhere glass is wanted.
//   scheme:      "light" | "dark" to force the look (default follows the phone)
//   tint:        colour to tint the glass (e.g. for a primary button)
//   interactive: iOS press shimmer; leave off if it swallows taps on children
//   intensity:   blur strength for the iOS fallback
// Give it a borderRadius (and size) in `style`, like a normal View.
export default function GlassSurface({
  style,
  scheme,
  tint,
  interactive = false,
  intensity = 55,
  children,
  ...rest
}) {
  const { isDark } = useTheme();
  const reduce = useReduceTransparency();
  const dark = scheme ? scheme === "dark" : isDark;

  if (HAS_LIQUID_GLASS && !reduce) {
    return (
      <GlassView
        glassEffectStyle="regular"
        colorScheme={scheme ?? "auto"}
        tintColor={tint}
        isInteractive={interactive}
        style={style}
        {...rest}
      >
        {children}
      </GlassView>
    );
  }

  const alpha = reduce ? 0.96 : 0.78;
  const base = dark ? `rgba(34,36,40,${alpha})` : `rgba(255,255,255,${alpha})`;
  const border = dark ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.08)";
  const fill = tint ?? base;

  if (Platform.OS === "ios" && !reduce) {
    return (
      <BlurView
        intensity={intensity}
        tint={dark ? "systemThinMaterialDark" : "systemThinMaterialLight"}
        style={[style, styles.clip, { borderColor: border }, tint ? { backgroundColor: tint } : null]}
        {...rest}
      >
        {children}
      </BlurView>
    );
  }

  return (
    <View style={[style, styles.clip, { backgroundColor: fill, borderColor: border }]} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  clip: { overflow: "hidden", borderWidth: StyleSheet.hairlineWidth },
});

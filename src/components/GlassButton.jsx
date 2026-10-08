import { Pressable } from "react-native";
import GlassSurface from "./GlassSurface";

// Round glass button. The Pressable sits outside the glass so taps always work.
export default function GlassButton({
  size = 44,
  onPress,
  label,
  tint,
  scheme,
  style,
  hitSlop = 6,
  children,
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={hitSlop}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [style, { transform: [{ scale: pressed ? 0.94 : 1 }] }]}
    >
      <GlassSurface
        scheme={scheme}
        tint={tint}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {children}
      </GlassSurface>
    </Pressable>
  );
}

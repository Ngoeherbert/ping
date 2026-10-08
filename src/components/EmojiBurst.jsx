import { useEffect, useMemo } from "react";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

// Add or edit phrases here. First match wins, so put specific phrases first.
const BURSTS = [
  { test: /\bgood\s*morning\b/i, emojis: ["☀️", "🌅", "🌻", "☕", "🐦"] },
  { test: /\bgood\s*night\b/i, emojis: ["🌙", "⭐", "😴", "✨", "💤"] },
  {
    test: /\b(happy\s*birthday|birthday|hbd)\b/i,
    emojis: ["🎂", "🎉", "🎈", "🎁", "🥳"],
  },
  {
    test: /\b(merry\s*christmas|christmas|xmas)\b/i,
    emojis: ["🎄", "🎅", "❄️", "🎁", "⭐"],
  },
  {
    test: /\b(happy\s*new\s*years?|new\s*years?)\b/i,
    emojis: ["🎆", "🎉", "🥳", "🍾", "✨"],
  },
  { test: /\beaster\b/i, emojis: ["🐰", "🥚", "🌷", "🐣", "✝️"] },
  { test: /\beid\s*mubarak\b/i, emojis: ["🌙", "🕌", "✨", "⭐"] },
  { test: /\bhappy\s*valentine/i, emojis: ["❤️", "🌹", "💘", "💕"] },
  { test: /\bi\s*love\s*(you|u)\b/i, emojis: ["❤️", "💖", "💕", "😍"] },
  { test: /\b(congratulations|congrats)\b/i, emojis: ["🎉", "👏", "🥳", "🏆"] },
];

// Returns the emoji set for a message, or null when nothing matches
export function detectBurst(text) {
  if (!text) return null;
  return BURSTS.find((b) => b.test.test(text))?.emojis ?? null;
}

const COUNT = 28;
const MAX_DELAY = 1400;
const MAX_DURATION = 4200;

// A seedable pure random function: for a given seed, always returns the same
// value so useMemo output never shifts on re-renders.
const seededRandom = (() => {
  let seed = 1;
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
})();

const rand = (a, b) => a + seededRandom() * (b - a);

function Particle({ emoji, p, height }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      p.delay,
      withTiming(1, { duration: p.duration, easing: Easing.out(Easing.quad) }),
    );
  }, []);

  const style = useAnimatedStyle(() => {
    const t = progress.value;
    return {
      opacity: interpolate(t, [0, 0.1, 0.55, 1], [0, 1, 1, 0]),
      transform: [
        { translateY: -t * (height + p.size * 3) },
        { translateX: Math.sin(t * Math.PI * p.sway) * p.amp },
        { rotate: `${t * p.spin}deg` },
        {
          scale: interpolate(t, [0, 0.15], [0.4, 1], Extrapolation.CLAMP),
        },
      ],
    };
  });

  return (
    <Animated.View
      style={[styles.particle, { left: p.x, bottom: -p.size * 1.5 }, style]}
    >
      <Text style={{ fontSize: p.size }}>{emoji}</Text>
    </Animated.View>
  );
}

// Full-screen overlay: emojis float from bottom to top and fade out.
// `burst` is { id, emojis }; a new id replays the animation.
export default function EmojiBurst({ burst, onDone }) {
  const { width, height } = useWindowDimensions();
  const reduceMotion = useReducedMotion();

  const particles = useMemo(() => {
    if (!burst) return [];
    // Seed once per burst, then advance sequentially. Because the generator is
    // deterministic, this array is stable across re-renders and independent of
    // Math.random, satisfying React's purity rules.
    const seed = burst?.id ?? 0;
    const random = (() => {
      let s = seed;
      return () => {
        s = (s * 1664525 + 1013904223) % 4294967296;
        return s / 4294967296;
      };
    })();
    const pick = (list) => list[Math.floor(random() * list.length)];

    return Array.from({ length: COUNT }, (_, i) => ({
      id: i,
      emoji: pick(burst.emojis),
      x: rand(0, Math.max(width - 50, 0)),
      size: rand(26, 46),
      delay: rand(0, MAX_DELAY),
      duration: rand(2600, MAX_DURATION),
      sway: rand(1, 3),
      amp: rand(10, 28),
      spin: rand(-40, 40),
    }));
  }, [burst?.id, width]);

  useEffect(() => {
    if (!burst) return;
    const t = setTimeout(() => onDone?.(), MAX_DELAY + MAX_DURATION + 100);
    return () => clearTimeout(t);
  }, [burst?.id]);

  if (!burst || reduceMotion) return null;

  return (
    <View key={burst.id} pointerEvents="none" style={styles.overlay}>
      {particles.map((p) => (
        <Particle key={p.id} emoji={p.emoji} p={p} height={height} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, zIndex: 10, overflow: "hidden" },
  particle: { position: "absolute" },
});

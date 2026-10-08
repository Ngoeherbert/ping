import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, Text, View, StyleSheet } from "react-native";
import BubbleShell, { useBubbleColors } from "./BubbleShell";
import { PlayGlyph, PauseGlyph } from "./Icons";
import { formatDuration } from "../utils/formatDuration";

const BARS = 28;

// Same id always gives the same waveform shape
function makeWave(seed, count = BARS) {
  let s = 0;
  for (const c of String(seed)) s = (s * 31 + c.charCodeAt(0)) >>> 0;
  return Array.from({ length: count }, () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return 6 + ((s % 1000) / 1000) * 20;
  });
}

// Voice note. Playback is simulated for now (progress only, no sound).
// Swap the timer for expo-audio when you have real files.
export default function VoiceNoteBubble({ id = "voice", duration = 10, isMine = true, showTail = true }) {
  const { fg } = useBubbleColors(isMine);
  const wave = useMemo(() => makeWave(id), [id]);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0..1
  const progressRef = useRef(0);

  useEffect(() => {
    if (!playing) return;
    const startedAt = Date.now() - progressRef.current * duration * 1000;
    const timer = setInterval(() => {
      const p = (Date.now() - startedAt) / (duration * 1000);
      if (p >= 1) {
        progressRef.current = 0;
        setProgress(0);
        setPlaying(false);
      } else {
        progressRef.current = p;
        setProgress(p);
      }
    }, 100);
    return () => clearInterval(timer);
  }, [playing, duration]);

  const shown = playing || progress > 0 ? duration * progress : duration;

  return (
    <BubbleShell isMine={isMine} showTail={showTail} style={styles.shell}>
      <Pressable
        onPress={() => setPlaying((p) => !p)}
        accessibilityRole="button"
        accessibilityLabel={playing ? "Pause voice note" : "Play voice note"}
        style={[styles.button, { backgroundColor: `${fg}33` }]}
      >
        {playing ? (
          <PauseGlyph color={fg} size={18} />
        ) : (
          <PlayGlyph color={fg} size={18} />
        )}
      </Pressable>

      <View style={styles.wave}>
        {wave.map((h, i) => (
          <View
            key={i}
            style={[
              styles.bar,
              { height: h, backgroundColor: fg, opacity: i / BARS < progress ? 1 : 0.4 },
            ]}
          />
        ))}
      </View>

      <Text style={[styles.time, { color: fg }]}>{formatDuration(shown)}</Text>
    </BubbleShell>
  );
}

const styles = StyleSheet.create({
  shell: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 12, paddingVertical: 8 },
  button: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  wave: { flexDirection: "row", alignItems: "center", gap: 2, height: 28 },
  bar: { width: 3, borderRadius: 2 },
  time: { fontSize: 13, fontWeight: "500", minWidth: 32, fontVariant: ["tabular-nums"] },
});

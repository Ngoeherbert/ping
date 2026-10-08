import { Pressable, Text, View, StyleSheet } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import BubbleShell, { useBubbleColors } from "./BubbleShell";

const SIZE = 22;
const R = 8.8;
const C = 2 * Math.PI * R;
const DOTS = 12;
const DOT_GAP = C / DOTS - 0.1;
// solid arc covers the left side of the ring (roughly 6 o'clock -> 12 o'clock)
const ARC = (170 / 360) * C;
const ARC_START = 95; // degrees clockwise from 3 o'clock

const WA_GREEN = "#25C45A";

const ROW_MIN_WIDTH = 110;
// How far the time/ticks sit to the right of the icon + label row.
// The bubble widens by exactly this amount, so the time never overhangs it.
const TIME_SHIFT = 14;

function ViewOnceIcon({ color, showOne }) {
  const mid = SIZE / 2;
  return (
    <View style={styles.icon}>
      <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        {/* dotted ring */}
        <Circle
          cx={mid}
          cy={mid}
          r={R}
          fill="none"
          stroke={color}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeDasharray={`0.1 ${DOT_GAP}`}
          rotation={-90}
          origin={`${mid}, ${mid}`}
        />
        {/* solid arc on the left */}
        <Circle
          cx={mid}
          cy={mid}
          r={R}
          fill="none"
          stroke={color}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeDasharray={`${ARC} ${C}`}
          rotation={ARC_START}
          origin={`${mid}, ${mid}`}
        />
      </Svg>
      {showOne ? <Text style={[styles.one, { color }]}>1</Text> : null}
    </View>
  );
}

const READ_BLUE = "#53BDEB";

const KIND_LABELS = {
  photo: "Photo",
  video: "Video",
  voice: "Voice message",
};

// single / double tick, drawn as strokes
function Ticks({ status, color }) {
  const double = status !== "sent";
  const tint = status === "read" ? READ_BLUE : color;
  return (
    <Svg width={15} height={9} viewBox="0 0 18 11">
      <Path
        d="M1 5.8 L4.4 9.2 L10.8 1.6"
        fill="none"
        stroke={tint}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {double ? (
        <Path
          d="M5.2 5.8 L8.6 9.2 L15 1.6"
          fill="none"
          stroke={tint}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : null}
    </Svg>
  );
}

function Footer({ time, status, isMine, color }) {
  if (!time) return null;
  return (
    <View style={styles.footer}>
      <Text style={[styles.time, { color, opacity: 0.6 }]}>{time}</Text>
      {isMine && status ? (
        <View style={{ opacity: status === "read" ? 1 : 0.6 }}>
          <Ticks status={status} color={color} />
        </View>
      ) : null}
    </View>
  );
}

// WhatsApp-style "view once" photo/video.
// Opened and unopened share one shape (no inner card, same size and padding);
// only the contents change:
// - unopened: ring with "1" + "Photo" / "Video" / "Voice message" (green + bold when received)
// - opened:   ring without the "1" + italic grey "Opened"
export default function ViewOnceBubble({
  kind = "photo", // "photo" | "video" | "voice"
  opened = false,
  isMine = true,
  showTail = true,
  time, // e.g. "9:29 AM"
  status = "sent", // "sent" | "delivered" | "read" (only shown for your own messages)
  onPress,
}) {
  const { fg } = useBubbleColors(isMine);

  const label = opened ? "Opened" : (KIND_LABELS[kind] ?? "Photo");
  const received = !isMine;

  const iconColor = opened ? fg : received ? WA_GREEN : fg;

  return (
    <BubbleShell isMine={isMine} showTail={showTail}>
      <View style={styles.body}>
        <Pressable
          onPress={onPress}
          disabled={opened}
          accessibilityRole="button"
          accessibilityLabel={
            opened
              ? "Opened"
              : `View once ${KIND_LABELS[kind]?.toLowerCase() ?? kind}`
          }
          style={styles.content}
        >
          <View style={{ opacity: opened ? 0.5 : received ? 1 : 0.75 }}>
            <ViewOnceIcon color={iconColor} showOne={!opened} />
          </View>
          <Text
            style={[
              styles.label,
              { color: fg },
              opened && styles.openedLabel,
              !opened && received && styles.receivedLabel,
              !opened && isMine && { opacity: 0.75 },
            ]}
          >
            {label}
          </Text>
        </Pressable>
        <Footer time={time} status={status} isMine={isMine} color={fg} />
      </View>
    </BubbleShell>
  );
}

const styles = StyleSheet.create({
  // the extra right padding is what makes the bubble grow with TIME_SHIFT
  body: { paddingRight: TIME_SHIFT },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingRight: 4,
    minWidth: ROW_MIN_WIDTH,
  },
  icon: {
    width: SIZE,
    height: SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  one: {
    position: "absolute",
    fontSize: 10,
    lineHeight: 12,
    fontWeight: "700",
    textAlign: "center",
    includeFontPadding: false,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-end",
    gap: 3,
    marginTop: -4,
    marginRight: -TIME_SHIFT, // pulls the time into that padding, flush with the bubble edge
  },
  time: { fontSize: 10.5 },
  label: { fontSize: 15, fontWeight: "400" },
  receivedLabel: { fontWeight: "700" },
  openedLabel: { fontStyle: "italic", opacity: 0.5 },
});

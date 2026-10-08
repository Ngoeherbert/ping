import { Text, View, StyleSheet } from "react-native";
import MediaBubble from "./MediaBubble";
import { PlayGlyph } from "./Icons";
import { formatDuration } from "../utils/formatDuration";

// Video message: thumbnail, play button and length. Optional caption like ImageBubble.
export default function VideoBubble({
  thumbnail,
  duration = 0,
  caption,
  isMine = true,
  showTail = true,
  onPress,
}) {
  const overlay = (
    <>
      <View style={styles.center}>
        <View style={styles.playCircle}>
          <PlayGlyph color="#fff" size={26} />
        </View>
      </View>
      <View style={styles.durationPill}>
        <Text style={styles.durationText}>{formatDuration(duration)}</Text>
      </View>
    </>
  );

  return (
    <MediaBubble
      uri={thumbnail}
      caption={caption}
      isMine={isMine}
      showTail={showTail}
      onPress={onPress}
      overlay={overlay}
      accessibilityLabel={`Video, ${formatDuration(duration)}`}
    />
  );
}

const styles = StyleSheet.create({
  center: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
  playCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  durationPill: {
    position: "absolute",
    left: 10,
    bottom: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  durationText: { color: "#fff", fontSize: 12, fontWeight: "600" },
});

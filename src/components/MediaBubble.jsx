import { Image, Pressable, Text, StyleSheet, useWindowDimensions } from "react-native";
import BubbleShell, { ChatRow, useBubbleColors } from "./BubbleShell";

const RADIUS = 20;
export const MEDIA_HEIGHT = 280; // every photo and video is this tall

// Shared by ImageBubble and VideoBubble.
//  - No caption: just the rounded media, no tail.
//  - Caption: one bubble with a tail; the media runs edge to edge at the top
//    (top corners rounded) and the text sits below with normal bubble padding.
//    Set showTail={false} to hide the tail (e.g. grouped messages).
// `overlay` is drawn on top of the media (e.g. the video play button).
export default function MediaBubble({
  uri,
  caption,
  isMine = true,
  showTail = true,
  onPress,
  overlay,
  accessibilityLabel,
}) {
  const { width: screenWidth } = useWindowDimensions();
  const { fg, colors } = useBubbleColors(isMine);
  const width = Math.min(300, screenWidth * 0.64);

  const media = (cornerStyle) => (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={{
        width,
        height: MEDIA_HEIGHT,
        ...cornerStyle,
        overflow: "hidden",
        backgroundColor: colors.mediaPlaceholder,
      }}
    >
      <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      {overlay}
    </Pressable>
  );

  if (caption) {
    return (
      <BubbleShell
        isMine={isMine}
        showTail={showTail}
        style={{
          width,
          maxWidth: "100%",
          paddingHorizontal: 0,
          paddingVertical: 0,
          justifyContent: "flex-start",
        }}
      >
        {media({ borderTopLeftRadius: RADIUS, borderTopRightRadius: RADIUS })}
        <Text style={[styles.caption, { color: fg }]}>{caption}</Text>
      </BubbleShell>
    );
  }

  return <ChatRow isMine={isMine}>{media({ borderRadius: RADIUS })}</ChatRow>;
}

const styles = StyleSheet.create({
  caption: { fontSize: 16, lineHeight: 22, paddingHorizontal: 14, paddingTop: 8, paddingBottom: 9 },
});

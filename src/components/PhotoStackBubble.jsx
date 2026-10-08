import { Image, Pressable, Text, View, StyleSheet } from "react-native";
import { ChatRow, useBubbleColors } from "./BubbleShell";
import ReactionPills from "./ReactionPills";

const STACK_W = 252;
const STACK_H = 178;
const CARD_W = 118;
const CARD_H = 146;
const SIDE_SHIFT = 66;
const LEFT = (STACK_W - CARD_W) / 2;

function Card({ uri, bg, style, children }) {
  return (
    <View style={[styles.card, { backgroundColor: bg }, style]}>
      <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      {children}
    </View>
  );
}

// Several photos sent together: fanned cards, the first one in front with a
// "+N photos" label, and optional reactions at the bottom-right corner.
export default function PhotoStackBubble({
  uris = [],
  total,
  reactions,
  isMine = false,
  onPress,
}) {
  const { colors } = useBubbleColors(isMine);
  const [front, left, right] = uris;
  const count = total ?? uris.length;
  const extra = Math.max(0, count - 1);

  return (
    <ChatRow isMine={isMine}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${count} photos`}
        style={styles.stack}
      >
        {left ? (
          <Card
            uri={left}
            bg={colors.mediaPlaceholder}
            style={{
              top: 26,
              transform: [{ translateX: -SIDE_SHIFT }, { rotate: "-7deg" }],
            }}
          >
            <View style={styles.dim} />
          </Card>
        ) : null}

        {right ? (
          <Card
            uri={right}
            bg={colors.mediaPlaceholder}
            style={{
              top: 28,
              transform: [{ translateX: SIDE_SHIFT }, { rotate: "7deg" }],
            }}
          >
            <View style={styles.dim} />
          </Card>
        ) : null}

        {front ? (
          <Card uri={front} bg={colors.mediaPlaceholder} style={{ top: 10 }}>
            {extra > 0 ? (
              <View style={styles.label}>
                <Text style={styles.labelText}>
                  +{extra} {extra === 1 ? "photo" : "photos"}
                </Text>
              </View>
            ) : null}
          </Card>
        ) : null}

        {reactions?.length ? (
          <View style={styles.reactions}>
            <ReactionPills reactions={reactions} isMine={isMine} />
          </View>
        ) : null}
      </Pressable>
    </ChatRow>
  );
}

const styles = StyleSheet.create({
  stack: { width: STACK_W, height: STACK_H },
  card: {
    position: "absolute",
    left: LEFT,
    width: CARD_W,
    height: CARD_H,
    borderRadius: 16,
    overflow: "hidden",
  },
  dim: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.22)" },
  label: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingVertical: 7,
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  labelText: { color: "#fff", fontSize: 12.5, fontWeight: "600" },
  reactions: { position: "absolute", right: 4, bottom: 0 },
});

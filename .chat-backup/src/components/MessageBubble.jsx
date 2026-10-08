import { Text, StyleSheet } from "react-native";
import BubbleShell, { useBubbleColors } from "./BubbleShell";

export default function MessageBubble({ text, isMine = true, showTail = true }) {
  const { fg } = useBubbleColors(isMine);
  return (
    <BubbleShell isMine={isMine} showTail={showTail}>
      <Text style={[styles.text, { color: fg }]}>{text}</Text>
    </BubbleShell>
  );
}

const styles = StyleSheet.create({
  text: { fontSize: 16, lineHeight: 22 },
});

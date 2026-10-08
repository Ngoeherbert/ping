import { Text, StyleSheet } from "react-native";
import BubbleShell, { useBubbleColors } from "./BubbleShell";
import { MENTION } from "../theme/chatTheme";

// "@Rohmad would be..." -> the @Rohmad part gets the mention colour
function withMentions(text = "") {
  return String(text)
    .split(/(@\w+)/g)
    .map((part, i) =>
      /^@\w+$/.test(part) ? (
        <Text key={i} style={styles.mention}>
          {part}
        </Text>
      ) : (
        part
      )
    );
}

// `senderName` is shown inside the bubble (group chats, first message of a run).
export default function MessageBubble({ text, isMine = true, showTail = true, senderName }) {
  const { fg } = useBubbleColors(isMine);
  return (
    <BubbleShell isMine={isMine} showTail={showTail}>
      {senderName ? (
        <Text style={[styles.sender, { color: fg }]} numberOfLines={1}>
          {senderName}
        </Text>
      ) : null}
      <Text style={[styles.text, { color: fg }]}>{withMentions(text)}</Text>
    </BubbleShell>
  );
}

const styles = StyleSheet.create({
  sender: { fontSize: 12.5, fontWeight: "500", opacity: 0.65, marginBottom: 2 },
  text: { fontSize: 16, lineHeight: 22 },
  mention: { color: MENTION },
});

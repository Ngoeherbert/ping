import MediaBubble from "./MediaBubble";

// Photo message. Pass `caption` to wrap it in a bubble with text; omit it for a bare photo.
export default function ImageBubble({ uri, caption, isMine = true, showTail = true, onPress }) {
  return (
    <MediaBubble
      uri={uri}
      caption={caption}
      isMine={isMine}
      showTail={showTail}
      onPress={onPress}
      accessibilityLabel="Photo"
    />
  );
}

import MessageBubble from "./MessageBubble";
import ImageBubble from "./ImageBubble";
import VideoBubble from "./VideoBubble";
import ViewOnceBubble from "./ViewOnceBubble";
import VoiceNoteBubble from "./VoiceNoteBubble";
import PhotoStackBubble from "./PhotoStackBubble";

// One entry point for every message type:
// "text" | "image" | "video" | "voice" | "viewOnce" | "photos"
export default function ChatMessage({ message }) {
  const { type = "text", isMine = true, showTail = true } = message;

  switch (type) {
    case "image":
      return (
        <ImageBubble
          uri={message.uri}
          caption={message.caption}
          isMine={isMine}
          showTail={showTail}
        />
      );
    case "video":
      return (
        <VideoBubble
          thumbnail={message.thumbnail}
          duration={message.duration}
          caption={message.caption}
          isMine={isMine}
          showTail={showTail}
        />
      );
    case "voice":
      return (
        <VoiceNoteBubble
          id={message.id}
          duration={message.duration}
          isMine={isMine}
          showTail={showTail}
        />
      );
    case "viewOnce":
      return (
        <ViewOnceBubble
          kind={message.kind}
          opened={message.opened}
          isMine={isMine}
          showTail={showTail}
        />
      );
    case "photos":
      return (
        <PhotoStackBubble
          uris={message.uris}
          total={message.total}
          reactions={message.reactions}
          isMine={isMine}
        />
      );
    default:
      return (
        <MessageBubble
          text={message.text}
          isMine={isMine}
          showTail={showTail}
          senderName={message.showName ? message.sender : undefined}
        />
      );
  }
}

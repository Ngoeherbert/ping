import { formatDuration } from "./formatDuration";

// Short one-line text for the chat list.
// Group messages are prefixed with the sender's first name.
export function messagePreview(message) {
  const prefix = message.isMine
    ? "You: "
    : message.sender
      ? `${message.sender.split(" ")[0]}: `
      : "";
  switch (message.type) {
    case "image":
      return prefix + (message.caption || "Photo");
    case "video":
      return prefix + (message.caption || "Video");
    case "voice":
      return `${prefix}Voice message ${formatDuration(message.duration)}`;
    case "viewOnce":
      return `${prefix}View once ${message.kind === "video" ? "video" : "photo"}`;
    case "photos": {
      const n = message.total ?? message.uris?.length ?? 0;
      return `${prefix}${n} photo${n === 1 ? "" : "s"}`;
    }
    default:
      return prefix + (message.text ?? "");
  }
}

import { formatDuration } from "./formatDuration";

// Short one-line text for the chat list.
export function messagePreview(message) {
  const prefix = message.isMine ? "You: " : "";
  switch (message.type) {
    case "image":
      return prefix + (message.caption || "Photo");
    case "video":
      return prefix + (message.caption || "Video");
    case "voice":
      return `${prefix}Voice message ${formatDuration(message.duration)}`;
    case "viewOnce":
      return `${prefix}View once ${message.kind === "video" ? "video" : "photo"}`;
    default:
      return prefix + (message.text ?? "");
  }
}

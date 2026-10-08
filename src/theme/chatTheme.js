// Extra tokens for chats shown over a wallpaper (the "glass" look).
// Kept out of colors.js so your palette file stays untouched.

// Opaque on purpose: the bubble tail is a separate shape, and translucent
// colours would show a darker seam where the tail overlaps the bubble.
export const glassBubbles = {
  sent: "#0b0b0c",
  sentText: "#ffffff",
  received: "#2a211c",
  receivedText: "#ffffff",
};

export const glassColors = {
  base: "#1a110c",
  wash: "rgba(24, 14, 9, 0.68)",
  text: "#ffffff",
  muted: "rgba(255, 255, 255, 0.62)",
  surface: "rgba(30, 22, 18, 0.86)",
  border: "rgba(255, 255, 255, 0.14)",
  ring: "rgba(255, 255, 255, 0.85)",
};

export const MENTION = "#ff8a4c";

// Used by every chat that has no `wallpaper` of its own.
export const DEFAULT_WALLPAPER = "https://picsum.photos/seed/chat-wallpaper/600/1000";

// Single source of truth for app colors. Add new tokens to BOTH palettes.
const light = {
  background: "#f6f7f9",
  surface: "#ffffff",
  border: "#e4e6ea",
  text: "#14181c",
  textMuted: "#6b7280",
  primary: "#0f6e5b",
  primarySoft: "#dff3ee",
  onPrimary: "#ffffff",
  danger: "#d64545",
  bubbleSent: "#007AFF",
  bubbleSentText: "#ffffff",
  bubbleReceived: "#e9e9eb",
  bubbleReceivedText: "#14181c",
  mediaPlaceholder: "#d9dce1",
};

const dark = {
  background: "#0d0f12",
  surface: "#15181c",
  border: "#262b31",
  text: "#eef1f4",
  textMuted: "#9aa3ad",
  primary: "#5fd1b5",
  primarySoft: "#1d3a33",
  onPrimary: "#0d0f12",
  danger: "#ff7a7a",
  bubbleSent: "#0a84ff",
  bubbleSentText: "#ffffff",
  bubbleReceived: "#26262a",
  bubbleReceivedText: "#eef1f4",
  mediaPlaceholder: "#2a2e35",
};

export const colors = { light, dark };
export default colors;

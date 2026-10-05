/**
 * Small bundled emoji dataset — no network, negligible bundle cost.
 *
 * ~200 emoji across 8 categories (recent is dynamic). Full Unicode emoji sets
 * are thousands of glyphs; a chat emoji panel is navigated by category/search,
 * so a curated subset covers real usage while keeping the file small and the
 * grid fast without extra dependencies on Expo Go.
 *
 * Structure per category: { id, label, icon, emoji: string[] }.
 * Extension point: stickers/GIFs add their own tabs and render into the same
 * panel slots (see EmojiPanel `stickerSlot` / `gifSlot` props).
 */

export const EMOJI_CATEGORIES = [
  {
    id: "smileys",
    label: "Smileys",
    icon: "smile",
    emoji: [
      "😀", "😁", "😂", "🤣", "😊", "😍", "😘", "😎",
      "🤔", "😐", "🙄", "😴", "🤯", "🥳", "😭", "😡",
      "🤠", "🥺", "😇", "🤖", "💀", "👻", "🙏", "👏",
      "👍", "👎", "✌️", "🤝", "💪", "🫶", "❤️", "💔",
    ],
  },
  {
    id: "people",
    label: "People",
    icon: "profile",
    emoji: [
      "👶", "🧒", "👦", "👧", "🧑", "👨", "👩", "🧓",
      "👴", "👵", "👮", "💂", "🕵️", "👷", "🤴", "👸",
      "👳", "🧕", "🤰", "🤱", "👼", "🎅", "🦸", "🧙",
      "🧚", "🧜", "🧞", "🧟", "💃", "🕺", "🏃", "🚶",
    ],
  },
  {
    id: "animals",
    label: "Animals",
    icon: "heart",
    emoji: [
      "🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼",
      "🐨", "🐯", "🦁", "🐮", "🐷", "🐸", "🐵", "🐔",
      "🐧", "🐦", "🦆", "🦅", "🦉", "🦇", "🐺", "🐗",
      "🐴", "🦄", "🐝", "🦋", "🐌", "🐞", "🦀", "🐢",
    ],
  },
  {
    id: "food",
    label: "Food",
    icon: "camera",
    emoji: [
      "🍎", "🍐", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓",
      "🍑", "🍍", "🥭", "🥑", "🍔", "🍟", "🍕", "🌭",
      "🍿", "🍩", "🍪", "🎂", "🍫", "🍯", "☕", "🧃",
      "🥤", "🍺", "🍷", "🥂", "🍾", "🌮", "🍜", "🍲",
    ],
  },
  {
    id: "activities",
    label: "Activities",
    icon: "game",
    emoji: [
      "⚽", "🏀", "🏈", "⚾", "🎾", "🏐", "🏉", "🎱",
      "🏓", "🏸", "🥊", "🥋", "⛳", "🎣", "🤿", "🎽",
      "🛹", "🎮", "🎲", "🧩", "♟️", "🎭", "🎨", "🎬",
      "🎤", "🎧", "🎷", "🎸", "🥁", "🎹", "🎺", "🎻",
    ],
  },
  {
    id: "travel",
    label: "Travel",
    icon: "location",
    emoji: [
      "🚗", "🚕", "🚙", "🚌", "🚎", "🏎️", "🚓", "🚑",
      "✈️", "🚀", "🚁", "⛵", "🚤", "🛥️", "🚲", "🛵",
      "🚂", "🚃", "🚄", "🚅", "🚇", "🚊", "🚉", "🗺️",
      "🗽", "🗼", "🏰", "🏝️", "🏖️", "⛰️", "🏔️", "🌋",
    ],
  },
  {
    id: "objects",
    label: "Objects",
    icon: "file",
    emoji: [
      "⌚", "📱", "💻", "⌨️", "🖥️", "🖨️", "🖱️", "💾",
      "💿", "📷", "🎥", "📺", "📻", "⏰", "💡", "🔦",
      "📚", "✏️", "✂️", "🔒", "🔑", "🔨", "🧲", "💰",
      "💎", "⚖️", "🧪", "💊", "💉", "🩺", "🧹", "🛒",
    ],
  },
  {
    id: "symbols",
    label: "Symbols",
    icon: "report",
    emoji: [
      "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍",
      "💯", "✨", "⭐", "🌟", "🔥", "💥", "✅", "❌",
      "⚠️", "🚫", "⛔", "💤", "💢", "♻️", "🔞", "🆘",
      "1️⃣", "2️⃣", "3️⃣", "🔢", "#️⃣", "*️⃣", "©️", "®️",
    ],
  },
  {
    id: "flags",
    label: "Flags",
    icon: "more",
    emoji: [
      "🇨🇲", "🇳🇬", "🇬🇭", "🇿🇦", "🇰🇪", "🇪🇬", "🇪🇹", "🇸🇳",
      "🇨🇮", "🇲🇱", "🇫🇷", "🇬🇧", "🇩🇪", "🇺🇸", "🇨🇦", "🇧🇷",
      "🇯🇵", "🇰🇷", "🇨🇳", "🇮🇳", "🇦🇺", "🇪🇸", "🇮🇹", "🇵🇹",
      "🏁", "🚩", "🏳️", "🏴", "🎌", "🇪🇺", "🇺🇳", "🌍",
    ],
  },
];

/** All emoji in one flat list (for search). Built once at module load. */
export const ALL_EMOJI = EMOJI_CATEGORIES.flatMap((c) => c.emoji);

/**
 * Skin-tone variants for the handful of emoji that support them. Long-press
 * a supported base in the panel to pick a tone; the tone modifier is
 * appended. Codes: light, medium-light, medium, medium-dark, dark.
 */
export const SKIN_TONES = ["🏻", "🏼", "🏽", "🏾", "🏿"];

/** Base emoji that accept a skin-tone modifier. */
export const TONEABLE = new Set([
  "👶", "🧒", "👦", "👧", "🧑", "👨", "👩", "👮", "🕵️", "👷",
  "🤴", "👸", "👳", "👼", "🎅", "💃", "🕺", "🏃", "🚶",
  "👏", "👍", "👎", "✌️", "🤝", "💪", "🙏",
]);

/** Apply a tone modifier to a base emoji. */
export function withTone(base, toneIndex) {
  if (!TONEABLE.has(base)) return base;
  const tone = SKIN_TONES[toneIndex];
  if (!tone) return base;
  return base.replace("️", "") + tone;
}

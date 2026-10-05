import * as SecureStore from "expo-secure-store";

/**
 * Persists the last real keyboard height (per orientation) plus emoji
 * recents, using expo-secure-store (already installed). Small JSON values
 * only; large lists are never persisted.
 */

const HEIGHT_KEY = "ping.keyboardHeight.v1";
const RECENTS_KEY = "ping.emojiRecents.v1";
const TONE_KEY = "ping.emojiTone.v1";

async function readJson(key) {
  try {
    const raw = await SecureStore.getItemAsync(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function writeJson(key, value) {
  try {
    await SecureStore.setItemAsync(key, JSON.stringify(value));
  } catch {
    // Persistence is best-effort; panels still work with defaults.
  }
}

/** `{ portrait: number, landscape: number }`, both 0 until seen once. */
export async function loadKeyboardHeights() {
  const saved = await readJson(HEIGHT_KEY);
  return {
    portrait: Number(saved?.portrait) || 0,
    landscape: Number(saved?.landscape) || 0,
  };
}

export async function saveKeyboardHeight(orientation, height) {
  const current = (await readJson(HEIGHT_KEY)) ?? {};
  await writeJson(HEIGHT_KEY, { ...current, [orientation]: Math.round(height) });
}

export async function loadEmojiRecents() {
  const saved = await readJson(RECENTS_KEY);
  return Array.isArray(saved) ? saved.filter((e) => typeof e === "string") : [];
}

export async function saveEmojiRecents(recents) {
  await writeJson(RECENTS_KEY, recents.slice(0, 30));
}

export async function loadSkinTone() {
  const saved = await readJson(TONE_KEY);
  return typeof saved === "number" ? saved : 0;
}

export async function saveSkinTone(index) {
  await writeJson(TONE_KEY, index);
}

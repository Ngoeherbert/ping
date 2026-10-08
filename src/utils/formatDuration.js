// 75 -> "1:15", 8 -> "0:08"
export function formatDuration(totalSeconds = 0) {
  const s = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}

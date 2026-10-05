export const formatDuration = (sec = 0) => {
  const s = Math.max(0, Math.round(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

export const formatBytes = (b = 0) => {
  if (b < 1024) return `${b} B`;
  if (b < 1048576) return `${Math.round(b / 1024)} KB`;
  return `${(b / 1048576).toFixed(1)} MB`;
};

// Fit media inside a max box while keeping its aspect ratio
export const mediaSize = (w = 4, h = 3, maxW = 240, maxH = 320) => {
  const ratio = w / h;
  let width = maxW;
  let height = width / ratio;
  if (height > maxH) {
    height = maxH;
    width = height * ratio;
  }
  return { width, height };
};

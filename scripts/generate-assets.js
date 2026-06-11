const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const root = path.resolve(__dirname, '..');
const assetsDir = path.join(root, 'assets');
const imagesDir = path.join(assetsDir, 'images');
fs.mkdirSync(imagesDir, { recursive: true });

const orange = [255, 107, 53, 255];
const dark = [232, 90, 36, 255];
const white = [255, 255, 255, 255];
const transparent = [0, 0, 0, 0];

function crc32(buffer) {
  let crc = -1;
  for (let i = 0; i < buffer.length; i += 1) {
    crc ^= buffer[i];
    for (let j = 0; j < 8; j += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ -1) >>> 0;
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([length, typeBuffer, data, checksum]);
}

function writePng(filePath, width, height, pixel) {
  const rows = [];
  for (let y = 0; y < height; y += 1) {
    const row = Buffer.alloc(1 + width * 4);
    row[0] = 0;
    for (let x = 0; x < width; x += 1) {
      const [r, g, b, a] = pixel(x, y, width, height);
      const offset = 1 + x * 4;
      row[offset] = r;
      row[offset + 1] = g;
      row[offset + 2] = b;
      row[offset + 3] = a;
    }
    rows.push(row);
  }

  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 6;

  fs.writeFileSync(
    filePath,
    Buffer.concat([
      Buffer.from('\x89PNG\r\n\x1a\n', 'binary'),
      chunk('IHDR', header),
      chunk('IDAT', zlib.deflateSync(Buffer.concat(rows), { level: 9 })),
      chunk('IEND', Buffer.alloc(0)),
    ]),
  );
}

function blend(a, b, t) {
  return a.map((value, index) => Math.round(value * (1 - t) + b[index] * t));
}

function inBubble(x, y, width, height, scale = 1) {
  const cx = width / 2;
  const cy = height * 0.46;
  const radius = Math.min(width, height) * 0.26 * scale;
  const circle = Math.hypot(x - cx, y - cy) <= radius;
  const tail =
    cx + radius * 0.2 < x &&
    x < cx + radius * 0.78 &&
    cy + radius * 0.48 < y &&
    y < cy + radius &&
    y > (x - (cx + radius * 0.2)) * 0.7 + cy + radius * 0.42;
  return circle || tail;
}

function logoDots(x, y, width, height, dotRadius) {
  const cx = width / 2;
  return [-0.09, 0, 0.09].some((offset) => Math.hypot(x - (cx + width * offset), y - height * 0.46) < dotRadius);
}

function iconPixel(x, y, width, height) {
  if (inBubble(x, y, width, height, 1.05)) {
    return logoDots(x, y, width, height, width * 0.035) ? orange : white;
  }
  return blend(orange, dark, (x + y) / (width + height));
}

function adaptivePixel(x, y, width, height) {
  if (inBubble(x, y, width, height, 1.25)) {
    return logoDots(x, y, width, height, width * 0.04) ? white : orange;
  }
  return transparent;
}

function splashPixel(x, y, width, height) {
  if (inBubble(x, y, width, height, 0.8)) {
    return logoDots(x, y, width, height, width * 0.028) ? white : orange;
  }
  return white;
}

const outputs = [
  ['icon.png', 1024, 1024, iconPixel],
  ['adaptive-icon.png', 1024, 1024, adaptivePixel],
  ['splash-icon.png', 1024, 1024, splashPixel],
  ['favicon.png', 128, 128, iconPixel],
];

for (const [name, width, height, pixel] of outputs) {
  writePng(path.join(assetsDir, name), width, height, pixel);
}

fs.copyFileSync(path.join(assetsDir, 'icon.png'), path.join(imagesDir, 'icon.png'));
fs.copyFileSync(path.join(assetsDir, 'splash-icon.png'), path.join(imagesDir, 'splash-icon.png'));
console.log('Generated Expo image assets in assets/.');

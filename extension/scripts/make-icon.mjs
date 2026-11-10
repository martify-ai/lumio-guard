// Draws the placeholder Lumio Guard icon (navy square, green shield shape) as PNGs.
// No image libraries: writes the PNG bytes directly. Run: node scripts/make-icon.mjs
import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'static');
const NAVY = [0x0d, 0x21, 0x37];
const GREEN = [0x16, 0x65, 0x34];
const WHITE = [0xff, 0xff, 0xff];

function crc32(buf) {
  let c = ~0;
  for (const b of buf) {
    c ^= b;
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

// Shield: a rounded top block that narrows to a point at the bottom.
function inShield(x, y, inset) {
  const top = 0.2 + inset, bottom = 0.86 - inset, half = 0.3 - inset;
  if (y < top || y > bottom) return false;
  const t = (y - top) / (bottom - top);
  const width = t < 0.45 ? half : half * (1 - (t - 0.45) / 0.55);
  return Math.abs(x - 0.5) <= width;
}

function png(size) {
  const raw = Buffer.alloc(size * (size * 3 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 3 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      const u = (x + 0.5) / size, v = (y + 0.5) / size;
      const c = inShield(u, v, 0.07) ? GREEN : inShield(u, v, 0) ? WHITE : NAVY;
      raw.set(c, y * (size * 3 + 1) + 1 + x * 3);
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr.set([8, 2, 0, 0, 0], 8);
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

for (const size of [16, 48, 128]) writeFileSync(join(out, `icon${size}.png`), png(size));
console.log('icons written');

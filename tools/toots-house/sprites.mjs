// Every picture of Toots, side by side, as one PNG (each dot 4 pixels): for looking at her without the
// game. Use: node tools/toots-house/sprites.mjs <out.png>
import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { windowPoses, roomPoses, PAL } from '../../src/activities/toots-house/toots-art.js';

const out = process.argv[2] || 'toots.png', Z = 4, GAP = 4;
const all = [...Object.values(windowPoses()), ...Object.values(roomPoses())];
const cols = 8, cw = Math.max(...all.map(p => p.w)) + GAP, ch = Math.max(...all.map(p => p.h)) + GAP;
const W = cols * cw * Z, H = Math.ceil(all.length / cols) * ch * Z, px = Buffer.alloc(W * H * 3, 0xd0);
all.forEach((p, i) => {
  const ox = (i % cols) * cw, oy = Math.floor(i / cols) * ch;
  for (let y = 0; y < p.h; y++) for (let x = 0; x < p.w; x++) {
    const c = p.d[y][x]; if (c === '.') continue;
    const v = parseInt(PAL[c].slice(1), 16);
    for (let j = 0; j < Z; j++) for (let k = 0; k < Z; k++) { const at = (((oy + y) * Z + j) * W + (ox + x) * Z + k) * 3; px[at] = v >> 16; px[at + 1] = (v >> 8) & 255; px[at + 2] = v & 255; }
  }
});
const raw = Buffer.alloc((W * 3 + 1) * H);
for (let y = 0; y < H; y++) px.copy(raw, y * (W * 3 + 1) + 1, y * W * 3, (y + 1) * W * 3);
const crc = b => { let c = ~0; for (const x of b) { c ^= x; for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1)); } return ~c >>> 0; };
const chunk = (t, d) => { const b = Buffer.alloc(12 + d.length); b.writeUInt32BE(d.length); b.write(t, 4); d.copy(b, 8); b.writeUInt32BE(crc(b.subarray(4, 8 + d.length)), 8 + d.length); return b; };
const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(W); ihdr.writeUInt32BE(H, 4); ihdr[8] = 8; ihdr[9] = 2;
writeFileSync(out, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]));
console.log(`${all.length} pictures in ${out}`);

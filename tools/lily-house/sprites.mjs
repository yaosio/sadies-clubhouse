// Every picture of Lily on one PNG, big, without a browser: node tools/lily-house/sprites.mjs <out.png> [scale] [bow]
import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { lilyPoses, chickenPix, PAL, BOWS } from '../../src/activities/lily-house/lily-art.js';
const [out, sc = '5', bowc = 'pink'] = process.argv.slice(2); const S = +sc;
const poses = { ...lilyPoses(), chicken: chickenPix() };
const names = Object.keys(poses), cols = 8, cw = 66, ch = 66;
const rows = Math.ceil(names.length / cols), W = cols * cw * S, H = rows * ch * S;
const buf = Buffer.alloc(W * H * 4);
const pal = { ...PAL, ...BOWS[bowc] };
for (let i = 0; i < W * H; i++) { buf[i * 4] = 216; buf[i * 4 + 1] = 212; buf[i * 4 + 2] = 232; buf[i * 4 + 3] = 255; }
names.forEach((n, i) => { const p = poses[n], ox = (i % cols) * cw, oy = Math.floor(i / cols) * ch;
  for (let y = 0; y < p.h; y++) for (let x = 0; x < p.w; x++) { const c = p.d[y][x]; if (c === '.') continue; const h = pal[c];
    const r = parseInt(h.slice(1, 3), 16), g = parseInt(h.slice(3, 5), 16), b = parseInt(h.slice(5, 7), 16);
    for (let j = 0; j < S; j++) for (let k = 0; k < S; k++) { const X = (ox + x) * S + k, Y = (oy + y) * S + j; if (X < W && Y < H) { const o = (Y * W + X) * 4; buf[o] = r; buf[o + 1] = g; buf[o + 2] = b; } } } });
const raw = Buffer.alloc((W * 4 + 1) * H); for (let y = 0; y < H; y++) { raw[y * (W * 4 + 1)] = 0; buf.copy(raw, y * (W * 4 + 1) + 1, y * W * 4, (y + 1) * W * 4); }
const crc = b => { let c, t = []; for (let n = 0; n < 256; n++) { c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } c = 0xffffffff; for (const x of b) c = t[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const chunk = (ty, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(ty), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };
const ih = Buffer.alloc(13); ih.writeUInt32BE(W, 0); ih.writeUInt32BE(H, 4); ih[8] = 8; ih[9] = 6;
writeFileSync(out, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ih), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]));
console.log(names.join(' '));

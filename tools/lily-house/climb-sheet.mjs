// The game's little pictures on one PNG, big, without a browser: node tools/lily-house/climb-sheet.mjs <out.png>
import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { PAL, BOWS, lilySide, lilyFront, lilyClimb, marbles, thing, chick } from '../../src/activities/lily-house/climb-art.js';
const S = 6, pics = [lilySide(1, 'walk0'), lilySide(1, 'walk1'), lilySide(-1, 'jump'), lilyClimb(0), lilyClimb(1), lilyFront('hug'), lilyFront('dizzy'), marbles('plain', true), thing('bubbles'), thing('dryer'), thing('vacuum'), thing('clippers'), chick()];
const cw = 26, W = pics.length * cw * S, H = 26 * S, buf = Buffer.alloc(W * H * 4, 0);
for (let i = 0; i < W * H; i++) buf.set([18, 10, 36, 255], i * 4);
const pal = { ...PAL, ...BOWS.pink };
pics.forEach((p, i) => { for (let y = 0; y < p.h; y++) for (let x = 0; x < p.w; x++) { const c = p.d[y][x]; if (c === '.') continue; const h = pal[c], rgb = [1, 3, 5].map(k => parseInt(h.slice(k, k + 2), 16));
  for (let j = 0; j < S; j++) for (let k = 0; k < S; k++) { const X = (i * cw + 2 + x) * S + k, Y = (2 + y) * S + j; if (X < W && Y < H) buf.set([...rgb, 255], (Y * W + X) * 4); } } });
const raw = Buffer.alloc((W * 4 + 1) * H); for (let y = 0; y < H; y++) buf.copy(raw, y * (W * 4 + 1) + 1, y * W * 4, (y + 1) * W * 4);
const crc = b => { let c, t = []; for (let n = 0; n < 256; n++) { c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } c = 0xffffffff; for (const x of b) c = t[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const chunk = (ty, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(ty), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };
const ih = Buffer.alloc(13); ih.writeUInt32BE(W, 0); ih.writeUInt32BE(H, 4); ih[8] = 8; ih[9] = 6;
writeFileSync(process.argv[2], Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ih), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]));

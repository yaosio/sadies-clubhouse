// Cuts Chooter's woo out of a recording and writes src/activities/paint-shop/sounds/woo-data.js
// (4-bit ADPCM at 11025 Hz, mono, as text, so it lives inside the game files).
// Use: node tools/paint-shop/make-woo.mjs <video or audio file> <start secs> <end secs>
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { encode } from '../../src/activities/paint-shop/sounds/adpcm.js';

const [file, a, b] = process.argv.slice(2);
if (!file || !(b > a)) { console.error('node tools/paint-shop/make-woo.mjs <file> <start> <end>'); process.exit(1); }
const raw = execFileSync('ffmpeg', ['-v', 'error', '-ss', a, '-to', b, '-i', file, '-vn', '-ac', '1', '-ar', '11025', '-f', 's16le', '-'], { maxBuffer: 1 << 26 });
const pcm = new Int16Array(raw.buffer, raw.byteOffset, raw.length >> 1);
let peak = 1; for (const v of pcm) peak = Math.max(peak, Math.abs(v));
const gain = 0.45 * 32767 / peak, fade = 0.03 * 11025;
const out = Int16Array.from(pcm, (v, i) => Math.round(v * gain * Math.min(1, i / 60, (pcm.length - i) / fade)));
const text = Buffer.from(encode(out)).toString('base64');
writeFileSync(new URL('../../src/activities/paint-shop/sounds/woo-data.js', import.meta.url),
  `// Chooter's woo, cut from the owner's own recording (${a}s to ${b}s) by tools/paint-shop/make-woo.mjs:\n// 4-bit ADPCM, 11025 Hz, mono. Don't edit by hand.\nexport default '${text}';\n`);
console.log(`${out.length} samples, ${(out.length / 11025).toFixed(2)} s, ${text.length} characters`);

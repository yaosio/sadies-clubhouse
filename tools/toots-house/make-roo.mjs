// Cuts Toots' roos out of the owner's window video and writes src/activities/toots-house/sounds/roo-data.js
// (4-bit ADPCM at 11025 Hz, mono, as text, so they live inside the game files). Each cut is only her:
// the last one stops before a person's voice comes in at about 12.6 s. Listen for people before using a new cut.
// Use: node tools/toots-house/make-roo.mjs <the window video> [start-end ...]
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { encode } from '../../src/shared/adpcm.js';

const [file, ...given] = process.argv.slice(2);
if (!file) { console.error('node tools/toots-house/make-roo.mjs <video> [start-end ...]'); process.exit(1); }
const cuts = (given.length ? given : ['7.75-10.1', '10.85-12.55']).map(c => c.split('-').map(Number));
const out = cuts.map(([a, b]) => {
  const raw = execFileSync('ffmpeg', ['-v', 'error', '-ss', String(a), '-to', String(b), '-i', file, '-vn', '-ac', '1', '-ar', '11025', '-f', 's16le', '-'], { maxBuffer: 1 << 26 });
  const pcm = new Int16Array(raw.buffer, raw.byteOffset, raw.length >> 1);
  let peak = 1; for (const v of pcm) peak = Math.max(peak, Math.abs(v));
  const gain = 0.45 * 32767 / peak, fadeIn = 0.05 * 11025, fadeOut = 0.2 * 11025;
  const s = Int16Array.from(pcm, (v, i) => Math.round(v * gain * Math.min(1, i / fadeIn, (pcm.length - i) / fadeOut)));
  console.log(`${a}s to ${b}s: ${(s.length / 11025).toFixed(2)} s`);
  return Buffer.from(encode(s)).toString('base64');
});
writeFileSync(new URL('../../src/activities/toots-house/sounds/roo-data.js', import.meta.url),
  `// Toots' roos, cut from the owner's own window video (${cuts.map(c => c.join('s to ') + 's').join(', ')}) by\n// tools/toots-house/make-roo.mjs: 4-bit ADPCM, 11025 Hz, mono. Don't edit by hand.\nexport default [\n${out.map(t => `  '${t}',`).join('\n')}\n];\n`);

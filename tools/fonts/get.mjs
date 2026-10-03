// Downloads the game's fonts from Google Fonts once, into src/shared/fonts/ (the files themselves, and
// fonts.css, the @font-face rules that name them), so the game never asks Google's servers for them:
// it works offline, and nobody is told who is playing. Only the Latin part of each is kept.
//
//   node tools/fonts/get.mjs
//
// Every font here is under the SIL Open Font License (credited on the pause menu's CREDITS page,
// src/shared/credits.js). Add a font: add it to FAMILIES, run this, commit what it wrote.
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('../..', import.meta.url).pathname, out = join(root, 'src/shared/fonts');
const FAMILIES = [
  'Silkscreen:wght@400;700', 'Patrick+Hand', 'VT323', 'Pacifico', 'Bungee', 'UnifrakturMaguntia', 'Courier+Prime',
  'Old+Standard+TT:ital,wght@0,400;0,700;1,400;1,700', 'Comic+Neue:ital,wght@0,400;0,700;1,400;1,700',
];
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';   // (a modern browser, so the files come as woff2)
const get = async (u, text) => { const r = await fetch(u, { headers: { 'User-Agent': UA } }); if (!r.ok) throw new Error(`${r.status} ${u}`); return text ? r.text() : Buffer.from(await r.arrayBuffer()); };

rmSync(out, { recursive: true, force: true }); mkdirSync(out, { recursive: true });
let css = '/* written by tools/fonts/get.mjs: the game\'s fonts, Latin only (see that file) */\n';
for (const fam of FAMILIES) {
  const sheet = await get(`https://fonts.googleapis.com/css2?family=${fam}&display=swap`, true);
  for (const [, label, block] of sheet.matchAll(/\/\* ([\w-]+) \*\/\s*(@font-face \{[^}]*\})/g)) {
    if (label !== 'latin') continue;
    const f = id => block.match(new RegExp(id + ':\\s*([^;]+);'))[1].trim().replace(/^'|'$/g, '');
    const name = `font-${f('font-family').toLowerCase().replace(/\s+/g, '-')}-${f('font-style')[0]}${f('font-weight')}.woff2`;
    writeFileSync(join(out, name), await get(block.match(/url\(([^)]+)\)/)[1]));
    css += `@font-face{font-family:'${f('font-family')}';font-style:${f('font-style')};font-weight:${f('font-weight')};font-display:swap;src:url(./game/${name}) format('woff2');unicode-range:${f('unicode-range')}}\n`;
  }
}
writeFileSync(join(out, 'fonts.css'), css);
console.log(css.split('\n').length - 2 + ' font files in src/shared/fonts/');

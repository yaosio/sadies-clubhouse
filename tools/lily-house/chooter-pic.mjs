// Writes src/activities/toots-house/chooter-pic.js: Chooter's portrait from Lily's House, as rows of
// dots, for the picture of him on Toots' wall (rooms can't share files, so Toots' house keeps a copy).
// Run again if his portrait in lily-art.js changes: node tools/lily-house/chooter-pic.mjs
import { writeFileSync } from 'node:fs';
import { chooterPortrait, CHOOTER } from '../../src/activities/lily-house/lily-art.js';
const p = chooterPortrait(), rows = p.d.map(r => r.join(''));
const used = new Set(rows.join('')); used.delete('.');
const pal = Object.fromEntries([...used].sort().map(k => [k, CHOOTER[k]]));
writeFileSync(new URL('../../src/activities/toots-house/chooter-pic.js', import.meta.url), `// Chooter, head and shoulders, dot by dot, for his picture on Toots' wall: a copy of Lily's House's
// chooterPortrait(), made by tools/lily-house/chooter-pic.mjs (rooms can't share files).
export const CHOOTER_PAL = ${JSON.stringify(pal)};
export const CHOOTER = [
${rows.map(r => `  '${r}',`).join('\n')}
];
`);
console.log(p.w, p.h);

// Writes src/activities/lily-house/toots-pic.js: Toots, from the front, as rows of dots, for the picture
// of her on Lily's wall (rooms can't share files, so Lily's house keeps its own copy of her picture).
// Run again if Toots' look changes: node tools/lily-house/toots-pic.mjs
import { writeFileSync } from 'node:fs';
import { frontToots, PAL } from '../../src/activities/toots-house/toots-art.js';
const p = frontToots({ ears: 1, wag: 1 }), rows = p.d.map(r => r.join(''));
const used = new Set(rows.join('')); used.delete('.');
const pal = Object.fromEntries([...used].sort().map(k => [k, PAL[k]]));
writeFileSync(new URL('../../src/activities/lily-house/toots-pic.js', import.meta.url), `// Toots from the front, dot by dot, for her picture on Lily's wall: a copy of Toots' House's own
// frontToots({ ears: 1, wag: 1 }), made by tools/lily-house/toots-pic.mjs (rooms can't share files).
export const TOOTS_PAL = ${JSON.stringify(pal)};
export const TOOTS = [
${rows.map(r => `  '${r}',`).join('\n')}
];
`);
console.log(p.w, p.h);

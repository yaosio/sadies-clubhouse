// How hard the physics works on a full board, in Node (no browser): loads the full-board save
// (tools/fullboard.mjs), plays it for a couple of minutes with the mole dropping pieces as usual,
// and prints:
//   - how long one simulation step takes with few, some and many pieces awake
//   - how many pieces each drop wakes up, and how long they stay awake
//
//   node tools/physics-load.mjs [minutes]
//
// Random numbers are seeded, so the same code gives the same run (the times vary a little).
// Times are for this machine; a slow phone is several times slower.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
let seed = 7;
Math.random = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
const mem = {}; // the save is read from "localStorage", like in the browser
globalThis.localStorage = { getItem: k => mem[k] ?? null, setItem: (k, v) => { mem[k] = String(v); }, removeItem: k => { delete mem[k]; } };
const boardFile = readdirSync(join(root, 'dist')).find(f => /^fullboard-.*\.json$/.test(f));
if (!boardFile) { console.error('no full board in dist/: run node tools/fullboard.mjs dist/fullboard-x.json (or npm run check) first'); process.exit(2); }

const src = new URL('../src/', import.meta.url);
const { world } = await import(new URL('core/world.js', src));
const { update } = await import(new URL('core/game.js', src));
const { loadGame, SAVE_KEY } = await import(new URL('core/save.js', src));
mem[SAVE_KEY] = readFileSync(join(root, 'dist', boardFile), 'utf8');
if (!loadGame()) { console.error('the full board could not be loaded'); process.exit(1); }

for (let f = 0; f < 600; f++) update(1 / 60); // warm up (the first steps are slow while the code is compiled)
const steps = Math.round(+(process.argv[2] || 2) * 3600);
const groups = [['calm (under 15 awake)', 15], ['busy (15-39 awake)', 40], ['pile-up (40+ awake)', Infinity]].map(([name, below]) => ({ name, below, n: 0, ms: 0, awake: 0, worst: 0 }));
const seen = new Set(world.pieces), spell = new Map(), spells = [];
let drops = 0, sum = 0;
for (let f = 0; f < steps; f++) {
  const t = performance.now(); update(1 / 60); const ms = performance.now() - t;
  let awake = 0;
  for (const p of world.pieces) {
    if (!seen.has(p)) { seen.add(p); drops++; }
    if (!p.asleep) { awake++; spell.set(p, (spell.get(p) || 0) + 1); }
    else if (spell.has(p)) { spells.push(spell.get(p) / 60); spell.delete(p); }
  }
  const g = groups.find(g => awake < g.below); g.n++; g.ms += ms; g.awake += awake; g.worst = Math.max(g.worst, ms); sum += awake;
}
console.log(`${(steps / 3600).toFixed(1)} minutes, ${world.pieces.length} pieces, ${drops} dropped, on average ${(sum / steps).toFixed(1)} awake`);
for (const g of groups) if (g.n) console.log(`  ${g.name}: ${(100 * g.n / steps).toFixed(0)}% of the time, ${(g.awake / g.n).toFixed(0)} awake on average, one step ${(g.ms / g.n).toFixed(2)} ms (worst ${g.worst.toFixed(1)})`);
spells.sort((a, b) => a - b);
const at = q => spells[Math.min(spells.length - 1, Math.floor(q * spells.length))].toFixed(1);
console.log(`each drop wakes ${(spells.length / Math.max(1, drops)).toFixed(1)} pieces (counting the dropped one); they stay awake ${at(0.5)} s typically, 1 in 10 over ${at(0.9)} s, longest ${at(1)} s`);

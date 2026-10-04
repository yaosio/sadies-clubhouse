// Chooter's Paint Shop's headless checks: the paint itself (layer.js: the brush, the roller, the spray
// can, the bucket, the stamps, keeping it and getting it back), the stamps and tools on offer, and
// every sound (sounds/). Run in Node, seeded, in about a second.
//
//   node tests/paint-shop/run.mjs
import { makeLayer, dab, stroke, spray, fill, stamp, clear, painted, encode, decode, PAINTS, RAINBOW } from '../../src/activities/paint-shop/layer.js';
import { STAMPS, SADIE_PAW } from '../../src/activities/paint-shop/stamps.js';
import { POTS, TOOLS, START } from '../../src/activities/paint-shop/tools.js';
import { RATE } from '../../src/shared/retro.js';
import { ALL } from '../../src/activities/paint-shop/sounds/index.js';
import card from '../../src/activities/paint-shop/card.js';
import { makeSurfaces, boxGeometry } from '../../src/activities/paint-shop/surfaces.js';
import { Scene, Mesh, Vector3, MeshBasicMaterial } from 'three';
import { checker } from '../shared/check.mjs';

const { check, finish } = checker();
function seeded(a) { return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// 1. the card: Chooter's shop, on the second plot outside the gate (across from Clyde's), not a door on the landing
check("the card puts Chooter's shop on the second plot outside the gate, not on the landing", card.lot === 1 && card.slot === undefined && typeof card.room === 'function' && /Chooter/.test(card.name));
check('...and says what it keeps in the browser', card.keeps.every(k => k.startsWith('sadies-clubhouse.paint-shop.')));

// 2. the brush: a round dab, a line with no gaps, and the roller's square
{
  const L = makeLayer(40, 30);
  const n = dab(L, 10, 10, 2, 1);
  check('a dab paints a round blob', n >= 9 && n <= 16 && L.px[10 * 40 + 10] === 1 && L.px[10 * 40 + 13] === 0, `${n} pixels`);
  clear(L); stroke(L, 2, 5, 37, 25, 1, 3);
  let gaps = 0;
  for (let k = 0; k <= 50; k++) { const x = Math.floor(2 + 35 * k / 50), y = Math.floor(5 + 20 * k / 50); let near = false; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (L.px[(y + dy) * 40 + x + dx] === 3) near = true; if (!near) gaps++; }
  check('a quick stroke is one unbroken line', !gaps, `${gaps} gaps`);
  clear(L); const sq = dab(L, 20, 15, 3, 5, { square: true }), rd = makeLayer(40, 30), r = dab(rd, 20, 15, 3, 5);
  check("the roller's dab is square (more than a round one the same size)", sq > r && sq === 36, `${sq} vs ${r}`);
  clear(L); dab(L, 0, 0, 4, 2); dab(L, 39, 29, 4, 2);
  check('painting off the edge is fine (nothing spills round)', painted(L) > 0 && L.px[0] === 2 && L.px[29 * 40 + 39] === 2 && L.px[29 * 40] === 0);
}

// 3. the spray can: dots, thicker in the middle, never solid
{
  const L = makeLayer(60, 60), rnd = seeded(3);
  for (let i = 0; i < 20; i++) spray(L, 30, 30, 12, 7, 14, rnd);
  let mid = 0, edge = 0;
  for (let j = 0; j < 60; j++) for (let i = 0; i < 60; i++) if (L.px[j * 60 + i]) { const d = Math.hypot(i + 0.5 - 30, j + 0.5 - 30); if (d < 6) mid++; else if (d < 12) edge++; }
  check('the spray can scatters dots, thickest in the middle, not a solid blob', mid / (Math.PI * 36) > edge / (Math.PI * 108) && painted(L) < Math.PI * 144 * 0.8 && painted(L) > 60, `${painted(L)} dots`);
}

// 4. the bucket: fills exactly the patch you press on, up to its edges
{
  const L = makeLayer(30, 20);
  for (let y = 0; y < 20; y++) L.px[y * 30 + 15] = 12;   // a black line down the middle
  const n = fill(L, 5, 5, 6);
  check('the bucket fills the whole patch you press on, and stops at its edges', n === 15 * 20 && L.px[5 * 30 + 20] === 0 && L.px[0] === 6 && L.px[19 * 30 + 14] === 6, `${n} pixels`);
  check('...filling it the same colour again does nothing', fill(L, 3, 3, 6) === 0);
  const C = makeLayer(30, 20), n2 = fill(C, 2, 2, 4, { clip: { x0: 0, y0: 0, x1: 10, y1: 10 } });
  check("...and on a box, stays on the side it's poured on", n2 === 100 && C.px[10] === 0 && C.px[10 * 30] === 0);
  const big = makeLayer(240, 216), t0 = performance.now(); fill(big, 100, 100, 3);
  check('...quickly, even a whole floor', painted(big) === 240 * 216 && performance.now() - t0 < 50, `${(performance.now() - t0).toFixed(1)} ms`);
}

// 5. the stamps: each the right way up, every letter a paint, about the size of a hand on a wall
{
  const bad = Object.entries(STAMPS).filter(([, s]) => s.pic.some(r => r.length !== s.pic[0].length) || s.pic.some(r => [...r].some(ch => ch !== '.' && !PAINTS[s.key[ch]])));
  check('every stamp is a neat picture in the paints', !bad.length, bad.map(([k]) => k).join());
  check('...between 10 and 16 dots across (about half a metre on a wall)', Object.values(STAMPS).every(s => s.pic[0].length >= 10 && s.pic[0].length <= 16));
  const L = makeLayer(30, 30), pic = ['K..', '...', '...'];
  stamp(L, 15, 15, pic, { K: 12 });
  check('a stamp comes out the right way up (its top row at the top)', L.px[16 * 30 + 14] === 12 && L.px[14 * 30 + 14] === 0 && painted(L) === 1);
  const P = makeLayer(10, 10); stamp(P, 5, 5, SADIE_PAW, {}, 1, { tint: 10 });
  check("Sadie's paw print is in whatever she stepped in", painted(P) === SADIE_PAW.join('').split('X').length - 1 && P.px.every(v => v === 0 || v === 10));
}

// 6. keeping it: a bare wall is tiny; anything comes back exactly; a save of another size is refused
{
  const L = makeLayer(240, 96);
  check('a bare wall keeps in a few dozen bytes', encode(L).length < 60, `${encode(L).length} bytes`);
  const rnd = seeded(9);
  for (let i = 0; i < 40; i++) stroke(L, rnd() * 240, rnd() * 96, rnd() * 240, rnd() * 96, 1 + rnd() * 4, 1 + Math.floor(rnd() * 14));
  for (let i = 0; i < 30; i++) spray(L, rnd() * 240, rnd() * 96, 8, 1 + Math.floor(rnd() * 14), 40, rnd);
  stamp(L, 50, 50, STAMPS.clyde.pic, STAMPS.clyde.key);
  const text = encode(L), back = makeLayer(240, 96);
  check('a well painted wall comes back exactly as it was', decode(back, text) && back.px.every((v, i) => v === L.px[i]), `${text.length} bytes`);
  check('...and keeps in well under one byte a pixel', text.length < 240 * 96, `${text.length} bytes`);
  const noisy = makeLayer(240, 96); for (let i = 0; i < noisy.px.length; i++) noisy.px[i] = 1 + Math.floor(rnd() * 14);
  const nt = encode(noisy), nb = makeLayer(240, 96);
  check('...even a wall of random dots comes back exactly', decode(nb, nt) && nb.px.every((v, i) => v === noisy.px[i]));
  const solid = makeLayer(240, 216); solid.px.fill(4); const st = encode(solid), sb = makeLayer(240, 216);
  check('...and a whole floor in one colour is tiny', decode(sb, st) && sb.px.every(v => v === 4) && st.length < 20, `${st.length} bytes`);
  const other = makeLayer(100, 96);
  check('a save from a wall of another size is refused (left bare)', !decode(other, text) && painted(other) === 0);
  check('...and so is nonsense', !decode(other, '%%%') && !decode(other, btoa('\xff\xff')));
  // the whole room, every surface covered in spray-can dots: the worst it can be
  const room = [[240, 96], [240, 96], [216, 96], [216, 96], [240, 216], [240, 216]];
  let total = 0;
  for (const [w, h] of room) { const R = makeLayer(w, h); for (let i = 0; i < R.px.length; i++) R.px[i] = rnd() < 0.5 ? 0 : 1 + Math.floor(rnd() * 14); total += encode(R).length; }
  check('the whole room covered in dots still fits easily in the browser (under 400 KB)', total < 400000, `${Math.round(total / 1000)} KB`);
}

// 7. what's on offer: a pot for every paint and the rainbow; the tools; what you start with
check('a pot for every paint, and RAINBOW', POTS.length === PAINTS.length && POTS.slice(0, -1).every((p, i) => p.paint === i + 1) && POTS.at(-1).paint === 'rainbow');
check('...the rainbow goes through bright paints', RAINBOW.every(i => PAINTS[i]) && RAINBOW.length >= 6);
check('the tools: brush, roller, spray can, bucket, every stamp, and the dynamite',
  ['brush', 'roller', 'spray', 'bucket', 'dynamite', ...Object.keys(STAMPS).map(k => 'stamp-' + k)].every(id => TOOLS.some(t => t.id === id)) && new Set(TOOLS.map(t => t.id)).size === TOOLS.length);
check('...every name fits a label (the 3x5 font, upper case)', TOOLS.every(t => /^[A-Z' ]+$/.test(t.name) && t.name.length <= 20) && POTS.every(p => /^[A-Z ]+$/.test(p.name)));
check('you start with the brush, in red', START.tool === 'brush' && START.paint === 1);

// 8. every sound: soft, 8-bit, fading right down to nothing, no click (RULEBOOK.md section 4); and
// painting itself has no sound at all. (No length limit: the owner said it isn't one of theirs.)
for (const [name, make] of Object.entries(ALL)) {
  const a = make(), recorded = /^woo/.test(name);   // (Chooter's woo is a recording, not 8-bit)
  let peak = 0; for (const v of a) peak = Math.max(peak, Math.abs(v));
  check(`the ${name}: ${recorded ? '' : '8-bit, '}soft, fading to nothing, no click`,
    (recorded || a.every(v => Math.abs(Math.round(v * 127) - v * 127) < 1e-3)) && peak > 0.08 && peak <= 0.5 &&
    a.slice(-5).every(v => Math.abs(v) < 0.02) && Math.abs(a[0]) < 0.05, `peak ${peak.toFixed(2)}, ${(a.length / RATE).toFixed(2)} s`);
}
check('no sound for painting (brush, roller, spray): only one-off blips', !Object.keys(ALL).some(k => /brush|roll|spray|stroke|hiss/.test(k)));

// a box takes paint on every side: a press on each side finds that side (it once found only the first)
{
  const S = makeSurfaces({ psx: () => new MeshBasicMaterial(), keep: t => t }), scene = new Scene();
  const b = boxGeometry(1, 1, 1, 10), s = S.surface('box', b.w, b.h, 10, () => [255, 255, 255], { cells: b.cells });
  const box = new Mesh(b.geometry); scene.add(box); S.paintOn(s, box);
  scene.updateMatrixWorld();
  const parts = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]].map(d => {
    const h = S.hit(scene, { origin: new Vector3(...d).multiplyScalar(3), dir: new Vector3(...d).negate() });
    if (h) S.tools.dab(h, 0.3, 2);
    return h?.part;
  });
  check('a box takes paint on all six sides, each on its own', new Set(parts).size === 6 && painted(s.L) > 6 * 4, `sides ${parts.join(' ')}`);
}

finish();

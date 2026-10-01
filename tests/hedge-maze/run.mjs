// The hedge maze's headless checks: the maze made as you walk (grow.js) and its music (music.js).
// Run in Node, seeded, in a second or two.
//
//   node tests/hedge-maze/run.mjs
import { makeMaze, S, DI, DJ } from '../../src/activities/hedge-maze/grow.js';
import { makeComposer, SCALES } from '../../src/activities/hedge-maze/music.js';
import card from '../../src/activities/hedge-maze/card.js';

let failed = 0;
function check(name, ok, detail) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  (' + detail + ')' : ''}`);
  if (!ok) failed++;
}
function seeded(a) { return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const back = d => (d + 2) % 4;
const cellAt = (mz, i, j) => mz.cells.get(i + ',' + j);

// Every made cell's open sides lead to a made cell that's open back (no holes in the hedges, nothing
// open on one side only), and no gate opens onto anything.
function sound(mz) {
  for (const c of mz.cells.values()) {
    if (c.kind !== 'built') continue;
    for (let d = 0; d < 4; d++) if (c.open[d]) {
      const n = cellAt(mz, c.i + DI[d], c.j + DJ[d]);
      if (!n || !n.open[back(d)] || n.kind === 'shut') return `cell ${c.i},${c.j} open ${d} onto ${n ? n.kind : 'nothing'}`;
    }
  }
  for (const g of mz.gates.values()) {
    const c = cellAt(mz, g.i, g.j), b = cellAt(mz, g.i + DI[g.side], g.j + DJ[g.side]);
    if (!c || c.open[g.side] || (b && b.kind !== 'shut')) return `gate ${g.key} is wrong`;
  }
  return '';
}
// You, walking: in by a door, finding the way through the way a person would (every corridor in
// turn, a dead end and back), the maze made around you as you go. Returns the way you took to the
// end (cells), or null if there's no end to be found.
function solve(mz, name) {
  mz.enter(name);
  const sp = mz.gateSpot(mz.doors[name]);
  const start = mz.at(sp.x + DI[sp.dir] * 1, sp.z + DJ[sp.dir] * 1);
  const seen = new Set([start]), from = new Map(), todo = [start];
  let visits = 0;
  while (todo.length && visits < 5000) {
    const c = todo.pop(); visits++;
    mz.walk(c.i * S, c.j * S);
    if (mz.live?.end && [...mz.gates.values()].some(g => g.key === mz.live.end && g.i === c.i && g.j === c.j)) {
      const way = [c]; let x = c; while (from.has(x)) { x = from.get(x); way.unshift(x); }
      return [{ i: start.i - DI[sp.dir], j: start.j - DJ[sp.dir] }, ...way];   // (from just outside the gate)
    }
    for (let d = 0; d < 4; d++) if (c.open[d]) {
      const n = cellAt(mz, c.i + DI[d], c.j + DJ[d]);
      if (n && n.kind === 'built' && !seen.has(n)) { seen.add(n); from.set(n, c); todo.push(n); }
    }
  }
  return null;
}
const corners = way => { let n = 0; for (let k = 2; k < way.length; k++) { const a = [way[k - 1].i - way[k - 2].i, way[k - 1].j - way[k - 2].j], b = [way[k].i - way[k - 1].i, way[k].j - way[k - 1].j]; if (a[0] !== b[0] || a[1] !== b[1]) n++; } return n; };
// what can be seen of the maze from just outside a gate, to its first corner (the cells and their sides)
function view(mz, k) {
  const g = mz.gates.get(k), h = back(g.side), out = [];
  let c = cellAt(mz, g.i, g.j);
  for (;;) {
    out.push(`${c.i},${c.j}:${c.open.map(Number).join('')}`);
    if ([0, 1, 2, 3].some(d => c.open[d] && d !== h && d !== back(h))) break;
    const n = c.open[h] && cellAt(mz, c.i + DI[h], c.j + DJ[h]);
    if (!n) break;
    c = n;
  }
  return out.join(' ');
}

// 1. the card: in the grounds beside the house, not a door on the landing or a plot along the lane
check('the card puts the maze in the grounds beside the house (not a door on the landing, not a plot)', card.grounds === 0 && card.slot === undefined && card.lot === undefined && typeof card.room === 'function');

// 2. a new maze, from the front arch: turns after turn, the end after 5 to 8 corners, and the
// backyard's door moves to the end
{
  const counts = new Set(), bad = [], moved = [];
  for (let seed = 1; seed <= 300; seed++) {
    const mz = makeMaze(seeded(seed));
    const way = solve(mz, 'door');
    const K = mz.live?.K;
    if (!way) { bad.push(`seed ${seed}: no way through`); continue; }
    const n = corners(way);
    counts.add(K);
    // (the way you went: K corners on the way through, then the corner onto the end; a dead end
    // walked into and out of isn't on it)
    if (n !== K + 1) bad.push(`seed ${seed}: ${n} corners for K ${K}`);
    const s = sound(mz); if (s) bad.push(`seed ${seed}: ${s}`);
    if (mz.doors.back !== mz.live.end) moved.push(seed);
  }
  check('from the front arch, every maze has a way through, with 5 to 8 corners before the corner onto the end', !bad.length, bad.slice(0, 3).join('; ') || `K seen: ${[...counts].sort().join(', ')}`);
  check('...every number from 5 to 8 turns up', [5, 6, 7, 8].every(k => counts.has(k)));
  check('...and once the end is made, the backyard door is there', !moved.length, moved.slice(0, 5).join(', '));
}

// 3. it's made as you go: only a little way ahead of where you are, and what's made stays made
{
  const mz = makeMaze(seeded(42), 8);
  const before = [...mz.cells.values()].filter(c => c.kind === 'built').length;
  mz.enter('door');
  const sp = mz.gateSpot(mz.doors.door);
  const snap = new Map([...mz.cells.values()].filter(c => c.kind === 'built' && Math.abs(c.i * S - sp.x) < 400).map(c => [c.i + ',' + c.j, c.open.join()]));
  const way = solve(mz, 'door');
  const after = [...mz.cells.values()].filter(c => c.kind === 'built').length;
  const changed = [...snap].filter(([k, o]) => { const c = mz.cells.get(k); return !c || c.open.join() !== o; });
  check('at first only the corridors near each door are made', before < 40, `${before} cells`);
  check('...more as you walk, and what was made stays as it was', after > before && !changed.length && way, `${after} cells, ${changed.length} changed`);
}

// 4. leaving by the backyard gate and turning round: what you can see is just as you left it, and
// past its first corner it's a new maze, whose end is the backyard's gate again (the sneaky bit)
{
  const bad = [];
  for (let seed = 1; seed <= 200; seed++) {
    const mz = makeMaze(seeded(seed * 7 + 3));
    if (!solve(mz, 'door')) { bad.push(`seed ${seed}: no way through the first`); continue; }
    const k = mz.doors.back, seen = view(mz, k);
    const old = new Set([...mz.cells.values()].filter(c => c.kind === 'built').map(c => c.i + ',' + c.j + ':' + c.open.join()));
    mz.leave('back');
    if (mz.doors.back !== k || view(mz, k) !== seen) { bad.push(`seed ${seed}: the view from the gate changed`); continue; }
    const way = solve(mz, 'back');
    if (!way) { bad.push(`seed ${seed}: no way through from the back`); continue; }
    const fresh = way.slice(1).filter(c => !old.has(c.i + ',' + c.j + ':' + c.open.join())).length;
    if (fresh < 4) bad.push(`seed ${seed}: not a new maze (${fresh} of ${way.length} new)`);
    if (mz.doors.back !== mz.live.end || mz.doors.back === k) bad.push(`seed ${seed}: the end isn't the backyard's gate`);
    if (corners(way) !== mz.live.K + 1) bad.push(`seed ${seed}: ${corners(way)} corners for K ${mz.live.K}`);
    const s = sound(mz); if (s) bad.push(`seed ${seed}: ${s}`);
    // and out the back again, and in by the front: the front's maze is all there, somewhere else
    mz.leave('back');
    if (!solve(mz, 'door')) bad.push(`seed ${seed}: no way through from the front after`);
  }
  check('leaving by the backyard gate, the view back in is just as it was; past the first corner a new maze, whose end is the backyard gate again', !bad.length, bad.slice(0, 3).join('; '));
}

// 5. in at the front, back out of the front: the bit you can see stays, the rest is new; and the two
// doors' mazes never meet
{
  const bad = [];
  for (let seed = 1; seed <= 100; seed++) {
    const mz = makeMaze(seeded(seed * 13));
    mz.enter('door');
    const sp = mz.gateSpot(mz.doors.door);
    for (let n = 0; n < 6; n++) mz.walk(sp.x + DI[sp.dir] * S * n, sp.z + DJ[sp.dir] * S * n);
    const seen = view(mz, mz.doors.door);
    mz.leave('door');
    if (view(mz, mz.doors.door) !== seen) bad.push(`seed ${seed}: the front view changed`);
    const rf = mz.regionOf(mz.gates.get(mz.doors.door).i), rb = mz.regionOf(mz.gates.get(mz.doors.back).i);
    if (rf === rb) bad.push(`seed ${seed}: both doors in one region`);
    if (!solve(mz, 'door')) bad.push(`seed ${seed}: no way through`);
  }
  check('in and back out of the front: the view stays, the maze past it is new, and the doors\' mazes never meet', !bad.length, bad.slice(0, 3).join('; '));
}

// 6. you can't see the end being made, or the door moving: the end's made two corners ahead
{
  const mz = makeMaze(seeded(5), 5);
  mz.enter('door');
  const way = solve(mz, 'door');
  const g = mz.gateSpot(mz.live.end);
  const sawIt = way.slice(0, -4).filter(c => mz.sees(c.i * S, c.j * S, g.x, g.z)).length;
  check('the end can\'t be seen until you\'re nearly there', way && sawIt === 0, `seen from ${sawIt} cells`);
}

// 7. the music: soft, in key, never the same twice, with quiet between pieces, and no drones
{
  const C = makeComposer(seeded(9));
  const notes = []; let quiet = 0;
  const pieces = new Set();
  while (!notes.length || notes[notes.length - 1].at < 3600) {
    const n = C.next();
    if (notes.length) quiet = Math.max(quiet, n.at - notes[notes.length - 1].at);
    notes.push(n); pieces.add(n.piece);
  }
  const long = notes.filter(n => n.len > 2.5), loud = notes.filter(n => n.vel > 0.6);
  const offKey = notes.filter(n => !SCALES[n.scale].includes(((n.midi - n.root) % 12 + 12) % 12));
  // no 8 notes in a row ever come round again, in an hour
  const runs = new Set(); let again = 0;
  for (let k = 8; k < notes.length; k++) { const r = notes.slice(k - 8, k).map(n => n.midi + ':' + n.len.toFixed(2)).join(' '); if (runs.has(r)) again++; runs.add(r); }
  const busy = []; for (let k = 0; k + 6 < notes.length; k++) if (notes[k + 6].at - notes[k].at < 1.2) busy.push(k);
  check('the maze music: an hour of it, a new piece every so often with a quiet moment between', pieces.size > 20 && quiet >= 4, `${pieces.size} pieces, longest quiet ${quiet.toFixed(1)} s`);
  check('...every note in its key, soft, and short (no held notes or drones)', !offKey.length && !loud.length && !long.length, `${offKey.length} off key, ${loud.length} loud, ${long.length} long`);
  check('...gentle (never a flurry of notes)', !busy.length, `${busy.length} flurries`);
  check('...and never the same eight notes twice', !again, `${again} repeats`);
}

console.log(failed ? `\n${failed} FAILED` : '\nall passed');
process.exit(failed ? 1 : 0);

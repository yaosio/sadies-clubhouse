// The maze itself, as plain numbers (no three.js, no browser: the tests run it). It's made in front of
// you as you walk: a grid of square cells, S metres across, each a bit of corridor with hedges on
// the sides that don't lead anywhere. Corridors are runs of cells; where one ends it turns (left,
// right, or both ways), or stops dead.
//
// How it's made, so it always works:
//   - Only the corridor you're in, the ones it turns into, and the ones those turn into are ever
//     made (two corners ahead), so nothing is made where you can see it. What's made stays made: walk
//     back and it's all still there.
//   - The real way through always heads on (`fwd`, the way you walked in) or sideways, never back, so
//     it can't wall itself in. Each corner you turn on it counts one; after K (5 to 8) the next corner
//     you turn is the end, a short stretch with a garden gate at the end of it. Side turns that aren't
//     the way through are short dead ends (only ever heading sideways or back, so they never get in
//     its way).
//   - A gate is a door out (`doors`: `door`, the front arch, and `back`, the backyard's). The end's
//     gate is always the backyard's, wherever you came in: when the end's made, the backyard's door
//     moves there (only while you can't see either spot).
//   - Leaving by a gate, the bit of corridor you can see from it (to its first corner) stays just as
//     it was, and everything past that corner is forgotten and made again, new (reset): turn round
//     and walk back in, and it looks just as you left it, but it's a new maze.
//   - Each door's maze is in a region of its own, far from the other's (REGION cells apart), so they
//     never meet; three regions are enough, and they're used again.
export const S = 3;                                 // a cell, in metres
export const DI = [0, 1, 0, -1], DJ = [1, 0, -1, 0];   // the four ways: 0 +z, 1 +x, 2 -z, 3 -x
const REGION = 400;                                 // cells between regions
const key = (i, j) => i + ',' + j;
const back = d => (d + 2) % 4;

// the edge between a cell and its neighbour that way (the same key from either side)
export function edgeKey(i, j, d) {
  if (d === 0) return `h${i},${j + 1}`; if (d === 2) return `h${i},${j}`;
  if (d === 1) return `v${i + 1},${j}`; return `v${i},${j}`;
}

export function makeMaze(rng = Math.random, turns = null) {
  const int = (a, b) => a + Math.floor(rng() * (b - a + 1));
  const cells = new Map();     // key -> { i, j, open: [4], kind: 'built' | 'held' (an exit's first cell) | 'shut' (behind a gate), seg }
  const gates = new Map();     // edge key -> { key, i, j, side } (the cell inside, and which side of it the gate's on)
  const roots = new Map();     // gate key -> the maze that starts there
  const doors = { door: null, back: null };
  let live = null;             // the maze you're in (null: you're not)
  let changed = true;          // (the room draws the hedges again when this is set)

  const cell = (i, j) => cells.get(key(i, j));
  const free = (i, j) => !cells.has(key(i, j));
  const regionOf = i => Math.round(i / REGION);
  function hold(i, j, kind = 'held') { const c = { i, j, open: [false, false, false, false], kind, seg: null }; cells.set(key(i, j), c); return c; }
  function join(c, d) { c.open[d] = true; const n = cell(c.i + DI[d], c.j + DJ[d]); if (n) n.open[back(d)] = true; }
  function gate(c, side) {
    const k = edgeKey(c.i, c.j, side);
    gates.set(k, { key: k, i: c.i, j: c.j, side });
    if (free(c.i + DI[side], c.j + DJ[side])) hold(c.i + DI[side], c.j + DJ[side], 'shut');
    changed = true;
    return k;
  }
  // can a gate go on that side of c? (nothing behind it)
  const gateable = (c, side) => free(c.i + DI[side], c.j + DJ[side]) || cell(c.i + DI[side], c.j + DJ[side]).kind === 'shut';

  // ---------- a corridor ----------
  // `first`: its first cell (held for it when its parent turned this way). kind: 'live' (the way
  // through), 'dead' (a dead end) or 'end' (the last stretch, to the gate).
  function corridor(tree, first, dir, depth, kind, parent, deadDepth = 0) {
    const s = { tree, dir, depth, kind, parent, deadDepth, cells: [first], exits: [] };
    first.kind = 'built'; first.seg = s;
    const want = kind === 'end' ? 1 + (rng() < 0.4 ? 1 : 0) : kind === 'dead' ? int(1, 3) : !parent ? int(2, 3) : dir === tree.fwd ? int(1, 3) : int(2, 5);
    let c = first;
    while (s.cells.length < want) {
      const ni = c.i + DI[dir], nj = c.j + DJ[dir];
      if (!free(ni, nj)) break;
      // (an end stretch stops while there's still room for its gate)
      if (kind === 'end' && !free(ni + DI[dir], nj + DJ[dir])) break;
      const n = hold(ni, nj, 'built'); n.seg = s; join(c, dir); s.cells.push(n); c = n;
    }
    turnings(s);
    changed = true;
    return s;
  }
  // where a corridor turns at its end, holding each way's first cell
  function turnings(s) {
    const J = s.cells[s.cells.length - 1], t = s.tree, side = [(s.dir + 1) % 4, (s.dir + 3) % 4];
    const ok = d => free(J.i + DI[d], J.j + DJ[d]);
    const exit = (d, kind) => { const n = hold(J.i + DI[d], J.j + DJ[d]); join(J, d); s.exits.push({ dir: d, kind, cell: n, child: null }); };
    if (rng() < 0.5) side.reverse();
    if (s.kind === 'end') {
      // the gate at its end (straight on if there's room, else to one side)
      const at = [s.dir, ...side].find(d => gateable(J, d));
      t.end = gate(J, at ?? s.dir);
      return;
    }
    if (s.kind === 'dead') {
      // now and then a dead end turns once more first (never on the way through's way)
      const d = side.find(d => d !== t.fwd && ok(d));
      if (s.deadDepth < 1 && d !== undefined && rng() < 0.35) exit(d, 'dead');
      return;
    }
    // the way through: after K corners, the next corner is the end
    if (s.depth >= t.K) {
      const d = [...side, s.dir].find(d => d !== back(t.fwd) && ok(d) && endRoom(J, d)) ?? [...side, s.dir].find(ok);
      if (d !== undefined) exit(d, 'end'); else t.end = gate(J, [0, 1, 2, 3].find(d => gateable(J, d)) ?? s.dir);
      return;
    }
    // heading on: turn sideways (one way, or both: the other a dead end). Heading sideways: turn
    // back to heading on (and perhaps the other way, a dead end)
    const on = s.dir === t.fwd ? side : [t.fwd];
    const way = on.find(ok) ?? [...side, s.dir].find(d => d !== back(t.fwd) && ok(d));
    if (way === undefined) { t.end = gate(J, [0, 1, 2, 3].find(d => gateable(J, d)) ?? s.dir); return; }   // (never happens: but never stuck)
    exit(way, 'live');
    const other = s.dir === t.fwd ? side.find(d => d !== way) : back(t.fwd);
    if (other !== undefined && ok(other) && rng() < (s.dir === t.fwd ? 0.55 : 0.35)) exit(other, 'dead');
  }
  // room for an end stretch that way (its cell, and somewhere for the gate)
  const endRoom = (J, d) => { const i = J.i + DI[d], j = J.j + DJ[d]; return [0, 1, 2, 3].some(g => g !== back(d) && free(i + DI[g], j + DJ[g])); };

  // make the corridors `levels` corners on from s (if they aren't made yet)
  function grow(s, levels = 2) {
    if (!s || levels <= 0) return;
    for (const e of s.exits) {
      if (!e.child) e.child = corridor(s.tree, e.cell, e.dir, s.depth + (e.kind === 'dead' ? 0 : 1), e.kind, s, e.kind === 'dead' ? (s.kind === 'dead' ? s.deadDepth + 1 : 0) : 0);
      grow(e.child, levels - 1);
    }
  }

  // ---------- a new maze ----------
  function newTree(fwd) { return { K: turns ?? int(5, 8), fwd, end: null, root: null }; }
  // somewhere fresh, in a region nobody's using: a gate, and the corridor in from it
  function fresh() {
    const used = new Set([doors.door, doors.back].filter(k => gates.has(k)).map(k => regionOf(gates.get(k).i)));
    const r = [-1, 0, 1].find(r => !used.has(r));
    forget(r);
    const t = newTree(0), first = hold(r * REGION, 0);
    const k = gate(first, 2);
    t.root = corridor(t, first, 0, 0, 'live', null);
    roots.set(k, t);
    grow(t.root);
    return k;
  }
  // Start again from a gate: the bit you can see from it (to its first corner) stays as it is, and
  // everything else in its region is forgotten; past that corner, a new maze.
  function reset(k) {
    const g = gates.get(k), h = back(g.side);
    let c = cell(g.i, g.j);
    const kept = [c];
    for (;;) {
      if ([0, 1, 2, 3].some(d => c.open[d] && d !== h && d !== back(h))) break;   // a corner
      const n = c.open[h] && cell(c.i + DI[h], c.j + DJ[h]);
      if (!n || n.kind !== 'built') break;
      c = n; kept.push(c);
    }
    const J = c, ways = [0, 1, 2, 3].filter(d => J.open[d] && d !== back(h) && d !== g.side);
    const behind = cell(g.i + DI[g.side], g.j + DJ[g.side]);
    const keep = new Set([...kept, behind]);
    for (const [ck, x] of cells) if (regionOf(x.i) === regionOf(g.i) && !keep.has(x)) cells.delete(ck);
    for (const [gk] of [...gates]) if (gk !== k && regionOf(gates.get(gk).i) === regionOf(g.i)) { gates.delete(gk); roots.delete(gk); }
    roots.delete(k);
    const t = newTree(h), s = { tree: t, dir: h, depth: 0, kind: 'live', parent: null, deadDepth: 0, cells: kept, exits: [] };
    for (const x of kept) { x.seg = s; x.open = [false, false, false, false]; }
    for (let n = 1; n < kept.length; n++) join(kept[n - 1], h);
    // its corner's ways, as they were (they can be seen): one is the way through (sideways if it
    // can), any other a dead end
    const order = ways.filter(d => d !== h).sort(() => rng() - 0.5);
    if (ways.includes(h)) order.push(h);
    order.forEach((d, n) => { const x = hold(J.i + DI[d], J.j + DJ[d]); join(J, d); s.exits.push({ dir: d, kind: n ? 'dead' : 'live', cell: x, child: null }); });
    if (!s.exits.length) turnings(s);
    t.root = s;
    roots.set(k, t);
    grow(s);
    changed = true;
  }
  // forget everything in a region
  function forget(r) {
    for (const [ck, x] of cells) if (regionOf(x.i) === r) cells.delete(ck);
    for (const [gk, g] of gates) if (regionOf(g.i) === r) { gates.delete(gk); roots.delete(gk); }
    changed = true;
  }

  // ---------- where things are ----------
  const at = (x, z) => cell(Math.round(x / S), Math.round(z / S));
  // a gate's middle, and the way you face walking in through it
  function gateSpot(k) {
    const g = gates.get(k); if (!g) return null;
    const x = g.i * S + DI[g.side] * S / 2, z = g.j * S + DJ[g.side] * S / 2, d = back(g.side);
    return { x, z, yaw: Math.atan2(DI[d], DJ[d]), dir: d };
  }
  // can you see from (x0, z0) to (x1, z1)? (no hedge in the way: only open edges crossed)
  function sees(x0, z0, x1, z1) {
    const n = Math.ceil(Math.hypot(x1 - x0, z1 - z0) / 0.2);
    let ci = Math.round(x0 / S), cj = Math.round(z0 / S);
    for (let k = 1; k <= n; k++) {
      const x = x0 + (x1 - x0) * k / n, z = z0 + (z1 - z0) * k / n, i = Math.round(x / S), j = Math.round(z / S);
      if (i === ci && j === cj) continue;
      const step = (a, d) => a && a.open[d] && cell(a.i + DI[d], a.j + DJ[d]);
      const di = i - ci, dj = j - cj, c = cell(ci, cj);
      const dx = di > 0 ? 1 : 3, dz = dj > 0 ? 0 : 2;
      let ok;
      if (di && dj) ok = step(step(c, dx), dz) || step(step(c, dz), dx);
      else ok = step(c, di ? dx : dz);
      if (!ok) return false;
      ci = i; cj = j;
    }
    return true;
  }

  // ---------- you, coming and going ----------
  // You came in by a door: that's the maze you're in.
  function enter(name) { live = roots.get(doors[name]) || null; }
  // You left by a door: it's started again from there, and if the other door was in the same region
  // (forgotten just now), it's somewhere fresh.
  function leave(name) {
    live = null;
    const other = name === 'door' ? 'back' : 'door', k = doors[name];
    if (!gates.has(k)) { doors[name] = fresh(); return; }
    const same = doors[other] && gates.has(doors[other]) && regionOf(gates.get(doors[other]).i) === regionOf(gates.get(k).i);
    reset(k);
    if (same || !gates.has(doors[other])) doors[other] = fresh();
  }
  // Every frame you're in it, where you are: the corridors two corners ahead are made, and once the
  // end is, the backyard's door goes there (when you can't see where it is or where it's going).
  function walk(x, z) {
    const c = at(x, z);
    if (c?.seg) grow(c.seg);
    if (!live?.end || doors.back === live.end) return;
    const was = gateSpot(doors.back), to = gateSpot(live.end);
    if (!to) return;
    const seen = p => p && Math.hypot(p.x - x, p.z - z) < 400 && sees(x, z, p.x - DI[back(p.dir)] * 0.01, p.z - DJ[back(p.dir)] * 0.01);
    if (seen(was) || seen(to)) return;
    const old = doors.back;
    doors.back = live.end;
    changed = true;
    if (gates.has(old) && regionOf(gates.get(old).i) !== regionOf(gates.get(live.end).i) && regionOf(gates.get(old).i) !== regionOf(gates.get(doors.door).i)) forget(regionOf(gates.get(old).i));
  }

  // (for the checks) the next step on the way through from where you are: the middle of the next
  // cell, or the end's gate once you're at it; null off the way through
  function ahead(x, z) {
    const c = at(x, z), s = c?.seg;
    if (!s || s.kind === 'dead') return null;
    const n = s.cells.indexOf(c);
    if (n < s.cells.length - 1) return { x: s.cells[n + 1].i * S, z: s.cells[n + 1].j * S };
    if (s.kind === 'end') { const g = gateSpot(s.tree.end); return g && { x: g.x, z: g.z, gate: true }; }
    const e = s.exits.find(e => e.kind !== 'dead');
    return e ? { x: e.cell.i * S, z: e.cell.j * S } : null;
  }

  doors.door = fresh(); doors.back = fresh();
  return {
    cells, gates, doors, at, gateSpot, sees, enter, leave, walk, ahead,
    get live() { return live; },
    // has anything changed since the room last drew the hedges? (and noted as drawn)
    changed() { const c = changed; changed = false; return c; },
    // the way through, from a door to the end (for the checks): cells, corners turned
    regionOf,
  };
}

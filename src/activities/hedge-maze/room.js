// Inside the hedge maze: corridors of clipped hedge under an open sky, made in front of you as you
// walk (grow.js decides where they go; this draws them), with a garden gate at each way out. Soft
// music plays while you're in it (music.js).
//
// The mansion calls buildRoom(m) with its building kit, the outside and this activity's spot in the
// grounds (its card has `grounds`), so the hedge block outside is built here too (block.js). Its two
// gates outside lead to the maze's two doors: `door` (the front arch) and `back` (the backyard's).
// The backyard's door moves (always where the maze's end is, and only while nobody can see it), so
// the end always lets you out into the backyard, whichever way you came in.
//
// Nothing's saved: it's a new maze every time anyway.
import { Scene, Color, Mesh, Group, BoxGeometry, PlaneGeometry, SphereGeometry } from 'three';
import { makeMaze, S, DI, DJ } from './grow.js';
import { buildBlock, DW, DH, TRIM } from './block.js';
import { drawArt } from './art.js';
import { makeMusic } from './music.js';
import { soundsFor } from '../../shared/sound.js';

const HH = 2.6, HT = 0.25, P = 0.35;   // the hedges: how tall, half how thick; and you, how far round
const GROUND = 800;                     // the grass under each door's maze (they're far apart)

export async function buildRoom(m) {
  const { T, psx, keep, doorway, skyMat, card } = m;
  const A = drawArt(m);
  // (built again after being put away, the block outside is still there: the mansion hands it back)
  const house = m.house || (m.outside && m.ground ? buildBlock(m, A) : null);
  await m.breathe?.();
  const scene = new Scene(); scene.background = new Color(0x2a60e0);
  const mz = makeMaze();

  // ---------- the shapes every bit of hedge is made of (made once, used over and over) ----------
  const L = S - 2 * HT;   // a stretch of hedge between two corner posts
  const geo = {
    wall: keep(new BoxGeometry(L + 0.02, HH, 2 * HT, 2, 2, 1)),
    post: keep(new BoxGeometry(2 * HT + 0.02, HH + 0.02, 2 * HT + 0.02, 1, 2, 1)),
    side: keep(new BoxGeometry((L - DW) / 2 + 0.02, HH, 2 * HT, 1, 2, 1)),
    lintel: keep(new BoxGeometry(DW, HH - DH, 2 * HT, 1, 1, 1)),
    leaf: keep(new PlaneGeometry(DW / 2, DH, 2, 4)),
    jamb: keep(new BoxGeometry(0.12, DH + 0.12, 0.1)), head: keep(new BoxGeometry(DW + 0.24, 0.12, 0.1)),
  };
  const mat = {
    wall: psx(A.hedge, { rx: L / 1.2, ry: HH / 1.2 }), post: psx(A.hedge, { rx: 0.4, ry: HH / 1.2 }),
    side: psx(A.hedge, { rx: 0.4, ry: HH / 1.2 }), lintel: psx(A.hedge, { rx: DW / 1.2, ry: 0.3 }),
    gateL: psx(A.gateL), gateR: psx(A.gateR), trim: psx(null, { tint: TRIM }),
  };
  const mk = (g, mt, x, y, z, parent) => { const o = new Mesh(g, mt); o.position.set(x, y, z); parent.add(o); return o; };

  // a gate in the hedge: the hedge either side of it and over it, and a shut gate (hidden while a
  // door's there instead)
  function gatePiece(k) {
    const sp = mz.gateSpot(k), grp = new Group();
    grp.position.set(sp.x, 0, sp.z); grp.rotation.y = sp.yaw;
    const off = DW / 2 + (L - DW) / 4;
    // (set back behind the gate's line: in front of it, it showed as a dark band over the gate seen
    // from outside)
    for (const s of [-1, 1]) mk(geo.side, mat.side, s * off, HH / 2, -HT - 0.01, grp);
    mk(geo.lintel, mat.lintel, 0, DH + (HH - DH) / 2, -HT - 0.01, grp);
    const shut = new Group(); grp.add(shut);
    for (const s of [-1, 1]) mk(geo.leaf, s < 0 ? mat.gateL : mat.gateR, s * DW / 4, DH / 2, 0, shut);
    for (const s of [-1, 1]) mk(geo.jamb, mat.trim, s * (DW / 2 + 0.06), DH / 2, 0.02, shut);
    mk(geo.head, mat.trim, 0, DH + 0.06, 0.02, shut);
    grp.userData.shut = shut;
    return grp;
  }
  // a stretch of hedge on an edge (`h`: across x, `v`: across z), and a post at a corner
  function wallPiece(k) {
    const [a, b] = k.slice(1).split(',').map(Number), o = new Mesh(geo.wall, mat.wall);
    if (k[0] === 'h') o.position.set(a * S, HH / 2, (b - 0.5) * S);
    else { o.position.set((a - 0.5) * S, HH / 2, b * S); o.rotation.y = Math.PI / 2; }
    return o;
  }
  const postPiece = k => { const [p, q] = k.slice(1).split(',').map(Number), o = new Mesh(geo.post, mat.post); o.position.set((p - 0.5) * S, (HH + 0.02) / 2, (q - 0.5) * S); return o; };

  // ---------- drawing what the maze is now ----------
  // Each time it changes, what should be there is worked out from scratch and compared with what is:
  // new bits are added, gone bits taken away (the shapes are shared, so nothing's made or handed back).
  const shown = new Map();
  function draw() {
    const want = new Set();
    for (const c of mz.cells.values()) {
      if (c.kind !== 'built') continue;
      for (let d = 0; d < 4; d++) {
        if (c.open[d]) continue;
        const ek = edgeOf(c.i, c.j, d);
        want.add((mz.gates.has(ek) ? 'g' : 'w') + ek);
        // its two corners
        if (d === 0 || d === 2) { const q = c.j + (d === 0 ? 1 : 0); want.add(`p${c.i},${q}`); want.add(`p${c.i + 1},${q}`); }
        else { const p = c.i + (d === 1 ? 1 : 0); want.add(`p${p},${c.j}`); want.add(`p${p},${c.j + 1}`); }
      }
    }
    for (const [k, o] of shown) if (!want.has(k)) { scene.remove(o); shown.delete(k); }
    for (const k of want) if (!shown.has(k)) {
      const o = k[0] === 'g' ? gatePiece(k.slice(1)) : k[0] === 'w' ? wallPiece(k.slice(1)) : postPiece(k);
      scene.add(o); shown.set(k, o);
    }
    // the doors, where the maze says (and the shut gate hidden where a door is)
    for (const name of ['door', 'back']) {
      const sp = mz.gateSpot(mz.doors[name]);
      doors[name].moveTo([sp.x, 0, sp.z], sp.yaw);
    }
    for (const [k, o] of shown) if (k[0] === 'g') o.userData.shut.visible = !Object.values(mz.doors).includes(k.slice(1));
    // the grass under each door's maze (centred on its gate, in whole tiles, so it never seems to move)
    const used = new Set();
    for (const name of ['door', 'back']) {
      const sp = mz.gateSpot(mz.doors[name]), r = mz.regionOf(Math.round(sp.x / S)) + 1;
      if (used.has(r)) continue;
      used.add(r);
      if (grounds[r].userData.at !== mz.doors[name]) { grounds[r].position.set(Math.round(sp.x / 6) * 6, 0, Math.round(sp.z / 6) * 6); grounds[r].userData.at = mz.doors[name]; }
    }
  }
  // (the same edge keys grow.js uses)
  const edgeOf = (i, j, d) => d === 0 ? `h${i},${j + 1}` : d === 2 ? `h${i},${j}` : d === 1 ? `v${i + 1},${j}` : `v${i},${j}`;

  // the grass (one per region the doors can be in), and the sky (one for each door to be seen
  // through, following you once you're in)
  const grassMat = psx(T.grass, { rx: GROUND / 2, ry: GROUND / 2 });
  const grassGeo = keep(new PlaneGeometry(GROUND, GROUND, 24, 24));
  const grounds = [0, 1, 2].map(() => { const g = new Mesh(grassGeo, grassMat); g.rotation.x = -Math.PI / 2; g.renderOrder = -2; scene.add(g); return g; });
  const skyGeo = keep(new SphereGeometry(250, 16, 12)), sky = skyMat();
  const skies = [0, 1].map(() => { const s = new Mesh(skyGeo, sky); s.renderOrder = -3; scene.add(s); return s; });

  // the two doors (garden gates, seen from inside), put where the maze says by draw()
  const leaves = [{ front: A.gateR, back: A.gateL }, { front: A.gateL, back: A.gateR }];
  const doors = { door: doorway(scene, { pos: [0, 0, 0], yaw: 0, w: DW, h: DH, leaves, trim: TRIM }), back: doorway(scene, { pos: [0, 0, 0], yaw: 0, w: DW, h: DH, leaves, trim: TRIM }) };
  draw(); mz.changed();
  await m.breathe?.();

  // ---------- walking ----------
  // inside a cell, kept off the hedges on its shut sides, and out of its corners (the posts)
  function floor(x, z) {
    const c = mz.at(x, z);
    if (!c || c.kind !== 'built') return null;
    const lx = x - c.i * S, lz = z - c.j * S, lim = S / 2 - HT - P;
    if ((lx > lim && !c.open[1]) || (lx < -lim && !c.open[3]) || (lz > lim && !c.open[0]) || (lz < -lim && !c.open[2])) return null;
    if (Math.abs(lx) > lim && Math.abs(lz) > lim) return null;
    return 0;
  }

  const h = soundsFor('room:' + card.id), music = makeMusic(h);
  let inside = false, last = null;
  const nearest = (x, z) => Math.hypot(x - doors.door.pos.x, z - doors.door.pos.z) <= Math.hypot(x - doors.back.pos.x, z - doors.back.pos.z) ? 'door' : 'back';
  const place = {
    name: 'room:' + card.id, card, scene, floor, doors, faces: [], uses: [],
    light: { sun: 0.55, bulb: 0, lamp: [0, 60, 0] },
    spots: { start: (() => { const sp = mz.gateSpot(mz.doors.door); return { x: sp.x + DI[sp.dir] * 1.5, z: sp.z + DJ[sp.dir] * 1.5, yaw: sp.yaw + Math.PI, pitch: 0 }; })() },
    house,
    // for the checks (tests/hedge-maze/browser.mjs): the maze itself
    maze: mz,
    update(t, dt) {
      const e = m.ears(), here = e.place === place;
      // coming in by a door: that's the maze you're in; leaving by one: it's started again from there
      if (here && !inside) { mz.enter(nearest(e.x, e.z)); music.play(); }
      if (!here && inside) { mz.leave(nearest(last.x, last.z)); music.stop(); }
      inside = here;
      if (here) { last = { x: e.x, z: e.z }; mz.walk(e.x, e.z); }
      if (mz.changed()) draw();
      music.tick();
      // the sky around you (or, from outside, around the door you might be looking in at)
      if (here) { skies[0].position.set(e.x, 0, e.z); skies[1].position.copy(skies[0].position); }
      else { skies[0].position.copy(doors.door.pos); skies[1].position.copy(doors.back.pos); }
    },
  };
  // for the checks: where the doors are, the maze you're in, and the next step on the way through
  window.__maze = {
    state: () => ({ inside, K: mz.live?.K ?? null, end: mz.live?.end ?? null, doors: { ...mz.doors }, played: music.played(), playing: music.playing,
      at: Object.fromEntries(Object.entries(doors).map(([k, d]) => [k, { x: d.pos.x, z: d.pos.z }])), cells: mz.cells.size, shown: shown.size }),
    ahead: (x, z) => mz.ahead(x, z),
  };
  return place;
}

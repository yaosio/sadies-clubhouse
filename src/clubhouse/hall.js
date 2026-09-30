// The entrance hall: the bottom of the cat tree. A tall hall with sixteen flat walls (round enough,
// in 1996), a giant scratching post up the middle and a spiral staircase round it. Each floor is a
// ring of doors: the first landing has a door per activity (each card's `slot`, 0 where the stairs
// come out; a card without one takes the next free door, so a new activity never moves the others)
// and boarded-up ones for the next; the second landing is still being built.
//
// It doesn't match the outside's size, on purpose: the front door just leads here.
import { Mesh, Group, Scene, Color, Vector3, BoxGeometry, PlaneGeometry, CylinderGeometry, SphereGeometry, TorusGeometry,
  CircleGeometry, RingGeometry, TubeGeometry, CatmullRomCurve3, DoubleSide } from 'three';
import { psx, keep, doorTexture, picture, doorBack } from './look.js';
import { kit, wallGeometry, doorway } from './build.js';

export const R = 8, N = 16, L1 = 4.6, L2 = 9.2, TOP = 13.6;
const A = R * Math.cos(Math.PI / N), FW = 2 * R * Math.sin(Math.PI / N);   // a wall's distance from the middle, and its width
const faceAngle = k => k * 2 * Math.PI / N;                                  // wall k faces the middle from this way round
const STEPS = 22, RISE = L1 / STEPS, TURN = 0.29, TH0 = -2.1, UPPER = 4;    // the staircase (and the first few steps of the next flight)
const THTOP = TH0 + (STEPS - 1) * TURN;
const IN = R - 2.3;                                                          // the landing's inner edge
// which walls on the first landing get doors, in order: starting where the stairs come out
const SLOTS = [10, 11, 9, 12, 13, 7];

export function buildHall(T, cards, doorPictures = []) {
  const scene = new Scene(); scene.background = new Color(0x0a0628);
  const { add, box, plane, cyl, cone } = kit(scene);
  const at = (r, th) => [Math.sin(th) * r, Math.cos(th) * r];

  // ---------- the walls: three storeys of sixteen, some with a hole for a door ----------
  const doors = {}, activityDoors = [];
  // which card has which door: its own slot if it says, else the next free one
  const bySlot = [];
  cards.forEach((c, i) => { if (Number.isInteger(c.slot)) bySlot[c.slot] = i; });
  cards.forEach((c, i) => { if (!Number.isInteger(c.slot)) { let s = 0; while (bySlot[s] !== undefined) s++; bySlot[s] = i; } });
  const wallpaper = psx(T.damask, { rx: 1 / 1.3, ry: 1 / 1.3 }), brick = psx(T.brick, { rx: 1 / 1.2, ry: 1 / 1.2 });
  function wall(k, y0, h, mat, hole) {
    const th = faceAngle(k), [x, z] = at(A, th);
    return add(new Mesh(wallGeometry(FW + 0.02, h, hole?.[0], hole?.[1]), mat), [x, y0, z], [0, th + Math.PI, 0]);
  }
  // a flat thing on wall k, `across` from its middle, facing in
  function onWall(k, w, h, mat, y, across = 0, inset = 0.05) {
    const th = faceAngle(k), [x, z] = at(A - inset, th), c = Math.cos(th), s = Math.sin(th);
    return plane(w, h, mat, [x - c * across, y, z + s * across], [0, th + Math.PI, 0], 2);
  }
  const FRONT = 8;
  for (let k = 0; k < N; k++) {
    wall(k, 0, L1, wallpaper, k === FRONT ? [2.0, 3.0] : null);
    const slot = SLOTS.indexOf(k), ci = bySlot[slot], card = cards[ci];
    wall(k, L1, L2 - L1, wallpaper, card ? [1.5, 2.45] : null);
    wall(k, L2, TOP - L2, brick);
    // the wainscot and its gold rail, round the ground floor (in two pieces either side of the front door)
    const pieces = k === FRONT ? [[-(FW / 2 + 1.0) / 2, FW / 2 - 1.0], [(FW / 2 + 1.0) / 2, FW / 2 - 1.0]] : [[0, FW]];
    for (const [c, w] of pieces) { onWall(k, w, 1.1, psx(T.wainscot, { rx: w / 0.9, ry: 1, decal: true }), 0.55, c, 0.04); onWall(k, w, 0.1, psx(null, { tint: 0xffd23a, decal: true }), 1.12, c, 0.08); }
    if (card) {
      const th = faceAngle(k), [x, z] = at(A, th);
      const pic = doorPictures[ci], tex = pic ? picture(pic) : doorTexture(card);
      const d = doorway(scene, { pos: [x, L1, z], yaw: th + Math.PI, w: 1.5, h: 2.45, leaves: [{ front: tex, back: pic ? doorBack(pic) : tex }], hinge: -1 });
      doors[card.id] = d; activityDoors.push(d);
      onWall(k, 0.36, 0.36, psx(T.catdoor, { decal: true }), L1 + 0.18, 1.05);   // a cat door by every door
    } else if (slot >= 0) {
      onWall(k, 1.5, 2.45, psx(T.boarded, { decal: true, unlit: 0.1 }), L1 + 1.22);
    }
  }
  const [fx, fz] = at(A, faceAngle(FRONT));
  doors.front = doorway(scene, { pos: [fx, 0, fz], yaw: faceAngle(FRONT) + Math.PI, w: 2.0, h: 3.0, leaves: [T.leafR, T.leafL] });   // the same two leaves as outside, seen from the back
  onWall(FRONT, 2.0, 0.45, psx(T.fanlight, { decal: true, unlit: 0.3 }), 3.25);
  onWall(FRONT, 0.36, 0.36, psx(T.catdoor, { decal: true }), 0.18, 1.35);

  // the floor, the rug round the post, and a tarp for a roof
  const floorAt = (geo, y, mat, down) => { const m = new Mesh(keep(geo), mat); m.rotation.x = down ? Math.PI / 2 : -Math.PI / 2; m.position.y = y; scene.add(m); return m; };
  const polyStart = Math.PI / N - Math.PI / 2;   // lines the polygon up with the walls
  floorAt(new CircleGeometry(R, N, polyStart), 0, psx(T.checker, { rx: 2 * R / 1.4, ry: 2 * R / 1.4 })).renderOrder = -2;
  floorAt(new RingGeometry(1.2, 3.6, 24, 1), 0, psx(T.carpet, { rx: 6, ry: 6, onFloor: true })).renderOrder = -1;
  floorAt(new CircleGeometry(R, N, polyStart), TOP, psx(T.tarp, { rx: 8, ry: 8, unlit: 0.55 }), true);

  // ---------- the trunk: a giant scratching post, clawed to bits at the bottom, with perches ----------
  cyl(1.1, 1.1, TOP, 14, psx(T.rope, { rx: 5, ry: TOP / 0.5 }), [0, TOP / 2, 0]);
  cyl(1.16, 1.16, 1.5, 14, psx(T.clawed, { rx: 5, ry: 3 }), [0, 0.75, 0]);
  const carpet = psx(T.carpet, { rx: 3, ry: 3 });
  for (const [y, th] of [[7.2, 2.4], [11.2, -0.8]]) { const [x, z] = at(1.9, th); cyl(1.0, 1.0, 0.16, 12, carpet, [x, y, z]); }

  // ---------- the spiral staircase, and the start of the next flight (then just a ladder) ----------
  const tread = psx(T.carpet, { rx: 2, ry: 1 }), wood = psx(T.wood, { rx: 2 }), brown = psx(null, { tint: 0x7a4a2a });
  const railPts = [];
  const treadGeo = keep(new BoxGeometry(1.95, 0.14, 0.62, 2, 1, 1));
  for (let i = 0; i < STEPS + UPPER; i++) {
    const th = TH0 + i * TURN, y = (i + 1) * RISE, [x, z] = at(2.1, th);
    add(new Mesh(treadGeo, i < STEPS + UPPER - 1 ? tread : wood), [x, y - 0.07, z], [0, th + Math.PI / 2, 0]);
    // the handrail stops a step short of the top, so it doesn't stand across the way onto the bridge
    if (i < STEPS - 1) { const [px, pz] = at(3.0, th); cyl(0.03, 0.03, 0.9, 4, brown, [px, y + 0.45, pz]); railPts.push(new Vector3(px, y + 0.92, pz)); }
  }
  add(new Mesh(keep(new TubeGeometry(new CatmullRomCurve3(railPts), 40, 0.045, 4)), psx(null, { tint: 0xffd23a })));
  { const th = TH0 + (STEPS + UPPER) * TURN, [x, z] = at(2.1, th), y0 = (STEPS + UPPER) * RISE;
    for (const s of [-0.35, 0.35]) { const o = at(s, th + Math.PI / 2); cyl(0.04, 0.04, L2 - y0 + 0.8, 4, wood, [x + o[0], (y0 + L2 + 0.8) / 2, z + o[1]]); }
    for (let y = y0 + 0.3; y < L2 + 0.6; y += 0.4) box(0.7, 0.05, 0.05, wood, [x, y, z], [0, th + Math.PI / 2, 0]); }

  // ---------- the first landing: a carpeted ring round the walls, a bridge from the stairs, a railing ----------
  floorAt(new RingGeometry(IN, R, 48, 1), L1, psx(T.carpet, { rx: 10, ry: 10 }));
  floorAt(new RingGeometry(IN, R, 48, 1), L1 - 0.18, psx(T.wood, { rx: 12, ry: 12 }), true);
  cyl(IN, IN, 0.18, 48, psx(T.wood, { rx: 20 }), [0, L1 - 0.09, 0], null, true);
  const gap = 0.12;
  const rail = new Mesh(keep(new CylinderGeometry(IN, IN, 1, 48, 1, true, THTOP + gap, 2 * Math.PI - 2 * gap)), psx(T.rail, { rx: 2 * Math.PI * IN / 0.5, ry: 1, side: DoubleSide }));
  rail.position.y = L1 + 0.5; scene.add(rail);
  { const mid = at((3.05 + IN) / 2, THTOP), len = IN - 3.0;
    box(1.3, 0.14, len, tread, [mid[0], L1 - 0.07, mid[1]], [0, THTOP, 0]);
    for (const s of [-0.62, 0.62]) { const o = at(s, THTOP + Math.PI / 2); plane(len, 1, psx(T.rail, { rx: 5, side: DoubleSide }), [mid[0] + o[0], L1 + 0.5, mid[1] + o[1]], [0, THTOP + Math.PI / 2, 0], 1); } }
  // a dirt pile by the door of an activity that asks for one (Dropper World: a mole came up through
  // the floorboards; it gets everywhere)
  cards.forEach((c, i) => {
    if (c.doorstep !== 'dirt') return;
    const [x, z] = at(A - 0.9, faceAngle(SLOTS[bySlot.indexOf(i)]) - 0.14); cone(0.42, 0.3, 7, psx(T.bark, { tint: 0xc08050, rx: 2 }), [x, L1 + 0.15, z]);
  });

  // ---------- the second landing, half built: planks with gaps, scaffolding, tape and a sign ----------
  const plank = psx(T.wood, { rx: 1, ry: 3 });
  for (let k = 0; k < 18; k++) { const th = k * 0.35 - 0.3; if (k % 5 === 3) continue; const [x, z] = at(R - 1.1, th); box(0.5, 0.1, 2.2, plank, [x, L2, z], [0, th, 0]); }
  const scaf = psx(T.scaffold);
  for (let k = 0; k < 8; k++) { const [x, z] = at(R - 2.3, k * Math.PI / 4 + 0.2); cyl(0.05, 0.05, TOP - L2, 4, scaf, [x, (L2 + TOP) / 2, z]); }
  const tape = new Mesh(keep(new CylinderGeometry(R - 2.3, R - 2.3, 0.2, 32, 1, true)), psx(T.hazard, { rx: 60, ry: 1, unlit: 0.3, side: DoubleSide })); tape.position.y = L2 + 1; scene.add(tape);
  { const [x, z] = at(R - 2.35, 0.2); plane(3.2, 1.05, psx(T.soonSign, { unlit: 0.4, side: DoubleSide }), [x, L2 + 1.9, z], [0, 0.2 + Math.PI, 0], 1); }

  // ---------- the ground floor, round the walls ----------
  // tall windows, one throwing a sunbeam across the floor
  onWall(3, 1.5, 3.1, psx(T.window, { unlit: 0.7, decal: true }), 2.2, 0, 0.12);
  onWall(12, 1.5, 3.1, psx(T.window, { unlit: 0.7, decal: true }), 2.2, 0, 0.12);
  const beam = new Mesh(keep(new PlaneGeometry(1.5, 3.2)), psx(null, { tint: 0xffe040, unlit: 1, fade: 0.45, side: DoubleSide, onFloor: true })); beam.renderOrder = -1;
  { const [x, z] = at(R - 2.4, faceAngle(3) - 0.1); beam.position.set(x, 0, z); beam.rotation.set(-Math.PI / 2, 0, faceAngle(3) + 0.2); scene.add(beam); }
  // an archway to a new wing, taped off
  onWall(5, 2.4, 3.2, psx(T.dark, { decal: true }), 1.6, 0, 0.12);
  { const th = faceAngle(5), [x, z] = at(A - 0.7, th);
    for (const y of [0.95, 0.55]) box(2.3, 0.18, 0.08, psx(T.hazard, { rx: 4, ry: 1, unlit: 0.3 }), [x, y, z], [0, th, 0]);
    onWall(5, 1.8, 0.8, psx(T.wingSign, { unlit: 0.4, decal: true }), 3.7); }
  // Sadie's portraits, the shredded armchair under the Duchess, the table and the vase that was on it
  onWall(14, 1.25, 1.46, psx(T.duchess, { decal: true, unlit: 0.2 }), 2.6);
  onWall(15, 0.85, 1.0, psx(T.general, { decal: true, unlit: 0.2 }), 2.5);
  onWall(13, 0.85, 1.0, psx(T.baby, { decal: true, unlit: 0.2 }), 2.5);
  const BLOCKS = [];
  { const th = faceAngle(14), [x, z] = at(A - 0.75, th), g = new Group(); g.position.set(x, 0, z); g.rotation.y = th + Math.PI; scene.add(g);
    const v = psx(T.velvet, { rx: 2, ry: 2 }), sh = psx(T.shredded);
    const part = (w, h, d, m, p) => { const b = new Mesh(keep(new BoxGeometry(w, h, d, 2, 2, 2)), m); b.position.set(...p); g.add(b); };
    part(1.2, 0.45, 0.9, v, [0, 0.35, 0]); part(1.2, 0.9, 0.22, v, [0, 0.9, -0.36]);
    part(0.2, 0.75, 0.9, sh, [-0.66, 0.4, 0]); part(0.2, 0.75, 0.9, sh, [0.66, 0.4, 0]);
    for (const [a, b] of [[-0.5, -0.35], [0.5, -0.35], [-0.5, 0.35], [0.5, 0.35]]) part(0.08, 0.14, 0.08, psx(null, { tint: 0xffd23a }), [a, 0.07, b]);
    BLOCKS.push([x, z, 0.8]); }
  { const th = faceAngle(15) + 0.12, [x, z] = at(A - 0.55, th);
    cyl(0.3, 0.3, 0.06, 10, psx(T.wood), [x, 0.9, z]); cyl(0.05, 0.08, 0.9, 6, psx(T.wood), [x, 0.45, z]);
    const [vx, vz] = at(A - 1.2, th + 0.1); cyl(0.12, 0.18, 0.45, 8, psx(null, { tint: 0x40c0f0 }), [vx, 0.15, vz], [Math.PI / 2, 0, 0.6]);
    BLOCKS.push([x, z, 0.35]); }
  // Sadie, asleep in the box the chandelier came in, in the sunbeam
  const nap = new Group(); { const [x, z] = at(R - 2.5, faceAngle(3) - 0.2); nap.position.set(x, 0, z); nap.rotation.y = -0.4; scene.add(nap);
    for (const [w, p, r] of [[1.0, [0, 0.25, -0.35], 0], [1.0, [0, 0.25, 0.35], Math.PI], [0.7, [-0.5, 0.25, 0], Math.PI / 2], [0.7, [0.5, 0.25, 0], -Math.PI / 2]]) {
      const m = new Mesh(keep(new PlaneGeometry(w, 0.5)), psx(T.cardboard, { side: DoubleSide })); m.position.set(...p); m.rotation.y = r; nap.add(m); }
    const flap = new Mesh(keep(new PlaneGeometry(1.0, 0.35)), psx(T.cardboard, { side: DoubleSide })); flap.position.set(0, 0.55, -0.5); flap.rotation.x = -0.9; nap.add(flap);
    // its bottom, so the floor's tiles don't show through inside it
    const bottom = new Mesh(keep(new PlaneGeometry(0.96, 0.66)), psx(T.cardboard, { rx: 2 })); bottom.position.set(0, 0.05, 0); bottom.rotation.x = -Math.PI / 2; nap.add(bottom);
    BLOCKS.push([x, z, 0.65]); }
  const sadie = new Mesh(keep(new PlaneGeometry(0.78, 0.63, 1, 1).translate(0, 0.31, 0)), psx(T.nap, { unlit: 0.4 }));
  sadie.position.copy(nap.position).add(new Vector3(0, 0.12, 0)); scene.add(sadie);

  // the chandelier (with a feather toy someone tied to it), and its light
  const CH = new Vector3(3.2, 7.6, 1.0);
  cyl(0.02, 0.02, TOP - CH.y, 3, psx(null, { tint: 0xffd23a }), [CH.x, (TOP + CH.y) / 2, CH.z]);
  const chand = new Group(); chand.position.copy(CH); scene.add(chand);
  { const brass = psx(null, { tint: 0xffd23a });
    const tor = new Mesh(keep(new TorusGeometry(0.6, 0.05, 4, 12)), brass); tor.rotation.x = Math.PI / 2; chand.add(tor);
    chand.add(new Mesh(keep(new SphereGeometry(0.16, 6, 4)), brass));
    const candle = psx(T.candle, { unlit: 1, side: DoubleSide }), crystal = psx(null, { tint: 0xd8f0ff, unlit: 0.6 });
    for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4;
      const c = new Mesh(keep(new PlaneGeometry(0.1, 0.22)), candle); c.position.set(Math.cos(a) * 0.6, 0.14, Math.sin(a) * 0.6); chand.add(c);
      const cr = new Mesh(keep(new SphereGeometry(0.05, 4, 2)), crystal); cr.position.set(Math.cos(a + 0.4) * 0.6, -0.18, Math.sin(a + 0.4) * 0.6); chand.add(cr); } }
  const toy = new Group(); toy.position.set(0.3, 0, 0.3); chand.add(toy);
  { const s = new Mesh(keep(new CylinderGeometry(0.01, 0.01, 1.6, 3)), psx(null)); s.position.y = -0.8; toy.add(s);
    const f = new Mesh(keep(new PlaneGeometry(0.22, 0.6).translate(0, -0.3, 0)), psx(T.feather, { side: DoubleSide, unlit: 0.3 })); f.position.y = -1.6; toy.add(f); }

  // ---------- where you can walk ----------
  // the ground (clear of the stairs), the treads, the bridge and the landing. A step up or down is
  // at most half a metre, so the railings and the landing's edge hold you in by themselves.
  const P = 0.35;
  const wrap = a => Math.atan2(Math.sin(a), Math.cos(a));
  const polyR = (x, z) => { let m = 0; for (let k = 0; k < N; k++) { const th = faceAngle(k); m = Math.max(m, x * Math.sin(th) + z * Math.cos(th)); } return m; };
  function heights(x, z) {
    const r = Math.hypot(x, z), th = Math.atan2(x, z), pr = polyR(x, z), out = [];
    const foot = r >= 1.45 && wrap(th - TH0) < -TURN / 2 && wrap(th - TH0) > -1.4;   // the floor where the stairs start
    if (pr < A - P && (r > 3.05 || foot) && !BLOCKS.some(([bx, bz, br]) => Math.hypot(x - bx, z - bz) < br + P)) out.push(0);
    if (r >= 1.45 && r <= 3.05) for (let i = 0; i < STEPS + UPPER; i++) if (Math.abs(wrap(th - (TH0 + i * TURN))) <= TURN / 2 + 0.01) out.push((i + 1) * RISE);
    const along = x * Math.sin(THTOP) + z * Math.cos(THTOP), across = x * Math.cos(THTOP) - z * Math.sin(THTOP);
    if (along > 2.9 && along < IN + 0.3 && Math.abs(across) < 0.5) out.push(L1);
    if (pr < A - P && r > IN + 0.3) out.push(L1);
    return out;
  }
  function floor(x, z, y) {
    let best = null;
    for (const h of heights(x, z)) if (Math.abs(h - y) <= 0.5 && (best === null || Math.abs(h - y) < Math.abs(best - y))) best = h;
    return best;
  }

  const inFront = (d, back) => { const [x, z] = [d.pos.x + d.normal.x * back, d.pos.z + d.normal.z * back]; return { x, z, yaw: d.yaw + Math.PI, pitch: 0 }; };
  return {
    name: 'hall', scene, floor, doors, faces: [sadie], uses: [],   // Sadie turns to face you, like everywhere else
    napping: sadie,   // Sadie asleep in her box in the sunbeam (a game can wake her: Brickbuster's loose yarn ball)
    // the hall's solid shape, for things that bounce round it (Brickbuster's yarn ball): the walls'
    // distance from the middle, the post's radius, the first landing (its inner edge, its height
    // and thickness, the railing on it), the second landing's height (nothing goes above it), the
    // spiral stairs' treads, and the furniture on the ground floor
    shape: { wall: A, post: 1.16, landing: { inner: IN, y: L1, thick: 0.18, rail: 1.0 }, top: L2,
      stairs: { r0: 1.45, r1: 3.05, th0: TH0, turn: TURN, rise: RISE, treads: STEPS + UPPER },
      blocks: BLOCKS.map(([x, z, r]) => ({ x, z, r, h: 1.0 })) },
    light: { sun: 0.15, bulb: 0.75, lamp: [CH.x, CH.y - 0.4, CH.z] },
    spots: {
      start: { ...inFront(doors.front, 1.2), pitch: 0.25, y: 0 },
      landing: { x: at(IN + 0.8, THTOP + 0.25)[0], z: at(IN + 0.8, THTOP + 0.25)[1], y: L1, yaw: THTOP + Math.PI / 2 + 0.3, pitch: -0.05 },
      stairs: { x: at(2.2, TH0 - 0.5)[0], z: at(2.2, TH0 - 0.5)[1], y: 0, yaw: TH0 - Math.PI / 2, pitch: 0 },
    },
    update(t) { toy.rotation.z = Math.sin(t * 1.4) * 0.18; },
  };
}

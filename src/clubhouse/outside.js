// Outside the mansion: the front garden, the gate (Sadie on the gatepost), and the house. The house
// is only a shell: its front door leads to the entrance hall, which is its own place (it doesn't have
// to fit in there, and either can change without the other).
//
// The cat tree's trunk rises out of the middle, its top always being built; the wing on one side is
// a branch, the bare platform on the other is where the next one goes.
//
// Outside the gate a lane runs along the fence, with plots (`LOTS`) either side of the path for
// houses of their own: an activity whose card has a `lot` builds its house on that plot (the mansion
// hands it this place), and the next free plot has a COMING SOON stake. Plots never move either.
//
// Behind the house, the backyard: the back of the house finished off (windows, a back door that's
// strictly for cats, flower beds), a patio, a bench in the sun where Sadie naps, and a fence round
// it all. You get there round either side of the house (or through the hedge maze).
import { Mesh, Group, Scene, Color, SphereGeometry, CylinderGeometry, PlaneGeometry, Shape, ShapeGeometry, DoubleSide } from 'three';
import { psx, keep, skyMat, tex } from './look.js';
import { kit, wallGeometry, doorway } from './build.js';

// The plots along the lane outside the gate: where each house's front door is (they face the gate),
// and how high its ground is (y). Never moved or reordered (tests/clubhouse/spots.json): a new one
// only ever goes on the end, and the outside grows to take it in.
export const LOTS = [{ x: -10, y: 0, z: -37 }, { x: 10, y: 0, z: -37 }, { x: -24, y: 0, z: -37 }, { x: 24, y: 0, z: -37 }];
// spots in the grounds round the house, for buildings that aren't on the lane (a card's `grounds`):
// the middle of each, its ground's height, and how much room there is (w across, d deep). They never move either.
// 0: beside the house on the left, from the front garden to the backyard (the hedge maze)
export const GROUNDS = [{ x: -20, y: 0, z: 4, w: 8, d: 10 }];
// how far the outside goes: round every plot and spot, with room to walk up to it
const EDGE = {
  x: Math.max(30, ...LOTS.map(l => Math.abs(l.x) + 6), ...GROUNDS.map(g => Math.abs(g.x) + g.w / 2 + 6)),
  z0: Math.min(-50, ...LOTS.map(l => l.z - 13)), z1: 32,
};

export function buildOutside(T, cards = []) {
  const scene = new Scene(); scene.background = new Color(0x1a1a80);
  const { add, box, plane, cyl, ball, cone } = kit(scene);
  const sky = new Mesh(keep(new SphereGeometry(200, 16, 12)), skyMat()); sky.renderOrder = -3; scene.add(sky);
  const hills = new Mesh(keep(new CylinderGeometry(120, 120, 30, 24, 1, true)), psx(T.hills, { unlit: 0.6, side: 1, rx: 6 }));
  hills.position.y = 8; scene.add(hills);
  plane(12, 12, psx(T.sun, { unlit: 1 }), [-60, 55, 110], [0, Math.atan2(-60, 110) + Math.PI, 0], 1);
  for (const [x, y, z, s] of [[-40, 38, 100, 1.4], [30, 44, 110, 1.8], [70, 30, 80, 1.2], [-90, 26, 60, 1.5]])
    plane(14 * s, 5 * s, psx(T.cloud, { unlit: 0.9 }), [x, y, z], [0, Math.atan2(x, z) + Math.PI, 0], 1);
  plane(260, 260, psx(T.grass, { rx: 130, ry: 130 }), [0, 0, 0], [-Math.PI / 2, 0, 0], 24).renderOrder = -2;
  plane(3, 30, psx(T.path, { rx: 2, ry: 20, onFloor: true }), [0, 0, -15], [-Math.PI / 2, 0, 0], 12).renderOrder = -1;
  // the lane outside the gate, and a stake on the next free plot
  plane(64, 2.4, psx(T.path, { rx: 40, ry: 1.6, onFloor: true }), [0, 0, -31], [-Math.PI / 2, 0, 0], 16).renderOrder = -1;
  const taken = new Set(cards.filter(c => Number.isInteger(c.lot)).map(c => c.lot));
  const free = LOTS.find((_, i) => !taken.has(i));

  // eslint-disable-next-line no-unused-vars -- (kept for the buildings going up along the lane)
  const stucco = (w, h) => psx(T.stucco, { rx: w / 1.5, ry: h / 1.5 });
  // A wall's own picture with its windows painted in: `base` tiled (one tile every `tile` metres) over
  // w x h metres, and each window { t, u, y, w, h } (u: its middle across, 0-1, wrapping round; y:
  // its middle, metres up). Painted in rather than stuck on in front: at the far end of the lane a
  // phone's depth is too coarse to keep a window even 15 cm in front of its wall, so they flickered
  // or vanished (or, nudged forward as decals, showed through the fence).
  function painted(base, tile, w, h, wins) {
    const W = Math.round(w / tile * 16), H = Math.round(h / tile * 16);
    return tex(W, H, g => {
      for (let y = 0; y < H; y += 16) for (let x = 0; x < W; x += 16) g.drawImage(base.image, x, y);
      for (const o of wins) {
        const pw = Math.round(o.w / w * W), ph = Math.round(o.h / h * H);
        const px = Math.round(o.u * W - pw / 2), py = Math.round((1 - o.y / h) * H - ph / 2);
        for (const dx of [-W, 0, W]) g.drawImage(o.t.image, px + dx, py, pw, ph);
      }
    });
  }
  const across = (x, w) => ((x / w) % 1 + 1) % 1;   // (texture coordinates in metres, from the middle)
  const trim = psx(null, { tint: 0xe8b070 });
  // ---------- the house (all of it goes in a group of its own: `house`, so a place that can't see
  // the real thing can have a picture of it, like the hedge maze) ----------
  const mark = scene.children.length;
  // the main block: two floors, a fish-scale hip roof, and a front wall with a hole for the door
  const front = [{ t: T.fanlight, u: 0, y: 3.72, w: 2.0, h: 0.45 }, { t: T.window, u: 0, y: 5.9, w: 1.3, h: 1.95 }];
  for (const y of [2.1, 5.9]) for (const x of [-6.8, -3.9, 3.9, 6.8]) front.push({ t: T.window, u: across(x, 18), y, w: 1.3, h: 1.95 });
  add(new Mesh(wallGeometry(18, 8, 2.0, 3.45), psx(painted(T.stucco, 1.5, 18, 8, front), { rx: 1 / 18, ry: 1 / 8 })), [0, 0, 0], [0, Math.PI, 0]);
  // the back and the sides, with windows too (the back door's on its own, below)
  const backWins = [];
  for (const x of [-6.8, -3.9, 3.9, 6.8]) for (const y of [2.1, 5.9]) backWins.push({ t: T.window, u: (x + 9) / 18, y, w: 1.3, h: 1.95 });
  backWins.push({ t: T.round, u: 0.5, y: 6.0, w: 1.4, h: 1.4 });
  plane(18, 8, psx(painted(T.stucco, 1.5, 18, 8, backWins)), [0, 4, 10], [0, 0, 0]);
  const sideWins = [0.3, 0.7].flatMap(u => [2.1, 5.9].map(y => ({ t: T.window, u, y, w: 1.3, h: 1.95 })));
  plane(10, 8, psx(painted(T.stucco, 1.5, 10, 8, sideWins)), [-9, 4, 5], [0, -Math.PI / 2, 0]);
  plane(10, 8, psx(painted(T.stucco, 1.5, 10, 8, sideWins)), [9, 4, 5], [0, Math.PI / 2, 0]);
  box(18.2, 0.25, 0.3, trim, [0, 4.1, 10.05]);
  const roof = cone(1, 1, 4, psx(T.roof, { rx: 10, ry: 5 }), [0, 10, 5], [0, Math.PI / 4, 0]); roof.scale.set(9.8 / 0.7071, 4, 5.8 / 0.7071);
  box(18.6, 0.35, 10.6, psx(T.wood, { tint: 0xffe0c0, rx: 8 }), [0, 8, 5]);
  box(18.2, 0.25, 0.3, trim, [0, 4.1, -0.05]);

  // the trunk: an octagonal tower out of the middle of the house, still being built on top
  const TR = 3.4, TOP = 19;
  // (its windows on the face towards the gate: the fourth of its eight, a quarter turn on)
  const round = 8 * 2 * TR * Math.sin(Math.PI / 8), fw = 3.5 / 8;
  // (and the same on the face towards the backyard)
  const trunkWins = [fw, fw + 0.5].flatMap(u => [10.5, 14.5].map(y => ({ t: T.window, u, y, w: 1.1, h: 1.65 })).concat([{ t: T.round, u, y: 17.4, w: 1.4, h: 1.4 }]));
  cyl(TR, TR, TOP, 8, psx(painted(T.stucco, 1.5, round, TOP, trunkWins)), [0, TOP / 2, 5], [0, Math.PI / 8, 0]);
  for (const y of [8.9, 13, TOP]) cyl(TR + 0.15, TR + 0.15, 0.3, 8, trim, [0, y, 5], [0, Math.PI / 8, 0]);
  const scaf = psx(T.scaffold);
  const half = new Mesh(keep(new CylinderGeometry(TR, TR, 1.6, 8, 1, true, Math.PI / 8 + Math.PI / 4 * 3, Math.PI)), psx(T.brick, { rx: 8, ry: 1, side: DoubleSide }));
  half.position.set(0, TOP + 0.8, 5); scene.add(half);
  for (const [x, z] of [[-4, 1.2], [4, 1.2], [-4, 8.8], [4, 8.8], [0, 1.2]]) cyl(0.07, 0.07, 5, 4, scaf, [x, TOP + 2.5, z]);
  for (const y of [TOP + 1.6, TOP + 3.4, TOP + 4.9]) { box(8.1, 0.1, 0.1, scaf, [0, y, 1.2]); box(8.1, 0.1, 0.1, scaf, [0, y, 8.8]); box(0.1, 0.1, 7.7, scaf, [-4, y, 5]); box(0.1, 0.1, 7.7, scaf, [4, y, 5]); }
  box(8.1, 0.12, 1.1, psx(T.wood, { rx: 4 }), [0, TOP + 1.6, 1.6]);
  const tarp = plane(4.2, 3, psx(T.tarp, { rx: 2, ry: 2, side: DoubleSide }), [2.2, TOP + 3.2, 8.7], [0, 0, 0.05]);
  plane(7, 2.3, psx(T.soonSign, { unlit: 0.4, side: DoubleSide }), [0, TOP + 2.7, 1.1], [0, Math.PI, 0], 1);

  // the front turrets: a pointy roof on each, leaning out a little (from the gate, they're ears)
  const turret = psx(painted(T.stucco, 1.5, 8 * 3.2 * Math.sin(Math.PI / 8), 11, [{ t: T.window, u: 0.5, y: 8.6, w: 0.8, h: 1.2 }]));
  for (const s of [-1, 1]) {
    cyl(1.6, 1.6, 11, 8, turret, [s * 9, 5.5, 0.4]);
    cyl(1.75, 1.75, 0.3, 8, trim, [s * 9, 11, 0.4]);
    cone(2.1, 4.6, 4, psx(T.roof, { rx: 3, ry: 3 }), [s * 9.25, 13.2, 0.4], [0, Math.PI / 4, s * -0.13]);
  }
  // the weathervane: a sitting cat, on one ear
  const iron = psx(null, { tint: 0x221a44 });
  cyl(0.05, 0.05, 1.6, 4, iron, [-9.55, 16.2, 0.4]);
  plane(1.1, 1.1, psx(T.cat, { side: DoubleSide }), [-9.55, 17.3, 0.4], [0, Math.PI, 0], 1);
  box(1.2, 0.05, 0.05, iron, [-9.55, 16.6, 0.4]);

  // the porch: scratching-rope columns (clawed at the bottom), a little roof and gable, three steps
  for (const s of [-1, 1]) { cyl(0.28, 0.28, 3.6, 8, psx(T.rope, { rx: 3, ry: 5 }), [s * 2, 2.25, -2.6]); cyl(0.3, 0.3, 1.1, 8, psx(T.clawed, { rx: 3, ry: 1.2 }), [s * 2, 1.0, -2.6]); }
  box(5.2, 0.4, 3.2, psx(null, { tint: 0xfff4e4 }), [0, 4.25, -1.5]);
  const gable = new Shape(); gable.moveTo(-2.9, 0); gable.lineTo(2.9, 0); gable.lineTo(0, 1.8); gable.lineTo(-2.9, 0);
  const gableArt = painted(T.roof, 2.5, 5.8, 1.8, [{ t: T.round, u: 0, y: 0.6, w: 0.9, h: 0.9 }]);
  add(new Mesh(keep(new ShapeGeometry(gable)), psx(gableArt, { rx: 1 / 5.8, ry: 1 / 1.8, side: DoubleSide })), [0, 4.45, -3.1]);
  const STEPS = [0, 1, 2].map(i => ({ w: 5.4 - i * 0.4, d: 3.4 - i * 0.5, z: -1.6 + i * 0.25, top: 0.15 * (i + 1) }));
  for (const s of STEPS) box(s.w, 0.15, s.d, psx(T.stone, { rx: 3, ry: 2 }), [0, s.top - 0.075, s.z]);
  plane(1.5, 0.75, psx(T.mat, { decal: true }), [0, 0.46, -0.9], [-Math.PI / 2, 0, Math.PI], 1);   // turned to read as you walk up
  const door = doorway(scene, { pos: [0, 0.45, 0], yaw: Math.PI, w: 2.0, h: 3.0, leaves: [T.leafL, T.leafR] });

  // a branch: the games wing, joined by a covered bridge
  box(6, 11, 6, psx(painted(T.stucco, 1.5, 6, 11, [2.2, 5.8, 9].map(y => ({ t: T.window, u: 0.5, y, w: 1.1, h: 1.6 })))), [16, 5.5, 6]);
  const wr = cone(1, 1, 4, psx(T.roof, { rx: 4, ry: 3 }), [16, 13.2, 6], [0, Math.PI / 4, 0]); wr.scale.set(3.4 / 0.7071, 4.4, 3.4 / 0.7071);
  box(4.2, 2.4, 2.6, psx(painted(T.stucco, 1.5, 4.2, 2.4, [-1, 1].map(x => ({ t: T.window, u: 0.5 + x / 4.2, y: 1.2, w: 0.8, h: 1.2 })))), [11, 6.4, 4.5]);
  const br = cone(1, 1, 4, psx(T.roof, { rx: 3, ry: 1 }), [11, 8.3, 4.5], [0, Math.PI / 4, 0]); br.scale.set(2.8 / 0.7071, 1.4, 1.7 / 0.7071);
  const house = new Group(); scene.add(house);
  for (const o of scene.children.slice(mark, -1)) house.add(o);

  // the front garden: gate, fence, hedges, lanterns, trees, and one hedge cat
  const stone = psx(T.stone, { rx: 1, ry: 3 });
  for (const s of [-1, 1]) {
    box(0.9, 2.4, 0.9, stone, [s * 2.6, 1.2, -20]);
    plane(26, 1.5, psx(T.fence, { rx: 26 / 1.5, side: DoubleSide }), [s * (3.05 + 13), 0.75, -20], [0, 0, 0], 1);
  }
  const HEDGES = [];
  // (the last one on the left is shorter, and its lantern is round the corner, leaving room for the
  // path off to the hedge maze)
  for (const s of [-1, 1]) for (const z of [-17, -11.5, -6]) {
    const short = s < 0 && z === -6, len = short ? 2.6 : 4, mid = short ? -6.7 : z;
    box(1, 1.1, len, psx(T.leaf, { rx: 3 * len / 4, ry: 1.5 }), [s * 2.3, 0.55, mid]); HEDGES.push([s * 2.3, mid, len]);
  }
  const lit = psx(T.lantern, { unlit: 1 });
  for (const s of [-1, 1]) for (const z of [-15.5, -9.5, -3.5]) {
    const [x, zz] = s < 0 && z === -3.5 ? [-2.1, -5.3] : [s * 1.85, z];
    cyl(0.05, 0.05, 1.8, 4, iron, [x, 0.9, zz]); box(0.3, 0.38, 0.3, lit, [x, 1.95, zz]);
  }
  const bark = psx(T.bark, { rx: 2, ry: 2 }), leaf = psx(T.leaf, { rx: 3, ry: 3 });
  const TREES = [[-14, -8, 1.2], [-24, -2, 1.5], [22, -6, 1.3], [26, 10, 1.6], [-26, 14, 1.4]];
  for (const [x, z, s] of TREES) {
    cyl(0.3 * s, 0.4 * s, 3 * s, 6, bark, [x, 1.5 * s, z]);
    ball(1.8 * s, leaf, [x, 3.6 * s, z]); ball(1.2 * s, leaf, [x + 0.9 * s, 4.4 * s, z - 0.3]);
  }
  box(1.6, 0.4, 1.6, psx(T.stone, { rx: 1 }), [-6.5, 0.2, -9]);
  ball(0.75, leaf, [-6.5, 1.25, -9], 1.25); ball(0.5, leaf, [-6.5, 2.4, -9]);
  for (const s of [-1, 1]) cone(0.17, 0.4, 4, leaf, [-6.5 + s * 0.28, 2.9, -9], [0, 0, s * -0.3]);
  cyl(0.12, 0.12, 1, 5, leaf, [-5.75, 1.2, -9], [0, 0, -0.5]);

  // ---------- the backyard ----------
  // the back door (it doesn't open: it's strictly for cats), with a lamp each side and its sign
  plane(1.5, 2.6, psx(T.backDoor, { decal: true }), [0, 1.3, 10.06], [0, 0, 0], 2);
  for (const [bw, bh, x, y] of [[0.14, 2.75, -0.82, 1.37], [0.14, 2.75, 0.82, 1.37], [1.78, 0.14, 0, 2.7]]) box(bw, bh, 0.14, trim, [x, y, 10.07]);
  box(2.4, 0.15, 1.1, psx(T.stone, { rx: 2, ry: 1 }), [0, 0.075, 10.55]);
  for (const s of [-1, 1]) { box(0.08, 0.3, 0.2, iron, [s * 1.25, 2.2, 10.1]); box(0.26, 0.34, 0.26, lit, [s * 1.25, 2.45, 10.25]); }
  plane(1.5, 0.5, psx(T.backSign, { decal: true, unlit: 0.3 }), [1.9, 1.5, 10.06], [0, 0, 0], 1);
  // a patio of flagstones, flower beds along the back wall, and a path round to the hedge maze
  plane(7, 4, psx(T.stone, { rx: 5, ry: 3, onFloor: true }), [0, 0, 13.1], [-Math.PI / 2, 0, 0], 4).renderOrder = -1;
  for (const s of [-1, 1]) box(5.6, 0.4, 0.9, psx(T.flowers, { rx: 5, ry: 1 }), [s * 5.4, 0.2, 10.55]);
  plane(16.5, 1.4, psx(T.path, { rx: 11, ry: 1, onFloor: true }), [-11.75, 0, 12.6], [-Math.PI / 2, 0, 0], 8).renderOrder = -1;
  // two trees, a bird bath, and the bench in the sun where Sadie naps
  const YARD_TREES = [[-12, 22, 1.3], [16, 24, 1.5], [24, 16, 1.2]];
  for (const [x, z, s] of YARD_TREES) {
    cyl(0.3 * s, 0.4 * s, 3 * s, 6, bark, [x, 1.5 * s, z]);
    ball(1.8 * s, leaf, [x, 3.6 * s, z]); ball(1.2 * s, leaf, [x - 0.8 * s, 4.3 * s, z + 0.4]);
  }
  cyl(0.18, 0.28, 0.9, 6, psx(T.stone, { rx: 1, ry: 1 }), [-4, 0.45, 19]);
  cyl(0.65, 0.4, 0.2, 8, psx(T.stone, { rx: 2, ry: 1 }), [-4, 0.98, 19]);
  plane(4.6, 3.4, psx(T.sunPatch, { onFloor: true, unlit: 0.4 }), [5.5, 0, 17.6], [-Math.PI / 2, 0, 0], 2).renderOrder = -1;
  const bench = psx(T.wood, { tint: 0xffd0a0, rx: 3 });
  box(2.4, 0.1, 0.6, bench, [5.5, 0.48, 17.8]);
  box(2.4, 0.5, 0.08, bench, [5.5, 0.9, 18.1]);
  for (const x of [4.5, 6.5]) for (const z of [17.6, 18.05]) box(0.08, 0.46, 0.08, iron, [x, 0.23, z]);
  for (const x of [4.35, 6.65]) box(0.08, 0.06, 0.6, iron, [x, 0.72, 17.8]);
  const napper = new Mesh(keep(new PlaneGeometry(0.85, 0.69, 1, 1).translate(0, 0.345, 0)), psx(T.nap, { unlit: 0.45 }));
  napper.position.set(5.0, 0.53, 17.75); scene.add(napper);
  const zs = [0, 1].map(i => { const z = new Mesh(keep(new PlaneGeometry(0.4, 0.4)), psx(T.zzz, { unlit: 0.6 })); z.userData.phase = i / 2; scene.add(z); return z; });
  // the fence round the back and both sides of the grounds
  plane(58, 1.5, psx(T.fence, { rx: 58 / 1.5, side: DoubleSide }), [0, 0.75, 30], [0, 0, 0], 1);
  for (const s of [-1, 1]) plane(50, 1.5, psx(T.fence, { rx: 50 / 1.5, side: DoubleSide }), [s * 29, 0.75, 5], [0, Math.PI / 2, 0], 1);

  // Sadie on the gatepost: she's expecting you (not that she'd show it)
  const sadie = new Mesh(keep(new PlaneGeometry(0.9, 0.73, 1, 1).translate(0, 0.365, 0)), psx(T.sadie, { unlit: 0.35 }));
  sadie.position.set(2.6, 2.4, -20.1); scene.add(sadie);

  if (free) {
    const post = psx(T.wood, { tint: 0xffe0c0 });
    box(0.14, 1.6, 0.14, post, [free.x - 0.9, 0.8, free.z - 1]); box(0.14, 1.6, 0.14, post, [free.x + 0.9, 0.8, free.z - 1]);
    plane(2.2, 0.8, psx(T.lotSign, { unlit: 0.3, side: DoubleSide }), [free.x, 1.3, free.z - 0.93], [0, 0, 0], 1);
  }

  // Where you can walk: the ground (the garden, out along the lane, and the front steps), round
  // everything solid on it (you're 0.35 m round), plus anything a building adds to walk on (a bridge,
  // a walkway over the lane...). Like the hall, it can have more than one level: wherever you are,
  // you're on the one nearest your feet, and a step up or down is at most half a metre. What's solid
  // only gets in the way at its own height (y0 to y1), so you can walk under a bridge, or over a
  // tunnel. The rest of what's here is all at ground level for now.
  const P = 0.35, TALL = 1.6;
  const RECTS = [[-9, 9, 0, 10], [13, 19, 3, 9], [-7.3, -5.7, -9.8, -8.2], [-8.2, -2.6, 10, 11], [2.6, 8.2, 10, 11], [-1.2, 1.2, 10, 11.1],
    [4.3, 6.7, 17.5, 18.15], [-29.05, 29.05, 29.95, 30.05], [-29.05, -28.95, -20, 30], [28.95, 29.05, -20, 30],
    ...HEDGES.map(([x, z, len]) => [x - 0.5, x + 0.5, z - len / 2, z + len / 2]),
    ...[-1, 1].map(s => [s * 2.6 - 0.45, s * 2.6 + 0.45, -20.45, -19.55]),
    [-40, -2.15, -20.05, -19.95], [2.15, 40, -20.05, -19.95]];
  if (free) RECTS.push([free.x - 1, free.x + 1, free.z - 1.1, free.z - 0.9]);
  const CIRCLES = [[-9, 0.4, 1.6], [9, 0.4, 1.6], [-2, -2.6, 0.3], [2, -2.6, 0.3], [-4, 19, 0.65], ...[...TREES, ...YARD_TREES].map(([x, z, s]) => [x, z, 0.4 * s])];
  const SURFACES = [];
  const keepIn = (list, it) => { list.push(it); return () => { const i = list.indexOf(it); if (i >= 0) list.splice(i, 1); }; };   // more to walk on: each (x, z) => its height there, or null
  function ground(x, z) {
    if (Math.abs(x) > EDGE.x || z < EDGE.z0 || z > EDGE.z1) return null;
    let h = 0;
    for (const s of STEPS) if (Math.abs(x) < s.w / 2 && Math.abs(z - s.z) < s.d / 2) h = Math.max(h, s.top);
    return h;
  }
  // (something solid from y0 to y1 is in the way of someone standing at h)
  const inTheWay = (y0 = -Infinity, y1 = Infinity, h) => y0 < h + TALL && y1 > h + 0.05;
  function clear(x, z, h) {
    for (const [x0, x1, z0, z1, y0, y1] of RECTS) if (x > x0 - P && x < x1 + P && z > z0 - P && z < z1 + P && inTheWay(y0, y1, h)) return false;
    for (const [cx, cz, r, y0, y1] of CIRCLES) if (Math.hypot(x - cx, z - cz) < r + P && inTheWay(y0, y1, h)) return false;
    return true;
  }
  function floor(x, z, y = 0) {
    let best = null;
    for (const h of [ground(x, z), ...SURFACES.map(s => s(x, z))])
      if (h !== null && Math.abs(h - y) <= 0.5 && clear(x, z, h) && (best === null || Math.abs(h - y) < Math.abs(best - y))) best = h;
    return best;
  }

  return {
    name: 'outside', scene, floor, doors: { front: door }, faces: [sadie, napper, ...zs], sadie, napper, uses: [], lots: LOTS, grounds: GROUNDS, house,
    // something solid a house puts on its plot: x0 to x1 across, z0 to z1 deep, or round (x, z, r);
    // from y0 up to y1 (from the ground up, if it doesn't say). Each hands back how to take it away.
    block(x0, x1, z0, z1, y0, y1) { return keepIn(RECTS, [x0, x1, z0, z1, y0, y1]); },
    blockRound(x, z, r, y0, y1) { return keepIn(CIRCLES, [x, z, r, y0, y1]); },
    // somewhere more to walk on: (x, z) => its height there, or null where it isn't
    surface(at) { return keepIn(SURFACES, at); },
    light: { sun: 0.5, bulb: 0, lamp: [0, 20, -40] },
    spots: { start: { x: 0, z: -27, yaw: Math.PI, pitch: 0.12 } },
    update(t) {
      tarp.rotation.z = 0.05 + Math.sin(t * 2) * 0.04;
      // Sadie's Zs drift up off the bench and fade
      for (const z of zs) {
        const k = (t / 5 + z.userData.phase) % 1;
        z.position.set(5.0 + Math.sin(k * 6) * 0.15 + k * 0.3, 1.1 + k * 0.9, 17.75);
        z.material.uniforms.uFade.value = Math.max(0, k * 1.4 - 0.4);
      }
    },
  };
}

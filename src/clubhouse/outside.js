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
import { Mesh, Scene, Color, SphereGeometry, CylinderGeometry, PlaneGeometry, Shape, ShapeGeometry, DoubleSide } from 'three';
import { psx, keep, skyMat, tex } from './look.js';
import { kit, wallGeometry, doorway } from './build.js';

// the plots along the lane outside the gate: where each house's front door is (they face the gate)
export const LOTS = [{ x: -10, z: -37 }, { x: 10, z: -37 }, { x: -24, z: -37 }, { x: 24, z: -37 }];

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
  // the main block: two floors, a fish-scale hip roof, and a front wall with a hole for the door
  const front = [{ t: T.fanlight, u: 0, y: 3.72, w: 2.0, h: 0.45 }, { t: T.window, u: 0, y: 5.9, w: 1.3, h: 1.95 }];
  for (const y of [2.1, 5.9]) for (const x of [-6.8, -3.9, 3.9, 6.8]) front.push({ t: T.window, u: across(x, 18), y, w: 1.3, h: 1.95 });
  add(new Mesh(wallGeometry(18, 8, 2.0, 3.45), psx(painted(T.stucco, 1.5, 18, 8, front), { rx: 1 / 18, ry: 1 / 8 })), [0, 0, 0], [0, Math.PI, 0]);
  plane(18, 8, stucco(18, 8), [0, 4, 10], [0, 0, 0]);
  plane(10, 8, stucco(10, 8), [-9, 4, 5], [0, -Math.PI / 2, 0]);
  plane(10, 8, stucco(10, 8), [9, 4, 5], [0, Math.PI / 2, 0]);
  const roof = cone(1, 1, 4, psx(T.roof, { rx: 10, ry: 5 }), [0, 10, 5], [0, Math.PI / 4, 0]); roof.scale.set(9.8 / 0.7071, 4, 5.8 / 0.7071);
  box(18.6, 0.35, 10.6, psx(T.wood, { tint: 0xffe0c0, rx: 8 }), [0, 8, 5]);
  box(18.2, 0.25, 0.3, trim, [0, 4.1, -0.05]);

  // the trunk: an octagonal tower out of the middle of the house, still being built on top
  const TR = 3.4, TOP = 19;
  // (its windows on the face towards the gate: the fourth of its eight, a quarter turn on)
  const round = 8 * 2 * TR * Math.sin(Math.PI / 8), fw = 3.5 / 8;
  const trunkWins = [10.5, 14.5].map(y => ({ t: T.window, u: fw, y, w: 1.1, h: 1.65 })).concat([{ t: T.round, u: fw, y: 17.4, w: 1.4, h: 1.4 }]);
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

  // a branch: the games wing, joined by a covered bridge; and a bare platform where the next goes
  box(6, 11, 6, psx(painted(T.stucco, 1.5, 6, 11, [2.2, 5.8, 9].map(y => ({ t: T.window, u: 0.5, y, w: 1.1, h: 1.6 })))), [16, 5.5, 6]);
  const wr = cone(1, 1, 4, psx(T.roof, { rx: 4, ry: 3 }), [16, 13.2, 6], [0, Math.PI / 4, 0]); wr.scale.set(3.4 / 0.7071, 4.4, 3.4 / 0.7071);
  box(4.2, 2.4, 2.6, psx(painted(T.stucco, 1.5, 4.2, 2.4, [-1, 1].map(x => ({ t: T.window, u: 0.5 + x / 4.2, y: 1.2, w: 0.8, h: 1.2 })))), [11, 6.4, 4.5]);
  const br = cone(1, 1, 4, psx(T.roof, { rx: 3, ry: 1 }), [11, 8.3, 4.5], [0, Math.PI / 4, 0]); br.scale.set(2.8 / 0.7071, 1.4, 1.7 / 0.7071);
  box(6, 0.2, 2.6, psx(T.wood, { rx: 4 }), [-11.9, 5.1, 7]);
  for (const x of [-11, -14.8]) for (const z of [5.8, 8.2]) cyl(0.06, 0.06, 5.1, 4, scaf, [x, 2.55, z]);
  box(0.1, 0.35, 2.6, psx(T.hazard, { rx: 1, ry: 1, unlit: 0.3 }), [-15, 5.6, 7]);
  plane(2.4, 1.05, psx(T.wingSign, { unlit: 0.4, side: DoubleSide }), [-14, 6.4, 5.6], [0, Math.PI, 0], 1);

  // the front garden: gate, fence, hedges, lanterns, trees, and one hedge cat
  const stone = psx(T.stone, { rx: 1, ry: 3 });
  for (const s of [-1, 1]) {
    box(0.9, 2.4, 0.9, stone, [s * 2.6, 1.2, -20]);
    plane(26, 1.5, psx(T.fence, { rx: 26 / 1.5, side: DoubleSide }), [s * (3.05 + 13), 0.75, -20], [0, 0, 0], 1);
  }
  const HEDGES = [];
  for (const s of [-1, 1]) for (const z of [-17, -11.5, -6]) { box(1, 1.1, 4, psx(T.leaf, { rx: 3, ry: 1.5 }), [s * 2.3, 0.55, z]); HEDGES.push([s * 2.3, z]); }
  const lit = psx(T.lantern, { unlit: 1 });
  for (const s of [-1, 1]) for (const z of [-15.5, -9.5, -3.5]) { cyl(0.05, 0.05, 1.8, 4, iron, [s * 1.85, 0.9, z]); box(0.3, 0.38, 0.3, lit, [s * 1.85, 1.95, z]); }
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

  // Sadie on the gatepost: she's expecting you (not that she'd show it)
  const sadie = new Mesh(keep(new PlaneGeometry(0.9, 0.73, 1, 1).translate(0, 0.365, 0)), psx(T.sadie, { unlit: 0.35 }));
  sadie.position.set(2.6, 2.4, -20.1); scene.add(sadie);

  if (free) {
    const post = psx(T.wood, { tint: 0xffe0c0 });
    box(0.14, 1.6, 0.14, post, [free.x - 0.9, 0.8, free.z - 1]); box(0.14, 1.6, 0.14, post, [free.x + 0.9, 0.8, free.z - 1]);
    plane(2.2, 0.8, psx(T.lotSign, { unlit: 0.3, side: DoubleSide }), [free.x, 1.3, free.z - 0.93], [0, 0, 0], 1);
  }

  // where you can walk: the garden, round everything in it (you're 0.35 m round), and out along the lane
  const P = 0.35;
  const RECTS = [[-9, 9, 0, 10], [13, 19, 3, 9], [-7.3, -5.7, -9.8, -8.2],
    ...HEDGES.map(([x, z]) => [x - 0.5, x + 0.5, z - 2, z + 2]),
    ...[-1, 1].map(s => [s * 2.6 - 0.45, s * 2.6 + 0.45, -20.45, -19.55]),
    [-40, -2.15, -20.05, -19.95], [2.15, 40, -20.05, -19.95]];
  if (free) RECTS.push([free.x - 1, free.x + 1, free.z - 1.1, free.z - 0.9]);
  const CIRCLES = [[-9, 0.4, 1.6], [9, 0.4, 1.6], [-2, -2.6, 0.3], [2, -2.6, 0.3], ...TREES.map(([x, z, s]) => [x, z, 0.4 * s])];
  function floor(x, z) {
    if (Math.abs(x) > 30 || z < -50 || z > 32) return null;
    for (const [x0, x1, z0, z1] of RECTS) if (x > x0 - P && x < x1 + P && z > z0 - P && z < z1 + P) return null;
    for (const [cx, cz, r] of CIRCLES) if (Math.hypot(x - cx, z - cz) < r + P) return null;
    let h = 0;
    for (const s of STEPS) if (Math.abs(x) < s.w / 2 && Math.abs(z - s.z) < s.d / 2) h = Math.max(h, s.top);
    return h;
  }

  return {
    name: 'outside', scene, floor, doors: { front: door }, faces: [sadie], sadie, uses: [], lots: LOTS,
    // something solid a house puts on its plot: x0 to x1 across, z0 to z1 deep, or round (x, z, r)
    block(x0, x1, z0, z1) { RECTS.push([x0, x1, z0, z1]); },
    blockRound(x, z, r) { CIRCLES.push([x, z, r]); },
    light: { sun: 0.5, bulb: 0, lamp: [0, 20, -40] },
    spots: { start: { x: 0, z: -27, yaw: Math.PI, pitch: 0.12 } },
    update(t) { tarp.rotation.z = 0.05 + Math.sin(t * 2) * 0.04; },
  };
}

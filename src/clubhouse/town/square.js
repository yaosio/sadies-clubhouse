// The town square, just outside the front gate: a round paved space with a bird bath in the middle,
// benches and flower beds round it, the paths that leave it for the grass (`PATHS`), and the birds.
// The plots stand round its far side (layout.js). Built into the outside's scene; what's solid is
// handed back for the outside to keep you out of.
import { Mesh, Group, CircleGeometry, DoubleSide } from 'three';
import { psx, keep } from '../look.js';
import { kit } from '../build.js';
import { SQUARE, PATHS } from './layout.js';
import { makeBirds } from './birds.js';

const rad = d => d * Math.PI / 180;
// a place on the square: `r` from the middle, at angle `a` degrees (0 straight on from the gate, - left, + right)
const on = (r, a) => [SQUARE.x + r * Math.sin(rad(a)), SQUARE.z - r * Math.cos(rad(a))];

export function buildSquare(T, scene, sadie) {
  const { plane, cyl } = kit(scene);
  const circles = [], perches = [];
  const flat = (geo, mat, x, z, order) => { const m = new Mesh(keep(geo), mat); m.rotation.x = -Math.PI / 2; m.position.set(x, 0, z); m.renderOrder = order; scene.add(m); return m; };

  // the paving, with a ring of cobbles round the bird bath (floors draw first, in this order)
  flat(new CircleGeometry(SQUARE.r, 32), psx(T.stone, { rx: 16, ry: 16, onFloor: true }), SQUARE.x, SQUARE.z, -1);
  flat(new CircleGeometry(2.6, 24), psx(T.path, { rx: 4, ry: 4, onFloor: true }), SQUARE.x, SQUARE.z, -0.9);

  // the paths out: each leaves the square where it says, winds a little half way, and stops in the grass
  // (a building that grows along one takes a new plot beside it)
  for (const p of PATHS) {
    const r0 = SQUARE.r - 0.6, half = (p.to - r0) / 2, a1 = rad(p.at), a2 = rad(p.at + p.bend);
    const [x0, z0] = on(r0, p.at);
    const x1 = x0 + Math.sin(a1) * half, z1 = z0 - Math.cos(a1) * half;
    for (const [x, z, a, len] of [[x0, z0, a1, half + 0.5], [x1, z1, a2, half]]) {
      const mid = [x + Math.sin(a) * len / 2, 0, z - Math.cos(a) * len / 2];
      plane(2, len, psx(T.path, { rx: 1.3, ry: len * 0.67, onFloor: true }), mid, [-Math.PI / 2, 0, -a], 4).renderOrder = -0.95;
    }
  }

  // the bird bath in the middle: a pedestal and a bowl of water, with room on its rim for a bird or two
  cyl(0.25, 0.4, 1.0, 8, psx(T.stone, { rx: 1, ry: 1 }), [SQUARE.x, 0.5, SQUARE.z]);
  cyl(1.0, 0.55, 0.28, 12, psx(T.stone, { rx: 3, ry: 1 }), [SQUARE.x, 1.1, SQUARE.z]);
  flat(new CircleGeometry(0.85, 12), psx(null, { tint: 0x6ac8ff, unlit: 0.7, side: DoubleSide }), SQUARE.x, SQUARE.z, 0).position.y = 1.25;
  circles.push([SQUARE.x, SQUARE.z, 1.0]);
  for (const a of [0, 120, 240]) perches.push({ x: SQUARE.x + Math.sin(rad(a)) * 0.95, y: 1.24, z: SQUARE.z - Math.cos(rad(a)) * 0.95 });

  // benches facing the middle, and flower beds behind them
  const wood = psx(T.wood, { tint: 0xffd0a0, rx: 3 }), iron = psx(null, { tint: 0x221a44 });
  for (const a of [-135, -45, 45, 135]) {
    const [x, z] = on(6.2, a), g = new Group(); g.position.set(x, 0, z); g.rotation.y = -rad(a); scene.add(g);
    const k = kit(g);
    k.box(1.9, 0.1, 0.55, wood, [0, 0.48, 0.05]);
    k.box(1.9, 0.5, 0.08, wood, [0, 0.88, -0.25]);
    for (const s of [-1, 1]) { k.box(0.08, 0.46, 0.5, iron, [s * 0.9, 0.23, 0.05]); k.box(0.08, 0.06, 0.55, iron, [s * 0.98, 0.72, 0.05]); }
    const c = Math.cos(-rad(a)), s = Math.sin(-rad(a));
    for (const lx of [-0.55, 0.55]) {
      circles.push([x + lx * c, z - lx * s, 0.45]);
      perches.push({ x: x + lx * 1.1 * c + (-0.25) * s, y: 1.13, z: z - lx * 1.1 * s + (-0.25) * c });   // on the back of the bench
    }
  }
  const flowers = psx(T.flowers, { rx: 3, ry: 1 });
  for (const [r, a] of [[8.4, -135], [8.4, -45], [8.4, 45], [8.4, 135], [9, -162], [9, 162]]) {
    const [x, z] = on(r, a), g = new Group(); g.position.set(x, 0, z); g.rotation.y = -rad(a); scene.add(g);
    kit(g).box(3.0, 0.4, 0.9, flowers, [0, 0.2, 0]);
    const c = Math.cos(-rad(a)), s = Math.sin(-rad(a));
    for (const lx of [-1, 0, 1]) circles.push([x + lx * c, z - lx * s, 0.6]);
  }

  // somewhere to sit and hop on the paving
  for (const [r, a] of [[3.6, 20], [4.2, -70], [3.4, 150], [8, 10], [3.8, -150], [5, 100]]) { const [x, z] = on(r, a); perches.push({ x, y: 0, z }); }

  const birds = makeBirds(T, scene, perches, sadie);
  return { update: birds.update, faces: birds.meshes, circles };
}

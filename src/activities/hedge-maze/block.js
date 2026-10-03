// The hedge maze from outside: a block of clipped hedge in the grounds beside the house, from the
// front garden back to the backyard, with a leafy arch and a garden gate at each end (the front
// one's sign says ENTRANCE, the backyard's says NO ENTRY, which nobody minds), and a little path to
// each: off the main path just before the porch, and off the backyard's path. Inside it's much
// bigger than this (room.js).
//
// Built into the outside's own scene, in a group of its own (the clubhouse hands the room this place and
// its spot in the grounds); each gate is a doorway into the maze, like every door in the clubhouse.
import { Group, Mesh, TorusGeometry, DoubleSide } from 'three';

export const DW = 1.6, DH = 2.3, TRIM = 0x2a5a2a;   // the gates, and their frames' colour

export function buildBlock(m, A) {
  const { T, psx, keep, kit, wallGeometry, doorway, outside, ground } = m;
  const scene = new Group(); outside.add(scene);
  const { add, box, plane } = kit(scene);
  const x0 = ground.x - ground.w / 2, x1 = ground.x + ground.w / 2, z0 = ground.z - ground.d / 2, z1 = ground.z + ground.d / 2;
  const H = 2.8, gx = ground.x;
  const hedge = (w, h) => psx(A.hedge, { rx: w / 1.2, ry: h / 1.2 });
  const holed = psx(A.hedge, { rx: 1 / 1.2, ry: 1 / 1.2 });   // (a wall with a hole's texture is in metres already)
  // the block: four sides of hedge (a hole in each end for its gate) and a clipped top
  const front = add(new Mesh(wallGeometry(ground.w, H, DW, DH), holed), [gx, 0, z0], [0, Math.PI, 0]);
  const rear = add(new Mesh(wallGeometry(ground.w, H, DW, DH), holed), [gx, 0, z1]);
  const sides = [-1, 1].map(s => plane(ground.d, H, hedge(ground.d, H), [s < 0 ? x0 : x1, H / 2, ground.z], [0, s * Math.PI / 2, 0]));
  const top = plane(ground.w, ground.d, hedge(ground.w, ground.d), [gx, H, ground.z], [-Math.PI / 2, 0, 0], 4);
  // each end: a leafy arch over the gate, its sign on a post, and the gate (a doorway into the maze)
  const gates = {};
  for (const [name, z, yaw, sign] of [['door', z0, Math.PI, A.signIn], ['back', z1, 0, A.signOut]]) {
    const out = name === 'door' ? -1 : 1;   // (which way is out, along z)
    for (const s of [-1, 1]) box(0.45, H + 0.1, 0.5, hedge(0.45, H), [gx + s * (DW / 2 + 0.22), (H + 0.1) / 2, z + out * 0.2]);
    const arch = new Mesh(keep(new TorusGeometry(DW / 2 + 0.22, 0.24, 4, 10, Math.PI)), hedge(3, 0.6));
    arch.position.set(gx, H - 0.35, z + out * 0.2); arch.rotation.y = yaw; scene.add(arch);
    box(0.1, 1.5, 0.1, psx(T.wood, { tint: 0xffe0c0 }), [gx + 2.1, 0.75, z + out * 0.9]);
    plane(1.5, 0.5, psx(sign, { unlit: 0.4, side: DoubleSide }), [gx + 2.1, 1.5, z + out * 0.96], [0, yaw, 0], 1);
    const d = doorway(scene, { pos: [gx, 0, z], yaw, w: DW, h: DH, leaves: [{ front: A.gateL, back: A.gateR }, { front: A.gateR, back: A.gateL }], trim: TRIM });
    d.see.position.y += 0.03;   // (a hair above the grass, which runs on under the block)
    gates[name] = d;
  }
  // the little paths: off the main path just before the porch to the front gate, and from the
  // backyard's path to the back one (where they join the outside's paths, its spot says: `joins`)
  const path = (x, z, w, d) => { plane(w, d, psx(T.path, { rx: w / 1.5, ry: d / 1.5, onFloor: true }), [x, 0, z], [-Math.PI / 2, 0, 0], 4).renderOrder = -1; };
  const { front: J, back: { z: YARD } } = ground.joins, TURN = J.z;
  path((J.x + gx - 0.6) / 2, TURN, J.x - (gx - 0.6), 1.2);
  // (stopping just short of each gate: running on under it, it flickered against the maze's grass)
  const e0 = z0 - 0.08, e1 = z1 + 0.08;
  path(gx, (TURN - 0.6 + e0) / 2, 1.2, e0 - (TURN - 0.6));
  path(gx, (e1 + YARD + 0.7) / 2, 1.2, YARD + 0.7 - e1);
  // what's solid: the block and its posts
  outside.block(x0 - 0.05, x1 + 0.05, z0 - 0.45, z1 + 0.45);
  outside.blockRound(gx + 2.1, z0 - 0.9, 0.12); outside.blockRound(gx + 2.1, z1 + 0.9, 0.12);
  return {
    door: gates.door, doors: gates, group: scene,
    body: [front, rear, ...sides, top], farTint: 0x2a8a3a,
    update() {},
  };
}

// Chooter's Paint Shop from outside, on its plot along the lane: a mint shop splattered in every colour
// (its customers paint the outside too), a pink and yellow awning, its sign, two windows full of paint
// cans, a sandwich board on the path (TODAY: PAINT THE WALLS / ALSO FLOOR AND CAT?), and a giant
// paint can tipping off the roof, pouring pink down the front.
//
// Built into the outside's own scene, in a group of its own (the mansion hands the room this place
// and the plot); the front door is a doorway into the room, like every door in the mansion.
import { Group, Mesh, CylinderGeometry, BoxGeometry, DoubleSide } from 'three';

export const DW = 1.3, DH = 2.4;   // the front door

export function buildHouse(m, A) {
  const { T, psx, keep, kit, wallGeometry, doorway, outside, lot } = m;
  const scene = new Group(); outside.scene.add(scene);
  const { add, box, plane, cyl } = kit(scene);
  const hx = lot.x, hz = lot.z, W = 6.4, D = 5, H = 3.6;
  // (it faces the gate, away from the sun, so it's lit a little from within: never drab)
  const wall = (w, h) => psx(A.wall, { rx: w / 3.2, ry: h / 2.4, unlit: 0.35 });

  // ---------- the shop: four walls, a flat roof, a parapet with the sign on it ----------
  const front = add(new Mesh(wallGeometry(W, H, DW, DH), psx(A.wall, { rx: 1 / 3.2, ry: 1 / 2.4, unlit: 0.35 })), [hx, 0, hz]);
  plane(D, H, wall(D, H), [hx - W / 2, H / 2, hz - D / 2], [0, -Math.PI / 2, 0]);
  plane(D, H, wall(D, H), [hx + W / 2, H / 2, hz - D / 2], [0, Math.PI / 2, 0]);
  plane(W, H, wall(W, H), [hx, H / 2, hz - D], [0, Math.PI, 0]);
  const roof = box(W + 0.3, 0.25, D + 0.3, psx(null, { tint: 0xe8dcff }), [hx, H + 0.12, hz - D / 2]);
  box(W + 0.3, 0.9, 0.2, psx(null, { tint: 0xff8ec8, unlit: 0.3 }), [hx, H + 0.55, hz + 0.05]);
  plane(3.8, 0.87, psx(A.sign, { unlit: 0.5 }), [hx + 0.4, H + 0.55, hz + 0.17], null, 1);
  const door = doorway(scene, { pos: [hx, 0, hz], yaw: 0, w: DW, h: DH, leaves: [{ front: A.door, back: A.doorBack }], hinge: -1, trim: 0xffd23a });
  door.group.traverse(o => { if (o.material?.uniforms?.uUnlit && !o.material.uniforms.pic) o.material.uniforms.uUnlit.value = 0.3; });
  door.see.position.y += 0.03;   // (a hair above the grass, which runs on under the shop)
  for (const s of [-1, 1]) plane(1.7, 1.3, psx(A.window, { unlit: 0.5 }), [hx + s * 2.05, 1.45, hz + 0.06], null, 1);
  // the awning over the door and windows, sloping out
  plane(W - 0.4, 1.1, psx(A.awning, { rx: (W - 0.4) / 1.4, unlit: 0.35, side: DoubleSide }), [hx, DH + 0.42, hz + 0.45], [-0.75, 0, 0], 2);

  // ---------- the giant paint can on the roof, tipping over, pouring pink down the front ----------
  const can = new Group(); can.position.set(hx - 2.1, H + 0.75, hz - 0.5); can.rotation.set(0.85, 0, 0.15); scene.add(can);
  const tin = psx(null, { tint: 0xd8d8e8, unlit: 0.3 });
  const body = new Mesh(keep(new CylinderGeometry(0.62, 0.62, 1.1, 10, 1)), [psx(A.canLabel, { rx: 3, unlit: 0.35 }), psx(null, { tint: 0xff8ec8, unlit: 0.4 }), tin]);
  can.add(body);
  plane(0.42, H + 0.35, psx(A.pour, { unlit: 0.45 }), [hx - 2.1, (H + 0.35) / 2, hz + 0.1], null, 2);
  cyl(0.55, 0.6, 0.03, 10, psx(null, { tint: 0xff8ec8, unlit: 0.4 }), [hx - 2.1, 0.015, hz + 0.45]);   // the puddle

  // ---------- the path from the lane, and the sandwich board ----------
  plane(1.3, 4.8, psx(T.path, { rx: 1, ry: 3, onFloor: true }), [hx, 0, hz + 2.4 + 0.02], [-Math.PI / 2, 0, 0], 4).renderOrder = -1;
  const board = new Group(); board.position.set(hx + 1.5, 0, hz + 3.3); board.rotation.y = -0.3; scene.add(board);
  for (const [t, s] of [[A.board, 1], [A.boardBack, -1]]) {
    const face = plane(0.62, 0.85, psx(t, { unlit: 0.4 }), [0, 0, 0], null, 1);
    scene.remove(face); board.add(face);
    face.position.set(0, 0.42, s * 0.12); face.rotation.set(-s * 0.28, s < 0 ? Math.PI : 0, 0);
    // (a wooden board behind each sign, so it's a solid thing from every side, not a picture in the air)
    const back = new Mesh(keep(new BoxGeometry(0.66, 0.89, 0.03)), psx(null, { tint: 0x7a4a2a, unlit: 0.3 }));
    back.position.z = -0.02; face.add(back);
  }

  // what's solid: the shop and the board
  outside.block(hx - W / 2, hx + W / 2, hz - D, hz);
  outside.blockRound(hx + 1.5, hz + 3.3, 0.35);

  return {
    door, group: scene,
    // from far off it's drawn as a plain block: the shop itself, in the colour of its walls
    body: [front, roof], farTint: 0x9af0d0,
    // every frame: the can on the roof wobbles a little, as if it's about to go
    update(t) { can.rotation.z = 0.15 + Math.sin(t * 0.8) * 0.03; },
  };
}

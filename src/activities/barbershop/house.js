// Marbles' Cut & Curl from outside, on its plot round the town square (beside Clyde's House): a cream shop with
// pink stripes and a tiled bottom, a red and white awning, a barber pole turning by the door, its sign,
// two windows with a mirror in each, and a giant pair of scissors on the roof, snipping slowly.
//
// Built into the outside's own scene, in a group of its own (the clubhouse hands the room this place
// and the plot); the front door is a doorway into the room, like every door in the clubhouse.
import { Group, Mesh, CylinderGeometry, BoxGeometry, TorusGeometry, SphereGeometry, DoubleSide } from 'three';

export const DW = 1.3, DH = 2.4;   // the front door

export function buildHouse(m, A) {
  const { T, psx, keep, kit, wallGeometry, doorway, outside, lot } = m;
  const scene = new Group(); outside.add(scene);
  // (the plot is turned to face the middle of the town square: everything in the house is built in its own
  // terms, x across and z out from the front door, in `place`, which sits on the plot turned the way it faces)
  const place = new Group(); place.position.set(lot.x, lot.y, lot.z); place.rotation.y = lot.yaw; place.userData.turn = lot.yaw; scene.add(place);
  const { add, box, plane } = kit(place);
  const hx = 0, hz = 0, W = 6.4, D = 5, H = 3.6;
  // (it faces the gate, away from the sun, so it's lit a little from within: never drab)
  const wall = (w, h) => psx(A.wall, { rx: w / 3.2, ry: h / 2.4, unlit: 0.35 });

  // ---------- the shop: four walls, a flat roof, a parapet with the sign on it ----------
  // (each wall runs on down into the ground, and a post stands at each corner: the PS1 wobble opens
  // hairline cracks along the edges, and through them you'd see the night)
  const O = 0.12, WH = H + O;
  const front = add(new Mesh(wallGeometry(W, WH, DW, DH + O), psx(A.wall, { rx: W / 3.2, ry: WH / 2.4, unlit: 0.35 })), [hx, -O, hz]);
  plane(D, WH, wall(D, H), [hx - W / 2, (H - O) / 2, hz - D / 2], [0, -Math.PI / 2, 0]);
  plane(D, WH, wall(D, H), [hx + W / 2, (H - O) / 2, hz - D / 2], [0, Math.PI / 2, 0]);
  plane(W, WH, wall(W, H), [hx, (H - O) / 2, hz - D], [0, Math.PI, 0]);
  for (const [x, z] of [[-1, 0], [1, 0], [-1, -1], [1, -1]]) box(0.16, H + 0.1, 0.16, psx(null, { tint: 0xff4fa3, unlit: 0.35 }), [hx + x * W / 2, (H + 0.1) / 2 - 0.05, hz + z * D]);
  const roof = box(W + 0.3, 0.25, D + 0.3, psx(null, { tint: 0xe8dcff }), [hx, H + 0.12, hz - D / 2]);
  box(W + 0.3, 0.9, 0.2, psx(null, { tint: 0xffd23f, unlit: 0.3 }), [hx, H + 0.55, hz + 0.05]);
  plane(3.8, 0.87, psx(A.sign, { unlit: 0.5 }), [hx + 0.4, H + 0.55, hz + 0.17], null, 1);
  const door = doorway(scene, { pos: [lot.x, lot.y, lot.z], yaw: lot.yaw, w: DW, h: DH, leaves: [{ front: A.door, back: A.doorBack }], hinge: -1, trim: 0xffd23a });
  door.group.traverse(o => { if (o.material?.uniforms?.uUnlit && !o.material.uniforms.pic) o.material.uniforms.uUnlit.value = 0.3; });
  door.see.position.y += 0.03;   // (a hair above the grass, which runs on under the shop)
  for (const s of [-1, 1]) plane(1.7, 1.3, psx(A.window, { unlit: 0.5 }), [hx + s * 2.05, 1.45, hz + 0.06], null, 1);
  // the awning over the door and windows, sloping out
  plane(W - 0.4, 1.1, psx(A.awning, { rx: (W - 0.4) / 1.4, unlit: 0.35, side: DoubleSide }), [hx, DH + 0.42, hz + 0.45], [-0.75, 0, 0], 2);

  // ---------- the barber pole by the door, turning ----------
  const pole = new Group(); pole.position.set(hx - 1.35, 0, hz + 0.7); place.add(pole);
  const stripes = new Mesh(keep(new CylinderGeometry(0.14, 0.14, 1.7, 10, 1, true)), psx(A.pole, { rx: 1, ry: 1.7 / 1.1, unlit: 0.5 }));
  stripes.position.y = 1.05; pole.add(stripes);
  for (const y of [0.15, 1.95]) { const cap = new Mesh(keep(new CylinderGeometry(0.17, 0.17, 0.3, 10)), psx(null, { tint: 0xd8d8e8, unlit: 0.4 })); cap.position.y = y; pole.add(cap); }
  const ball = new Mesh(keep(new SphereGeometry(0.15, 8, 6)), psx(null, { tint: 0xffd23a, unlit: 0.5 })); ball.position.y = 2.2; pole.add(ball);

  // ---------- the giant scissors on the roof: they snip, slowly ----------
  const scissors = new Group(); scissors.position.set(hx, H + 1.4, hz - 1.6); place.add(scissors);
  const steel = psx(null, { tint: 0xd8d8e8, unlit: 0.4 }), grip = psx(null, { tint: 0xe8202a, unlit: 0.4 });
  const blades = [];
  for (const s of [-1, 1]) {
    const half = new Group(); scissors.add(half);
    const blade = new Mesh(keep(new BoxGeometry(0.18, 1.7, 0.08)), steel); blade.position.y = 0.9; half.add(blade);
    const handle = new Mesh(keep(new BoxGeometry(0.1, 0.9, 0.08)), steel); handle.position.y = -0.45; half.add(handle);
    const ring = new Mesh(keep(new TorusGeometry(0.28, 0.07, 5, 10)), grip); ring.position.set(s * 0.02, -1.1, 0); half.add(ring);
    blades.push([half, s]);
  }
  box(1.4, 1.1, 1.4, psx(null, { tint: 0x9a6a3a, unlit: 0.3 }), [hx, H + 0.9, hz - 1.6]);   // its stand

  // ---------- the path from the square ----------
  plane(1.3, 4.8, psx(T.path, { rx: 1, ry: 3, onFloor: true }), [hx, 0, hz + 2.4 + 0.02], [-Math.PI / 2, 0, 0], 4).renderOrder = -1;

  // what's solid: the shop and the pole
  lot.block(hx - W / 2, hx + W / 2, hz - D, hz);
  lot.blockRound(hx - 1.35, hz + 0.7, 0.3);

  return {
    door, group: scene,
    // from far off it's drawn as a plain block: the shop itself, in the colour of its walls
    body: [front, roof], farTint: 0xffd5ea,
    // every frame: the pole turns, the scissors open and shut (slowly: a snip every few seconds)
    update(t) {
      stripes.rotation.y = t * 0.5;
      const open = 0.12 + 0.14 * Math.max(0, Math.sin(t * 1.3));
      for (const [half, s] of blades) half.rotation.z = s * open;
    },
  };
}

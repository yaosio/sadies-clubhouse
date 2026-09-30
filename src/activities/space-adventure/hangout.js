// Sadie's space room: where the door opens once you've been on the trip. A perfectly ordinary space
// room: starry wallpaper, glow-in-the-dark stars on the ceiling, a ringed-planet rug, a planet mobile,
// a SPACE! poster, and a big round window onto space. Sadie sits by a radio in her space helmet, a
// speech bubble over her head saying I LOVE SPACE!, and the radio plays the happy version of the trip's
// song. The big red button under the FUN SPACE ADVENTURE sign sends you on the trip again.
import { Group, Mesh, PlaneGeometry, RingGeometry, Shape, Path, ShapeGeometry, Vector3, DoubleSide } from 'three';
import { RD } from './trip.js';

export const HW = 4.2, HD = 5.5, HH = 3.4;   // the room: half its width, how far it goes (from the door's wall at -RD), its height
export const RADIO = new Vector3(2.6, 0.95, 2.6), BUTTON = new Vector3(-2.2, 1.05, 1.6), CUSHION = new Vector3(1.6, 0, 3.0);
const BACK = -RD, FRONT = -RD + 2 * HD;

export function buildHangout(m, P, T) {
  const { psx, kit, wallGeometry, keep } = m;
  const room = new Group();
  const { add, box, plane, cyl, ball } = kit(room);
  const wall = (w, h) => psx(P.wall, { rx: w / 1.4, ry: h / 1.4 });
  const mid = (BACK + FRONT) / 2;
  plane(2 * HW, 2 * HD, psx(P.floor, { rx: 2 * HW / 1.2, ry: 2 * HD / 1.2 }), [0, 0, mid], [-Math.PI / 2, 0, 0], 8).renderOrder = -2;
  plane(2 * HW, 2 * HD, psx(P.ceiling, { rx: 2 * HW / 1.5, ry: 2 * HD / 1.5, unlit: 0.4 }), [0, HH, mid], [Math.PI / 2, 0, 0], 6);
  add(new Mesh(wallGeometry(2 * HW, HH, 1.5, 2.45), wall(2 * HW, HH)), [0, 0, BACK]);
  for (const s of [-1, 1]) plane(2 * HD, HH, wall(2 * HD, HH), [s * HW, HH / 2, mid], [0, -s * Math.PI / 2, 0], 4);
  // the far wall, with a big round window in it onto space
  const W = new Shape(); W.moveTo(-HW, 0); W.lineTo(HW, 0); W.lineTo(HW, HH); W.lineTo(-HW, HH); W.lineTo(-HW, 0);
  const hole = new Path(); hole.absarc(0, 1.8, 1.1, 0, Math.PI * 2, true); W.holes.push(hole);
  const far = new Mesh(keep(new ShapeGeometry(W, 12)), wall(2 * HW, HH)); far.position.set(0, 0, FRONT); far.rotation.y = Math.PI; room.add(far);
  const ring = new Mesh(keep(new RingGeometry(1.1, 1.25, 20)), psx(null, { tint: 0xc8c6e0 })); ring.position.set(0, 1.8, FRONT - 0.04); ring.rotation.y = Math.PI; room.add(ring);
  // a silver rail round the walls (under the window)
  // (on the door's wall, in two pieces either side of the doorway, so it doesn't cross it)
  const GAP = 0.85, side = HW - GAP;
  for (const [w, pos, rot] of [[side, [-(GAP + side / 2), 0.55, BACK + 0.04], 0], [side, [GAP + side / 2, 0.55, BACK + 0.04], 0], [2 * HW, [0, 0.55, FRONT - 0.04], Math.PI], [2 * HD, [-HW + 0.04, 0.55, mid], Math.PI / 2], [2 * HD, [HW - 0.04, 0.55, mid], -Math.PI / 2]])
    plane(w, 0.08, psx(null, { tint: 0xc8c6e0, decal: true }), pos, [0, rot, 0], 2);
  // the rug, and the poster
  plane(3.4, 3.4, psx(P.rug, { onFloor: true }), [0, 0, 1.2], [-Math.PI / 2, 0, 0], 4).renderOrder = -1;
  plane(0.9, 1.24, psx(P.poster, { decal: true }), [HW - 0.05, 1.9, -0.6], [0, -Math.PI / 2, 0], 2);
  // a lamp
  cyl(0.3, 0.45, 0.3, 8, psx(null, { tint: 0xfff08a, unlit: 0.9 }), [0, HH - 0.15, 0.5]);

  // the planet mobile, hanging from the ceiling and turning slowly
  const mobile = new Group(); mobile.position.set(-0.4, HH, 3.2); room.add(mobile);
  { const k = kit(mobile);
    k.cyl(0.015, 0.015, 0.5, 4, psx(null, { tint: 0x8a88a8 }), [0, -0.25, 0]);
    k.box(2.2, 0.03, 0.03, psx(null, { tint: 0x8a88a8 }), [0, -0.5, 0]);
    k.box(0.03, 0.03, 2.2, psx(null, { tint: 0x8a88a8 }), [0, -0.5, 0]);
    for (const [x, z, r, col, len] of [[1.1, 0, 0.18, 0xff9a5a, 0.5], [-1.1, 0, 0.12, 0x58c8f0, 0.7], [0, 1.1, 0.14, 0x58d04a, 0.4], [0, -1.1, 0.1, 0xe0509a, 0.6]]) {
      k.cyl(0.008, 0.008, len, 3, psx(null, { tint: 0x8a88a8 }), [x, -0.5 - len / 2, z]);
      k.ball(r, psx(null, { tint: col }), [x, -0.5 - len - r, z]);
    }
    k.ball(0.26, psx(null, { tint: 0xffd23a, unlit: 0.8 }), [0, -0.85, 0]);
  }

  // the radio on its little table, and the notes that float up out of it while it plays
  const table = psx(T.wood, { rx: 1, tint: 0xc8a0ff });
  box(1.0, 0.06, 0.6, table, [RADIO.x, 0.72, RADIO.z]);
  for (const [dx, dz] of [[-0.42, -0.24], [0.42, -0.24], [-0.42, 0.24], [0.42, 0.24]]) box(0.05, 0.72, 0.05, table, [RADIO.x + dx, 0.36, RADIO.z + dz]);
  box(0.8, 0.4, 0.26, psx(null, { tint: 0xc02a3a }), [RADIO.x, 0.95, RADIO.z]);
  plane(0.78, 0.39, psx(P.radio, { unlit: 0.3 }), [RADIO.x, 0.95, RADIO.z - 0.135], [0, Math.PI, 0], 1);
  box(0.5, 0.05, 0.05, psx(null, { tint: 0x5e5c80 }), [RADIO.x, 1.18, RADIO.z]);
  cyl(0.01, 0.01, 0.6, 3, psx(null, { tint: 0xc8c6e0 }), [RADIO.x + 0.3, 1.45, RADIO.z], [0, 0, -0.3]);
  const notes = Array.from({ length: 4 }, (_, i) => {
    const n = new Mesh(keep(new PlaneGeometry(0.16, 0.2)), psx(P.note, { unlit: 1, side: DoubleSide })); room.add(n); n.visible = false;
    return { n, k: i / 4 };
  });

  // Sadie, on a cushion by the radio, in her space helmet; and her speech bubble
  cyl(0.45, 0.5, 0.18, 10, psx(T.velvet, { rx: 3, tint: 0xff8ec8 }), [CUSHION.x, 0.09, CUSHION.z]);
  const helmet = P.helmet, blink = P.helmetBlink(T.nap.image);
  const sadie = new Mesh(keep(new PlaneGeometry(0.86, 0.75, 1, 1).translate(0, 0.37, 0)), psx(helmet, { unlit: 0.35 }));
  sadie.position.set(CUSHION.x, 0.17, CUSHION.z); room.add(sadie);
  const bubble = new Mesh(keep(new PlaneGeometry(1.1, 0.41)), psx(P.bubble, { unlit: 0.8 }));
  bubble.position.set(CUSHION.x - 0.2, 1.3, CUSHION.z); room.add(bubble);

  // the big red button on its stand, and its sign
  const stand = psx(null, { tint: 0x5e5c80 });
  cyl(0.3, 0.38, 0.9, 8, stand, [BUTTON.x, 0.45, BUTTON.z]);
  cyl(0.34, 0.34, 0.06, 8, psx(null, { tint: 0xffd23a }), [BUTTON.x, 0.93, BUTTON.z]);
  const knob = cyl(0.2, 0.22, 0.12, 10, psx(null, { tint: 0xe83a3a }), [BUTTON.x, 1.02, BUTTON.z]);
  ball(0.2, psx(null, { tint: 0xff5a5a }), [BUTTON.x, 1.08, BUTTON.z], 0.4);
  for (const dx of [-0.6, 0.6]) cyl(0.03, 0.03, 2.3, 4, stand, [BUTTON.x + dx, 1.15, BUTTON.z + 0.42]);   // (behind the sign, as you look at it)
  const sign = new Mesh(keep(new PlaneGeometry(1.5, 0.6)), psx(P.sign, { unlit: 0.4, side: DoubleSide }));
  sign.position.set(BUTTON.x, 2.1, BUTTON.z + 0.36); sign.rotation.y = Math.PI; room.add(sign);
  // a telescope at the window, and a toy rocket
  cyl(0.06, 0.1, 1.0, 6, psx(null, { tint: 0xffd23a }), [1.3, 1.25, FRONT - 1.0], [0.9, 0, 0]);
  for (const s of [-1, 1]) cyl(0.02, 0.02, 1.1, 3, stand, [1.3 + s * 0.25, 0.5, FRONT - 1.2], [0, 0, s * 0.25]);
  cyl(0.02, 0.02, 1.1, 3, stand, [1.3, 0.5, FRONT - 1.45], [0.25, 0, 0]);
  cyl(0.12, 0.12, 0.5, 8, psx(null, { tint: 0xffffff }), [-3.3, 0.3, 4.6]);
  m.kit(room).cone(0.12, 0.22, 8, psx(null, { tint: 0xe83a3a }), [-3.3, 0.66, 4.6]);

  // the floor you can walk on: the room, less the table, the button's stand and Sadie's cushion
  const P2 = 0.35;
  const floor = (x, z) => {
    if (Math.abs(x) > HW - P2 || z < BACK + P2 - 0.01 || z > FRONT - P2) return null;
    if (Math.abs(x - RADIO.x) < 0.5 + P2 && Math.abs(z - RADIO.z) < 0.3 + P2) return null;
    if (Math.hypot(x - BUTTON.x, z - BUTTON.z) < 0.38 + P2) return null;
    if (Math.hypot(x - CUSHION.x, z - CUSHION.z) < 0.5 + P2) return null;
    if (Math.abs(z - (FRONT - 1.2)) < 0.4 + P2 && Math.abs(x - 1.3) < 0.4 + P2) return null;
    return 0;
  };
  function update(t, playing, dt) {
    mobile.rotation.y = t * 0.15;
    // Sadie bobs along while the radio plays, and blinks now and then
    sadie.rotation.z = playing ? Math.sin(t * Math.PI * 112 / 60) * 0.06 : 0;
    sadie.material.uniforms.map.value = (t % 4.3) < 0.15 ? blink : helmet;
    bubble.position.y = 1.3 + Math.sin(t * 1.5) * 0.03;
    for (const o of notes) {
      o.k += dt * 0.35; if (o.k > 1) o.k -= 1;
      o.n.visible = playing;
      o.n.position.set(RADIO.x + Math.sin(o.k * 9 + o.k) * 0.15 - 0.1, 1.25 + o.k * 1.1, RADIO.z - 0.1);
    }
    knob.position.y = 1.02;
  }
  return { group: room, floor, update, faces: [sadie, bubble, ...notes.map(o => o.n)], knob };
}

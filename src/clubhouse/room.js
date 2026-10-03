// The room for an activity played at a computer, behind its door on the landing: a small den with a
// desk and an old computer, its box's picture on the screen and a poster of it on the wall. The activities are
// programs, so you play one at its computer. (Each room is its own place: it can be any size, and
// one day any shape.)
import { Mesh, Scene, Color, Vector3 } from 'three';
import { psx, picture, doorBack } from './look.js';
import { kit, wallGeometry, doorway, WALKER } from './build.js';

const W = 3.5, D = 4, H = 3.2;   // half its width and depth, and its height

export function buildRoom(T, card, boxImage, doorImage) {
  const scene = new Scene(); scene.background = new Color(0x0a0628);
  const { add, box, plane, cyl } = kit(scene);
  const col = card.box?.side ?? 0x8a78ff;
  const paper = psx(T.damask, { rx: 1 / 1.3, ry: 1 / 1.3, tint: mixWhite(col, 0.72) });
  // walls: the one with the door is at the front (z = -D), the desk against the back
  add(new Mesh(wallGeometry(2 * W, H, 1.5, 2.45), paper), [0, 0, -D]);
  add(new Mesh(wallGeometry(2 * W, H), paper), [0, 0, D], [0, Math.PI, 0]);
  add(new Mesh(wallGeometry(2 * D, H), paper), [-W, 0, 0], [0, Math.PI / 2, 0]);
  add(new Mesh(wallGeometry(2 * D, H), paper), [W, 0, 0], [0, -Math.PI / 2, 0]);
  plane(2 * W, 2 * D, psx(T.wood, { rx: 2 * W / 1.2, ry: 2 * D / 1.2 }), [0, 0, 0], [-Math.PI / 2, 0, 0], 8).renderOrder = -2;
  plane(2 * W, 2 * D, psx(null, { tint: 0xfff3ea }), [0, H, 0], [Math.PI / 2, 0, 0], 6);
  plane(3.2, 2.4, psx(T.carpet, { rx: 4, ry: 3, onFloor: true }), [0, 0, 0.4], [-Math.PI / 2, 0, 0], 4).renderOrder = -1;
  // the same door as on the landing, seen from this side (so it's hinged on the other side)
  const door = doorway(scene, { pos: [0, 0, -D], yaw: 0, w: 1.5, h: 2.45, leaves: [doorImage ? { front: doorBack(doorImage), back: picture(doorImage) } : T.leafL], hinge: 1 });
  const art = boxImage ? picture(boxImage) : T.dark;
  // the poster on the side wall, and a lamp
  plane(1.3, 1.43, psx(art, { decal: true, unlit: 0.2 }), [-W + 0.05, 1.7, 0.6], [0, Math.PI / 2, 0], 2);
  cyl(0.25, 0.35, 0.3, 8, psx(null, { tint: 0xfff08a, unlit: 0.8 }), [0, H - 0.15, 0.5]);

  // the desk and the computer: a beige monitor with the program's picture on its screen
  const beige = psx(T.beige, { rx: 2, ry: 2, tint: 0xe0d0a8 });
  box(2.4, 0.08, 1.0, psx(T.wood, { rx: 2 }), [0, 0.76, D - 0.6]);
  for (const x of [-1.1, 1.1]) box(0.08, 0.74, 0.9, psx(T.wood), [x, 0.37, D - 0.6]);
  box(0.62, 0.5, 0.55, beige, [0, 1.07, D - 0.55]);
  box(0.4, 0.06, 0.3, beige, [0, 0.83, D - 0.55]);
  const screen = plane(0.48, 0.38, psx(art, { unlit: 0.85 }), [0, 1.08, D - 0.55 - 0.28], [0, Math.PI, 0], 1);
  plane(0.6, 0.2, psx(T.keys, { decal: true }), [0, 0.81, D - 1.0], [-Math.PI / 2, 0, 0], 1);
  box(0.62, 0.05, 0.3, beige, [0.95, 0.83, D - 0.55]);                  // the box of floppies' drive
  // a chair, pushed back
  const seat = psx(T.velvet, { rx: 1, ry: 1, tint: col });
  box(0.5, 0.08, 0.5, seat, [1.6, 0.48, D - 1.6], [0, 0.5, 0]); box(0.5, 0.55, 0.06, seat, [1.73, 0.78, D - 1.83], [0, 0.5, 0]);
  cyl(0.03, 0.03, 0.44, 4, psx(null, { tint: 0x333344 }), [1.6, 0.22, D - 1.6]);

  const P = WALKER;
  function floor(x, z) {
    if (Math.abs(x) > W - P || z < -D + P || z > D - P) return null;
    if (z > D - 1.1 - P && Math.abs(x) < 1.2 + P) return null;       // the desk
    if (Math.hypot(x - 1.6, z - D + 1.6) < 0.35 + P) return null;    // the chair
    return 0;
  }
  const where = screen.getWorldPosition(new Vector3());
  return {
    name: 'room:' + card.id, card, scene, floor, doors: { door }, faces: [],
    screen: where,
    uses: [{ pos: where, reach: 2.6, label: 'PLAY ' + card.name.toUpperCase(), card }],
    light: { sun: 0.2, bulb: 0.75, lamp: [0, H - 0.4, 0.5] },
    spots: { computer: { x: 0, z: D - 2.6, yaw: Math.PI, pitch: -0.18, y: 0 } },
    update() {},
  };
}

function mixWhite(c, k) {
  const r = (c >> 16) & 255, g = (c >> 8) & 255, b = c & 255, m = v => Math.round(v + (255 - v) * k);
  return (m(r) << 16) | (m(g) << 8) | m(b);
}

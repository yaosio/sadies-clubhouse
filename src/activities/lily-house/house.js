// Lily's house from outside, on her ledge at the top of Dog City's hydrant: a peach cottage with pink
// scalloped shingles like icing, orange trim, two round windows and an orange front door. A big bow on
// the front gable, the same colour as the one in her hair today. A rubber chicken for a weathervane, a
// trampoline in the yard (with a chicken on it), flower pots, a HI! HI! HI! doormat and her sign.
// Through the round window left of the door: Lily, jumping up to see out, again and again.
//
// Built into the outside's own scene, in a group of its own on the plot (x across, z out from the
// front door, towards the hydrant). The front door is a doorway into the room. Her bow is pink or
// orange, picked as the house is built (each time you play), and the room inside wears the same one
// (`shared.bow`).
import { Group, Mesh, Shape, Path, ShapeGeometry, PlaneGeometry, CircleGeometry, DoubleSide } from 'three';
import { BOW_HEX } from './art.js';

export const DW = 1.3, DH = 2.4;                       // the front door
const W = 9, D = 7.5, H1 = 3.4, RH = 3.2;             // the house: width, depth, walls, the roof's rise
export const WIN = [{ x: -2.7, y: 1.75, r: 0.85, lily: true }, { x: 2.7, y: 1.75, r: 0.85 }];
const DOT = 0.022;                                     // her window picture: 56 dots, about 1.2 m
export const TR = { x: 3.4, z: 3.6, r: 1.25, y: 0.42 };   // the trampoline in her yard (its mat's height: low enough to step up onto)
const HOME = 'room:lily-house';                        // her room inside (the card's id): while you're in there, so is she

export function buildHouse(m, A, poses) {
  const { psx, keep, kit, doorway, outside, lot } = m;
  const scene = new Group(); outside.add(scene);
  const place = new Group(); place.position.set(lot.x, lot.y, lot.z); place.rotation.y = lot.yaw; place.userData.turn = lot.yaw; scene.add(place);
  const { add, box, plane, cyl } = kit(place);
  const siding = psx(A.siding, { rx: 1 / 1.6, ry: 1 / 1.6, unlit: 0.35, side: DoubleSide });
  const trim = psx(null, { tint: 0xff9a3a, unlit: 0.35 });
  const shape = (pts, holes = []) => { const s = new Shape(pts.map(([x, y]) => ({ x, y }))); for (const h of holes) s.holes.push(h); return keep(new ShapeGeometry(s, 24)); };
  const circle = (x, y, r) => { const p = new Path(); p.absarc(x, y, r, 0, Math.PI * 2, true); return p; };

  // ---------- the walls: the front with the door and two round windows in it, the gable above ----------
  // (the door's hole is a notch up from the ground: a hole can't touch the wall's edge)
  const front = add(new Mesh(shape([[-W / 2, 0], [-DW / 2, 0], [-DW / 2, DH], [DW / 2, DH], [DW / 2, 0], [W / 2, 0], [W / 2, H1], [0, H1 + RH], [-W / 2, H1]], WIN.map(w => circle(w.x, w.y, w.r))), siding), [0, 0, 0]);
  add(new Mesh(shape([[-W / 2, 0], [W / 2, 0], [W / 2, H1], [0, H1 + RH], [-W / 2, H1]]), siding), [0, 0, -D], [0, Math.PI, 0]);
  for (const s of [-1, 1]) plane(D, H1, psx(A.siding, { rx: D / 1.6, ry: H1 / 1.6, unlit: 0.35 }), [s * W / 2, H1 / 2, -D / 2], [0, s * Math.PI / 2, 0]);
  // orange trim: the corners, along the eaves
  for (const s of [-1, 1]) box(0.18, H1, 0.18, trim, [s * W / 2, H1 / 2, 0.02]);
  const ex = W / 2 + 0.5, slope = Math.hypot(ex, RH + 0.36), ang = Math.atan2(RH + 0.36, ex);
  // ---------- the roof: pink scallops, a slope each side ----------
  for (const s of [-1, 1]) {
    const g = new Group(); g.position.set(s * ex / 2, H1 - 0.36 + (RH + 0.36) / 2, -D / 2); g.rotation.z = -s * ang; place.add(g);
    const r = new Mesh(keep(new PlaneGeometry(slope + 0.2, D + 0.8, 4, 4)), psx(A.shingles, { rx: slope / 1.2, ry: (D + 0.8) / 1.2, side: DoubleSide, unlit: 0.2 }));
    r.rotation.x = -Math.PI / 2; g.add(r);
    // the trim along the front edge of the roof
    const t = new Mesh(keep(new PlaneGeometry(slope + 0.2, 0.22)), psx(null, { tint: 0xff9a3a, unlit: 0.4, side: DoubleSide })); t.position.set(0, -0.11, 0.4 + D / 2 + 0.01); g.add(t);
  }
  // the door
  const dw = doorway(scene, { pos: [lot.x, lot.y, lot.z], yaw: lot.yaw, w: DW, h: DH, leaves: [{ front: A.door, back: A.doorBack }], hinge: -1, trim: 0xff9a3a });
  dw.see.position.y += 0.03;
  // a little roof over the door
  box(2.0, 0.12, 0.9, psx(A.shingles, { rx: 1.5, ry: 0.6, unlit: 0.2 }), [0, DH + 0.35, 0.45]);
  for (const s of [-1, 1]) box(0.1, 0.4, 0.1, trim, [s * 0.9, DH + 0.15, 0.8]);

  // ---------- the round windows: a frame, and a nook behind each (hers with a cushion; the other, curtains and a lamp) ----------
  const lily = new Mesh(keep(new PlaneGeometry(56 * DOT, 56 * DOT)), psx(poses.pink.window, { unlit: 0.45 }));
  for (const w of WIN) {
    plane(w.r * 2 + 0.24, w.r * 2 + 0.24, psx(A.ring, { unlit: 0.4, decal: true }), [w.x, w.y, 0.05], null, 1);
    const nd = 0.9;
    plane(w.r * 2 + 0.2, w.r * 2 + 0.2, psx(A.nook, { rx: 1.5, ry: 1.5, unlit: 0.5 }), [w.x, w.y, -nd]);
    for (const s of [-1, 1]) plane(nd, w.r * 2 + 0.2, psx(A.nook, { unlit: 0.4, side: DoubleSide }), [w.x + s * (w.r + 0.1), w.y, -nd / 2], [0, Math.PI / 2, 0]);
    plane(w.r * 2 + 0.2, nd, psx(A.nook, { unlit: 0.3, side: DoubleSide }), [w.x, w.y + w.r + 0.1, -nd / 2], [Math.PI / 2, 0, 0]);
    box(w.r * 2 + 0.2, 0.06, nd, psx(A.bed, { rx: 2, unlit: 0.45 }), [w.x, w.y - w.r - 0.05, -nd / 2]);   // the sill: her cushion
    if (w.lily) { lily.position.set(w.x, w.y - 1.4, -0.45); place.add(lily); w.base = w.y; }
    else {
      for (const s of [-1, 1]) plane(0.5, w.r * 2, psx(A.curtain, { unlit: 0.45 }), [w.x + s * (w.r - 0.2), w.y, -0.3], null, 1);
      add(new Mesh(keep(new CircleGeometry(0.22, 10)), psx(null, { tint: 0xfff08a, unlit: 1 })), [w.x, w.y + 0.1, -0.8]);
    }
  }

  // ---------- the bow on the gable: today's colour, like the one in her hair ----------
  const bowA = psx(null, { tint: BOW_HEX.pink[0], unlit: 0.45, side: DoubleSide }), bowB = psx(null, { tint: BOW_HEX.pink[1], unlit: 0.45, side: DoubleSide });
  const by = H1 + 1.15;
  for (const s of [-1, 1]) {
    add(new Mesh(shape([[0, 0], [s * 1.5, 0.75], [s * 1.6, -0.6]]), bowA), [0, by, 0.15]);
    add(new Mesh(shape([[0, -0.1], [s * 0.7, -1.2], [s * 0.35, -1.25]]), bowB), [0, by, 0.12]);
  }
  add(new Mesh(keep(new CircleGeometry(0.28, 10)), bowB), [0, by, 0.2]);

  // ---------- the weathervane: a rubber chicken on a pole, turning in the wind ----------
  cyl(0.04, 0.04, 1.3, 5, psx(null, { tint: 0x8a8aa0 }), [0, H1 + RH + 0.6, -D / 2]);
  const vane = new Group(); vane.position.set(0, H1 + RH + 1.35, -D / 2); place.add(vane);
  vane.add(new Mesh(keep(new PlaneGeometry(1.2, 0.6)), psx(A.chicken, { unlit: 0.5, side: DoubleSide })));

  // ---------- the yard: trampoline (with her chicken on it), flower pots, doormat, her sign ----------
  // (low enough to step up onto, and springy: stand on it and you bounce, the chicken with you)
  for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + 0.4; box(0.08, TR.y - 0.05, 0.08, psx(null, { tint: 0x8a8aa0 }), [TR.x + Math.cos(a) * TR.r * 0.9, (TR.y - 0.05) / 2, TR.z + Math.sin(a) * TR.r * 0.9]); }
  cyl(TR.r, TR.r, 0.14, 16, psx(A.pad, { rx: 6, unlit: 0.4, side: DoubleSide }), [TR.x, TR.y - 0.06, TR.z], null, true);   // (both sides: its far edge is seen from inside)
  add(new Mesh(keep(new CircleGeometry(TR.r * 0.86, 16)), psx(A.mat2, { rx: 2, ry: 2, unlit: 0.3 })), [TR.x, TR.y - 0.06, TR.z], [-Math.PI / 2, 0, 0]);
  const toy = new Mesh(keep(new PlaneGeometry(0.64, 0.32).translate(0, 0.16, 0)), psx(A.chicken, { unlit: 0.5, side: DoubleSide }));
  toy.position.set(TR.x - 0.2, TR.y - 0.05, TR.z + 0.1); place.add(toy);
  // on it, in the house's own terms (x across, z out from the door), from where you are out there
  const c = Math.cos(lot.yaw), s = Math.sin(lot.yaw);
  const local = (x, z) => { const dx = x - lot.x, dz = z - lot.z; return [dx * c - dz * s, dx * s + dz * c]; };
  const onIt = (x, z) => { const [lx, lz] = local(x, z); return Math.hypot(lx - TR.x, lz - TR.z) < TR.r - 0.15; };
  outside.surface((x, z) => onIt(x, z) ? lot.y + TR.y : null);
  outside.bounce((x, z, y) => onIt(x, z) && Math.abs(y - lot.y - TR.y) < 0.05);
  for (const s of [-1, 1]) {
    cyl(0.28, 0.2, 0.4, 8, psx(A.pot, { unlit: 0.4 }), [s * 1.25, 0.2, 0.45]);
    plane(0.7, 0.6, psx(A.flowers, { unlit: 0.4, side: DoubleSide }), [s * 1.25, 0.65, 0.45], null, 1);
  }
  const mat = plane(1.6, 0.4, psx(A.mat, { unlit: 0.4, onFloor: true }), [0, 0.02, 0.45], [-Math.PI / 2, 0, 0], 1);
  mat.renderOrder = -1;
  for (const s of [-1, 1]) box(0.12, 1.3, 0.12, psx(null, { tint: 0x7a4a2a }), [-3.6 + s * 0.6, 0.65, 2.4]);
  plane(1.6, 0.6, psx(A.sign, { unlit: 0.4, side: DoubleSide }), [-3.6, 1.2, 2.5], null, 1);

  // what's solid: the house, the sign posts, the pots (the trampoline you can climb on)
  lot.block(-W / 2, W / 2, -D, 0);
  for (const s of [-1, 1]) lot.blockRound(s * 1.25, 0.45, 0.3);
  lot.blockRound(-3.6, 2.4, 0.8);

  // ---------- Lily in her window: jumping up to see out ----------
  // In bursts of three to six jumps, a rest between; when you're up on her ledge, she never stops.
  // She looks your way at the top of each jump.
  const win = WIN[0];
  let jumps = 4, rest = 0, t0 = 0;
  const shared = { bow: Math.random() < 0.5 ? 'pink' : 'orange' };
  bowA.uniforms.tint.value.setHex(BOW_HEX[shared.bow][0]); bowB.uniforms.tint.value.setHex(BOW_HEX[shared.bow][1]);
  return {
    shared, door: dw, group: scene, body: [front], farTint: 0xffc89e,
    update(t, dt, ears) {
      vane.rotation.y = Math.sin(t * 0.3) * 1.2 + Math.sin(t * 0.83) * 0.4;
      // her chicken on the trampoline: tossed up and down as you bounce (it lands as you do)
      const hop = ears && outside.is(ears.place) && onIt(ears.x, ears.z) ? ears.hop || 0 : 0;
      toy.position.y = TR.y - 0.05 + hop * 0.7; toy.rotation.z = hop * 0.8;
      // (in her house, she's in there with you: there's only one Lily)
      lily.visible = ears?.place?.name !== HOME;
      if (!lily.visible) return;
      // where you are, in the house's own terms (anywhere but outside, she can't see you)
      const out = ears && outside.is(ears.place);
      const dx = out ? ears.x - lot.x : 0, dz = out ? ears.z - lot.z : 99, lx = dx * c - dz * s, lz = dx * s + dz * c;
      const near = out && Math.abs(ears.y - 1.6 - lot.y) < 3 && Math.hypot(lx, lz) < 14;
      const T = 0.62;   // one jump
      if (rest > 0) { rest -= dt; if (rest <= 0) { t0 = t; jumps = near ? 99 : 3 + Math.floor(Math.random() * 4); } lily.position.y = win.base - 1.5; return; }
      const k = (t - t0) / T, n = Math.floor(k), f = k - n;
      if (n >= jumps && !near) { rest = 1.5 + Math.random() * 2.5; return; }
      const h = Math.sin(f * Math.PI);   // up and down again
      lily.position.y = win.base - 1.5 + h * 1.55;
      const look = lx < win.x - 3 ? 'windowL' : lx > win.x + 3 ? 'windowR' : 'window';
      lily.material.uniforms.map.value = poses[shared.bow][h > 0.85 ? (near ? look : 'windowFly') : 'windowFly'];
    },
  };
}

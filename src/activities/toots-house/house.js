// Toots' house from outside, on its plot round the town square (next to Chooter's Paint Shop): an
// ordinary two-story house, sky-blue siding, white trim, a red shingle roof, that's plainly a dog's.
// Bone shutters, a red door with a dog flap, WELCOME EVERYBODY on the mat, paw-print stepping stones,
// tennis balls stuck in the gutter, a tennis-ball attic window, her mailbox, a fire hydrant on the lawn
// for an ornament, and a little guest house (a doghouse that's a tiny copy of hers).
// Upstairs in the middle, her big window, with her in it. Round the back, a big painted-on window.
//
// Built into the outside's own scene, in a group of its own on the plot turned to face the square (x
// across, z out from the front door); the front door is a doorway into the room, like every door in the
// clubhouse. Her window: window.js says what she does, `roo()` plays her voice.
import { Group, Mesh, Shape, ShapeGeometry, PlaneGeometry, BoxGeometry, SphereGeometry, CylinderGeometry, DoubleSide } from 'three';
import { makeWatcher } from './window.js';

export const DW = 1.3, DH = 2.4;   // the front door
const W = 7.6, D = 6, H1 = 3.0, H2 = 2.8, HT = H1 + H2, RH = 2.3;   // the house: width, depth, each story, the roof
const WIN = { w: 2.1, y0: H1 + 0.55, y1: H1 + 2.15 };   // her window
const TOOTS = 1.35;   // her picture in the window, meters across (48 dots: about 3 cm a dot; bigger than life, so you can see her face from the square)
const HOME = 'room:toots-house';   // her room inside (the card's id): while you're in there, so is she

export function buildHouse(m, A, poses, roo) {
  const { T, psx, keep, kit, wallGeometry, doorway, outside, lot } = m;
  const scene = new Group(); outside.add(scene);
  const place = new Group(); place.position.set(lot.x, lot.y, lot.z); place.rotation.y = lot.yaw; place.userData.turn = lot.yaw; scene.add(place);
  const { add, box, plane } = kit(place);
  const siding = (w, h) => psx(A.siding, { rx: w / 1.6, ry: h / 1.6, unlit: 0.35 });
  const white = psx(null, { tint: 0xffffff, unlit: 0.35 });
  const mesh = (geo, mat, pos, rot) => { const o = new Mesh(keep(geo), mat); if (pos) o.position.set(...pos); if (rot) o.rotation.set(...rot); place.add(o); return o; };

  // ---------- downstairs: the front wall with the door, the sides, the back ----------
  const front = add(new Mesh(wallGeometry(W, H1, DW, DH), psx(A.siding, { rx: 1 / 1.6, ry: 1 / 1.6, unlit: 0.35 })), [0, 0, 0]);
  for (const s of [-1, 1]) plane(D, HT, siding(D, HT), [s * W / 2, HT / 2, -D / 2], [0, s * Math.PI / 2, 0]);
  plane(W, HT, siding(W, HT), [0, HT / 2, -D], [0, Math.PI, 0]);
  const door = doorway(scene, { pos: [lot.x, lot.y, lot.z], yaw: lot.yaw, w: DW, h: DH, leaves: [{ front: A.door, back: A.doorBack }], hinge: -1, trim: 0xffffff });
  door.group.traverse(o => { if (o.material?.uniforms?.uUnlit && !o.material.uniforms.pic) o.material.uniforms.uUnlit.value = 0.3; });
  door.see.position.y += 0.03;
  // windows with bone shutters
  const win = (x, y, w, h) => {
    plane(w, h, psx(A.window, { unlit: 0.45 }), [x, y, 0.04], null, 1);
    for (const s of [-1, 1]) plane(w * 0.45, h, psx(A.shutter, { unlit: 0.35 }), [x + s * (w / 2 + w * 0.25), y, 0.05], null, 1);
    box(w + 0.2, 0.08, 0.16, white, [x, y - h / 2 - 0.04, 0.06]);
  };
  for (const s of [-1, 1]) win(s * 2.55, 1.55, 1.05, 1.3);
  // round the back, the big window onto her backyard (the one that's the whole back wall inside):
  // painted on, three windows wide, with a sill (no view in: rooms are bigger inside)
  plane(5.4, 1.9, psx(A.window, { rx: 3, unlit: 0.45 }), [0, 1.5, -D - 0.04], [0, Math.PI, 0], 1);
  box(5.6, 0.08, 0.16, white, [0, 1.5 - 0.95 - 0.04, -D - 0.06]);
  // the white band between the floors, and the corner boards
  box(W + 0.1, 0.16, 0.1, white, [0, H1, 0.03]);
  for (const s of [-1, 1]) for (const z of [0, -D]) box(0.14, HT + 0.05, 0.14, white, [s * W / 2, HT / 2, z]);

  // ---------- upstairs: the front wall in four pieces round her window ----------
  const hw = WIN.w / 2 + 0.1;
  for (const s of [-1, 1]) { const w = W / 2 - hw; plane(w, H2, siding(w, H2), [s * (hw + w / 2), H1 + H2 / 2, 0]); }
  plane(2 * hw, WIN.y0 - H1, siding(2 * hw, WIN.y0 - H1), [0, (H1 + WIN.y0) / 2, 0]);
  plane(2 * hw, HT - WIN.y1, siding(2 * hw, HT - WIN.y1), [0, (WIN.y1 + HT) / 2, 0]);
  for (const s of [-1, 1]) win(s * 2.85, H1 + 1.35, 0.8, 1.1);
  // her window: a little lit nook behind the glass, a cushion on the seat, curtains tied back
  const nook = 0.9, wy = (WIN.y0 + WIN.y1) / 2, wh = WIN.y1 - WIN.y0;
  const warm = psx(A.inside, { rx: 2, ry: 1.5, unlit: 0.7 });
  plane(2 * hw, wh + 0.2, warm, [0, wy, -nook]);
  for (const s of [-1, 1]) plane(nook, wh + 0.2, warm, [s * hw, wy, -nook / 2], [0, -s * Math.PI / 2, 0]);
  plane(2 * hw, nook, psx(null, { tint: 0xffe8c0, unlit: 0.7 }), [0, WIN.y1 + 0.1, -nook / 2], [Math.PI / 2, 0, 0]);
  box(2 * hw, 0.14, nook, psx(A.cushion, { rx: 3, unlit: 0.6 }), [0, WIN.y0 - 0.07, -nook / 2]);
  for (const s of [-1, 1]) plane(0.3, wh + 0.1, psx(A.curtain, { unlit: 0.6 }), [s * (hw - 0.22), wy + 0.05, -0.12], null, 2);
  // the frame and the outside sill
  box(WIN.w + 0.3, 0.12, 0.3, white, [0, WIN.y0 - 0.06, 0.08]);
  box(WIN.w + 0.3, 0.12, 0.14, white, [0, WIN.y1 + 0.06, 0.04]);
  for (const s of [-1, 1]) box(0.12, wh + 0.2, 0.14, white, [s * (WIN.w / 2 + 0.09), wy, 0.04]);
  // her, in it: a flat picture facing out (not turning: she's in a window), her pose picked every frame
  // (its picture drawn from the seat up: dropping out of sight, it's cut off at the seat, never drawn below it)
  const toots = mesh(new PlaneGeometry(TOOTS, TOOTS).translate(0, TOOTS / 2, 0), psx(poses.softC, { unlit: 0.55 }), [0, WIN.y0 - 0.02, -0.38]);
  const tp = toots.geometry.attributes.position, tuv = toots.geometry.attributes.uv;
  let kept = 1;
  toots.renderOrder = 1;
  // the glass, with her nose prints on it
  plane(WIN.w, wh, psx(A.glass, { fade: 0.35, unlit: 0.6 }), [0, wy, 0.0], null, 2).renderOrder = 3;

  // ---------- the roof: shingles front and back, gable ends in siding, a little front gable over her
  // window with the tennis-ball attic window in it, and a chimney ----------
  const over = 0.45, run = D / 2 + over, slope = Math.hypot(run, RH + 0.3), tilt = Math.atan2(RH + 0.3, run);
  const roofMat = psx(A.shingles, { rx: (W + 1) / 1.4, ry: slope / 1.4, unlit: 0.3, side: DoubleSide });
  for (const s of [1, -1]) mesh(new PlaneGeometry(W + 0.9, slope, 4, 4), roofMat, [0, HT - 0.3 + (RH + 0.3) / 2, -D / 2 + s * run / 2], [-s * (Math.PI / 2 - tilt), s < 0 ? Math.PI : 0, 0]);
  const gable = new Shape(); gable.moveTo(-D / 2, 0); gable.lineTo(D / 2, 0); gable.lineTo(0, RH); gable.lineTo(-D / 2, 0);
  for (const s of [-1, 1]) mesh(new ShapeGeometry(gable), siding(D, RH), [s * W / 2, HT, -D / 2], [0, s * Math.PI / 2, 0]);
  // the front gable
  const fg = new Shape(), GW = 3.4, GH = 1.9; fg.moveTo(-GW / 2, 0); fg.lineTo(GW / 2, 0); fg.lineTo(0, GH); fg.lineTo(-GW / 2, 0);
  mesh(new ShapeGeometry(fg), siding(GW, GH), [0, HT - 0.02, 0.1]);
  plane(0.95, 0.95, psx(A.ballWindow, { unlit: 0.45 }), [0, HT + 0.75, 0.12], null, 2);
  const gs = Math.hypot(GW / 2 + 0.2, GH + 0.15), ga = Math.atan2(GH + 0.15, GW / 2 + 0.2);
  for (const s of [-1, 1]) {
    // (each half lies along one sloping edge of the gable, running back into the main roof)
    const g = new Group(); g.position.set(s * GW / 4, HT + GH / 2 + 0.05, 0.2 - 1.0); g.rotation.z = -s * ga; place.add(g);
    const piece = new Mesh(keep(new PlaneGeometry(gs, 2.0, 2, 2)), psx(A.shingles, { rx: gs / 1.4, ry: 1.4, unlit: 0.3, side: DoubleSide }));
    piece.rotation.x = -Math.PI / 2; g.add(piece);
  }
  // the chimney, and the gutter with three of her tennis balls stuck in it
  box(0.75, 2.6, 0.75, psx(A.brick, { rx: 0.75 / 0.8, ry: 2.6 / 0.4, unlit: 0.3 }), [2.4, HT + RH - 0.3, -D / 2 - 0.9]);
  box(W + 0.9, 0.14, 0.16, white, [0, HT - 0.32, over - 0.05]);
  const ball = psx(A.ball, { unlit: 0.5 });
  for (const x of [-2.9, -0.6, 3.1]) mesh(new SphereGeometry(0.11, 8, 6), ball, [x, HT - 0.18, over - 0.05]);

  // ---------- the porch: a little roof on two posts, a step, the mat ----------
  box(2.6, 0.12, 1.6, psx(A.shingles, { rx: 2, ry: 1, unlit: 0.3 }), [0, DH + 0.42, 0.8], [0.12, 0, 0]);
  for (const s of [-1, 1]) box(0.12, DH + 0.4, 0.12, white, [s * 1.15, (DH + 0.4) / 2, 1.5]);
  box(2.0, 0.12, 0.6, psx(T.stone, { rx: 2, ry: 0.6, unlit: 0.3 }), [0, 0.06, 0.35]);
  plane(1.5, 0.38, psx(A.mat, { unlit: 0.3 }), [0, 0.125, 0.4], [-Math.PI / 2, 0, 0], 2);

  // ---------- the yard ----------
  // paw-print stepping stones down to the square
  for (let i = 0; i < 7; i++) plane(0.6, 0.6, psx(A.stone, { onFloor: true, unlit: 0.2 }), [(i % 2 ? 0.25 : -0.25), 0.02, 1.2 + i * 0.75], [-Math.PI / 2, 0, (i % 2 ? 0.25 : -0.25)], 1).renderOrder = -1;
  // her sign
  for (const s of [-1, 1]) box(0.08, 1.3, 0.08, psx(null, { tint: 0x7a4a2a }), [-2.1 + s * 0.65, 0.65, 5.4]);
  plane(1.6, 0.6, psx(A.sign, { unlit: 0.45 }), [-2.1, 1.05, 5.45], [0, 0.25, 0], 1);
  // her mailbox: a little dog house on a post
  box(0.08, 1.0, 0.08, psx(null, { tint: 0x7a4a2a }), [1.9, 0.5, 5.6]);
  box(0.55, 0.35, 0.4, psx(A.mailbox, { unlit: 0.4 }), [1.9, 1.17, 5.6]);
  for (const s of [-1, 1]) box(0.36, 0.04, 0.46, psx(A.shingles, { unlit: 0.3 }), [1.9 + s * 0.14, 1.43, 5.6], [0, 0, -s * 0.6]);
  box(0.03, 0.18, 0.1, psx(null, { tint: 0xe8202a }), [2.2, 1.35, 5.6]);   // its flag
  // a fire hydrant, for an ornament
  const hydrant = psx(A.hydrant, { unlit: 0.35 });
  mesh(new CylinderGeometry(0.13, 0.15, 0.55, 8), hydrant, [-3.2, 0.28, 3.0]);
  mesh(new SphereGeometry(0.14, 8, 5), hydrant, [-3.2, 0.56, 3.0]);
  mesh(new CylinderGeometry(0.05, 0.05, 0.36, 6), hydrant, [-3.2, 0.36, 3.0], [0, 0, Math.PI / 2]);
  // tennis balls in the grass
  for (const [x, z] of [[2.6, 3.4], [-4.3, 5.0], [5.4, 3.6], [-1.3, 7.2]]) mesh(new SphereGeometry(0.1, 8, 6), ball, [x, 0.1, z]);
  // the guest house: a doghouse that's a tiny copy of hers (she loved everybody, and everybody's welcome)
  const gh = new Group(); gh.position.set(5.2, 0, 0.6); gh.rotation.y = -0.35; place.add(gh);
  const ghBox = new Mesh(keep(new BoxGeometry(1.2, 0.9, 1.1)), psx(A.siding, { rx: 0.8, ry: 0.6, unlit: 0.35 })); ghBox.position.y = 0.45; gh.add(ghBox);
  const hole = new Mesh(keep(new PlaneGeometry(0.42, 0.55)), psx(T.dark)); hole.position.set(0, 0.32, 0.56); gh.add(hole);
  for (const s of [-1, 1]) { const r = new Mesh(keep(new BoxGeometry(0.85, 0.05, 1.3)), psx(A.shingles, { rx: 0.6, ry: 1, unlit: 0.3 })); r.position.set(s * 0.32, 1.1, 0); r.rotation.z = -s * 0.65; gh.add(r); }
  const tri = new Shape(); tri.moveTo(-0.6, 0); tri.lineTo(0.6, 0); tri.lineTo(0, 0.48); tri.lineTo(-0.6, 0);
  const ghGable = new Mesh(keep(new ShapeGeometry(tri)), psx(A.siding, { rx: 0.8, ry: 0.3, unlit: 0.35 })); ghGable.position.set(0, 0.9, 0.551); gh.add(ghGable);
  const ghSign = new Mesh(keep(new PlaneGeometry(0.6, 0.19)), psx(A.guest, { unlit: 0.4 })); ghSign.position.set(0, 0.75, 0.56); gh.add(ghSign);
  const ghBall = new Mesh(keep(new SphereGeometry(0.1, 8, 6)), ball); ghBall.position.set(-0.35, 0.1, 0.8); gh.add(ghBall);

  // ---------- her backyard, behind the house ----------
  // a white picket fence round it and her big tree poking up over the roof (not the size of the one
  // through her big window inside: rooms are bigger inside, and that's fine)
  // (a little wider than the house, joined to its back corners)
  const YD = 5, YW = W / 2 + 1.2;
  const fence = (w, pos, ry) => plane(w, 1.1, psx(A.fence, { rx: w / 1.6, unlit: 0.4, side: DoubleSide }), pos, [0, ry, 0], 2);
  fence(2 * YW, [0, 0.55, -D - YD], 0);
  for (const s of [-1, 1]) {
    fence(YD, [s * YW, 0.55, -D - YD / 2], Math.PI / 2);
    fence(YW - W / 2 + 0.05, [s * (W / 2 + YW) / 2, 0.55, -D + 0.02], 0);
  }
  mesh(new CylinderGeometry(0.35, 0.5, 6, 8), psx(T.bark, { rx: 2, ry: 4 }), [-1.8, 3, -D - 2.6]);
  for (const [x, y, z, r] of [[-1.8, 7, -D - 2.6, 2.8], [-3.1, 6.1, -D - 2, 2], [-0.6, 6.3, -D - 3.2, 2.1]]) mesh(new SphereGeometry(r, 8, 6), psx(T.leaf, { rx: 3, ry: 2 }), [x, y, z]);

  // what's solid
  lot.block(-W / 2, W / 2, -D, 0);
  lot.block(-YW, YW, -D - YD, -D);   // (the backyard's fenced in)
  for (const s of [-1, 1]) lot.blockRound(s * 1.15, 1.5, 0.15);
  lot.blockRound(5.2, 0.6, 0.75);

  // ---------- every frame: her, at the window ----------
  const watch = makeWatcher();
  let shut = true;   // (her front door: she roos as it opens, from just inside it, where she's waiting)
  const c = Math.cos(lot.yaw), s = Math.sin(lot.yaw);
  let shown = 'softC';
  // where she is, for the room inside: 'window' (up there, so not downstairs), or 'door' (gone down to meet you)
  const shared = { where: 'window', ran: false };
  return {
    shared, door, group: scene, body: [front], farTint: 0x9ccaf4,
    update(t, dt, ears) {
      // where you are, in the house's own terms (anywhere but outside, she can't see you)
      // (in her house, she's in there with you: there's only one Toots)
      const out = ears && outside.is(ears.place), home = ears?.place?.name === HOME;
      const dx = out ? ears.x - lot.x : 0, dz = out ? ears.z - lot.z : 99;
      const you = home ? { home } : { x: c * dx - s * dz, z: s * dx + c * dz, door: door.amount > 0 };
      const was = shared.where, pose = watch(t, dt, you);
      shared.where = pose.state === 'away' ? 'door' : 'window';
      // (still up here when the door opened: she's on her way down, room.js has her come running)
      if (was === 'window' && shared.where === 'door') shared.ran = you.door && !home;
      // the door opening from out here: she's right behind it (from in there, room.js has her roo)
      if (shut && door.amount > 0 && out) roo?.({ at: { x: lot.x, y: 0.5, z: lot.z } });
      shut = door.amount === 0;
      if (pose.name !== shown && poses[pose.name]) { toots.material.uniforms.map.value = poses[pose.name]; shown = pose.name; }
      // (her breathing is a single dot up and down; dropping out of sight, she slides down behind the
      // sill: only the part of her still above the seat is drawn, so none of her ever shows below it)
      toots.position.y = WIN.y0 - 0.02 + pose.bob * 0.02;
      const keep = Math.max(0, 1 - pose.sink);
      if (keep !== kept) {
        for (let i = 0; i < tp.count; i++) {
          const top = i < tp.count / 2;   // (a plane's top row of corners comes first)
          tp.setY(i, top ? TOOTS * keep : 0); tuv.setY(i, top ? 1 : 1 - keep);
        }
        tp.needsUpdate = true; tuv.needsUpdate = true; kept = keep;
      }
      toots.visible = keep > 0;
      return pose;
    },
  };
}

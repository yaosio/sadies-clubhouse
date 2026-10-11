// Inside Toots' house: two floors, big and cozy. Toots (a black pit mix with three legs and a gray
// muzzle, who loved everybody) lives here, and she's always pleased to see you.
//
// Downstairs: a big living room. A couch facing the whole back wall, which is one big window onto her
// backyard (where her activity will go one day), a round rug, the fireplace with her picture over it and
// her friends' pictures either side (Sadie, Marbles, Chooter), her bowls, a basket of tennis balls, and
// stairs up the left wall. Upstairs: her window seat at the front window (the one you see her in from
// outside), her bed, and Sadie's bed with Sadie asleep in it.
//
// The toy: her tennis ball. Pick it up, throw it where you're looking, and she runs after it (up the
// stairs and all, hopping on her three legs), brings it back and drops it at your feet. Pat her and she
// wiggles. Nothing is saved.
//
// The clubhouse calls buildRoom(m) with its building kit, and with the outside and this activity's plot
// on it (its card has a `lot`), so the house outside is built here too (house.js).
import { Scene, Color, Mesh, Group, Vector3, PlaneGeometry, SphereGeometry, BoxGeometry, DoubleSide } from 'three';
import { drawArt } from './art.js';
import { buildHouse } from './house.js';
import { windowPoses, roomPoses, frontToots, paint } from './toots-art.js';
import { RW, RD, L2, TOP, DW, DH, STAIRS, WINDOW, BACK, SOLIDS, ground } from './plan.js';
import { makeBall, throwBall, stepBall, makeToots, BALL_R } from './fetch.js';
import { makeSounds } from './sounds/index.js';
import { soundsFor } from '../../shared/sound.js';

const DOT = 0.0135;   // how big one of Toots' dots is inside, in metres (so she stands about as tall as your knee)

export async function buildRoom(m) {
  const { psx, keep, kit, wallGeometry, doorway, card, tex, T } = m;
  const A = drawArt(m);
  // her pictures: in the window (outside) and about the house (inside), each made once
  const pix = (o) => Object.fromEntries(Object.entries(o).map(([k, p]) => [k, tex(p.w, p.h, g => paint(g, p))]));
  const winPoses = pix(windowPoses()), poses = pix(roomPoses());
  await m.breathe?.();
  // her voice belongs to the house, so she can roo at you from her window while the room's put away
  const voice = makeSounds(soundsFor('house:toots'));
  // (built again after being put away, the house outside is still there: the clubhouse hands it back)
  const house = m.house || (m.outside && m.lot ? buildHouse(m, A, winPoses, o => voice.roo(o)) : null);

  const scene = new Scene(); scene.background = new Color(0x6ab8ff);
  const { add, box, plane, cyl } = kit(scene);
  const mesh = (geo, mat, pos, rot, parent = scene) => { const o = new Mesh(keep(geo), mat); if (pos) o.position.set(...pos); if (rot) o.rotation.set(...rot); parent.add(o); return o; };
  const tint = (c, o = {}) => psx(null, { tint: c, unlit: 0.25, ...o });
  const white = tint(0xffffff, { unlit: 0.3 });

  // ---------- out there: the sky, the grass, and her backyard through the big window ----------
  const sky = mesh(new SphereGeometry(120, 16, 12), m.skyMat(), [0, 0, 0]); sky.renderOrder = -3;
  mesh(new PlaneGeometry(200, 200, 16, 16), psx(T.grass, { rx: 100, ry: 100 }), [0, -0.02, 0], [-Math.PI / 2, 0, 0]).renderOrder = -2;
  // a picket fence round the yard, a big tree, flower beds, a birdbath, and one of her balls out in the grass
  for (const [w, pos, ry] of [[30, [0, 0.55, -20], 0], [14, [-15, 0.55, -13], Math.PI / 2], [14, [15, 0.55, -13], Math.PI / 2]]) plane(w, 1.1, psx(A.fence, { rx: w / 1.6, unlit: 0.4, side: DoubleSide }), pos, [0, ry, 0], 2);
  cyl(0.35, 0.5, 4, 8, psx(T.bark, { rx: 2, ry: 3 }), [-5, 2, -13]);
  for (const [x, y, z, r] of [[-5, 5, -13, 2.6], [-6.2, 4.2, -12.4, 1.8], [-3.8, 4.4, -13.6, 1.9]]) mesh(new SphereGeometry(r, 8, 6), psx(T.leaf, { rx: 3, ry: 2 }), [x, y, z]);
  for (const x of [-10, 9]) plane(5, 1.2, psx(T.flowers, { rx: 3, onFloor: true }), [x, 0.01, -18.6], [-Math.PI / 2, 0, 0], 2).renderOrder = -1;
  cyl(0.15, 0.25, 0.9, 8, tint(0xd8d8e8), [5, 0.45, -11]); cyl(0.7, 0.5, 0.2, 10, tint(0x9ad0ff, { unlit: 0.5 }), [5, 0.95, -11]);
  mesh(new SphereGeometry(0.08, 8, 6), psx(A.ball, { unlit: 0.5 }), [1.5, 0.08, -9]);
  await m.breathe?.();

  // ---------- downstairs: walls, the big back window, the floor ----------
  const paper = (w, h) => psx(A.paper, { rx: w / 1.6, ry: h / 1.6, unlit: 0.25 });
  const up = (w, h) => psx(A.paperUp, { rx: w / 0.8, ry: h / 0.8, unlit: 0.25 });
  const O = 0.15;   // (walls run on a little past the corners: the PS1 wobble opens hairline cracks there)
  // (a wall with a hole in it, from wallGeometry, is measured in meters already: paper(1, 1) on those)
  // the front wall, with the door
  add(new Mesh(keep(wallGeometry(2 * RW + 2 * O, L2, DW, DH)), paper(1, 1)), [0, 0, RD], [0, Math.PI, 0]);
  // the side walls (both floors at once)
  for (const s of [-1, 1]) {
    add(new Mesh(keep(wallGeometry(2 * RD + 2 * O, L2)), paper(1, 1)), [s * RW, 0, 0], [0, -s * Math.PI / 2, 0]);
    add(new Mesh(keep(wallGeometry(2 * RD + 2 * O, TOP - L2)), up(1, 1)), [s * RW, L2, 0], [0, -s * Math.PI / 2, 0]);
  }
  // the back wall, round the big window
  for (const s of [-1, 1]) plane(RW - BACK.x1 + O, L2, paper(2, L2), [s * (BACK.x1 + (RW - BACK.x1) / 2), L2 / 2, -RD]);
  plane(BACK.x1 - BACK.x0, BACK.y0, paper(12, 0.5), [0, BACK.y0 / 2, -RD]);
  plane(BACK.x1 - BACK.x0, L2 - BACK.y1, paper(12, 0.5), [0, (BACK.y1 + L2) / 2, -RD]);
  // its frame: white, with a few panes, and a deep sill
  box(BACK.x1 - BACK.x0 + 0.2, 0.12, 0.35, white, [0, BACK.y0 - 0.06, -RD + 0.1]);
  box(BACK.x1 - BACK.x0 + 0.2, 0.12, 0.2, white, [0, BACK.y1 + 0.06, -RD + 0.05]);
  for (let i = 0; i <= 4; i++) box(0.1, BACK.y1 - BACK.y0, 0.12, white, [BACK.x0 + i * (BACK.x1 - BACK.x0) / 4, (BACK.y0 + BACK.y1) / 2, -RD + 0.03]);
  // wood panelling below a rail, all round
  for (const [w, pos, ry] of [[2 * RW, [0, 0.5, RD - 0.03], Math.PI], [2 * RD, [-RW + 0.03, 0.5, 0], Math.PI / 2], [2 * RD, [RW - 0.03, 0.5, 0], -Math.PI / 2]])
    plane(w, 1.0, psx(A.panel, { rx: w / 1.2, unlit: 0.25, decal: true }), pos, [0, ry, 0], 2);
  // two windows either side of the front door
  for (const s of [-1, 1]) {
    plane(1.3, 1.6, psx(A.window, { unlit: 0.5, decal: true }), [s * 4.5, 1.8, RD - 0.03], [0, Math.PI, 0], 1);
    box(1.5, 0.08, 0.2, white, [s * 4.5, 0.96, RD - 0.08]);
  }
  plane(2 * RW + 2 * O, 2 * RD + 2 * O, psx(A.boards, { rx: 2 * RW / 1.4, ry: 2 * RD / 1.4 }), [0, 0, 0], [-Math.PI / 2, 0, 0], 8).renderOrder = -2;
  const door = doorway(scene, { pos: [0, 0, RD], yaw: Math.PI, w: DW, h: DH, leaves: [{ front: A.doorBack, back: A.door }], hinge: 1, trim: 0xffffff });
  await m.breathe?.();

  // ---------- between the floors: the ceiling below, the carpet above, round the hole for the stairs ----------
  const holeW = STAIRS.x1 + RW, holeD = STAIRS.z0 - STAIRS.z1;
  const slabs = [
    [RW - STAIRS.x1, 2 * RD, (STAIRS.x1 + RW) / 2, 0],
    [holeW, RD + STAIRS.z1, (STAIRS.x1 - RW) / 2, (-RD + STAIRS.z1) / 2],
    [holeW, RD - STAIRS.z0, (STAIRS.x1 - RW) / 2, (RD + STAIRS.z0) / 2],
  ];
  for (const [w, d, x, z] of slabs) {
    plane(w, d, psx(null, { tint: 0xfff8e0, unlit: 0.5 }), [x, L2 - 0.01, z], [Math.PI / 2, 0, 0], 4);
    plane(w, d, psx(A.carpet, { rx: w / 1.2, ry: d / 1.2 }), [x, L2, z], [-Math.PI / 2, 0, 0], 4).renderOrder = -2;
  }
  plane(2 * RW + 2 * O, 2 * RD + 2 * O, psx(null, { tint: 0xffffff, unlit: 0.55 }), [0, TOP, 0], [Math.PI / 2, 0, 0], 8);
  // the stairs: a step every 30 cm, up the left wall, with a banister and a railing round the top
  const STEPS = 12, run = holeD / STEPS;
  const tread = psx(A.boards, { rx: 1, ry: 0.4 }), riser = tint(0xfff4e4);
  for (let i = 0; i < STEPS; i++) {
    const y = (i + 1) * L2 / STEPS, z = STAIRS.z0 - (i + 0.5) * run;
    box(holeW, 0.06, run, tread, [(STAIRS.x1 - RW) / 2, y - 0.03, z]);
    box(holeW, L2 / STEPS, 0.04, riser, [(STAIRS.x1 - RW) / 2, y - L2 / STEPS / 2, z + run / 2]);
  }
  // the underside of the stairs, panelled (so downstairs they're a solid wall)
  const under = new Mesh(keep(new PlaneGeometry(holeD, L2, 2, 2)), psx(A.panel, { rx: holeD / 1.2, ry: L2 / 1.2, unlit: 0.25, side: DoubleSide }));
  under.position.set(STAIRS.x1, L2 / 2, (STAIRS.z0 + STAIRS.z1) / 2); under.rotation.y = Math.PI / 2; scene.add(under);
  const rail = tint(0x9a5a2a);
  const slope = Math.atan2(L2, holeD), len = Math.hypot(L2, holeD);
  mesh(new BoxGeometry(0.08, 0.08, len), rail, [STAIRS.x1 + 0.05, L2 / 2 + 0.9, (STAIRS.z0 + STAIRS.z1) / 2], [-slope, 0, 0]);
  for (let i = 0; i <= 8; i++) { const z = STAIRS.z0 - i * holeD / 8, y = (STAIRS.z0 - z) / holeD * L2; cyl(0.025, 0.025, 0.9, 4, white, [STAIRS.x1 + 0.05, y + 0.45, z]); }
  // upstairs, round the hole
  box(0.08, 0.08, holeD, rail, [STAIRS.x1 + 0.05, L2 + 0.95, (STAIRS.z0 + STAIRS.z1) / 2]);
  box(holeW, 0.08, 0.08, rail, [(STAIRS.x1 - RW) / 2, L2 + 0.95, STAIRS.z0 + 0.04]);
  for (let i = 0; i <= 8; i++) cyl(0.025, 0.025, 0.95, 4, white, [STAIRS.x1 + 0.05, L2 + 0.47, STAIRS.z0 - i * holeD / 8]);
  for (let i = 1; i < 4; i++) cyl(0.025, 0.025, 0.95, 4, white, [-RW + i * holeW / 4, L2 + 0.47, STAIRS.z0 + 0.04]);
  await m.breathe?.();

  // ---------- downstairs: couch, rug, lamp, fireplace, her friends' pictures, bowls, the ball basket ----------
  const couch = psx(A.couch, { rx: 3, ry: 1, unlit: 0.25 });
  box(3.8, 0.45, 0.9, couch, [0, 0.225, 0.55]);                  // the seat
  box(3.8, 0.55, 0.25, couch, [0, 0.62, 0.92]);                  // its back (facing the window)
  for (const s of [-1, 1]) box(0.25, 0.65, 0.9, couch, [s * 1.85, 0.32, 0.55]);
  for (const x of [-1.2, 0, 1.2]) box(0.9, 0.12, 0.7, psx(A.couch, { unlit: 0.35 }), [x, 0.5, 0.5]);   // the cushions
  plane(4.6, 4.6, psx(A.rug, { onFloor: true }), [0, 0.01, -2.4], [-Math.PI / 2, 0, 0], 4).renderOrder = -1;
  // the floor lamp by the couch, lit
  cyl(0.03, 0.03, 1.6, 4, tint(0x7a4a2a), [2.5, 0.8, 0.5]); cyl(0.2, 0.2, 0.04, 8, tint(0x7a4a2a), [2.5, 0.02, 0.5]);
  cyl(0.18, 0.32, 0.35, 8, tint(0xfff08a, { unlit: 0.9 }), [2.5, 1.75, 0.5]);
  // the fireplace on the right wall (a still, warm fire: no crackle), and the WELCOME sign over the door
  const brick = psx(A.brickIn, { rx: 2.5, ry: 2, unlit: 0.25 });
  box(0.75, 1.4, 2.4, brick, [RW - 0.37, 0.7, 0]);
  box(0.9, 0.12, 2.7, tint(0x7a4a2a), [RW - 0.45, 1.46, 0]);   // the mantel
  plane(1.2, 0.75, psx(A.fire, { unlit: 0.9 }), [RW - 0.76, 0.5, 0], [0, -Math.PI / 2, 0], 1);
  plane(2.4, 0.6, psx(A.homeSign, { unlit: 0.4 }), [0, DH + 0.55, RD - 0.04], [0, Math.PI, 0], 1);
  // the pictures: Toots herself over the mantel, her friends either side
  const portrait = tex(48, 70, g => {
    g.fillStyle = '#8a5a10'; g.fillRect(0, 0, 48, 70); g.fillStyle = '#ffd23a'; g.fillRect(1, 1, 46, 68); g.fillStyle = '#c89018'; g.fillRect(2, 2, 44, 66);
    g.fillStyle = '#ff8ec8'; g.fillRect(4, 4, 40, 62); paint(g, frontToots({ ears: 1, wag: 1 }), 0, 3);
  });
  const hang = (t, w, h, z, y) => plane(w, h, psx(t, { unlit: 0.45 }), [RW - 0.04, y, z], [0, -Math.PI / 2, 0], 1);
  hang(portrait, 0.95, 1.38, 0, 2.45);
  hang(A.plate('TOOTS'), 0.6, 0.12, 0, 1.68);
  for (const [pic, name, z] of [[A.picSadie, 'SADIE', -2.3], [A.picMarbles, 'MARBLES', 2.3], [A.picChooter, 'CHOOTER', 4.3]]) {
    hang(pic, 1.1, 1.0, z, 2.25); hang(A.plate(name), 0.75, 0.15, z, 1.6);
  }
  // her bowls, by the front corner
  for (const [x, t] of [[6.2, A.bowl], [6.9, A.bowl2]]) { cyl(0.26, 0.2, 0.14, 10, psx(t, { rx: 2, unlit: 0.35 }), [x, 0.07, 4.6]); cyl(0.2, 0.2, 0.01, 10, tint(x < 6.5 ? 0x9a6a3a : 0x9ad0ff, { unlit: 0.5 }), [x, 0.135, 4.6]); }
  // the basket of tennis balls by the door
  const basket = SOLIDS.find(s => s.name === 'basket'), bx = (basket.x0 + basket.x1) / 2, bz = (basket.z0 + basket.z1) / 2;
  cyl(0.38, 0.3, 0.42, 10, psx(A.basket, { rx: 3, unlit: 0.3 }), [bx, 0.21, bz]);
  for (const [dx, dz] of [[-0.12, -0.08], [0.1, -0.1], [0, 0.12], [0.14, 0.08], [-0.1, 0.1]]) mesh(new SphereGeometry(0.08, 8, 6), psx(A.ball, { unlit: 0.5 }), [bx + dx, 0.44, bz + dz]);
  plane(0.6, 0.15, psx(A.ballSign, { unlit: 0.5 }), [bx, 0.62, bz - 0.4], [0, Math.PI, 0], 1);
  // lights on the ceiling
  for (const [x, z] of [[-2, -2], [3, 2.5], [3, -3.5]]) { cyl(0.3, 0.42, 0.18, 8, tint(0xfff08a, { unlit: 0.9 }), [x, L2 - 0.1, z]); cyl(0.3, 0.42, 0.18, 8, tint(0xfff08a, { unlit: 0.9 }), [x, TOP - 0.1, z]); }
  await m.breathe?.();

  // ---------- upstairs: the front wall round her window, the back wall, her window seat, the beds ----------
  const ww = WINDOW.w / 2 + 0.1, H2 = TOP - L2;
  for (const s of [-1, 1]) plane(RW - ww + O, H2, up(RW - ww, H2), [s * (ww + (RW - ww) / 2), L2 + H2 / 2, RD], [0, Math.PI, 0]);
  plane(2 * ww, WINDOW.y0 - L2, up(2, 0.5), [0, (L2 + WINDOW.y0) / 2, RD], [0, Math.PI, 0]);
  plane(2 * ww, TOP - WINDOW.y1, up(2, 0.5), [0, (WINDOW.y1 + TOP) / 2, RD], [0, Math.PI, 0]);
  for (const s of [-1, 1]) box(0.12, WINDOW.y1 - WINDOW.y0 + 0.2, 0.14, white, [s * (ww - 0.05), (WINDOW.y0 + WINDOW.y1) / 2, RD - 0.04]);
  box(2 * ww, 0.12, 0.14, white, [0, WINDOW.y1 + 0.06, RD - 0.04]);
  add(new Mesh(keep(wallGeometry(2 * RW + 2 * O, H2)), up(1, 1)), [0, L2, -RD]);
  for (const x of [-5, 3.5]) plane(1.0, 1.2, psx(A.window, { unlit: 0.5, decal: true }), [x, L2 + 1.6, -RD + 0.03], null, 1);
  // her window seat: a red cushion on a box, in the window, and the curtains tied back
  const seat = SOLIDS.find(s => s.name === 'seat');
  box(seat.x1 - seat.x0, seat.h, seat.z1 - seat.z0, white, [0, L2 + seat.h / 2, (seat.z0 + seat.z1) / 2]);
  box(seat.x1 - seat.x0 - 0.1, 0.12, seat.z1 - seat.z0 - 0.05, psx(A.cushion, { rx: 3, unlit: 0.35 }), [0, L2 + seat.h + 0.06, (seat.z0 + seat.z1) / 2]);
  for (const s of [-1, 1]) plane(0.45, WINDOW.y1 - WINDOW.y0 + 0.2, psx(A.curtain, { unlit: 0.35, side: DoubleSide }), [s * (ww + 0.15), (WINDOW.y0 + WINDOW.y1) / 2, RD - 0.12], [0, Math.PI, 0], 2);
  // her bed: big, round and red, with a ball in it
  cyl(0.85, 0.85, 0.22, 12, psx(A.bedTop, { rx: 4, unlit: 0.3 }), [3.6, L2 + 0.11, 3.4]);
  cyl(0.65, 0.65, 0.05, 12, tint(0xfff4e4, { unlit: 0.3 }), [3.6, L2 + 0.2, 3.4]);
  mesh(new SphereGeometry(0.08, 8, 6), psx(A.ball, { unlit: 0.5 }), [3.9, L2 + 0.3, 3.2]);
  plane(1.45, 1.09, psx(A.picFriends, { unlit: 0.45 }), [3.6, L2 + 1.95, RD - 0.04], [0, Math.PI, 0], 1);
  plane(1.4, 0.17, psx(A.plate('BEST FRIENDS'), { unlit: 0.4 }), [3.6, L2 + 1.25, RD - 0.04], [0, Math.PI, 0], 1);
  plane(0.6, 0.12, psx(A.plate('TOOTS'), { unlit: 0.4 }), [3.6, L2 + 0.75, RD - 0.06], [0, Math.PI, 0], 1);
  // Sadie's bed, in the back corner: a little proper bed with a quilt, and Sadie asleep in it
  const sb = SOLIDS.find(s => s.name === 'sadiesBed'), sx = (sb.x0 + sb.x1) / 2, sz = (sb.z0 + sb.z1) / 2;
  box(sb.x1 - sb.x0, 0.35, sb.z1 - sb.z0, tint(0x9a5a2a), [sx, L2 + 0.175, sz]);
  box(sb.x1 - sb.x0 - 0.06, 0.2, sb.z1 - sb.z0 - 0.06, psx(A.quilt, { rx: 2, ry: 3, unlit: 0.3 }), [sx, L2 + 0.45, sz + 0.03]);
  box(sb.x1 - sb.x0, 1.0, 0.1, tint(0x9a5a2a), [sx, L2 + 0.5, sb.z0 + 0.05]);   // the headboard
  box(0.9, 0.14, 0.4, white, [sx, L2 + 0.62, sb.z0 + 0.35]);                    // the pillow
  plane(0.9, 0.22, psx(A.plate('SADIE'), { unlit: 0.4 }), [sx, L2 + 0.85, sb.z0 + 0.11], null, 1);
  // Sadie, tucked in: her napping picture with the quilt pulled up over her legs, so she's lying in it
  // (drawn as one picture, so it reads the same from wherever you look)
  const tucked = tex(58, 47, g => {
    g.drawImage(T.nap.image, 0, 0);
    const cs = ['#ff8ec8', '#fff08a', '#9ad0ff', '#ffffff'];
    for (let y = 31; y < 47; y += 4) for (let x = 0; x < 58; x += 4) { g.fillStyle = cs[((x + y) / 4 | 0) % 4]; g.fillRect(x, y, 4, 4); }
    g.fillStyle = '#e0509a'; for (let x = 0; x < 58; x += 4) g.fillRect(x, 31, 1, 16);
    g.fillStyle = '#ffffff'; g.fillRect(0, 29, 58, 3);   // the sheet, turned down over the quilt
    g.fillStyle = '#c8c0d8'; g.fillRect(0, 32, 58, 1);
  });
  const SW = 0.8, SH = SW * 47 / 58;
  const sadie = new Mesh(keep(new PlaneGeometry(SW, SH).translate(0, SH / 2, 0)), psx(tucked, { unlit: 0.35 }));
  sadie.position.set(sx, L2 + 0.55 - SH * 16 / 47 + 0.08, sb.z0 + 0.75); scene.add(sadie);
  const zzz = mesh(new PlaneGeometry(0.35, 0.35), psx(T.zzz, { unlit: 0.8 }), [sx + 0.15, L2 + 1.2, sb.z0 + 0.75]);
  // a dresser, a rug, her toy box
  box(1.6, 1.1, 0.6, tint(0xe8b070), [-2.4, L2 + 0.55, -RD + 0.3]);
  for (const y of [0.3, 0.65, 0.95]) box(1.4, 0.02, 0.02, tint(0x7a4a2a), [-2.4, L2 + y, -RD + 0.61]);
  plane(3, 2, psx(A.rug, { onFloor: true }), [3.6, L2 + 0.01, -0.5], [-Math.PI / 2, 0, 0], 2).renderOrder = -1;
  // white panelling below a red rail, all round upstairs (not under her window: the seat's there)
  const panelUp = w => psx(A.panelUp, { rx: w / 1.2, unlit: 0.25, decal: true });
  for (const s of [-1, 1]) plane(RW - ww, 1.0, panelUp(RW - ww), [s * (ww + (RW - ww) / 2), L2 + 0.5, RD - 0.03], [0, Math.PI, 0], 2);
  for (const [w, pos, ry] of [[2 * RW, [0, L2 + 0.5, -RD + 0.03], 0], [2 * RD, [-RW + 0.03, L2 + 0.5, 0], Math.PI / 2], [2 * RD, [RW - 0.03, L2 + 0.5, 0], -Math.PI / 2]])
    plane(w, 1.0, panelUp(w), pos, [0, ry, 0], 2);
  // a nightstand by Sadie's bed, with a little lamp (lit) and a glass of milk
  box(0.6, 0.6, 0.5, tint(0xe8b070), [sb.x0 - 0.4, L2 + 0.3, sb.z0 + 0.35]);
  cyl(0.06, 0.1, 0.3, 6, tint(0x7a4a2a), [sb.x0 - 0.45, L2 + 0.75, sb.z0 + 0.3]);
  cyl(0.12, 0.22, 0.22, 8, tint(0xff8ec8, { unlit: 0.9 }), [sb.x0 - 0.45, L2 + 0.98, sb.z0 + 0.3]);
  cyl(0.05, 0.05, 0.12, 6, tint(0xffffff, { unlit: 0.6 }), [sb.x0 - 0.25, L2 + 0.66, sb.z0 + 0.45]);
  // her toy box by the window seat, full of tennis balls
  box(0.9, 0.5, 0.6, tint(0xe8202a), [-2.6, L2 + 0.25, RD - 0.5]);
  box(0.94, 0.06, 0.64, tint(0xffd23a), [-2.6, L2 + 0.5, RD - 0.5]);
  for (const [dx, dz] of [[-0.25, -0.1], [0.05, 0.12], [0.3, -0.05], [-0.05, -0.15]]) mesh(new SphereGeometry(0.08, 8, 6), psx(A.ball, { unlit: 0.5 }), [-2.6 + dx, L2 + 0.58, RD - 0.5 + dz]);
  await m.breathe?.();

  // ---------- Toots, and her ball ----------
  // two flat pictures (from the side, and from the front or behind), the one that fits shown; she turns to face you
  const sideH = 50 * DOT, sideW = 72 * DOT, frontH = 64 * DOT, frontW = 48 * DOT;
  const toots = new Group(); scene.add(toots);
  const sideMesh = new Mesh(keep(new PlaneGeometry(sideW, sideH).translate(0, sideH / 2 - 3.5 * DOT, 0)), psx(poses.right0, { unlit: 0.35 }));
  const frontMesh = new Mesh(keep(new PlaneGeometry(frontW, frontH).translate(0, frontH / 2 - 2 * DOT, 0)), psx(poses.frontA, { unlit: 0.35 }));
  toots.add(sideMesh, frontMesh);
  const ballMat = psx(A.ball, { unlit: 0.5 });
  const ball3d = mesh(new SphereGeometry(BALL_R, 8, 6), ballMat, [0, 0, 0]);
  const hand = mesh(new SphereGeometry(BALL_R, 8, 6), ballMat, [0, 0, 0]); hand.visible = false;
  const ball = makeBall(2.0, 4.2), dog = makeToots();
  const faces = [toots, sadie, zzz];

  // ---------- what you can do: pick up the ball, throw it, take one from the basket, pat her ----------
  const throwUse = { pos: new Vector3(), reach: 3, label: 'THROW THE BALL', button: 'THROW', act: () => doThrow() };
  const pickUse = { pos: new Vector3(), reach: 2.4, label: 'PICK UP THE BALL', button: 'PICK UP', act: () => { ball.held = 'you'; ball.rest = false; } };
  const basketUse = { pos: new Vector3(bx, 0.5, bz), reach: 2.4, label: 'TAKE A BALL', button: 'TAKE', act: () => { ball.held = 'you'; ball.rest = false; dog.t.ball = false; } };
  const patUse = { pos: new Vector3(), reach: 2.2, label: 'PAT TOOTS', button: 'PAT', act: () => { dog.pat(); if (Math.random() < 0.4) voice.roo({ at: { x: dog.t.x, y: dog.t.y, z: dog.t.z } }); } };
  const uses = [];
  const look = () => {
    const e = m.ears?.();
    if (!e || e.place !== place) return null;
    const c = Math.cos(e.pitch);
    return { e, dir: { x: -Math.sin(e.yaw) * c, y: Math.sin(e.pitch), z: -Math.cos(e.yaw) * c } };
  };
  function doThrow() {
    const l = look(); if (!l || ball.held !== 'you') return;
    throwBall(ball, { x: l.e.x, y: l.e.y, z: l.e.z }, l.dir);
  }

  // ---------- every frame ----------
  let roosOnDrop = 0;
  const place = {
    name: 'room:' + card.id, card, scene, doors: { door }, faces, house, uses,
    light: { sun: 0.4, bulb: 0.7, lamp: [0, L2 - 0.6, 0] },
    speed: 3.2,
    spots: {
      door: { x: 0, z: RD - 1.2, yaw: 0, pitch: 0, y: 0 },
      couch: { x: 0, z: -1.2, yaw: 0, pitch: 0, y: 0 },
      pictures: { x: 5.0, z: 0.5, yaw: -Math.PI / 2, pitch: 0.15, y: 0 },
      stairs: { x: -7.1, z: 4.8, yaw: 0, pitch: 0.2, y: 0 },
      upstairs: { x: 0, z: 0, yaw: Math.PI, pitch: 0, y: L2 },
      beds: { x: 4.5, z: -1.5, yaw: -0.6, pitch: -0.2, y: L2 },
    },
    floor: (x, z, y = 0) => ground(x, z, y, m.walker),
    update(t, dt = 0) {
      const l = look();
      const you = l ? { x: l.e.x, y: l.e.y - 1.6, z: l.e.z, yaw: l.e.yaw } : { x: 0, y: 0, z: RD - 1.2, yaw: 0 };
      // the lamp is on whichever floor you're on
      place.light.lamp[1] = you.y > L2 / 2 ? TOP - 0.6 : L2 - 0.6;
      if (!m.paused?.()) {
        stepBall(ball, Math.min(dt, 0.05));
        const d = dog.update(Math.min(dt, 0.05), you, ball);
        if (d.dropped && ++roosOnDrop % 3 === 0) voice.roo({ at: { x: d.x, y: d.y, z: d.z } });
      }
      // which of her pictures: going towards you (front), away (behind), across (from the side), or still (front, wagging)
      const d = dog.t, cx = (l?.e.x ?? 0) - d.x, cz = (l?.e.z ?? RD) - d.z, cl = Math.hypot(cx, cz) || 1;
      const v = Math.hypot(d.vx, d.vz), step = Math.floor(t * 8) % 4, b = d.ball ? 'Ball' : '';
      let name, side = false;
      if (v < 0.2 || d.happy > 0) name = d.happy > 0 ? (Math.floor(t * 6) % 2 ? `front${b}A` : `front${b}B`) : (Math.floor(t * 2.5) % 2 ? `front${b}A` : `front${b}B`);
      else {
        const toward = (d.vx * cx + d.vz * cz) / (v * cl), across = (d.vx * -cz + d.vz * cx) / (v * cl);
        if (toward > 0.6) name = Math.floor(t * 8) % 2 ? `front${b}A` : `front${b}B`;
        else if (toward < -0.6 && !d.ball) name = `back${step}`;
        else { side = true; name = (across < 0 ? 'right' : 'left') + b + step; }
      }
      sideMesh.visible = side; frontMesh.visible = !side;
      const shown = side ? sideMesh : frontMesh;
      if (shown.material.uniforms.map.value !== poses[name]) shown.material.uniforms.map.value = poses[name];
      toots.position.set(d.x, d.y + d.hop + (v > 0.2 ? Math.abs(Math.sin(t * 12)) * 0.03 : 0), d.z);
      // the ball: on the floor, in the air, in her mouth (drawn on her), or in your hand (just in front of you, low right)
      ball3d.visible = ball.held === null; ball3d.position.set(ball.x, ball.y, ball.z);
      hand.visible = ball.held === 'you' && !!l;
      if (hand.visible) {
        const { e, dir } = l, rx = Math.cos(e.yaw), rz = -Math.sin(e.yaw);
        hand.position.set(e.x + dir.x * 0.6 + rx * 0.22, e.y + dir.y * 0.6 - 0.2, e.z + dir.z * 0.6 + rz * 0.22);
      }
      // Sadie snoozes; her Zs drift up
      zzz.position.y = L2 + 1.15 + (t * 0.25 % 0.4);
      // what you can use right now
      uses.length = 0;
      if (ball.held === 'you' && l) { throwUse.pos.set(l.e.x + l.dir.x, l.e.y + l.dir.y, l.e.z + l.dir.z); uses.push(throwUse); }
      else {
        if (ball.held === null && ball.rest) { pickUse.pos.set(ball.x, ball.y, ball.z); uses.push(pickUse); }
        if (ball.held !== 'toots' && !(ball.held === null && !ball.rest)) uses.push(basketUse);
        patUse.pos.set(d.x, d.y + 0.45, d.z); uses.push(patUse);
      }
    },
  };

  // for the checks (tests/toots-house/browser.mjs)
  m.checks('__toots', {
    state: () => ({ ball: { x: ball.x, y: ball.y, z: ball.z, held: ball.held, rest: ball.rest }, toots: { x: dog.t.x, y: dog.t.y, z: dog.t.z, mode: dog.t.mode, fetched: dog.t.fetched }, heard: [...voice.log] }),
    give: () => { ball.held = 'you'; ball.rest = false; },
    throwAt: (dx, dy, dz) => { const e = m.ears(); const n = Math.hypot(dx, dy, dz); throwBall(ball, { x: e.x, y: e.y, z: e.z }, { x: dx / n, y: dy / n, z: dz / n }); },
  });
  return place;
}

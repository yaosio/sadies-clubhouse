// Inside Chooter's Paint Shop (Chooter: the dog from Dropper World, who sits by his counter, wagging,
// in a cap the colour of your paint): a big plain room you paint. All of it: the walls, the floor, the ceiling,
// and the things in it (a plaster Sadie on a plinth, a wooden fish hanging from the ceiling, an easel,
// a beach ball, a crate). Paint pots on the counter (every colour, and RAINBOW), tools on the pegboard
// (a brush, a roller, a spray can, a paint bucket, four stamps, and the dynamite, which blows the paint
// off whatever you point it at), and by the door a TNT plunger that blows up the whole room (push it
// twice). Now and then Sadie comes in through her cat flap, having stepped in the paint, and walks
// across the floor leaving paw prints.
//
// You paint as you walk about: the mansion hands this place every press (the place's `brush`), as a
// line out into the room, and surfaces.js finds where it lands and paints there. Everything you paint
// is kept (sadies-clubhouse.paint-shop.paint), a while after you stop and when the room's put away.
//
// The mansion calls buildRoom(m) with its building kit, and with the outside and this activity's
// plot on it (its card has a `lot`), so the shop outside is built here too (house.js).
import { Scene, Color, Mesh, Group, Vector3, PlaneGeometry, BoxGeometry, CylinderGeometry, SphereGeometry, ConeGeometry, TorusGeometry, DoubleSide } from 'three';
import { drawArt, PAINT_CSS } from './art.js';
import { buildHouse, DW, DH } from './house.js';
import { makeSurfaces, boxGeometry, fitUv } from './surfaces.js';
import { PAINTS, RAINBOW } from './layer.js';
import { STAMPS, SADIE_PAW } from './stamps.js';
import { POTS, TOOLS, tool, START, RAINBOW_STEP } from './tools.js';
import { makeSounds } from './sounds/index.js';
import { soundsFor } from '../../shared/sound.js';

const PAINT_KEY = 'paint', HOLD_KEY = 'holding';
const RW = 5, RD = 4.5, H = 4;          // the room: half its width and depth, and its height
const DENSITY = 24, SMALL = 40;         // pixels of paint a metre: the room, and the things in it
const FLAP = { x: 3.7, z: -RD + 0.3 };  // Sadie's cat flap, in the back wall

// the bare look of each kind of surface (before any paint): a colour for each pixel
const hash = (i, j, s) => (((i * 73856093) ^ (j * 19349663) ^ (s * 83492791)) >>> 0) % 1024;
const BARE = {
  wall: (i, j) => hash(i, j, 1) < 14 ? [236, 228, 252] : [252, 248, 240],
  floor: (i, j) => j % 7 === 0 ? [206, 196, 184] : (i + (Math.floor(j / 7) % 3) * 23) % 41 === 0 ? [214, 204, 192] : [234, 226, 214],
  ceiling: () => [255, 252, 246],
  plaster: (i, j) => hash(i, j, 2) < 30 ? [232, 226, 216] : [246, 242, 234],
  wood: (i, j) => (j + Math.round(Math.sin(i / 7) * 2)) % 5 === 0 ? [214, 176, 120] : [234, 200, 146],
  canvas: (i, j) => hash(i, j, 3) < 20 ? [244, 240, 232] : [255, 255, 255],
};

export async function buildRoom(m) {
  const { T, psx, keep, kit, wallGeometry, doorway, card } = m;
  const A = drawArt(m);
  await m.breathe?.();
  const scene = new Scene(); scene.background = new Color(0x0a0628);
  const { add, box, plane, cyl } = kit(scene);
  const mesh = (geo, mat, pos, rot, parent = scene) => { const o = new Mesh(keep(geo), mat); if (pos) o.position.set(...pos); if (rot) o.rotation.set(...rot); parent.add(o); return o; };
  const tint = (c, o = {}) => psx(null, { tint: c, ...o });
  // (built again after being put away, the shop outside is still there: the mansion hands it back)
  const house = m.house || (m.outside && m.lot ? buildHouse(m, A) : null);
  const S = makeSurfaces(m);

  // ---------- the room: every wall, the floor and the ceiling are paintable ----------
  // (a surface the size of the thing at DENSITY pixels a metre, its bare look, and a mesh to wear it)
  const surface = (name, wm, hm, bare, d = DENSITY, o) => S.surface(name, Math.round(wm * d), Math.round(hm * d), d, BARE[bare], o);
  const walls = [
    ['back wall', 2 * RW, [0, 0, -RD], 0, false],
    ['front wall', 2 * RW, [0, 0, RD], Math.PI, true],
    ['left wall', 2 * RD, [-RW, 0, 0], Math.PI / 2, false],
    ['right wall', 2 * RD, [RW, 0, 0], -Math.PI / 2, false],
  ];
  // (each runs on a little past the room's edges, behind the others, with its paint where it was: the
  // PS1 wobble opens hairline cracks along the corners, and through them you'd see the night)
  const OVER = 0.15;
  for (const [name, w, pos, yaw, hole] of walls) {
    const geo = fitUv(hole ? wallGeometry(w + 2 * OVER, H, DW, DH) : wallGeometry(w + 2 * OVER, H), w, H);
    S.paintOn(surface(name, w, H, 'wall'), add(new Mesh(geo, null), pos, [0, yaw, 0]));
  }
  const flat = (name, y, rx, o) => {
    const p = S.paintOn(surface(name, 2 * RW, 2 * RD, name, DENSITY, o), plane(2 * RW + 2 * OVER, 2 * RD + 2 * OVER, null, [0, y, 0], [rx, 0, 0], 8));
    fitUv(p.geometry, 2 * RW, 2 * RD, -RW, -RD);
  };
  flat('floor', 0, -Math.PI / 2); flat('ceiling', H, Math.PI / 2, { unlit: 0.6 });
  const door = doorway(scene, { pos: [0, 0, RD], yaw: Math.PI, w: DW, h: DH, leaves: [{ front: A.doorBack, back: A.door }], hinge: 1, trim: 0xffd23a });
  await m.breathe?.();

  // ---------- the things to paint ----------
  // a box (each side its own part of the picture), a ball, anything round: a surface each
  const paintBox = (name, w, h, d, bare, pos, parent) => {
    const cell = Math.round(Math.max(w, h, d) * SMALL), b = boxGeometry(w, h, d, cell);
    const s = S.surface(name, b.w, b.h, SMALL, BARE[bare], { cells: b.cells });
    return S.paintOn(s, mesh(b.geometry, null, pos, null, parent));
  };
  const paintRound = (name, geo, r, bare, pos, parent, around = 2 * Math.PI, along = Math.PI) => {
    const s = S.surface(name, Math.max(8, Math.round(around * r * SMALL)), Math.max(6, Math.round(along * r * SMALL)), SMALL, BARE[bare]);
    return S.paintOn(s, mesh(geo, null, pos, null, parent));
  };
  // Sadie, in plaster, sitting on a plinth (facing into the room), waiting to be painted
  const statue = new Group(); statue.position.set(3.3, 0, -1.4); statue.rotation.y = -Math.PI / 2 - 0.35; scene.add(statue);
  paintBox('plinth', 0.8, 0.5, 0.8, 'plaster', [0, 0.25, 0], statue);
  mesh(new PlaneGeometry(0.62, 0.13), psx(A.plaque, { unlit: 0.4 }), [0, 0.3, 0.405], null, statue);
  const body = paintRound('sadie body', new SphereGeometry(0.34, 14, 10), 0.4, 'plaster', [0, 0.92, -0.04], statue); body.scale.set(1, 1.3, 0.95);
  paintRound('sadie head', new SphereGeometry(0.26, 14, 10), 0.26, 'plaster', [0, 1.5, 0.06], statue);
  for (const s of [-1, 1]) {
    const ear = paintRound(s < 0 ? 'sadie left ear' : 'sadie right ear', new ConeGeometry(0.09, 0.2, 8, 1), 0.1, 'plaster', [s * 0.14, 1.78, 0.04], statue, 2 * Math.PI, 2);
    ear.rotation.z = -s * 0.25;
    paintRound(s < 0 ? 'sadie left paw' : 'sadie right paw', new SphereGeometry(0.1, 10, 8), 0.1, 'plaster', [s * 0.13, 0.56, 0.27], statue).scale.set(1, 0.6, 1.4);
  }
  const tail = paintRound('sadie tail', new TorusGeometry(0.34, 0.055, 6, 14, Math.PI * 1.1), 0.34, 'plaster', [0, 0.55, -0.02], statue, Math.PI * 1.1, 2 * Math.PI * 0.055 / 0.34);
  tail.rotation.set(Math.PI / 2, 0, 0.2);
  // a big wooden fish, hanging from the ceiling on two strings, turning gently
  const fish = new Group(); fish.position.set(-0.4, 2.85, 0.4); scene.add(fish);
  paintRound('fish', new SphereGeometry(0.5, 14, 10), 0.6, 'wood', [0, 0, 0], fish).scale.set(1.6, 0.75, 0.32);
  const fin = paintRound('fish tail', new ConeGeometry(0.34, 0.5, 8, 1), 0.34, 'wood', [-0.95, 0, 0], fish, 2 * Math.PI, 1.6);
  fin.rotation.z = -Math.PI / 2; fin.scale.z = 0.3;
  for (const x of [-0.4, 0.4]) cyl(0.008, 0.008, H - 2.85 - 0.3, 3, tint(0x221a44), [fish.position.x + x, (H + 2.85 + 0.3) / 2, fish.position.z]);
  // an easel with a blank canvas on it
  const easel = new Group(); easel.position.set(-3.7, 0, 3.0); easel.rotation.y = 2.4; scene.add(easel);
  const leg = tint(0x9a5a2a);
  for (const s of [-1, 1]) mesh(new BoxGeometry(0.05, 1.9, 0.05), leg, [s * 0.45, 0.95, 0], [0.12, 0, s * -0.08], easel);
  mesh(new BoxGeometry(0.05, 1.8, 0.05), leg, [0, 0.9, -0.35], [-0.25, 0, 0], easel);
  mesh(new BoxGeometry(1.1, 0.06, 0.12), leg, [0, 0.62, 0.08], null, easel);
  const canvas = S.paintOn(S.surface('canvas', Math.round(1.0 * SMALL), Math.round(1.3 * SMALL), SMALL, BARE.canvas), mesh(new PlaneGeometry(1.0, 1.3, 2, 2), null, [0, 1.32, 0.1], [-0.12, 0, 0], easel));
  mesh(new BoxGeometry(1.0, 1.3, 0.03), tint(0xd8bc8c, { unlit: 0.4 }), [0, 0, -0.018], null, canvas);   // (its back: a stretcher of plain canvas)
  // a beach ball, and a wooden crate
  paintRound('beach ball', new SphereGeometry(0.45, 16, 12), 0.45, 'plaster', [1.5, 0.45, 1.6]);
  paintBox('crate', 0.9, 0.9, 0.9, 'wood', [-2.6, 0.45, -2.4]).rotation.y = 0.3;
  await m.breathe?.();

  // ---------- the counter with the pots, the pegboard with the tools, the plunger by the door ----------
  box(4.3, 0.95, 0.7, psx(A.counter, { rx: 4, ry: 1 }), [0, 0.475, -RD + 0.5]);
  plane(1.7, 0.27, psx(A.potSign, { unlit: 0.4 }), [-1.0, 0.75, -RD + 0.86], null, 1);
  box(4.3, 0.06, 0.38, psx(A.counter, { rx: 4 }), [0, 1.42, -RD + 0.2]);
  for (const x of [-2.0, 0, 2.0]) box(0.05, 0.3, 0.3, tint(0x9a5a2a), [x, 1.25, -RD + 0.17]);
  plane(1.9, 0.14, psx(A.morePaint, { unlit: 0.4 }), [1.1, 0.75, -RD + 0.86], null, 1);
  plane(4.3, 0.62, psx(A.bigSign, { unlit: 0.45 }), [0, 2.75, -RD + 0.05], null, 2);
  const uses = [];
  const potGeo = keep(new CylinderGeometry(0.13, 0.13, 0.22, 10, 1));
  POTS.forEach((p, i) => {
    const back = i >= 8, x = back ? -1.5 + (i - 8) * 0.5 : -1.75 + i * 0.5, y = back ? 1.56 : 1.06, z = back ? -RD + 0.2 : -RD + 0.55;
    const top = p.paint === 'rainbow' ? psx(A.rainbowTop, { unlit: 0.5 }) : tint(PAINTS[p.paint].hex, { unlit: 0.5 });
    const pot = new Mesh(potGeo, [psx(A.potLabel(p.paint, p.name), { rx: 3, unlit: 0.35 }), top, tint(0xc8c8d8)]);
    pot.position.set(x, y, z); pot.rotation.y = -Math.PI / 2; scene.add(pot);
    uses.push({ pos: new Vector3(x, y + 0.1, z), reach: 2.2, label: 'DIP IN ' + p.name, button: 'DIP', act: () => hold(held.tool, p.paint, 'plip') });
  });
  // the pegboard on the left wall, a tool on each hook (the one you're holding isn't there)
  plane(4.4, 1.5, psx(A.pegboard, { rx: 11, ry: 3.75 }), [-RW + 0.05, 1.6, 0], [0, Math.PI / 2, 0], 2);
  plane(1.9, 0.3, psx(A.toolSign, { unlit: 0.4 }), [-RW + 0.07, 2.55, 0], [0, Math.PI / 2, 0], 1);
  const hooks = {}, icons = {};
  TOOLS.forEach((t, i) => {
    const z = -1.84 + i * 0.46, pic = icons[t.id] = t.kind === 'stamp' ? A.stampIcon(STAMPS[t.stamp]) : A.tool[t.id];
    hooks[t.id] = plane(0.4, 0.4, psx(pic, { unlit: 0.35 }), [-RW + 0.1, 1.6, z], [0, Math.PI / 2, 0], 1);
    uses.push({ pos: new Vector3(-RW + 0.1, 1.6, z), reach: 2.2, label: 'TAKE THE ' + t.name, button: 'TAKE', act: () => hold(t.id, held.paint, 'tok') });
  });
  // the plunger: push it once and it asks; again (soon) and the whole room goes up
  const tnt = new Group(); tnt.position.set(2.4, 0, RD - 0.8); scene.add(tnt);
  const crate = tint(0x7a4a2a), tntMat = psx(A.tnt, { unlit: 0.35 });
  mesh(new BoxGeometry(0.62, 0.46, 0.46), [crate, crate, crate, crate, crate, tntMat], [0, 0.23, 0], null, tnt);
  const handle = new Group(); tnt.add(handle);
  mesh(new CylinderGeometry(0.025, 0.025, 0.5, 4), tint(0x8a88a8), [0, 0.6, 0], null, handle);
  mesh(new BoxGeometry(0.5, 0.07, 0.07), tint(0x1c1238), [0, 0.86, 0], null, handle);
  const sure = mesh(new PlaneGeometry(0.75, 0.16), psx(A.sure, { unlit: 0.8 }), [0, 1.15, -0.05], [0, Math.PI, 0], tnt); sure.visible = false;
  const plunger = { pos: new Vector3(2.4, 0.86, RD - 0.8), reach: 2.2, label: 'BLOW UP THE WHOLE ROOM', button: 'PUSH', act: () => push() };
  uses.push(plunger);
  // Sadie's cat flap, a lamp or three, and a skirting board (not paintable: the shop's own)
  plane(0.46, 0.46, psx(A.catflap), [FLAP.x, 0.25, -RD + 0.05], null, 1);
  for (const [x, z] of [[-2.5, -1], [2.5, -1], [0, 2.4]]) {
    cyl(0.008, 0.008, 0.6, 3, tint(0x221a44), [x, H - 0.3, z]);
    cyl(0.12, 0.28, 0.24, 8, tint(0xffd23a, { unlit: 0.85 }), [x, H - 0.7, z]);
  }

  // ---------- Chooter, by his counter: always wagging, always covered in your paint ----------
  const chooter = new Mesh(keep(new PlaneGeometry(0.78, 0.9).translate(0, 0.45, 0)), psx(null, { unlit: 0.35 }));
  chooter.position.set(2.85, 0, -RD + 0.75); scene.add(chooter);
  let hop = 0;   // (how long he's still jumping about for: a BOOM, or Sadie coming in, is the best thing ever)

  // ---------- Sadie, who comes in now and then, having stepped in the paint ----------
  const sadie = new Mesh(keep(new PlaneGeometry(0.55, 0.5).translate(0, 0.25, 0)), psx(T.sadie, { unlit: 0.3 }));
  sadie.visible = false; sadie.userData.ghost = true; scene.add(sadie);
  // the dynamite's bits flying off, and the BOOM
  const bits = Array.from({ length: 28 }, () => {
    const b = mesh(new BoxGeometry(0.07, 0.07, 0.07), tint(0xffffff, { unlit: 0.6 }), [0, -9, 0]);
    b.userData = { ghost: true, v: new Vector3(), age: 9 }; return b;
  });
  const boom = mesh(new PlaneGeometry(1.3, 0.91), psx(A.boom, { unlit: 1, side: DoubleSide }), [0, -9, 0]);
  boom.userData = { ghost: true, age: 9 };
  await m.breathe?.();

  // ---------- what you're holding, and keeping the paint ----------
  let madeSounds = null;
  const sounds = () => (madeSounds ||= makeSounds(soundsFor('room:' + card.id)));
  const saved = m.saves.get(HOLD_KEY, null);
  const held = { ...START, ...(saved && TOOLS.some(t => t.id === saved.tool) && POTS.some(p => p.paint === saved.paint) ? saved : {}) };
  S.load(m.saves.get(PAINT_KEY, null));
  let clock = 0, saveAt = 0;
  const ears = () => m.ears?.();
  let picks = 0;   // (how many times you've picked something up: the mansion switches to painting each time)
  function hold(t, paint, sound) {
    held.tool = t; held.paint = paint; picks++;
    m.saves.set(HOLD_KEY, { tool: t, paint });
    for (const [id, h] of Object.entries(hooks)) h.visible = id !== t;
    sounds()[sound]?.();
  }
  for (const [id, h] of Object.entries(hooks)) h.visible = id !== held.tool;
  chooter.material.uniforms.map.value = A.chooter(held.paint, 0); A.chooter(held.paint, 1);   // (both his pictures now, not mid-game)
  function keepPaint() { if (S.changedSinceSave()) m.saves.set(PAINT_KEY, S.save()); saveAt = 0; }
  const later = () => { saveAt = clock + 1.5; };
  const onHide = () => keepPaint();
  addEventListener('pagehide', onHide);

  // ---------- painting: every press, as a line into the room ----------
  const presses = new Map();
  const colour = p => held.paint === 'rainbow' ? RAINBOW[Math.floor(p.dist / RAINBOW_STEP) % RAINBOW.length] : held.paint;
  function brush(id, ray, phase) {
    if (phase === 'up') { presses.delete(id); later(); return; }
    if (phase === 'down') presses.set(id, { last: null, dist: 0 });
    const p = presses.get(id); if (!p) return;
    const t = tool(held.tool), h = S.hit(scene, ray);
    if (!h) { p.last = null; return; }
    const c = colour(p);
    if (t.kind === 'brush') {
      const l = p.last, d = l ? l.point.distanceTo(h.point) : 0;
      if (l && l.s === h.s && l.part === h.part && d < 0.8) { S.tools.stroke(h, l, t.r, c, t.square); p.dist += d; }
      else S.tools.dab(h, t.r, c, t.square);
    } else if (t.kind === 'spray') { S.tools.spray(h, t.r, c, t.dots, Math.random); p.dist += p.last ? p.last.point.distanceTo(h.point) + 0.02 : 0; }
    else if (phase === 'down' && t.kind === 'fill') { if (S.tools.fill(h, c)) sounds().glug(); }
    else if (phase === 'down' && t.kind === 'stamp') { S.tools.stamp(h, STAMPS[t.stamp]); sounds().pup(); }
    else if (phase === 'down' && t.kind === 'boom') { blowUp(h.s, h.point, ray.dir); sounds().fwump(); hop = 1.5; }
    p.last = h;
    later();
  }
  // what you're holding, for the mansion's YOU'RE HOLDING box: the tool and its picture, the paint
  // (none for a stamp or the dynamite, which bring their own), and what pressing does with it
  const VERB = { brush: 'PAINT', spray: 'SPRAY', fill: 'FILL', stamp: 'STAMP', boom: 'BLOW THE PAINT OFF' };
  const brushLook = () => {
    const t = tool(held.tool), rainbow = held.paint === 'rainbow';
    const paints = t.kind === 'brush' || t.kind === 'spray' || t.kind === 'fill';
    return {
      color: !paints ? '#fff' : rainbow ? PAINT_CSS[RAINBOW[Math.floor(clock * 3) % RAINBOW.length]] : PAINT_CSS[held.paint],
      tool: t.name, icon: icons[t.id]?.image, paint: paints ? (rainbow ? 'RAINBOW' : PAINTS[held.paint].name) : null,
      verb: VERB[t.kind], drags: t.kind === 'brush' || t.kind === 'spray', picks,
    };
  };

  // the dynamite: the surface shakes, the paint flies off it in bits, BOOM, and it's bare again
  const shakes = [];
  function blowUp(s, point, dir, quiet) {
    const cols = [];
    for (let k = 0; k < 40 && cols.length < bits.length; k++) {
      const v = s.L.px[Math.floor(Math.random() * s.L.px.length)];
      if (v) cols.push(PAINTS[v].hex);
    }
    if (!cols.length) cols.push(0xf4efe6, 0xe8e0d4);
    const n = quiet ? 8 : bits.length;
    for (let i = 0; i < n; i++) {
      const b = quiet ? bits[(shakes.length * 8 + i) % bits.length] : bits[i];
      b.position.copy(point).addScaledVector(dir, -0.15);
      b.userData.v.set(-dir.x * 2 + (Math.random() - 0.5) * 3, 1.5 + Math.random() * 2.5, -dir.z * 2 + (Math.random() - 0.5) * 3);
      b.userData.age = 0; b.material.uniforms.tint.value.setHex(cols[i % cols.length]);
    }
    if (!quiet || !boom.userData.age || boom.userData.age > 0.5) { boom.position.copy(point).addScaledVector(dir, -0.4); boom.userData.age = 0; }
    shakes.push({ s, age: 0, at: s.meshes.map(o => o.position.clone()) });
    S.tools.clear(s);
    later();
  }
  // the plunger: the first push asks, a second within a few seconds blows up everything painted
  let armed = -1;
  function push() {
    if (clock > armed) { armed = clock + 4; sure.visible = true; plunger.label = 'SURE? PUSH AGAIN'; sounds().eh(); return; }
    armed = -1; sure.visible = false; plunger.label = 'BLOW UP THE WHOLE ROOM';
    handle.position.y = -0.25;
    sounds().kaboom(); hop = 2.5;
    const painted = S.list.filter(s => S.painted(s));
    painted.forEach((s, i) => queue.push({ at: clock + 0.1 + i * 0.12, s }));
    if (!painted.length) { boom.position.set(2.4, 1.6, RD - 1.4); boom.userData.age = 0; }
  }
  const queue = [];
  const centre = s => { const v = new Vector3(); s.meshes[0].getWorldPosition(v); return v; };

  // Sadie's walk: in through the cat flap, across the open floor to somewhere, a sit, and back out,
  // leaving a paw print every few steps (her right and left in turn) in whatever she stepped in, until
  // it's worn off. Only while you're in the room to see it.
  const floorS = S.byName.get('floor');
  const walk = { on: false, next: null, path: [], i: 0, t: 0, prints: 0, gone: 0, paint: 1, side: 1 };
  function sadieComes() {
    const tx = -2 + Math.random() * 3.6, tz = -1.6 + Math.random() * 3.8;
    Object.assign(walk, { on: true, path: [[FLAP.x, FLAP.z], [(FLAP.x + tx) / 2 + 0.6, (FLAP.z + tz) / 2 - 0.4], [tx, tz], [tx, tz], [FLAP.x, FLAP.z]], i: 0, t: 0, prints: 0, gone: 0, sit: 0,
      paint: typeof held.paint === 'number' && held.paint !== 13 ? held.paint : RAINBOW[Math.floor(Math.random() * RAINBOW.length)] });
    sadie.position.set(FLAP.x, 0, FLAP.z); sadie.visible = true;
    sounds().mrrp({ at: FLAP });
    hop = 2;   // (his best friend!)
  }
  function sadieWalks(dt) {
    const a = walk.path[walk.i], b = walk.path[walk.i + 1];
    if (!b) { walk.on = false; sadie.visible = false; walk.next = clock + 50 + Math.random() * 50; return; }
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (!len) { walk.sit += dt; if (walk.sit > 2.5) { walk.i++; walk.sit = 0; } sadie.position.y = 0; return; }   // (a sit)
    walk.t += dt * 0.7 / len;
    const k = Math.min(1, walk.t), x = a[0] + (b[0] - a[0]) * k, z = a[1] + (b[1] - a[1]) * k;
    const moved = Math.hypot(x - sadie.position.x, z - sadie.position.z);
    sadie.position.set(x, Math.abs(Math.sin(clock * 9)) * 0.03, z);
    walk.gone += moved;
    if (walk.gone > 0.24 && walk.prints < 16 && floorS) {
      walk.gone = 0; walk.prints++; walk.side = -walk.side;
      const nx = -(b[1] - a[1]) / len * 0.06 * walk.side, nz = (b[0] - a[0]) / len * 0.06 * walk.side;
      const h = { s: floorS, part: 0, x: (x + nx + RW) / (2 * RW) * floorS.L.w, y: (RD - z - nz) / (2 * RD) * floorS.L.h };
      S.tools.stamp(h, { pic: SADIE_PAW, key: {} }, { tint: walk.paint });
      later();
    }
    if (k >= 1) { walk.i++; walk.t = 0; }
  }

  // ---------- every frame ----------
  const place = {
    name: 'room:' + card.id, card, scene, doors: { door }, faces: [sadie, boom, chooter], house, uses,
    brush, brushLook,
    light: { sun: 0.3, bulb: 0.7, lamp: [0, H - 0.8, 0] },
    spots: {
      door: { x: 0, z: RD - 1.2, yaw: 0, pitch: 0, y: 0 },
      counter: { x: 0, z: -RD + 2.0, yaw: 0, pitch: -0.2, y: 0 },
      pegboard: { x: -RW + 2.0, z: 0, yaw: Math.PI / 2, pitch: 0, y: 0 },
      middle: { x: 0, z: 0.5, yaw: 0, pitch: 0, y: 0 },
    },
    floor(x, z) {
      const P = 0.35;
      if (Math.abs(x) > RW - P || Math.abs(z) > RD - P) return null;
      if (z < -RD + 0.85 + P && Math.abs(x) < 2.15 + P) return null;                 // the counter
      if (Math.hypot(x - 3.3, z + 1.4) < 0.57 + P) return null;                       // Sadie's plinth
      if (Math.hypot(x + 2.6, z + 2.4) < 0.64 + P) return null;                       // the crate
      if (Math.hypot(x - 1.5, z - 1.6) < 0.45 + P) return null;                       // the beach ball
      if (Math.hypot(x + 3.7, z - 3.0) < 0.5 + P) return null;                        // the easel
      if (Math.abs(x - 2.4) < 0.31 + P && Math.abs(z - RD + 0.8) < 0.23 + P) return null;   // the plunger
      if (Math.hypot(x - 2.85, z + RD - 0.75) < 0.35 + P) return null;                  // Chooter
      return 0;
    },
    putAway() { keepPaint(); removeEventListener('pagehide', onHide); },
    update(t, dt = 0) {
      clock = t;
      const e = ears();
      if (saveAt && clock > saveAt) keepPaint();
      const here = e && e.place === place;
      // the fish turns a little, and the plunger comes back up; what the dynamite did settles down
      fish.rotation.y = Math.sin(t * 0.25) * 0.12;
      handle.position.y = Math.min(0, handle.position.y + dt * 0.4);
      if (armed > 0 && clock > armed) { armed = -1; sure.visible = false; plunger.label = 'BLOW UP THE WHOLE ROOM'; }
      while (queue.length && queue[0].at <= clock) { const q = queue.shift(), c = centre(q.s); blowUp(q.s, c, c.clone().sub(new Vector3(0, 1.6, 0)).normalize(), true); }
      for (const b of bits) if (b.userData.age < 1.4) {
        const u = b.userData; u.age += dt; u.v.y -= 7 * dt;
        b.position.addScaledVector(u.v, dt); b.rotation.x += dt * 7; b.rotation.y += dt * 5;
        if (b.position.y < 0.04) { b.position.y = 0.04; u.v.multiplyScalar(0.4); u.v.y = Math.abs(u.v.y); }
        b.material.uniforms.uFade.value = Math.max(0, (u.age - 0.7) / 0.7);
        if (u.age >= 1.4) b.position.y = -9;
      }
      if (boom.userData.age < 0.9) {
        boom.userData.age += dt; const a = boom.userData.age;
        boom.scale.setScalar(Math.min(1, 0.3 + a * 5)); boom.material.uniforms.uFade.value = Math.max(0, (a - 0.5) / 0.4);
        if (a >= 0.9) boom.position.y = -9;
      }
      for (let i = shakes.length - 1; i >= 0; i--) {
        const sh = shakes[i]; sh.age += dt;
        sh.s.meshes.forEach((o, k) => { o.position.copy(sh.at[k]); if (sh.age < 0.3) o.position.x += Math.sin(sh.age * 90) * 0.02 * (1 - sh.age / 0.3); });
        if (sh.age >= 0.3) shakes.splice(i, 1);
      }
      // Chooter: his tail never stops, he wears your paint, and he jumps about when something happens
      hop = Math.max(0, hop - dt);
      chooter.material.uniforms.map.value = A.chooter(held.paint, Math.floor(t * (hop ? 9 : 4)) % 2);
      chooter.position.y = hop ? Math.abs(Math.sin(hop * 9)) * 0.18 : 0;
      // Sadie: only while you're here
      walk.next ??= clock + 25;   // (the first visit: a while after the room's built)
      if (here) {
        if (!walk.on && clock > walk.next) sadieComes();
        if (walk.on) sadieWalks(dt);
      } else if (walk.on) { walk.on = false; sadie.visible = false; walk.next = clock + 20; }
      S.upload();
    },
  };

  // for the checks (tests/paint-shop/browser.mjs)
  globalThis.__paintShop = {
    state: () => ({
      holding: { ...held }, painted: Object.fromEntries(S.list.map(s => [s.name, S.painted(s)])),
      total: S.list.reduce((a, s) => a + S.painted(s), 0), surfaces: S.list.length,
      saved: JSON.stringify(m.saves.get(PAINT_KEY, '')).length, sadie: { on: walk.on, prints: walk.prints, paint: walk.paint },
      armed: armed > 0, heard: [...new Set(sounds().log)], played: sounds().played,
    }),
    hold: (t, paint) => hold(t, paint ?? held.paint),
    sadie: () => { sadieComes(); },
    keep: () => keepPaint(),
  };
  return place;
}

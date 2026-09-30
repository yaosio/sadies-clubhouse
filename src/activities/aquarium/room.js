// The aquarium's room: a big fish tank along the back wall, with Sadie swimming in it in a little
// diving suit among the fish. A cardboard sign taped to the glass says DON'T TAP ON THE GLASS!!;
// standing at the glass and looking at it, E (TAP GLASS on a phone) taps it anyway: the fish
// scatter, Sadie turns and glares, and your view rises over the rim and sinks down to the sand,
// where (looking at nothing but the sand) the room is swapped for the ocean (ocean.js), which has a
// copy of the tank's floor right there; you rise up through the sea and you're in the boat. BACK TO
// AQUARIUM (on the boat's dashboard) does the same the other way. What you find out there turns up
// in the OCEAN FINDS cabinet on the right wall.
//
// The room and the ocean are the same place to the mansion: while you're out at sea this place's
// scene, floor, things to use and light are the ocean's (and it's quicker to get about, and you can
// see further). The mansion calls buildRoom(m) with its building kit (its shapes, its PS1 material,
// its textures and Sadie's sprite), so nothing here imports the clubhouse. The room itself is
// silent; the ocean's few sounds are in sounds/.
import { Scene, Color, Mesh, Group, Vector3, PlaneGeometry, BoxGeometry, DoubleSide } from 'three';
import { RW, RD, RH, TW, T0, T1, GZ, BZ, WATER, FISH, FINDS, sadieAt, dive, surfaceHome, diveX, DIVE_Z } from './tank.js';
import { SPOTS, BOAT, DECK, SAVE, readSave, reefOpen } from './chart.js';
import { buildOcean, SURFACE } from './ocean.js';
import { makeSounds, LIST } from './sounds/index.js';
import { seaPacing } from './sounds/sea.js';
import { store } from '../../shared/storage.js';
import { px, dot, oval, fishPics, scubaSadie, findPics } from './pictures.js';

export async function buildRoom(m) {
  const { T, C, psx, keep, tex, words, kit, wallGeometry, doorway, card, leaf } = m;
  const scene = new Scene(); scene.background = new Color(0x0a0628);
  const { add, box, plane, cyl, ball, cone } = kit(scene);
  const faces = [], swayers = [];

  // ---------- the room: sea-blue wallpaper, the wainscot and its rail, a rug with waves, the door ----------
  const paper = psx(T.damask, { rx: 1 / 1.3, ry: 1 / 1.3, tint: 0xa8e0ff });
  add(new Mesh(wallGeometry(2 * RW, RH, 1.5, 2.45), paper), [0, 0, -RD]);
  add(new Mesh(wallGeometry(2 * RW, RH), paper), [0, 0, RD], [0, Math.PI, 0]);
  add(new Mesh(wallGeometry(2 * RD, RH), paper), [-RW, 0, 0], [0, Math.PI / 2, 0]);
  add(new Mesh(wallGeometry(2 * RD, RH), paper), [RW, 0, 0], [0, -Math.PI / 2, 0]);
  const side = (RW - 0.9) / 2 + 0.9, sw = RW - 0.9;
  for (const [w, pos, rot] of [[sw, [-side, 0.55, -RD + 0.04], 0], [sw, [side, 0.55, -RD + 0.04], 0], [2 * RD, [-RW + 0.04, 0.55, 0], Math.PI / 2], [2 * RD, [RW - 0.04, 0.55, 0], -Math.PI / 2]]) {
    plane(w, 1.1, psx(T.wainscot, { rx: w / 0.9, decal: true, tint: 0x9ad0ff }), pos, [0, rot, 0], 2);
    plane(w, 0.1, psx(null, { tint: 0xffd23a, decal: true }), [pos[0], 1.12, pos[2]], [0, rot, 0], 2);
  }
  plane(2 * RW, 2 * RD, psx(T.wood, { rx: 2 * RW / 1.2, ry: 2 * RD / 1.2 }), [0, 0, 0], [-Math.PI / 2, 0, 0], 8).renderOrder = -2;
  plane(2 * RW, 2 * RD, psx(null, { tint: 0xd8f4ff }), [0, RH, 0], [Math.PI / 2, 0, 0], 6);
  const rug = tex(32, 32, g => {
    for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) {
      const d = Math.hypot(x - 15.5, y - 15.5);
      if (d < 15.5) px(g, d > 14 ? C.cream : Math.floor(d / 2.5 + Math.sin(Math.atan2(y - 15.5, x - 15.5) * 6) * 0.4) % 2 ? '#2a8ad0' : '#58c8f0', x, y);
    }
  });
  plane(3.2, 3.2, psx(rug, { onFloor: true }), [0, 0, 1.4], [-Math.PI / 2, 0, 0], 4).renderOrder = -1;
  // the same door as on the landing, seen from this side (its sign painted over, like every room's)
  const door = doorway(scene, { pos: [0, 0, -RD], yaw: 0, w: 1.5, h: 2.45, leaves: [leaf], hinge: 1 });
  cyl(0.3, 0.42, 0.3, 8, psx(null, { tint: 0xfff08a, unlit: 0.85 }), [0, RH - 0.15, 0]);

  // on the left wall: a life ring from Sadie's boat, and a porthole (the ocean's coming)
  const ring = tex(48, 48, g => {
    for (let y = 0; y < 48; y++) for (let x = 0; x < 48; x++) {
      const d = Math.hypot(x - 23.5, y - 23.5), a = Math.atan2(y - 23.5, x - 23.5);
      if (d < 23.5 && d > 11) px(g, d > 22.5 || d < 12 ? '#a02030' : Math.floor((a + Math.PI) / (Math.PI / 2) + 0.5) % 2 ? C.white : C.red, x, y);
    }
    // the boat's name, on two white labels, so none of it runs off the ring
    for (const [text, y] of [['S.S.', 3], ['SADIE', 40]]) {
      const w = text.length * 4 + 1;
      px(g, C.ink, 24 - w / 2 - 1, y - 2, w + 2, 9); px(g, C.cream, 24 - w / 2, y - 1, w, 7); words(g, text, 24, y, 1, C.ink, { align: 'center' });
    }
  });
  plane(1.0, 1.0, psx(ring, { decal: true }), [-RW + 0.06, 2.3, -1.6], [0, Math.PI / 2, 0], 2);
  const porthole = tex(32, 32, g => {
    for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) {
      const d = Math.hypot(x - 15.5, y - 15.5);
      if (d < 15.5) px(g, d > 12 ? (d > 14.5 ? C.gold3 : C.gold) : y < 15 ? (dot(x, y) < (15 - y) / 15 ? '#58c8f0' : '#8ad8ff') : dot(x, y) < (y - 15) / 16 ? '#1a3aa0' : '#2a6af0', x, y);
    }
    for (let a = 0; a < 8; a++) px(g, C.gold3, Math.round(15.5 + 13.2 * Math.cos(a * Math.PI / 4)), Math.round(15.5 + 13.2 * Math.sin(a * Math.PI / 4)));
    px(g, C.white, 8, 14, 16, 1); px(g, C.white, 9, 8, 3, 1);
  });
  plane(1.2, 1.2, psx(porthole, { decal: true, unlit: 0.3 }), [-RW + 0.06, 2.2, 1.2], [0, Math.PI / 2, 0], 2);

  // ---------- the tank: its cabinet, the painted sea inside, sand, the glass, the rim and light ----------
  const wood = psx(T.wood, { rx: 4, ry: 1 });
  box(2 * TW + 0.3, T0, BZ - GZ + 0.3, wood, [0, T0 / 2, (GZ + BZ) / 2]);
  for (const x of [-2.4, 0, 2.4]) plane(2.1, 0.55, psx(T.wainscot, { rx: 2, decal: true }), [x, T0 / 2, GZ - 0.16], [0, Math.PI, 0], 2);
  const plate = tex(64, 10, g => { px(g, C.gold3, 0, 0, 64, 10); px(g, C.gold, 1, 1, 62, 8); words(g, "SADIE'S FISH", 32, 3, 1, C.ink, { align: 'center' }); });
  plane(1.3, 0.2, psx(plate, { decal: true }), [0, T0 - 0.1, GZ - 0.17], [0, Math.PI, 0], 1);
  const sea = tex(64, 32, g => {
    const cols = ['#58c8f0', '#2a8ad0', '#1a5ab0', '#123a80'];
    for (let y = 0; y < 32; y++) { const f = y / 31 * 3, k = Math.min(2, Math.floor(f)); for (let x = 0; x < 64; x++) px(g, dot(x, y) < f - k ? cols[k + 1] : cols[k], x, y); }
    for (let x = 0; x < 64; x++) { const h = 3 + Math.round(2 * Math.sin(x / 3) + 2 * Math.sin(x / 7.3)); px(g, '#0e2a60', x, 32 - h, 1, h); }
    for (const [x0, col] of [[6, C.pink2], [22, '#ff7a2a'], [41, C.pink], [55, '#ffd23a']]) for (let i = 0; i < 6; i++) px(g, col, x0 + Math.round(Math.sin(i) * 2), 26 - i, 2, 1);
    for (const x0 of [14, 33, 48]) for (let y = 12; y < 30; y++) px(g, '#16602a', x0 + Math.round(Math.sin(y / 2.5) * 1.5), y, 2, 1);
    for (const [x, y] of [[10, 6], [30, 3], [52, 9], [44, 4]]) px(g, '#dff6ff', x, y);
  });
  const blue = 0x9ad8ff;
  plane(2 * TW, T1 - T0, psx(sea, { unlit: 0.5 }), [0, (T0 + T1) / 2, BZ], [0, Math.PI, 0], 4);
  for (const s of [-1, 1]) plane(BZ - GZ, T1 - T0, psx(sea, { rx: 0.3, unlit: 0.45, tint: 0xc8e8ff }), [s * TW, (T0 + T1) / 2, (GZ + BZ) / 2], [0, -s * Math.PI / 2, 0], 2);
  const floorFrom = scene.children.length;   // (the tank's floor, from here on: the ocean has a copy of it)
  const sand = tex(16, 16, g => { px(g, '#f0d890', 0, 0, 16, 16); for (let i = 0; i < 40; i++) px(g, i % 3 ? '#d8b868' : '#fff0c0', (i * 7) % 16, (i * 11) % 16); px(g, C.pink, 3, 12, 1, 1); px(g, C.lav3, 12, 5, 1, 1); });
  plane(2 * TW, BZ - GZ, psx(sand, { rx: 8, ry: 2, tint: 0xd8f0ff }), [0, T0 + 0.02, (GZ + BZ) / 2], [-Math.PI / 2, 0, 0], 4);
  // a castle, a treasure chest, a diving helmet that bubbles, coral and weed
  const stone = psx(T.stone, { rx: 1, ry: 1, tint: blue });
  box(0.7, 0.55, 0.45, stone, [-2.3, T0 + 0.3, 5.3]);
  for (const x of [-2.7, -1.9]) { cyl(0.16, 0.16, 0.85, 6, stone, [x, T0 + 0.45, 5.3]); cone(0.22, 0.32, 6, psx(null, { tint: 0xe0509a }), [x, T0 + 1.03, 5.3]); }
  box(0.22, 0.28, 0.05, psx(T.dark), [-2.3, T0 + 0.15, 5.07]);
  const chest = psx(T.wood, { rx: 1, tint: 0xc8a070 });
  box(0.5, 0.3, 0.34, chest, [1.4, T0 + 0.16, 5.25]);
  box(0.5, 0.08, 0.34, chest, [1.4, T0 + 0.38, 5.36], [-0.7, 0, 0]);
  box(0.52, 0.04, 0.36, psx(null, { tint: 0xffd23a }), [1.4, T0 + 0.26, 5.25]);
  for (const [x, z] of [[1.25, 5.05], [1.36, 4.98], [1.6, 5.02]]) cyl(0.05, 0.05, 0.02, 6, psx(null, { tint: 0xffd23a, unlit: 0.4 }), [x, T0 + 0.04, z]);
  const brass = psx(null, { tint: 0xe8b050 });
  ball(0.26, brass, [2.8, T0 + 0.3, 5.1]);
  cyl(0.1, 0.1, 0.02, 8, psx(null, { tint: 0x2a3a80 }), [2.8, T0 + 0.32, 4.84], [Math.PI / 2, 0, 0]);
  box(0.4, 0.08, 0.36, brass, [2.8, T0 + 0.06, 5.1]);
  const weed = tex(8, 32, g => { for (let y = 0; y < 32; y++) { const x = 3 + Math.round(Math.sin(y / 4) * 2); px(g, y % 5 ? C.green : '#8af070', x, y, 2, 1); if (y % 6 === 2) px(g, C.green2, x + 2, y, 2, 1); } });
  for (const [x, z, h] of [[-3.3, 5.6, 1.5], [-1.2, 5.5, 1.1], [-0.6, 5.7, 1.7], [0.5, 5.4, 1.2], [2.2, 5.6, 1.6], [3.3, 5.2, 1.0], [-3.0, 4.7, 0.8], [0.1, 4.8, 0.7]]) {
    const w = new Mesh(keep(new PlaneGeometry(0.35, h, 1, 4).translate(0, h / 2, 0)), psx(weed, { side: DoubleSide, tint: 0xc8f0e0 }));
    w.position.set(x, T0 + 0.02, z); w.rotation.y = x * 0.7; scene.add(w); swayers.push([w, x * 1.3]);
  }
  for (const [x, z, col] of [[-1.6, 5.1, 0xe0509a], [0.9, 5.6, 0xff7a2a], [3.1, 5.6, 0xff8ec8]]) {
    for (let i = 0; i < 3; i++) cyl(0.03, 0.05, 0.3 + i * 0.1, 4, psx(null, { tint: col }), [x + (i - 1) * 0.08, T0 + 0.16 + i * 0.05, z], [0, 0, (i - 1) * 0.4]);
  }
  const floorBits = scene.children.slice(floorFrom);
  // the water's surface (seen from above, when you lean over), the glass, and the frame round it
  const ripples = tex(16, 16, g => { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) px(g, (Math.sin(x / 2.5 + Math.sin(y / 3) * 2) > 0.6) ? '#dff6ff' : '#58c8f0', x, y); });
  const surface = plane(2 * TW, BZ - GZ, psx(ripples, { rx: 10, ry: 3, fade: 0.25, side: DoubleSide, unlit: 0.4 }), [0, WATER, (GZ + BZ) / 2], [-Math.PI / 2, 0, 0], 6);
  plane(2 * TW, WATER - T0, psx(null, { tint: 0x7ad8ff, fade: 0.84, unlit: 0.5, side: DoubleSide }), [0, (T0 + WATER) / 2, GZ], [0, Math.PI, 0], 4);
  const trim = psx(null, { tint: 0x1c1238 });
  box(2 * TW + 0.12, 0.08, 0.08, trim, [0, T0 + 0.02, GZ]); box(2 * TW + 0.12, 0.08, 0.08, trim, [0, T1, GZ]);
  for (const s of [-1, 1]) box(0.08, T1 - T0, 0.08, trim, [s * TW, (T0 + T1) / 2, GZ]);
  // the top is open: a rim along the front with the tank's name, and a light bar along the back
  const rim = psx(T.velvet, { rx: 6, tint: 0x3a8ad0 });
  box(2 * TW + 0.3, 0.3, 0.26, rim, [0, T1 + 0.15, GZ - 0.02]);
  box(2 * TW + 0.3, 0.3, 0.4, rim, [0, T1 + 0.15, BZ - 0.05]);
  for (const x of [-TW - 0.05, TW + 0.05]) box(0.2, 0.3, BZ - GZ, rim, [x, T1 + 0.15, (GZ + BZ) / 2]);
  const hood = tex(96, 12, g => { px(g, C.ink, 0, 0, 96, 12); px(g, '#2a6af0', 1, 1, 94, 10); words(g, "SADIE'S AQUARIUM", 48, 3, 1, C.yellow, { align: 'center', shadow: C.ink }); });
  plane(2.6, 0.26, psx(hood, { decal: true, unlit: 0.3 }), [0, T1 + 0.15, GZ - 0.16], [0, Math.PI, 0], 1);
  const food = tex(16, 16, g => { px(g, '#e83a3a', 0, 0, 16, 16); px(g, C.cream, 0, 5, 16, 7); words(g, 'FISH', 8, 6, 1, C.ink, { align: 'center' }); for (const x of [3, 5, 7]) px(g, C.ink, x, 1 + (x % 2), 1, 3); });
  cyl(0.12, 0.12, 0.3, 8, psx(food, { rx: 2 }), [3.2, T1 + 0.45, BZ - 0.05]);
  const shine = new Mesh(keep(new PlaneGeometry(2 * TW - 0.2, 0.06)), psx(null, { tint: 0xfff8c0, unlit: 1 }));
  shine.position.set(0, T1 - 0.01, BZ - 0.3); shine.rotation.x = Math.PI / 2; scene.add(shine);

  // ---------- the sign: cardboard taped to the glass, in Sadie's own capitals ----------
  const sign = tex(80, 48, g => {   // (wide enough for DON'T TAP with room either side)
    px(g, '#c89050', 0, 0, 80, 48); px(g, '#e8b878', 1, 1, 78, 46);
    for (let x = 1; x < 79; x += 3) px(g, '#d8a060', x, 1, 1, 46);
    words(g, "DON'T TAP", 40, 6, 2, C.red, { align: 'center' });
    words(g, 'ON THE', 40, 19, 2, C.red, { align: 'center' });
    words(g, 'GLASS!!', 40, 32, 2, C.red, { align: 'center' });
    for (const [x, y] of [[-2, -1], [72, -2], [-1, 42], [71, 41]]) { px(g, '#f8f0d0', x + 1, y + 2, 9, 5); px(g, '#e8dcb0', x + 1, y + 6, 9, 1); }
    px(g, C.pink2, 4, 37, 4, 3); for (const [x, y] of [[-1, -7], [1, -8], [3, -8], [5, -7]]) px(g, C.pink2, 4 + x, 42 + y - 1, 1, 1);
  });
  plane(1.31, 0.79, psx(sign, { unlit: 0.25 }), [0.9, 2.25, GZ - 0.05], [0, Math.PI, 0.05], 2);
  // ---------- the OCEAN FINDS cabinet, on the right wall: a spot for each thing from the ocean ----------
  const cab = new Group(); cab.position.set(RW - 0.3, 0, 0.8); cab.rotation.y = -Math.PI / 2; scene.add(cab);
  const cpart = (mesh, pos) => { mesh.position.set(...pos); cab.add(mesh); return mesh; };
  const cbox = (w, h, d, mat, pos) => cpart(new Mesh(keep(new BoxGeometry(w, h, d, 2, 2, 2)), mat), pos);
  const cplane = (w, h, mat, pos) => cpart(new Mesh(keep(new PlaneGeometry(w, h, 2, 2)), mat), pos);
  const CW = 2.6, CH = 1.9, CB = 0.5;   // its width, height, and how high it stands
  const dark = psx(T.wood, { rx: 2, tint: 0x9a6a50 });
  cbox(CW + 0.1, 0.08, 0.5, dark, [0, CB, 0]); cbox(CW + 0.1, 0.08, 0.5, dark, [0, CB + CH, 0]); cbox(CW + 0.1, 0.06, 0.5, dark, [0, CB + CH / 2, 0]);
  for (const x of [-CW / 2, -CW / 6, CW / 6, CW / 2]) cbox(0.06, CH, 0.5, dark, [x, CB + CH / 2, 0]);
  for (const x of [-CW / 2 + 0.05, CW / 2 - 0.05]) cbox(0.08, CB, 0.08, dark, [x, CB / 2, 0.15]);
  cplane(CW, CH, psx(T.velvet, { rx: 4, ry: 3, tint: 0x3a4ab0 }), [0, CB + CH / 2, -0.22]);
  const head = tex(64, 12, g => { px(g, C.gold3, 0, 0, 64, 12); px(g, C.gold, 1, 1, 62, 10); words(g, 'OCEAN FINDS', 32, 4, 1, C.ink, { align: 'center' }); });
  cplane(1.6, 0.3, psx(head, { unlit: 0.2 }), [0, CB + CH + 0.26, 0.2]);
  cbox(1.7, 0.36, 0.04, dark, [0, CB + CH + 0.26, 0.17]);
  const qmark = tex(16, 16, g => {
    for (let a = 0; a < 40; a++) { const t = a / 40 * Math.PI * 2; if (a % 3 !== 2) px(g, '#8a9af0', Math.round(7.5 + 7 * Math.cos(t)), Math.round(7.5 + 7 * Math.sin(t))); }
    words(g, '?', 5, 3, 2, '#8a9af0');
  });
  const label = text => tex(40, 9, g => { px(g, C.gold3, 0, 0, 40, 9); px(g, C.gold, 1, 1, 38, 7); words(g, text, 20, 2, 1, C.ink, { align: 'center' }); });
  const unknown = label('???'), pics = findPics(tex, C);
  const shelf = FINDS.map((f, i) => {
    const x = (i % 3 - 1) * CW / 3, y = CB + (i < 3 ? CH * 0.75 : CH * 0.25);
    return {
      id: f.id, known: label(f.label), pic: pics[f.id],
      art: cpart(new Mesh(keep(new PlaneGeometry(0.46, 0.46)), psx(qmark, { unlit: 0.3 })), [x, y + 0.08, -0.05]),
      tag: cpart(new Mesh(keep(new PlaneGeometry(0.44, 0.1)), psx(unknown)), [x, y - 0.3, 0.2]),
    };
  });
  // what you've found so far, on the shelves (a question mark for the rest)
  function showFinds() {
    for (const s of shelf) {
      const got = saved.found.includes(s.id);
      s.art.material.uniforms.map.value = got ? s.pic : qmark;
      s.tag.material.uniforms.map.value = got ? s.known : unknown;
    }
  }

  // ---------- the swimmers ----------
  const F = fishPics(tex, C);
  const fish = FISH.map(([kind, size, y, z, speed], i) => {
    const pic = F[kind], w = size * pic.image.width / 16, h = size * pic.image.height / 16;
    const f = new Mesh(keep(new PlaneGeometry(w, h)), psx(pic, { side: DoubleSide, tint: 0xd8f0ff }));
    f.position.set((i * 1.37) % 6 - 3, y, z); f.rotation.y = Math.PI; scene.add(f);
    return { m: f, y, v: speed * (i % 2 ? 1 : -1), phase: i * 1.7, lim: TW - w / 2 - 0.15 };
  });
  const scuba = scubaSadie(tex, C, T.sadie.image), scubaBlink = scubaSadie(tex, C, T.sadie.image, T.nap.image);
  const sadie = new Mesh(keep(new PlaneGeometry(1.0, 0.91)), psx(scuba, { tint: 0xe8f6ff }));
  scene.add(sadie); faces.push(sadie);
  const bubble = tex(4, 4, g => { px(g, '#dff6ff', 1, 0, 2, 1); px(g, '#dff6ff', 0, 1, 1, 2); px(g, '#dff6ff', 3, 1, 1, 2); px(g, '#dff6ff', 1, 3, 2, 1); px(g, C.white, 1, 1, 1, 1); });
  const bubbles = Array.from({ length: 16 }, (_, i) => {
    const b = new Mesh(keep(new PlaneGeometry(0.07, 0.07)), psx(bubble, { unlit: 0.6 }));
    scene.add(b); faces.push(b);
    return { m: b, fromSadie: i % 2 === 1, k: i / 16 };
  });
  // a little ! over Sadie's head when you tap, and where you tapped: rings on the glass
  const bang = tex(8, 16, g => { px(g, C.ink, 2, 0, 5, 16); px(g, C.yellow, 3, 1, 3, 9); px(g, C.yellow, 3, 12, 3, 3); });
  const alarm = new Mesh(keep(new PlaneGeometry(0.16, 0.32)), psx(bang, { unlit: 1 })); alarm.visible = false; scene.add(alarm); faces.push(alarm);
  const ringPic = tex(16, 16, g => { for (let a = 0; a < 48; a++) { const t = a / 48 * Math.PI * 2; px(g, C.white, Math.round(7.5 + 7 * Math.cos(t)), Math.round(7.5 + 7 * Math.sin(t))); } });
  const knock = new Mesh(keep(new PlaneGeometry(0.3, 0.3)), psx(ringPic, { unlit: 1, side: DoubleSide })); knock.visible = false; knock.rotation.y = Math.PI; scene.add(knock);
  let knockT = 0;

  // ---------- the ocean, and what you've found in it ----------
  const ocean = buildOcean(m, floorBits);
  let saved = readSave(store.get(SAVE, null));
  const save = () => store.set(SAVE, saved);
  showFinds();
  const sounds = makeSounds(), pacing = seaPacing();
  const roomLight = { sun: 0.2, bulb: 0.8, lamp: [0, RH - 0.4, 1.5] }, seaLight = { sun: 0.75, bulb: 0, lamp: [0, -1000, 0] };
  const underLight = { sun: 0.2, bulb: 0.8, lamp: [0, RH - 0.4, 1.5] };   // (underwater at sea: lit just like the tank, round the copy of its floor)
  const off = { x: 0, z: 0 }, copyAt = { x: 0, z: 0 };   // where the sea is this trip, and the copy of the tank's floor
  let where = 'room', tapFrom = null;

  // For the checks: `hold` stops the dive just before the swap (and again just after) until told to
  // go on, with the weed held still, so the two pictures can be compared.
  const hold = { on: false, state: null, t: null };
  const waitUntil = (glide, to, cond, then) => glide(to, 0.05, () => (cond() ? then() : waitUntil(glide, to, cond, then)));
  function run(steps, glide, done) {
    const next = i => {
      const s = steps[i], go = () => (i + 1 < steps.length ? next(i + 1) : done());
      glide(s.to, s.secs, () => {
        const swapThen = () => {
          if (s.swap) swapTo(s.swap);
          if (s.swap && hold.on) { hold.state = 'after'; waitUntil(glide, s.to, () => !hold.on, go); } else go();
        };
        if (s.hold && hold.on) { hold.state = 'before'; waitUntil(glide, s.to, () => hold.state === 'go', swapThen); } else swapThen();
      });
    };
    next(0);
  }

  // the swap itself: this place becomes the ocean, or the room again, in one frame
  function swapTo(to) {
    where = to;
    const sea = to === 'sea';
    place.scene = sea ? ocean.scene : scene;
    place.faces = sea ? ocean.faces : faces;
    place.uses = sea ? seaUses : uses;
    place.floor = sea ? seaFloor : roomFloor;
    place.speed = sea ? BOAT : undefined;
    place.far = undefined;
    place.light = sea ? underLight : roomLight;
    if (!sea) { showFinds(); seaUses.length = 0; }
  }
  const DECK_Y = SURFACE + DECK;
  const seaFloor = (x, z) => (ocean.sailable(x - off.x, z - off.z) ? DECK_Y : null);

  // ---------- tapping the glass: into the ocean ----------
  let spook = 0, glare = 0, taps = 0, diving = false;
  function tap(u, { from, EYE, glide }) {
    taps++; spook = 1; glare = 4; diving = true;
    knock.position.set(u.pos.x, u.pos.y, GZ - 0.03); knockT = 0; knock.visible = true;
    // this trip's sea: where you left the boat comes up right over where you'll sink to in the tank
    tapFrom = { ...from };
    const b = saved.boat;
    off.x = diveX(from) - b.x; off.z = DIVE_Z - b.z;
    ocean.sea.position.set(off.x, SURFACE, off.z);
    copyAt.x = copyAt.z = 0; ocean.copy.position.set(0, 0, 0); underLight.lamp = [...roomLight.lamp];
    ocean.show(saved.found);
    const steps = dive(from, EYE, { surface: SURFACE, deck: DECK_Y, yaw: b.yaw });
    steps.find(s => s.swap).hold = true;
    run(steps, glide, () => { diving = false; });
  }
  // a spot along the glass every couple of metres, so wherever you stand at it you can tap it
  const uses = [-2.4, 0, 2.4].map(x => {
    const u = { pos: new Vector3(x, 1.9, GZ), reach: 2.6, label: 'TAP THE GLASS', button: 'TAP GLASS' };
    u.act = kitIn => tap(u, kitIn);
    return u;
  });

  // ---------- out at sea: picking things up, and going home ----------
  const seaUses = [];
  const home = { pos: new Vector3(), reach: 3, label: 'BACK TO AQUARIUM', button: 'GO HOME' };
  home.act = ({ from, EYE, glide }) => {
    diving = true;
    saved.boat = { x: from.x - off.x, z: from.z - off.z, yaw: from.yaw }; save();
    // the copy of the tank's floor goes right under the boat, lit as it is in the tank
    const back = tapFrom || { ...place.spots.glass, eye: 0 };
    copyAt.x = from.x - diveX(back); copyAt.z = from.z - DIVE_Z;
    ocean.copy.position.set(copyAt.x, 0, copyAt.z);
    underLight.lamp = [roomLight.lamp[0] + copyAt.x, roomLight.lamp[1], roomLight.lamp[2] + copyAt.z];
    const steps = surfaceHome(from, back, EYE);
    steps[1].hold = true;
    run(steps, glide, () => { diving = false; });
  };
  const picks = {};
  for (const f of SPOTS) {
    picks[f.id] = { pos: new Vector3(), reach: 3, label: 'PICK UP ' + f.name, button: 'PICK UP', id: f.id };
    picks[f.id].act = () => {
      const t = performance.now() / 1000;
      ocean.take(f.id, t);
      saved.found = ocean.found.slice(); save();
      sounds.find(f.id);
      if (f.id !== 'mountain' && reefOpen(saved.found)) setTimeout(() => sounds.reef(), 1600);   // (the fifth: the reef sinks)
    };
  }

  // ---------- the sound tester (only in the test version): every sound, one at a time ----------
  const testing = !!document.getElementById('testBadge');
  let tester = null, testN = 0;
  if (testing) {
    const boxPic = tex(32, 24, g => {
      px(g, C.ink, 0, 0, 32, 24); px(g, '#5a2a78', 1, 1, 30, 22); px(g, C.gold, 3, 3, 26, 7);
      words(g, 'SOUND', 16, 5, 1, C.ink, { align: 'center' });
      for (const cx of [9, 23]) oval(g, cx, 16, 4, 4, C.ink, '#8a88a8');
      words(g, 'TEST', 16, 15, 1, C.yellow, { align: 'center' });
    });
    box(0.7, 0.9, 0.35, psx(null, { tint: 0x3a1858 }), [-RW + 0.25, 0.45, 2.9]);
    plane(0.64, 0.48, psx(boxPic, { unlit: 0.4 }), [-RW + 0.43, 0.62, 2.9], [0, Math.PI / 2, 0], 2);
    const next = () => {
      const [name, play] = LIST[testN % LIST.length];
      const u = { pos: new Vector3(-RW + 0.43, 0.7, 2.9), reach: 2.4, label: `PLAY SOUND ${testN % LIST.length + 1} OF ${LIST.length}: ${name}`, button: 'PLAY SOUND' };
      u.act = () => { play(sounds); testN++; uses[uses.indexOf(u)] = next(); };
      return u;
    };
    tester = next(); uses.push(tester);
  }

  let blinkAt = 3, blinkOff = 0, dir = 1, lastX = 0, lastYaw = null;
  const P = 0.35;
  const roomFloor = (x, z) => {
    if (Math.abs(x) > RW - P || Math.abs(z) > RD - P) return null;
    if (z > GZ - 0.2 - P && Math.abs(x) < TW + 0.2 + P) return null;        // the tank
    if (x > RW - 0.6 - P && Math.abs(z - 0.8) < 1.4 + P) return null;        // the cabinet
    if (testing && x < -RW + 0.6 + P && Math.abs(z - 2.9) < 0.4 + P) return null;   // the sound tester
    return 0;
  };
  const place = {
    name: 'room:' + card.id, card, scene, doors: { door }, faces, uses,
    light: roomLight,
    spots: {
      glass: { x: -0.9, z: GZ - 1.4, yaw: Math.PI + 0.1, pitch: 0.05, y: 0 },
      cabinet: { x: 2.2, z: 0.6, yaw: -Math.PI / 2, pitch: 0.05, y: 0 },
    },
    floor: roomFloor,
    update(t, dt = 0) {
      const tt = hold.on ? (hold.t ??= t) : t;   // (the weed held still while the checks compare)
      // fish: back and forth along their lanes, bobbing, turning at the ends; a tap scatters them
      const rush = 1 + 2.5 * Math.max(0, spook);
      for (const f of fish) {
        f.m.position.x += f.v * dt * rush;
        if (Math.abs(f.m.position.x) > f.lim) { f.m.position.x = Math.sign(f.m.position.x) * f.lim; f.v = -f.v; }
        f.m.position.y = f.y + Math.sin(t * 0.9 + f.phase) * 0.06 + (spook > 0 ? Math.sin(t * 9 + f.phase) * 0.03 : 0);
        f.m.scale.x = f.v < 0 ? 1 : -1;
      }
      // Sadie paddling round; you look at the tank from in front, so going -x is going right
      const s = sadieAt(t);
      if (Math.abs(s.x - lastX) > 1e-5) dir = s.x < lastX ? 1 : -1;
      lastX = s.x;
      sadie.position.set(s.x, s.y, s.z);
      const facing = glare > 0 ? 1 : dir;   // (when you tap, she turns to face you, and glares)
      sadie.scale.x = facing; sadie.rotation.z = Math.sin(t * 1.3) * 0.08;
      if (t > blinkAt) { sadie.material.uniforms.map.value = scubaBlink; blinkOff = t + 0.15; blinkAt = t + 2.5 + Math.random() * 3; }
      if (blinkOff && t > blinkOff) { sadie.material.uniforms.map.value = scuba; blinkOff = 0; }
      alarm.visible = glare > 0; alarm.position.set(s.x + 0.15, s.y + 0.65, s.z);
      for (const b of bubbles) {
        b.k += dt * (b.fromSadie ? 0.35 : 0.28);
        if (b.k > 1) b.k -= 1;
        const src = b.fromSadie ? [s.x + 0.2 * facing, s.y + 0.3, s.z] : [2.8, T0 + 0.5, 5.1];
        const top = WATER - 0.04, y = src[1] + (top - src[1]) * b.k;
        b.m.position.set(src[0] + Math.sin(b.k * 12 + (b.fromSadie ? 1 : 0)) * 0.05, y, src[2]);
        b.m.visible = y < top;
      }
      for (const [w, ph] of swayers) w.rotation.z = Math.sin(tt * 0.8 + ph) * 0.08;
      surface.material.uniforms.map.value.offset.set(t * 0.03, t * 0.017);
      spook -= dt / 2.2; glare -= dt;
      if (knock.visible) { knockT += dt; knock.scale.setScalar(1 + knockT * 3); knock.visible = knockT < 0.5; }
      if (!hold.on) hold.t = null;

      // out at sea
      if (where !== 'sea') return;
      const me = m.ears();
      ocean.update(t, dt, me, off);
      const up = me.y > SURFACE;
      place.light = up ? seaLight : underLight;
      place.far = up ? 1200 : undefined;
      // what's dead ahead to use: the find you're next to, or the button home (only when you're up in the boat)
      seaUses.length = 0;
      if (!diving && up) {
        const f = ocean.findHere(me.x - off.x, me.z - off.z), u = f ? picks[f.id] : home;
        u.pos.set(me.x - Math.sin(me.yaw) * Math.cos(me.pitch), me.y + Math.sin(me.pitch), me.z - Math.cos(me.yaw) * Math.cos(me.pitch));
        seaUses.push(u);
      }
      // the sea's own sounds, now and then (a wave; the sail, when you turn hard)
      if (up && !diving && dt > 0) {
        const turning = lastYaw !== null && Math.abs(Math.atan2(Math.sin(me.yaw - lastYaw), Math.cos(me.yaw - lastYaw))) / dt > 2.2;
        const s2 = pacing(t, turning, Math.random());
        if (s2) sounds.sea(s2);
      }
      lastYaw = me.yaw;
    },
  };
  // for the checks (tests/aquarium/browser.mjs)
  window.__aquarium = {
    state: () => ({ taps, diving, where, glaring: glare > 0, sadie: sadie.position.toArray(), fish: fish.length,
      found: saved.found.slice(), boat: { ...saved.boat }, sign: ocean.message(), held: hold.state, sounds: sounds.played, lastSound: sounds.last,
      boatAt: where === 'sea' ? (({ x, z }) => ({ x: x - off.x, z: z - off.z }))(m.ears()) : null }),
    hold(on) { hold.on = on; if (!on) hold.state = null; },
    go() { hold.state = 'go'; },
    // where the sea is this trip (so a check can sail to a spot), and a way to find things quickly
    off: () => ({ ...off }),
    spots: () => SPOTS.map(s => ({ id: s.id, x: s.x, z: s.z, r: s.r, reach: s.reach })),
  };
  return place;
}

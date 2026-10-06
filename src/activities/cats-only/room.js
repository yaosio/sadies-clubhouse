// Cats Only: a closet of a room behind a door on the first landing (straight above the front door),
// with a cat bed in it and just room to step inside. Beside the door, out on the landing, a red
// button says DO NOT PRESS. Press it and then open the door, and a whole herd of Sadies pours out,
// meowing, down the stairs (or over the railing) and out of the front door. Once the front door has
// shut behind them they vanish. They never push you or get in your way: they're only pictures.
//
// The clubhouse calls buildRoom(m) with its building kit (kit.md), so nothing here imports the
// clubhouse. The room puts the button and the herd into the hall (m.hall) and the garden
// (m.hall.front.outside), and takes them out again when it's put away. How the herd runs is in
// herd.js, in plain numbers.
import { Scene, Color, Mesh, Group, Vector3, PlaneGeometry, CylinderGeometry } from 'three';
import { soundsFor } from '../../shared/sound.js';
import { makeSounds } from './sounds/index.js';
import { COUNT, makeStampede, across, SPAWN } from './herd.js';

const RW = 0.85, RD = 0.85, H = 2.6;     // the room: half its width and depth, and its height (a closet)
const BED = { x: 0, z: -0.28, r: 0.32 }; // the cat bed in the back
const FLAT = [-Math.PI / 2, 0, 0];
const SPEAK = 0.45;                      // a door counts as open once it's this far open (0 to 1)
const SLAM = 0.5;                        // seconds a door stays slammed shut before it flies open again

export async function buildRoom(m) {
  const { T, C, psx, keep, tex, words, kit, doorway, card, leaf, hall, landingDoor: ld, walker: P } = m;
  const sfx = soundsFor('room:' + card.id);
  let sound = null;   // (made on first use: it wakes on your next press or key if the browser's still holding it back)
  const scene = new Scene(); scene.background = new Color(0x0a0628);
  const { plane, cyl, shell } = kit(scene);

  // ---------- the closet: orange cat-fur wallpaper, a wooden floor, a cat bed, the door behind you ----------
  shell({ w: RW, d: RD, h: H, paper: psx(T.damask, { rx: 1 / 1.3, ry: 1 / 1.3, tint: 0xffc890 }), wainscot: w => psx(T.wainscot, { rx: w / 0.9, decal: true }), doorAt: 1, wholeWainscot: true });
  plane(2 * RW, 2 * RD, psx(T.wood, { rx: 2 * RW / 1.2, ry: 2 * RD / 1.2 }), [0, 0, 0], FLAT, 4).renderOrder = -2;
  plane(2 * RW, 2 * RD, psx(T.carpet, { rx: 2, ry: 2, tint: 0x806050 }), [0, H, 0], [Math.PI / 2, 0, 0], 2);
  const door = doorway(scene, { pos: [0, 0, RD], yaw: Math.PI, w: 1.5, h: 2.45, leaves: [leaf], hinge: 1 });
  // the bed: a round cushion with a dip in it and a rim, and a little cat door painted on the back wall
  cyl(BED.r, BED.r + 0.02, 0.16, 12, psx(T.velvet, { rx: 3, ry: 1 }), [BED.x, 0.08, BED.z]);
  cyl(BED.r - 0.09, BED.r - 0.09, 0.165, 12, psx(T.carpet, { rx: 2, ry: 2, tint: 0xff9ec8 }), [BED.x, 0.08, BED.z]);
  plane(0.34, 0.34, psx(T.catdoor, { decal: true }), [0, 0.18, -RD + 0.05], [0, 0, 0], 1);

  // ---------- the red button, out on the landing beside the door ----------
  const Y = ld.pos.y;
  const sign = tex(64, 40, g => {
    g.fillStyle = '#101010'; g.fillRect(0, 0, 64, 40); g.fillStyle = '#ffd820'; g.fillRect(1, 1, 62, 38);
    for (let x = 0; x < 64; x += 8) { g.fillStyle = '#101010'; g.fillRect(x, 1, 4, 3); g.fillRect(x + 4, 36, 4, 3); }
    words(g, 'DO NOT', 32, 7, 2, C.ink, { align: 'center' });
    words(g, 'PRESS', 32, 18, 2, C.red, { align: 'center' });
    g.fillStyle = '#808080'; g.fillRect(20, 29, 24, 1);
  });
  const panel = new Group(); panel.position.set(ld.pos.x, Y, ld.pos.z); panel.rotation.y = ld.yaw;   // (local +x runs along the wall, +z out into the hall)
  const at = (geo, mat, x, y, z, rx = 0) => { const o = new Mesh(keep(geo), mat); o.position.set(x, y, z); o.rotation.x = rx; panel.add(o); return o; };
  const SX = -1.2, SY = 1.3;                                       // where the sign is, along the wall from the door and up
  at(new PlaneGeometry(0.5, 0.31), psx(sign, { unlit: 0.25, decal: true }), SX, SY, 0.05);
  at(new CylinderGeometry(0.1, 0.1, 0.03, 12), psx(null, { tint: 0x601010 }), SX, SY - 0.04, 0.065, Math.PI / 2);   // the red button's rim
  const knob = at(new CylinderGeometry(0.075, 0.075, 0.06, 12), psx(null, { tint: 0xff2020, unlit: 0.4 }), SX, SY - 0.04, 0.1, Math.PI / 2);
  panel.updateMatrix();
  const buttonAt = new Vector3(SX, SY - 0.04, 0.2).applyMatrix4(panel.matrix);

  // ---------- the herd: one flat Sadie per runner, all sharing one picture ----------
  const sadieGeo = keep(new PlaneGeometry(1, 47 / 58, 1, 1).translate(0, 47 / 116, 0)), sadieMat = psx(T.sadie, { unlit: 0.4 });
  const hallHerd = new Group(), gardenHerd = new Group();
  const sprites = Array.from({ length: COUNT }, () => { const s = new Mesh(sadieGeo, sadieMat); s.visible = false; hallHerd.add(s); return s; });
  const D = hall.front, roomDoor = { x: 0, z: RD, yaw: Math.PI };
  const geo = () => ({ shape: hall.shape, door: { x: ld.pos.x, y: ld.pos.y, z: ld.pos.z, nx: ld.normal.x, nz: ld.normal.z }, front: D.in, out: D.out });

  // where you are, seen from the hall and from the garden (so each picture of Sadie can turn to
  // face you, wherever you're looking at the herd from: the landing, the closet, the garden)
  function eyes() {
    const e = m.ears();
    if (hall.is(e.place)) return { hall: [e.x, e.z], garden: across(D.in, D.out, e.x, e.z) };
    if (D.outside.is(e.place)) return { garden: [e.x, e.z], hall: across(D.out, D.in, e.x, e.z) };
    if (e.place === place) { const h = across(roomDoor, { x: ld.pos.x, z: ld.pos.z, yaw: ld.yaw }, e.x, e.z); return { hall: h, garden: across(D.in, D.out, h[0], h[1]) }; }
    return null;
  }

  // ---------- the button and the stampede ----------
  let armed = m.saves.get('armed', false) === true;   // pressed, and the door not yet opened
  let phase = 'idle';      // idle | slam (the door's shut for a moment) | opening | pour (running) | drain (waiting for the front door to shut)
  let slam = 0, wait = 0, stamp = null, letGoFront = null;
  const saveArmed = () => m.saves.set('armed', armed);
  function snap() { sound ||= makeSounds(sfx); knob.position.z = armed ? 0.075 : 0.1; }
  function press() {
    if (phase !== 'idle') return;                                    // (mid-stampede: nothing more to press)
    snap(); sound.press();
    if (!armed) { armed = true; saveArmed(); knob.position.z = 0.075; }
    // the door's open (you opened it first, to look): it slams shut, then flies open again with them
    if (ld.open() > 0.3) { phase = 'slam'; slam = SLAM; place.shut = door; }
  }
  function fire() {
    armed = false; saveArmed(); knob.position.z = 0.1;
    stamp = makeStampede(geo(), Math.floor(Math.random() * 1e6) + 1);
    for (const s of sprites) { s.visible = false; if (s.parent !== hallHerd) hallHerd.add(s); }
    letGoFront = D.hold();   // the front door swings open for them
    place.holding = door; place.shut = null; phase = 'pour';
    sound ||= makeSounds(sfx);
  }
  function finish() {
    stamp?.hide(); for (const s of sprites) s.visible = false;
    letGoFront?.(); letGoFront = null; place.holding = null; place.shut = null;
    stamp = null; phase = 'idle'; wait = 0;
  }
  const use = {
    pos: buttonAt, reach: 2.8, button: 'PRESS',
    get label() { return armed ? 'PRESSED. NOW OPEN THE DOOR' : 'DO NOT PRESS'; },
    act: press,
  };
  const outOfPlaces = [hall.add(panel, hallHerd), hall.use(use), D.outside.add(gardenHerd)];   // (how to take them out again)

  const face = (s, eye, x, z) => { if (eye) s.rotation.y = Math.atan2(eye[0] - x, eye[1] - z); };
  function draw() {
    if (!stamp) return;
    const eye = eyes();
    stamp.runners.forEach((u, i) => {
      const s = sprites[i];
      if (s.visible !== u.on) s.visible = u.on;
      if (!u.on) return;
      const home = u.where === 'garden' ? gardenHerd : hallHerd;
      if (s.parent !== home) home.add(s);
      s.position.set(u.x, u.y + u.bounce, u.z);
      s.scale.set(u.size, u.size * (1 - u.bounce * 0.5), 1);
      face(s, eye && eye[u.where === 'garden' ? 'garden' : 'hall'], u.x, u.z);
    });
  }

  const place = {
    name: 'room:' + card.id, card, scene, doors: { door }, faces: [], uses: [],
    holding: null,   // the door, held open while the herd pours out
    shut: null,      // the door, slammed shut for a moment when you press the button with it open
    busy: () => phase !== 'idle',   // (never put away mid-stampede)
    putAway() { finish(); for (const out of outOfPlaces) out(); sfx.close(); },
    light: { sun: 0.2, bulb: 0.85, lamp: [0, H - 0.4, 0] },
    spots: { inside: { x: 0, z: 0.55, yaw: 0, pitch: 0, y: 0 } },
    floor(x, z) {
      if (Math.abs(x) > RW - P || z < -RD + P || z > RD) return null;      // the walls (the doorway's line is the edge)
      if (Math.hypot(x - BED.x, z - BED.z) < BED.r + P) return null;       // the bed: there's room to step in, and that's it
      return 0;
    },
    update(t, dt = 0) {
      dt = Math.min(dt, 0.1);   // (a slow frame never makes the herd leap)
      if (phase === 'idle') { if (armed && ld.open() > SPEAK) fire(); }
      else if (phase === 'slam') { if ((slam -= dt) <= 0) { place.shut = null; place.holding = door; phase = 'opening'; wait = 0; } }
      else if (phase === 'opening') { if (ld.open() > SPEAK || (wait += dt) > 2) fire(); }   // (never stuck waiting for a door)
      else if (phase === 'pour' || phase === 'drain') {
        for (const w of stamp.step(dt)) {
          const u = stamp.runners[w.who], e = m.ears();
          if (!u.on || u.where !== 'hall') continue;
          sound ||= makeSounds(sfx);
          if (hall.is(e.place)) sound.meow(w.variant, { x: u.x, y: u.y + 0.4, z: u.z }); else if (e.place === place) sound.meow(w.variant, undefined, 4);
        }
        if (stamp.t > SPAWN + 0.4) place.holding = null;
        if (phase === 'pour' && stamp.t >= stamp.holdFor) { letGoFront?.(); letGoFront = null; phase = 'drain'; }
        // gone once the front door has shut behind them (or, if you're standing in its way and it can't, a few seconds on: they've long since run off)
        else if (phase === 'drain' && stamp.over && (D.open() < 0.1 || stamp.t > stamp.holdFor + 4)) finish();
      }
      draw();
    },
  };
  m.checks?.('__catsOnly', {
    state: () => ({ armed, phase, t: stamp?.t ?? 0, on: stamp ? stamp.runners.filter(u => u.on).length : 0, garden: stamp ? stamp.runners.filter(u => u.on && u.where === 'garden').length : 0,
      frontHeld: !!letGoFront, frontOpen: D.open(), doorOpen: ld.open(), meows: { ...sfx.counts } }),
    press, go: () => { if (phase === 'idle') fire(); }, button: () => ({ x: buttonAt.x, y: buttonAt.y, z: buttonAt.z, label: use.label }),
  });
  return place;
}

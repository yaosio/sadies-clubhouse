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
import { Scene, Color, Mesh, Group, Vector3, PlaneGeometry, CylinderGeometry, InstancedMesh, Object3D } from 'three';
import { soundsFor } from '../../shared/sound.js';
import { makeSounds, warmSteps } from './sounds/index.js';
import { COUNT, makeStampede, across, SPAWN } from './herd.js';

const SPARKS = 3;                         // little sparkles that fly off each Sadie as she puffs away

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
  const SX = -1.2, SY = 1.2;                                       // where the button is, along the wall from the door and up; the sign is over it
  at(new PlaneGeometry(0.5, 0.31), psx(sign, { unlit: 0.25, decal: true }), SX, SY + 0.3, 0.05);
  at(new PlaneGeometry(0.3, 0.3), psx(null, { tint: 0x403030, decal: true }), SX, SY, 0.04);   // a plate behind the button
  at(new CylinderGeometry(0.1, 0.1, 0.03, 12), psx(null, { tint: 0x601010 }), SX, SY, 0.065, Math.PI / 2);   // the red button's rim
  const knob = at(new CylinderGeometry(0.075, 0.075, 0.06, 12), psx(null, { tint: 0xff2020, unlit: 0.4 }), SX, SY, 0.1, Math.PI / 2);
  panel.updateMatrix();
  const buttonAt = new Vector3(SX, SY, 0.2).applyMatrix4(panel.matrix);

  // ---------- the herd: flat Sadies, all drawn as one instanced picture in the hall and one in the garden ----------
  // (psx's vertex shader reads only the mesh's own matrix; this makes it read each instance's too)
  const instanced = mat => {
    mat.vertexShader = mat.vertexShader.replace('void main(){', 'void main(){ mat4 mm = modelMatrix;\n#ifdef USE_INSTANCING\n mm = modelMatrix * instanceMatrix;\n#endif')
      .replace('modelMatrix * vec4(position, 1.0)', 'mm * vec4(position, 1.0)').replace('mat3(modelMatrix)', 'mat3(mm)');
    return mat;
  };
  const sadieGeo = keep(new PlaneGeometry(1, 47 / 58, 1, 1).translate(0, 47 / 116, 0)), sadieMat = instanced(psx(T.sadie, { unlit: 0.4 }));
  const sparkGeo = keep(new PlaneGeometry(1, 1)), sparkTex = tex(8, 8, g => {   // a little four-pointed twinkle
    g.fillStyle = '#fff4a8'; g.fillRect(3, 0, 2, 8); g.fillRect(0, 3, 8, 2); g.fillStyle = '#ffffff'; g.fillRect(2, 2, 4, 4);
  }), sparkMat = instanced(psx(sparkTex, { unlit: 1 }));
  const flock = () => {   // one picture of Sadies and one of sparkles, for one place
    const g = new Group(), body = new InstancedMesh(sadieGeo, sadieMat, COUNT), sparks = new InstancedMesh(sparkGeo, sparkMat, COUNT * SPARKS);
    for (const o of [body, sparks]) { o.frustumCulled = false; o.count = 0; g.add(o); }
    return { group: g, body, sparks };
  };
  const hallHerd = flock(), gardenHerd = flock();
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
  let phase = 'idle';      // idle | slam (the door's shut for a moment) | opening | pour (running) | drain (waiting for the front door to shut) | puff (vanishing)
  let slam = 0, wait = 0, stamp = null, letGoFront = null, piled = false;   // piled: the Sadies are in the closet (only once its door has shut)
  const saveArmed = () => m.saves.set('armed', armed);
  const herd = () => stamp ||= makeStampede(geo(), Math.floor(Math.random() * 1e6) + 1);   // (while you wait, the whole pile sits behind the door)
  function snap() { sound ||= makeSounds(sfx); knob.position.z = armed ? 0.075 : 0.1; }
  function press() {
    if (phase !== 'idle') return;                                    // (mid-stampede: nothing more to press)
    snap(); sound.press(); warmSteps().forEach((job, i) => m.after(0.05 + i * 0.03, job));   // (the big sounds get made now, bit by bit, while you wait for the door)
    if (!armed) { armed = true; saveArmed(); knob.position.z = 0.075; }
    // the door's open (you opened it first, to look): it slams shut, then flies open again with them
    if (ld.open() > 0.3) { phase = 'slam'; slam = SLAM; place.shut = door; }
  }
  // The Sadies only appear in the closet once its door has shut (never in front of your eyes with it open)
  function waiting(dt) {
    if (!piled && ld.open() < 0.03) piled = true;
    if (piled) herd().step(dt); else if (stamp) stamp.hide();
  }
  function fire() {
    piled = false;
    armed = false; saveArmed(); knob.position.z = 0.1;
    herd().start();
    letGoFront = D.hold();   // the front door swings open for them
    place.holding = door; place.shut = null; phase = 'pour';
    sound ||= makeSounds(sfx);
    const e = m.ears();   // the sound of them all piling out of the little room
    const there = { x: ld.pos.x, y: ld.pos.y + 1, z: ld.pos.z };
    if (hall.is(e.place)) { sound.pile(there); sound.crowd(there); } else if (e.place === place) { sound.pile(undefined, 3); sound.crowd(undefined, 3); } else if (D.outside.is(e.place)) sound.crowd(undefined, 9);
  }
  function finish() {
    stamp?.hide(); draw(); stamp = null;
    letGoFront?.(); letGoFront = null; place.holding = null; place.shut = null;
    phase = 'idle'; wait = 0;
  }
  const use = {
    pos: buttonAt, reach: 2.8, button: 'PRESS',
    get label() { return armed ? 'PRESSED. NOW OPEN THE DOOR' : 'DO NOT PRESS'; },
    act: press,
  };
  const outOfPlaces = [hall.add(panel, hallHerd.group), hall.use(use), D.outside.add(gardenHerd.group)];   // (how to take them out again)

  const dummy = new Object3D();
  const put = (mesh, i, x, y, z, yaw, sx, sy, roll = 0) => {
    dummy.position.set(x, y, z); dummy.rotation.set(0, yaw, roll, 'YXZ'); dummy.scale.set(sx, sy, 1); dummy.updateMatrix(); mesh.setMatrixAt(i, dummy.matrix);
  };
  function draw() {
    const eye = eyes(), n = { hall: 0, garden: 0, hallSparks: 0, gardenSparks: 0 };
    if (stamp) for (const u of stamp.runners) {
      if (!u.on) continue;
      const g = u.where === 'garden' ? 'garden' : 'hall', flk = g === 'garden' ? gardenHerd : hallHerd, e = eye && eye[g];
      const yaw = e ? Math.atan2(e[0] - u.x, e[1] - u.z) : 0, p = u.pop;
      // a Sadie that's vanishing swells a little, spins and shrinks to nothing as she floats up, in a shower of sparkles
      const k = p === 0 ? 1 : p < 0.25 ? 1 + p * 2 : 1.5 * (1 - (p - 0.25) / 0.75), sz = u.size * k;
      put(flk.body, n[g]++, u.x, u.y + u.bounce + p * 0.5, u.z, yaw, sz, sz * (1 - u.bounce * 0.5), p * 2.5);
      if (p > 0) for (let j = 0; j < SPARKS; j++) {
        const a = u.beat + j * 2.1, r = p * (0.5 + 0.25 * j), c = Math.cos(yaw), s = Math.sin(yaw), side = Math.cos(a) * r;
        put(flk.sparks, n[g + 'Sparks']++, u.x + c * side, u.y + 0.3 + p * 0.5 + Math.sin(a) * r, u.z - s * side, yaw, (1 - p) * 0.28 * (0.6 + 0.4 * Math.sin(p * 40 + j)), (1 - p) * 0.28);
      }
    }
    for (const [flk, g] of [[hallHerd, 'hall'], [gardenHerd, 'garden']]) {
      flk.body.count = n[g]; flk.sparks.count = n[g + 'Sparks'];
      flk.body.instanceMatrix.needsUpdate = flk.sparks.instanceMatrix.needsUpdate = true;
    }
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
      if (phase === 'idle') {
        if (armed) { waiting(dt); if (piled && ld.open() > SPEAK) fire(); }   // (the pile fidgets behind the door, and you see it as the door swings open)
        else { piled = false; if (stamp) finish(); }
      }
      else if (phase === 'slam') { waiting(dt); if ((slam -= dt) <= 0) { piled = true; place.shut = null; place.holding = door; phase = 'opening'; wait = 0; } }
      else if (phase === 'opening') { waiting(dt); if (ld.open() > SPEAK || (wait += dt) > 2) fire(); }   // (never stuck waiting for a door)
      else {
        for (const w of stamp.step(dt)) {
          const u = stamp.runners[w.who], e = m.ears();
          if (!u.on || u.where !== 'hall') continue;
          sound ||= makeSounds(sfx);
          if (hall.is(e.place)) sound.meow(w.variant, w.pitch, { x: u.x, y: u.y + 0.4, z: u.z }); else if (e.place === place) sound.meow(w.variant, w.pitch, undefined, 4);
        }
        if (phase !== 'puff' && stamp.t > SPAWN + 0.4) place.holding = null;
        if (phase === 'pour' && stamp.t >= stamp.holdFor) { letGoFront?.(); letGoFront = null; phase = 'drain'; }
        // once the front door has shut behind them (or, if you're standing in its way and it can't, a few seconds on: they've long since run off) they puff away
        else if (phase === 'drain' && stamp.over && (D.open() < 0.1 || stamp.t > stamp.holdFor + 4)) { stamp.vanishAll(); phase = 'puff'; }
        else if (phase === 'puff' && !stamp.left) finish();
      }
      draw();
    },
  };
  m.checks?.('__catsOnly', {
    state: () => ({ armed, phase, piled, t: stamp?.t ?? 0, on: stamp ? stamp.runners.filter(u => u.on).length : 0, garden: stamp ? stamp.runners.filter(u => u.on && u.where === 'garden').length : 0,
      frontHeld: !!letGoFront, frontOpen: D.open(), doorOpen: ld.open(), meows: { ...sfx.counts } }),
    press, go: () => { if (phase === 'idle') fire(); }, button: () => ({ x: buttonAt.x, y: buttonAt.y, z: buttonAt.z, label: use.label }),
  });
  return place;
}

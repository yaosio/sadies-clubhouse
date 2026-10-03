// The music room: a room full of instruments you play right where they stand (no computer), and
// Sadie, who now and then walks across one. The toy piano and the tape deck against the back wall,
// the drum kit (her bed) on its rug, the fish xylophone in the middle, the KEYCAT 3000 on its stand,
// the theremin by the left wall, wind chimes by the window, the volume dial, and the sign by the door.
//
// The mansion calls buildRoom(m) with its building kit (m: its shapes, its PS1 material, its
// textures, Sadie's sprite, and where you are: ears()), so nothing here imports the clubhouse. It
// hands back a place like any room's, with a `play` on each instrument: stepping up to one eases
// your view in until it fills the screen, then every key (and every press on the screen) goes to
// it until you step back. The dial and the sign are `act`s: E turns them there and then.
import { Scene, Color, Mesh, Group, Vector3, PlaneGeometry, CylinderGeometry, CircleGeometry, TorusGeometry, SphereGeometry, BoxGeometry, DoubleSide, Raycaster, Plane } from 'three';
import { drawArt } from './art.js';
import { makeSounds, LOUD } from './sounds/index.js';
import { soundsFor } from '../../shared/sound.js';
import { hz } from '../../shared/retro.js';
import { BARS } from './sounds/xylophone.js';
import { WHITE } from './sounds/piano.js';
import { DEMO } from './sounds/synth.js';
import { TUBES, REST } from './sounds/chimes.js';
import { makeSadie, stepSadie, goNow, TIMING } from './sadie.js';
import { makeTape, saveTape, press, heard, sadieTake, stepTape } from './tape.js';
import { keyboardNote, noteAt, pawNote, barOf, WHITE_KEYS, DRUM_KEYS, SADIE_DRUMS, VOICE_KEYS, VOICES, TAPE_KEYS, TAPE_BUTTONS, VOLUMES, KEYS_PIC } from './layout.js';

const RW = 6, RD = 5, H = 4.6;                    // the room: half its width and depth, and its height
const PX = -2.2, PZ = -4.65;                       // the toy piano (its body's middle)
const TX = -0.2, TZ = -4.6;                        // the tape deck's table
const DX = 2.9, DZ = -3.0;                         // the drum kit
const XX = 0.4, XZ = -1.0, XY = 0.78;              // the xylophone (its bars' height)
const SYN = { x: 4.2, z: 0.9, yaw: -1.0 };         // the KEYCAT 3000, turned to face the room
const TH = { x: -5.2, z: -1.6 };                   // the theremin, by the left wall (facing the room)
const CH = { x: -5.25, z: 1.0, low: 1.95 };        // the wind chimes by the window (their bottom)
const FLAT = [-Math.PI / 2, 0, 0];
const CUSHION = new Vector3(PX - 1.75, 0.12, PZ + 0.8);

export async function buildRoom(m) {
  const { T, psx, keep, kit, wallGeometry, doorway, card, leaf } = m;
  const A = drawArt(m);
  await m.breathe?.();   // (the mansion builds it a bit at a time, so nothing stutters)
  const scene = new Scene(); scene.background = new Color(0x0a0628);
  const { add, box, plane, cyl } = kit(scene);
  const mesh = (geo, mat, pos, rot, parent = scene) => { const o = new Mesh(keep(geo), mat); if (pos) o.position.set(...pos); if (rot) o.rotation.set(...rot); parent.add(o); return o; };

  // ---------- the room: teal music-note wallpaper, a wooden floor, the door in the front wall ----------
  const paper = psx(A.paper, { rx: 1 / 1.2, ry: 1 / 1.2 });
  add(new Mesh(wallGeometry(2 * RW, H), paper), [0, 0, -RD]);
  add(new Mesh(wallGeometry(2 * RW, H, 1.5, 2.45), paper), [0, 0, RD], [0, Math.PI, 0]);
  add(new Mesh(wallGeometry(2 * RD, H), paper), [-RW, 0, 0], [0, Math.PI / 2, 0]);
  add(new Mesh(wallGeometry(2 * RD, H), paper), [RW, 0, 0], [0, -Math.PI / 2, 0]);
  const sw = RW - 0.9, side = sw / 2 + 0.9;   // (the wainscot along the front wall: either side of the door)
  for (const [w, pos, rot] of [[2 * RW, [0, 0.55, -RD + 0.04], 0], [sw, [-side, 0.55, RD - 0.04], Math.PI], [sw, [side, 0.55, RD - 0.04], Math.PI],
    [2 * RD, [-RW + 0.04, 0.55, 0], Math.PI / 2], [2 * RD, [RW - 0.04, 0.55, 0], -Math.PI / 2]]) {
    plane(w, 1.1, psx(T.wainscot, { rx: w / 0.9, decal: true }), pos, [0, rot, 0], 2);
    plane(w, 0.1, psx(null, { tint: 0xffd23a, decal: true }), [pos[0], 1.12, pos[2]], [0, rot, 0], 2);
  }
  plane(2 * RW, 2 * RD, psx(A.floor, { rx: 2 * RW / 1.6, ry: 2 * RD / 1.6 }), [0, 0, 0], FLAT, 8).renderOrder = -2;
  plane(2 * RW, 2 * RD, psx(A.ceiling, { rx: 6, ry: 5 }), [0, H, 0], [Math.PI / 2, 0, 0], 6);
  const door = doorway(scene, { pos: [0, 0, RD], yaw: Math.PI, w: 1.5, h: 2.45, leaves: [leaf], hinge: 1 });
  const chrome = psx(A.chrome), gold = psx(A.brass), wood = psx(T.wood);
  // a mirror ball, turning slowly
  cyl(0.008, 0.008, 0.6, 3, chrome, [0.5, H - 0.3, 0]);
  const mirrorBall = mesh(new SphereGeometry(0.32, 8, 6), psx(A.mirror, { rx: 3, ry: 2, unlit: 0.4 }), [0.5, H - 0.75, 0]);

  // ---------- the toy piano, its stool, Sadie's cushion, and the band poster over it ----------
  const pink = psx(null, { tint: 0xff8ec8 }), pinkDark = psx(null, { tint: 0xe0509a });
  box(2.3, 1.3, 0.6, pinkDark, [PX, 0.95, PZ]);
  box(2.4, 0.08, 0.66, pink, [PX, 1.64, PZ]);
  for (const dx of [-1.05, 1.05]) box(0.14, 0.3, 0.5, gold, [PX + dx, 0.15, PZ + 0.1]);
  box(2.3, 0.14, 0.46, pinkDark, [PX, 0.8, PZ + 0.52]);
  const pianoKeys = plane(2.2, 0.42, psx(A.keys), [PX, 0.876, PZ + 0.52], FLAT, 2);
  plane(2.3, 0.72, psx(A.piano, { decal: true }), [PX, 1.25, PZ + 0.305], null, 2);
  plane(0.54, 0.36, psx(A.songbook), [PX, 1.2, PZ + 0.37], [-0.25, 0, 0], 2);
  box(0.8, 0.04, 0.08, gold, [PX, 1.02, PZ + 0.37]);
  cyl(0.28, 0.24, 0.5, 10, pink, [PX, 0.25, PZ + 1.35]);
  cyl(0.3, 0.3, 0.06, 10, psx(A.cushion), [PX, 0.53, PZ + 1.35]);
  cyl(0.45, 0.45, 0.1, 12, psx(A.cushion, { rx: 2 }), [CUSHION.x, 0.05, CUSHION.z]);
  plane(0.7, 0.93, psx(A.poster(T.sadie.image), { decal: true }), [PX, 2.65, -RD + 0.05], null, 2);

  // ---------- the tape deck on its little table, the cassette case beside it, the volume dial ----------
  box(0.95, 0.72, 0.5, psx(T.wood, { rx: 2, ry: 2 }), [TX, 0.36, TZ]);
  box(0.84, 0.42, 0.24, psx(null, { tint: 0x5e5c80 }), [TX, 0.93, TZ - 0.02]);
  const deck = plane(0.84, 0.42, psx(A.tape, { decal: true }), [TX, 0.93, TZ + 0.105], null, 2);
  box(0.14, 0.08, 0.14, psx(null, { tint: 0xb8b8c8 }), [TX, 1.17, TZ - 0.02]);
  box(0.36, 0.035, 0.24, pink, [TX + 0.28, 0.738, TZ + 0.32], [0, 0.3, 0]);
  const cassette = plane(0.34, 0.22, psx(A.cassette), [TX + 0.28, 0.757, TZ + 0.32], [-Math.PI / 2, 0, 0.3], 2);
  const DIAL = new Vector3(1.05, 2.0, -RD + 0.05);
  plane(0.62, 0.78, psx(A.dial, { decal: true, unlit: 0.2 }), DIAL.toArray(), null, 2);

  // ---------- the drum kit on its rug (it's a bed as much as a drum kit) ----------
  plane(3.6, 3.6, psx(T.carpet, { rx: 5, ry: 5, onFloor: true }), [DX, 0, DZ], FLAT, 4).renderOrder = -1;
  const shell = psx(A.shell, { rx: 4, ry: 1 }), drums = {}, drumHits = [];
  const hitMe = (o, name) => { o.userData.drum = name; drumHits.push(o); return o; };
  { const g = new Group(); g.position.set(DX, 0.5, DZ); scene.add(g); drums.kick = g;
    hitMe(mesh(new CylinderGeometry(0.48, 0.48, 0.42, 14, 2), shell, [0, 0, 0], [Math.PI / 2, 0, 0], g), 'kick');
    hitMe(mesh(new CircleGeometry(0.47, 16), psx(A.head), [0, 0, 0.215], null, g), 'kick');
    mesh(new PlaneGeometry(0.62, 0.36), psx(A.blanket, { rx: 2, side: DoubleSide }), [0.08, 0.12, 0.24], [0.25, 0, -0.15], g);
    mesh(new PlaneGeometry(0.3, 0.3), psx(A.blanket, { side: DoubleSide }), [0.2, -0.07, 0.26], [0.05, 0, 0.5], g); }
  const drum = (name, r, h, x, y, z, tilt = 0) => {
    cyl(0.015, 0.015, y, 4, chrome, [x, y / 2, z]);
    const g = new Group(); g.position.set(x, y, z); g.rotation.x = tilt; scene.add(g); drums[name] = g;
    hitMe(mesh(new CylinderGeometry(r, r, h, 12, 2), shell, [0, 0, 0], null, g), name);
    hitMe(mesh(new CylinderGeometry(r - 0.01, r - 0.01, 0.01, 12), psx(A.fur), [0, h / 2 + 0.005, 0], null, g), name);
  };
  drum('snare', 0.26, 0.18, DX - 0.75, 0.7, DZ + 0.45, 0.15);   // the snare: covered in fur
  drum('tom1', 0.2, 0.2, DX - 0.25, 0.98, DZ - 0.05, 0.35);
  drum('tom2', 0.2, 0.2, DX + 0.3, 0.98, DZ - 0.05, 0.35);
  drum('floor', 0.3, 0.4, DX + 0.9, 0.42, DZ + 0.5);
  const cymbal = (name, r, x, y, z) => {
    cyl(0.015, 0.015, y, 4, chrome, [x, y / 2, z]);
    const g = new Group(); g.position.set(x, y, z); g.rotation.set(0.2, 0, 0.1); scene.add(g); drums[name] = g;
    hitMe(mesh(new CylinderGeometry(r * 0.1, r, 0.05, 14, 1), gold, [0, 0, 0], null, g), name);
    if (name === 'hat') mesh(new CylinderGeometry(r, r * 0.1, 0.04, 14, 1), gold, [0, -0.06, 0], null, g);
  };
  cymbal('cymbal', 0.36, DX + 0.95, 1.45, DZ - 0.35);
  cymbal('hat', 0.24, DX - 1.25, 1.02, DZ + 0.2);
  cyl(0.24, 0.2, 0.5, 10, pink, [DX - 0.05, 0.25, DZ + 1.05]);   // (its stool)
  const DRUM_AT = { kick: [DX, 0.98, DZ], snare: [DX - 0.75, 0.8, DZ + 0.45], tom1: [DX - 0.25, 1.08, DZ - 0.05], tom2: [DX + 0.3, 1.08, DZ - 0.05], floor: [DX + 0.9, 0.62, DZ + 0.5], hat: [DX - 1.25, 1.05, DZ + 0.2], cymbal: [DX + 0.95, 1.5, DZ - 0.35] };

  await m.breathe?.();

  // ---------- the xylophone: fish for bars, mallets with pom-poms (cat toys, obviously) ----------
  for (const dz of [-0.26, 0.18]) box(1.5, 0.06, 0.06, wood, [XX, XY - 0.04, XZ + dz]);
  for (const [dx, dz] of [[-0.68, -0.24], [0.68, -0.24], [-0.68, 0.16], [0.68, 0.16]]) box(0.05, XY, 0.05, wood, [XX + dx, XY / 2, XZ + dz]);
  const RAINBOW = [0xff5a5a, 0xff9a3a, 0xffd23a, 0x58d04a, 0x40c0f0, 0x6a7aff, 0xb46aff, 0xff8ec8];
  const bars = BARS.map((midi, i) => {
    const len = 0.56 - i * 0.035, x = XX - 0.6 + i * 0.17;
    const b = plane(0.16, len, psx(A.fish, { tint: RAINBOW[i] }), [x, XY + 0.01, XZ - 0.04], [-Math.PI / 2, 0, Math.PI / 2], 2);
    b.userData.midi = midi; return b;
  });
  for (const [dx, a] of [[-0.1, 0.5], [0.25, -0.3]]) {
    cyl(0.012, 0.012, 0.45, 4, wood, [XX + dx, XY + 0.03, XZ + 0.36], [Math.PI / 2, 0, a]);
    mesh(new SphereGeometry(0.05, 6, 4), psx(A.pompom), [XX + dx - Math.sin(a) * 0.22, XY + 0.05, XZ + 0.36 - Math.cos(a) * 0.22]);
  }

  // ---------- the KEYCAT 3000 on its stand ----------
  const syn = new Group(); syn.position.set(SYN.x, 0, SYN.z); syn.rotation.y = SYN.yaw; scene.add(syn);
  const synAt = (x, y, z) => new Vector3(x, y, z).applyAxisAngle(new Vector3(0, 1, 0), SYN.yaw).add(new Vector3(SYN.x, 0, SYN.z));
  for (const s of [1, -1]) for (const lean of [0.5, -0.5]) mesh(new BoxGeometry(0.05, 1.1, 0.05), chrome, [0.4 * s, 0.45, 0], [lean, 0, 0], syn);
  mesh(new BoxGeometry(1.3, 0.1, 0.54, 2, 2, 2), psx(null, { tint: 0x2a2a40 }), [0, 0.92, 0], null, syn);
  const synPanel = mesh(new PlaneGeometry(1.28, 0.2), psx(A.synthPanel), [0, 0.972, -0.16], FLAT, syn);
  const synKeys = mesh(new PlaneGeometry(1.28, 0.3), psx(A.synthKeys), [0, 0.972, 0.1], FLAT, syn);

  // ---------- the theremin by the left wall, facing the room (its pitch aerial on your right) ----------
  cyl(0.03, 0.03, 0.9, 5, chrome, [TH.x, 0.45, TH.z]);
  cyl(0.25, 0.3, 0.04, 8, chrome, [TH.x, 0.02, TH.z]);
  box(0.3, 0.18, 0.62, wood, [TH.x, 0.98, TH.z]);
  plane(0.58, 0.12, psx(A.label, { decal: true }), [TH.x + 0.155, 0.98, TH.z], [0, Math.PI / 2, 0], 2);
  const antenna = cyl(0.012, 0.012, 0.75, 4, chrome, [TH.x, 1.45, TH.z - 0.26]);
  mesh(new TorusGeometry(0.13, 0.012, 4, 10, Math.PI), chrome, [TH.x, 1.07, TH.z + 0.33], [0, 0, Math.PI / 2]);
  const glow = mesh(new SphereGeometry(0.05, 6, 4), psx(null, { tint: 0xff8ec8, unlit: 1 }), [TH.x, 1.84, TH.z - 0.26]);
  glow.visible = false;

  // ---------- the window on the left wall, and the wind chimes in front of it ----------
  plane(1.2, 1.5, psx(A.window, { decal: true }), [-RW + 0.05, 2.35, CH.z], [0, Math.PI / 2, 0], 2);
  cyl(0.005, 0.005, H - 2.95, 3, chrome, [CH.x, (H + 2.95) / 2, CH.z]);
  const chimes = new Group(); chimes.position.set(CH.x, 2.95, CH.z); scene.add(chimes);
  mesh(new CylinderGeometry(0.18, 0.18, 0.03, 10), wood, [0, 0, 0], null, chimes);
  const rods = [0.55, 0.7, 0.62, 0.8, 0.48].map((len, i) => {
    const th = i / 5 * Math.PI * 2;
    return mesh(new CylinderGeometry(0.018, 0.018, len, 5), chrome, [Math.sin(th) * 0.13, -0.05 - len / 2, Math.cos(th) * 0.13], null, chimes);
  });
  mesh(new PlaneGeometry(0.22, 0.1), psx(A.fish, { tint: 0x40c0f0, side: DoubleSide }), [0, -0.95, 0], null, chimes);   // (a fish on the end, to catch the breeze)

  // ---------- the sign by the door, on its hook ----------
  const SIGN = new Vector3(1.35, 1.45, RD - 0.05);
  plane(0.5, 0.35, psx(A.sign, { decal: true, unlit: 0.2 }), SIGN.toArray(), [0, Math.PI, 0], 2);
  box(0.04, 0.04, 0.06, gold, [SIGN.x, SIGN.y + 0.2, RD - 0.04]);

  // ---------- Sadie, and the notes that float up off whatever's played ----------
  const sadie = mesh(new PlaneGeometry(0.78, 0.63, 1, 1).translate(0, 0.315, 0), psx(T.sadie, { unlit: 0.35 }), CUSHION.toArray());
  const notes = [];
  for (let i = 0; i < 10; i++) {
    const n = mesh(new PlaneGeometry(0.16, 0.19, 1, 1).translate(0, 0.095, 0), psx(A.notes[i % 3], { unlit: 0.6 }));
    n.visible = false; n.userData.life = 0; notes.push(n);
  }
  let nextNote = 0;
  function float(at) {
    const n = notes[nextNote++ % notes.length];
    n.position.set(at[0] + (Math.random() - 0.5) * 0.3, at[1] + 0.1, at[2]); n.userData.life = 1.4; n.visible = true;
  }

  // ---------- sound, and what's kept ----------
  const welcomeSaved = m.saves.get('sign', true) !== false;
  let welcome = welcomeSaved, volumeAt = VOLUMES.findIndex(v => v[0] === m.saves.get('volume', 'MEDIUM'));
  if (volumeAt < 0) volumeAt = 1;
  const tape = makeTape(m.saves.get('tape', null));
  const keepTape = () => m.saves.set('tape', saveTape(tape));
  let sound = null, now = 0, playing = null, voice = 'CAT', lcd = 'CAT', lcdUntil = 0;
  const sounds = () => (sound ||= makeSounds(soundsFor('room:' + card.id), VOLUMES[volumeAt][1]));
  A.drawSign(welcome); A.drawDial(VOLUMES[volumeAt][1] / 0.8, VOLUMES[volumeAt][0]); A.drawDeck(tape.state, tape.which);
  const here = () => { const e = m.ears?.(); return !!e && e.place === place; };
  const later = [];   // things to do in a moment: [when, what]
  const soon = (secs, fn) => later.push([now + secs, fn]);

  // what's lit on the keyboards, and a key lit just for a moment (Sadie's paws, the tape)
  const lit = { piano: new Set(), synth: new Set() };
  const relight = inst => A.lightKeys(inst === 'piano' ? A.keys : A.synthKeys, lit[inst], inst === 'synth');
  function flash(inst, midi) { lit[inst].add(midi); relight(inst); soon(0.22, () => { lit[inst].delete(midi); relight(inst); }); }
  const bump = { drums: {}, bars: {} };

  // One note, on any instrument: { inst, n (the note, or the drum), loud, voice (the synth's) }.
  // byYou: it goes on the tape if it's recording.
  function sound_(nt, byYou) {
    const s = sounds(), loud = nt.loud ?? 1;
    if (nt.inst === 'piano') { s.piano(nt.n, loud); float([PX - 1.1 + (WHITE.indexOf(nt.n) + 0.5) * 0.22, 0.9, PZ + 0.45]); }
    else if (nt.inst === 'xylophone') { s.xylophone(nt.n, loud); bump.bars[nt.n] = 0.12; float(bars[BARS.indexOf(nt.n)]?.position.toArray() ?? [XX, XY, XZ]); }
    else if (nt.inst === 'drums') { s.drums(nt.n, loud); bump.drums[nt.n] = 0.15; float(DRUM_AT[nt.n]); }
    else if (nt.inst === 'synth') { s.synth(nt.voice || voice, nt.n, loud); float(synAt(0, 1.0, 0.05).toArray()); }
    if (byYou) heard(tape, nt, now);
  }

  // ---------- the instruments you play ----------
  const ray = new Raycaster();
  const hit = (r, objs) => { ray.set(r.origin, r.dir); return ray.intersectObjects(objs, false)[0] || null; };
  const held = new Map();   // what each key or finger is holding down: [instrument, note]
  function down(who, inst, n, extra) {
    const was = held.get(who);
    if (was && was[1] === n) return;
    if (was) up(who);
    held.set(who, [inst, n]);
    if (inst === 'piano' || inst === 'synth') { lit[inst].add(n); relight(inst); }
    sound_({ inst, n, ...extra }, true);
  }
  function up(who) {
    const was = held.get(who); if (!was) return;
    held.delete(who);
    const [inst, n] = was;
    if ((inst === 'piano' || inst === 'synth') && ![...held.values()].some(h => h[0] === inst && h[1] === n)) { lit[inst].delete(n); relight(inst); }
  }
  function letAllGo() { for (const who of [...held.keys()]) up(who); theremin.off(); }
  // a keyboard's note from where a press hit its picture
  const keyAt = h => h?.uv ? noteAt(h.uv.x * KEYS_PIC.w, (1 - h.uv.y) * KEYS_PIC.h) : null;

  function instrument(name, label, view, hint, how) {
    return {
      label, view, hint,
      start() { sounds().wake(); playing = name; },
      stop() { letAllGo(); playing = null; },
      key(code, isDown, repeat) { if (repeat) return how.key(code, null) !== null; return how.key(code, isDown) !== null; },
      touch(id, r, kind) { how.touch('p' + id, r, kind); },
    };
  }
  const n1 = new Vector3(0, 0, 1);
  const piano = instrument('piano', 'PLAY THE TOY PIANO',
    { center: new Vector3(PX, 0.95, PZ + 0.45), normal: n1, w: 2.5, h: 1.0, down: 0.85 },
    { keys: '<kbd>A</kbd>-<kbd>;</kbd> <kbd>W E T Y U O P</kbd> PLAY &nbsp; <kbd>ESC</kbd> STEP BACK', touch: 'TAP THE KEYS' },
    {
      key(code, isDown) { const n = keyboardNote(code); if (n === null) return null; if (isDown) down(code, 'piano', n); else if (isDown === false) up(code); return n; },
      touch(who, r, kind) { if (kind === 'up') return up(who); const n = keyAt(hit(r, [pianoKeys])); if (n !== null) down(who, 'piano', n); else up(who); },
    });
  const xylophone = instrument('xylophone', 'PLAY THE XYLOPHONE',
    { center: new Vector3(XX, XY, XZ), normal: n1, w: 1.7, h: 0.8, down: 1.0 },
    { keys: '<kbd>A</kbd>-<kbd>K</kbd> PLAY &nbsp; <kbd>ESC</kbd> STEP BACK', touch: 'TAP THE FISH (SLIDE ACROSS THEM TOO)' },
    {
      key(code, isDown) { const n = barOf(code); if (n === null) return null; if (isDown) down(code, 'xylophone', n); else if (isDown === false) up(code); return n; },
      touch(who, r, kind) { if (kind === 'up') return up(who); const h = hit(r, bars); if (h) down(who, 'xylophone', h.object.userData.midi); else up(who); },
    });
  const drumkit = instrument('drums', 'PLAY THE DRUMS',
    { center: new Vector3(DX, 0.85, DZ + 0.2), normal: n1, w: 3.2, h: 1.9, down: 0.6 },
    { keys: '<kbd>A S D F G H</kbd> <kbd>SPACE</kbd> PLAY &nbsp; <kbd>ESC</kbd> STEP BACK', touch: 'TAP THE DRUMS' },
    {
      key(code, isDown) { const n = DRUM_KEYS[code]; if (!n) return null; if (isDown) down(code, 'drums', n); else if (isDown === false) up(code); return n; },
      touch(who, r, kind) { if (kind === 'up') return up(who); if (kind !== 'down') return; const h = hit(r, drumHits); if (h) { up(who); down(who, 'drums', h.object.userData.drum); } },
    });
  function demo() {
    DEMO.forEach((n, i) => soon(i * 0.4, () => { sound_({ inst: 'synth', n }, false); flash('synth', n); }));
    soon(1.3, () => { lcd = 'FULL VER.\n1997!'; lcdUntil = now + 3; A.drawPanel(voice, lcd); });
  }
  const setVoice = v => { voice = v; lcd = v; lcdUntil = 0; A.drawPanel(voice, lcd); };
  const synth = instrument('synth', 'PLAY THE KEYCAT 3000',
    { center: synAt(0, 0.97, 0), normal: new Vector3(Math.sin(SYN.yaw), 0, Math.cos(SYN.yaw)), w: 1.5, h: 0.7, down: 0.9 },
    { keys: '<kbd>A</kbd>-<kbd>;</kbd> <kbd>W E T Y U O P</kbd> PLAY &nbsp; <kbd>1</kbd>-<kbd>4</kbd> SOUND &nbsp; <kbd>0</kbd> DEMO &nbsp; <kbd>ESC</kbd> STEP BACK', touch: 'TAP THE KEYS, THE SOUNDS OR DEMO' },
    {
      key(code, isDown) {
        const v = VOICE_KEYS.indexOf(code);
        if (v >= 0) { if (isDown) setVoice(VOICES[v]); return v; }
        if (code === 'Digit0') { if (isDown) demo(); return 0; }
        const n = keyboardNote(code); if (n === null) return null;
        if (isDown) down(code, 'synth', n, { voice }); else if (isDown === false) up(code); return n;
      },
      touch(who, r, kind) {
        if (kind === 'up') return up(who);
        const h = hit(r, [synKeys, synPanel]);
        if (h?.object === synPanel) {
          if (kind !== 'down') return;
          const x = h.uv.x * 96, y = (1 - h.uv.y) * 24;
          if (y >= 12) { const i = Math.floor((x - 2) / 12); if (x >= 52 && x < 92) demo(); else if (i >= 0 && i < 4) setVoice(VOICES[i]); }
          return;
        }
        const n = keyAt(h); if (n !== null) down(who, 'synth', n, { voice }); else up(who);
      },
    });
  // the theremin: it sounds only while you hold it, sliding to wherever your hand (or key) goes
  const theremin = (() => {
    let v = null; const keys = new Set(), fingers = new Map();
    const face = new Plane(new Vector3(1, 0, 0), -(TH.x + 0.25)), p = new Vector3();
    function sing() {
      let f = null, loud = 0.8;
      if (fingers.size) [f, loud] = [...fingers.values()].pop();
      else if (keys.size) f = hz(keyboardNote([...keys].pop()) - 12);
      if (f === null) { v?.stop(); v = null; glow.visible = false; return; }
      if (!v) v = sounds().voice();
      v.set(f, LOUD.theremin * loud); glow.visible = true;
    }
    return {
      off() { keys.clear(); fingers.clear(); sing(); },
      play: instrument('theremin', 'PLAY THE THEREMIN',
        { center: new Vector3(TH.x, 1.25, TH.z), normal: new Vector3(1, 0, 0), w: 2.0, h: 1.6, down: 0.15 },
        { keys: 'HOLD <kbd>MOUSE</kbd> AND MOVE, OR HOLD <kbd>A</kbd>-<kbd>;</kbd> &nbsp; <kbd>ESC</kbd> STEP BACK', touch: 'HOLD A FINGER ON IT AND MOVE (UP: LOUDER)' },
        {
          key(code, isDown) { if (!WHITE_KEYS.includes(code)) return null; if (isDown) keys.add(code); else if (isDown === false) keys.delete(code); sing(); return 1; },
          touch(who, r, kind) {
            if (kind === 'up') { fingers.delete(who); return sing(); }
            ray.set(r.origin, r.dir); if (!ray.ray.intersectPlane(face, p)) return;
            const dx = Math.max(-0.9, Math.min(0.9, TH.z - p.z)), k = (dx + 0.9) / 1.8;   // (higher towards the aerial, on your right)
            fingers.set(who, [196 * Math.pow(2, k * 2), Math.max(0.25, Math.min(1, (p.y - 0.5) / 1.3))]); sing();
          },
        }),
    };
  })();
  // the tape deck
  function tapeButton(b) {
    if (b === 'loop' && tape.state === 'loop') b = 'stop';
    press(tape, b, now); A.drawDeck(tape.state, tape.which); keepTape();
  }
  const tapeDeck = instrument('tape', 'USE THE TAPE DECK',
    { center: new Vector3(TX, 0.9, TZ + 0.1), normal: n1, w: 1.35, h: 0.8, down: 0.35 },
    { keys: '<kbd>R</kbd> REC &nbsp; <kbd>P</kbd> PLAY &nbsp; <kbd>S</kbd> STOP &nbsp; <kbd>L</kbd> LOOP &nbsp; <kbd>T</kbd> SWAP TAPES &nbsp; <kbd>ESC</kbd> STEP BACK', touch: 'TAP A BUTTON (OR A TAPE, TO SWAP)' },
    {
      key(code, isDown) { const b = TAPE_KEYS[code]; if (!b) return null; if (isDown) tapeButton(b); return b; },
      touch(who, r, kind) {
        if (kind !== 'down') return;
        const h = hit(r, [deck, cassette]);
        if (h?.object === cassette) tapeButton('tape');
        else if (h && (1 - h.uv.y) * 80 < 21) { const i = Math.floor((h.uv.x * 160 - 6) / 38); if (i >= 0 && i < 4) tapeButton(TAPE_BUTTONS[i]); }
      },
    });

  // ---------- the dial and the sign: E turns them ----------
  const dialUse = {
    pos: DIAL, reach: 3.6, act() {
      volumeAt = (volumeAt + 1) % VOLUMES.length; const [name, v] = VOLUMES[volumeAt];
      m.saves.set('volume', name); A.drawDial(v / 0.8, name); sounds().setVolume(v);
      if (v) soon(0.05, () => sound_({ inst: 'piano', n: 72, loud: 0.6 }, false));   // (a note, so you hear how loud)
    },
    get label() { return 'TURN THE VOLUME (' + VOLUMES[volumeAt][0] + ')'; }, button: 'TURN',
  };
  const signUse = {
    pos: SIGN, reach: 2.6, act() { welcome = !welcome; m.saves.set('sign', welcome); A.drawSign(welcome); },
    get label() { return welcome ? 'TURN THE SIGN (SADIE WELCOME)' : 'TURN THE SIGN (SHH, SADIE NAPPING)'; }, button: 'TURN',
  };

  // ---------- Sadie ----------
  const S = makeSadie(Math.floor(Math.random() * 1e6) + 1);
  const world = () => ({ here: here(), playing, welcome });
  // where she stands: on each instrument at u (0 one end, 1 the other), napping, or sulking beside it
  const along = (pts, u) => { const k = Math.max(0, Math.min(pts.length - 1.0001, u * (pts.length - 1))), i = Math.floor(k), f = k - i; return pts[i].clone().lerp(pts[i + 1], f); };
  const V = a => new Vector3(...a);
  const PATHS = {
    piano: [V([PX - 0.95, 0.876, PZ + 0.5]), V([PX + 0.95, 0.876, PZ + 0.5])],
    xylophone: [V([XX - 0.6, XY + 0.01, XZ - 0.04]), V([XX + 0.6, XY + 0.01, XZ - 0.04])],
    drums: SADIE_DRUMS.map(d => V(DRUM_AT[d])),
    synth: [synAt(-0.55, 0.972, 0.1), synAt(0.55, 0.972, 0.1)],
  };
  const NAPS = { drums: V(DRUM_AT.kick) };
  const SULKS = { piano: V([PX + 1.5, 0, PZ + 0.75]), xylophone: V([XX - 1.0, 0, XZ + 0.35]), drums: V([DX - 1.7, 0, DZ + 1.1]), synth: synAt(-0.95, 0, 0.35) };
  let take = [], takeFrom = 0, was = 'cushion', from = CUSHION.clone();
  const spot = () => {
    if (S.mode === 'cushion') return CUSHION;
    if (S.mode === 'sulk') return SULKS[S.inst];
    if (S.mode === 'nap' && NAPS[S.inst]) return NAPS[S.inst];
    return along(PATHS[S.inst], S.u);
  };
  function sadieHeard(e) {
    let nt;
    if (e.inst === 'drums') nt = { inst: 'drums', n: e.kind === 'step' ? SADIE_DRUMS[e.keys[0]] : 'kick', loud: e.loud };
    for (const k of e.inst === 'drums' ? [0] : e.keys) {
      if (e.inst === 'piano' || e.inst === 'synth') nt = { inst: e.inst, n: pawNote(k), loud: e.loud, voice };
      else if (e.inst === 'xylophone') nt = { inst: 'xylophone', n: BARS[k], loud: e.loud };
      sound_(nt, false);
      if (nt.inst === 'piano' || nt.inst === 'synth') flash(nt.inst, nt.n);
      take.push({ ...nt, at: Math.round((now - takeFrom) * 1000) / 1000 });
    }
  }
  function drawSadie(dt) {
    if (S.mode !== was) {   // (where she's hopping from)
      from = sadie.position.clone();
      if (S.mode === 'hop') { take = []; takeFrom = now; }
      if (S.mode === 'cushion' && take.length) { sadieTake(tape, take); keepTape(); take = []; A.drawDeck(tape.state, tape.which); }
      was = S.mode;
    }
    const to = spot(), hopping = S.mode === 'hop' || S.mode === 'back' || (S.mode === 'sulk' && S.t < TIMING.hop);
    if (hopping) {
      const k = Math.min(1, S.t / TIMING.hop), end = S.mode === 'back' ? CUSHION : to;
      sadie.position.lerpVectors(from, end, k); sadie.position.y += Math.sin(Math.PI * k) * 0.5;
    } else if (S.mode === 'walk') {
      sadie.position.lerp(to, Math.min(1, dt * 5));
      sadie.position.y = to.y + Math.max(0, 0.05 - S.t * 0.25);   // (a little lift with each step)
    } else sadie.position.copy(to);
    const napping = S.mode === 'nap';
    sadie.scale.set(napping ? 1.1 : 1, napping ? 0.75 : 1, 1);
    sadie.material.uniforms.map.value = napping || (S.mode === 'cushion' && (now % 5.3) < 0.15) ? T.nap : T.sadie;
  }

  // ---------- the place ----------
  const P = 0.35;
  const near = (x, z, cx, cz, r) => Math.hypot(x - cx, z - cz) < r + P;
  let chimedAt = -Infinity, swing = 0;
  const place = {
    name: 'room:' + card.id, card, scene, doors: { door }, faces: [sadie, ...notes],
    hush: true,   // (the clubhouse's music stays out: this room is for yours, and its instruments aren't music channels)
    uses: [
      { pos: new Vector3(PX, 0.88, PZ + 0.52), reach: 2.6, label: piano.label, play: piano },
      { pos: new Vector3(XX, XY, XZ), reach: 2.4, label: xylophone.label, play: xylophone },
      { pos: new Vector3(DX, 0.8, DZ), reach: 3.2, label: drumkit.label, play: drumkit },
      { pos: synAt(0, 0.97, 0), reach: 2.4, label: synth.label, play: synth },
      { pos: new Vector3(TH.x, 1.1, TH.z), reach: 2.4, label: theremin.play.label, play: theremin.play },
      { pos: new Vector3(TX, 0.95, TZ + 0.1), reach: 2.4, label: tapeDeck.label, play: tapeDeck },
      dialUse, signUse,
    ],
    holding: null, watch: null,
    light: { sun: 0.2, bulb: 0.8, lamp: [0.5, 3.6, -1.5] },
    // (the mansion puts the room away when you're far off, never with something still to happen in
    // it; it's built again from its save as you come back)
    busy: () => later.length > 0 || !!playing,
    spots: {
      door: { x: 0, z: RD - 1.2, yaw: 0, pitch: 0, y: 0 },
      piano: { x: PX, z: PZ + 2.3, yaw: 0, pitch: -0.35, y: 0 },
      xylophone: { x: XX, z: XZ + 1.6, yaw: 0, pitch: -0.45, y: 0 },
      drums: { x: DX - 0.2, z: DZ + 2.5, yaw: 0, pitch: -0.2, y: 0 },
      synth: { x: synAt(0, 0, 1.5).x, z: synAt(0, 0, 1.5).z, yaw: SYN.yaw, pitch: -0.4, y: 0 },
      theremin: { x: TH.x + 1.8, z: TH.z, yaw: Math.PI / 2, pitch: -0.1, y: 0 },
      tape: { x: TX, z: TZ + 1.6, yaw: 0, pitch: -0.3, y: 0 },
      dial: { x: 0.9, z: -2.7, yaw: 0, pitch: 0.2, y: 0 },
      sign: { x: 1.35, z: RD - 1.4, yaw: Math.PI, pitch: 0, y: 0 },
      chimes: { x: CH.x + 1.5, z: CH.z, yaw: Math.PI / 2, pitch: 0, y: 0 },
    },
    floor(x, z) {
      if (Math.abs(x) > RW - P || Math.abs(z) > RD - P) return null;
      if (Math.abs(x - PX) < 1.2 + P && z < PZ + 0.75 + P) return null;                // the piano
      if (near(x, z, PX, PZ + 1.35, 0.3) || near(x, z, CUSHION.x, CUSHION.z, 0.3)) return null;   // its stool, her cushion
      if (Math.abs(x - TX) < 0.5 + P && z < TZ + 0.45 + P) return null;                // the tape deck's table
      if (near(x, z, DX, DZ, 1.5)) return null;                                          // the drums
      if (Math.abs(x - XX) < 0.75 + P && Math.abs(z - XZ + 0.04) < 0.3 + P) return null; // the xylophone
      if (near(x, z, SYN.x, SYN.z, 0.7) || near(x, z, TH.x, TH.z, 0.35)) return null;    // the synth, the theremin
      return 0;
    },
    update(t, dt = 0) {
      now = t;
      for (let i = later.length - 1; i >= 0; i--) if (t >= later[i][0]) { const [, fn] = later[i]; later.splice(i, 1); fn(); }
      const inHere = here();
      // Sadie (only while you're here)
      for (const e of stepSadie(S, dt, world())) sadieHeard(e);
      drawSadie(dt);
      // the tape: it only plays while you're in the room
      if (!inHere && (tape.state === 'play' || tape.state === 'loop')) { press(tape, 'stop', t); A.drawDeck(tape.state, tape.which); }
      for (const nt of stepTape(tape, t)) { sound_(nt, false); if (nt.inst === 'piano' || nt.inst === 'synth') flash(nt.inst, nt.n); }
      if (tape.state !== 'idle' && Math.floor(t * 6) !== Math.floor((t - dt) * 6)) A.drawDeck(tape.state, tape.which, t * 3);
      if (lcdUntil && t > lcdUntil) { lcdUntil = 0; lcd = voice; A.drawPanel(voice, lcd); }
      // the chimes: walking under them, a few soft notes (and then not again for a while)
      const e = inHere ? m.ears() : null;
      if (e && Math.hypot(e.x - CH.x, e.z - CH.z) < 0.6 && t - chimedAt > REST) {
        chimedAt = t; swing = 1;
        const count = 3 + Math.floor(Math.random() * 3);
        let at = 0, last = -1;
        for (let i = 0; i < count; i++) {
          let k = Math.floor(Math.random() * TUBES.length); if (k === last) k = (k + 1) % TUBES.length; last = k;
          const kk = k, loud = 0.6 + Math.random() * 0.4;
          soon(at, () => sounds().chimes(kk, loud)); at += 0.18 + Math.random() * 0.25;
        }
      }
      swing = Math.max(0, swing - dt * 0.35);
      chimes.rotation.z = Math.sin(t * 5) * 0.12 * swing; chimes.rotation.x = Math.sin(t * 3.7) * 0.08 * swing;
      rods.forEach((r, i) => { r.rotation.z = Math.sin(t * 7 + i) * 0.2 * swing; });
      // the drums and the bars bounce when they're hit, and the notes float up and fade
      for (const [name, g] of Object.entries(drums)) { const b = bump.drums[name] || 0; g.scale.set(1 + b * 0.4, 1 - b * 0.8, 1 + b * 0.4); bump.drums[name] = Math.max(0, b - dt); }
      bars.forEach(b => { const k = bump.bars[b.userData.midi] || 0; b.position.y = XY + 0.01 - k * 0.12; bump.bars[b.userData.midi] = Math.max(0, k - dt); });
      for (const n of notes) {
        if (!n.visible) continue;
        n.userData.life -= dt; n.position.y += dt * 0.35;
        n.material.uniforms.uFade.value = Math.max(0, 1 - n.userData.life / 0.6);
        if (n.userData.life <= 0) n.visible = false;
      }
      mirrorBall.rotation.y = t / 4;
      antenna.scale.y = glow.visible ? 1 + Math.sin(t * 30) * 0.01 : 1;
    },
  };

  // for the checks (tests/music-room/browser.mjs)
  m.checks('__musicRoom', {
    state: () => ({ playing, sadie: { mode: S.mode, inst: S.inst, walks: S.walks, wait: S.wait }, sounds: sound ? sound.played : 0, heard: sound ? sound.log.slice() : [],
      lit: { piano: [...lit.piano], synth: [...lit.synth] }, welcome, volume: VOLUMES[volumeAt][0], voice, lcd,
      tape: { state: tape.state, which: tape.which, mine: tape.mine.length, sadie: tape.sadie.length }, theremin: glow.visible, sadieAt: sadie.position.toArray() }),
    // send Sadie off to an instrument right now (as if she'd decided to)
    sadieNow(inst) { goNow(S, world(), inst); },
  });
  return place;
}

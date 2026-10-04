// Inside Marbles' Cut & Curl (Marbles: a mischievous brown tabby, the owner of the shop): a barbershop
// where Sadie sits in the barber chair in front of a big mirror and you give her a hairdo, a taildo and
// an outfit. Nothing is saved: leave and she's plain Sadie again.
//
// You choose by walking up and pressing USE: wig heads on a shelf (hair), ribbons on a rack (tails), a
// rail of clothes (outfits). Some outfits have a little show: pull the rope by the stage and Sadie hops
// up and does it (the pop star sings, all meows; the construction worker builds a cat tower that falls
// over; the ball gown waltzes; and more, shows.js). Press USE on Marbles and she picks everything,
// and nothing matches.
//
// The clubhouse calls buildRoom(m) with its building kit, and with the outside and this activity's
// plot on it (its card has a `lot`), so the shop outside is built here too (house.js).
import { Scene, Color, Mesh, Group, Vector3, PlaneGeometry, BoxGeometry, SphereGeometry, ConeGeometry, DoubleSide } from 'three';
import { drawArt, MARBLES } from './art.js';
import { buildHouse, DW, DH } from './house.js';
import { HAIR, TAIL, OUTFIT, drawLook, W as LW, H as LH } from './looks.js';
import { makeProps } from './props.js';
import { SHOWS } from './shows.js';
import { makeSounds } from './sounds/index.js';
import { soundsFor } from '../../shared/sound.js';

const RW = 5, RD = 4, H = 3.6;            // the room: half its width and depth, and its height
const SADIE_W = 0.9;                      // how wide Sadie is (as everywhere outside)
const CHAIR = { x: -1.4, z: -2.7, seat: 0.55 };   // the barber chair, and how high you sit
const STAGE = { x0: 1.7, x1: 4.9, z0: -3.9, z1: -1.2, h: 0.3 };
const MARBLES_AT = { x: -3.0, z: -3.3 };
const RAIL = { z: 2.7, x0: 1.3, x1: 4.7 };
const QUIPS = ['TRUST ME.', 'VERY FASHION.', 'I DID A LITTLE EXTRA.', 'NO REFUNDS.', 'SHE LOVES IT. PROBABLY.', 'BOLD. I LIKE BOLD.'];
const SHOP_TALK = ["THAT ONE'S JUST A LOOK.", 'NO SHOW WITH THAT ONE. TRY A FANCY ONE.'];

export async function buildRoom(m) {
  const { psx, keep, kit, wallGeometry, doorway, card, tex, words } = m;
  const A = drawArt(m);
  await m.breathe?.();
  const scene = new Scene(); scene.background = new Color(0x0a0628);
  const { add, box, plane, cyl } = kit(scene);
  const mesh = (geo, mat, pos, rot, parent = scene) => { const o = new Mesh(keep(geo), mat); if (pos) o.position.set(...pos); if (rot) o.rotation.set(...rot); parent.add(o); return o; };
  const tint = (c, o = {}) => psx(null, { tint: c, unlit: 0.25, ...o });
  // (built again after being put away, the shop outside is still there: the clubhouse hands it back)
  const house = m.house || (m.outside && m.lot ? buildHouse(m, A) : null);

  // ---------- the room: papered walls, a checkered floor, a ceiling ----------
  const OVER = 0.15;   // (each wall runs on a little past the corners: the PS1 wobble opens hairline cracks there)
  const paper = w => psx(A.wallpaper, { rx: w / 2, ry: H / 2, unlit: 0.2 });
  add(new Mesh(keep(wallGeometry(2 * RW + 2 * OVER, H)), paper(2 * RW)), [0, 0, -RD]);
  add(new Mesh(keep(wallGeometry(2 * RW + 2 * OVER, H, DW, DH)), paper(2 * RW)), [0, 0, RD], [0, Math.PI, 0]);
  add(new Mesh(keep(wallGeometry(2 * RD + 2 * OVER, H)), paper(2 * RD)), [-RW, 0, 0], [0, Math.PI / 2, 0]);
  add(new Mesh(keep(wallGeometry(2 * RD + 2 * OVER, H)), paper(2 * RD)), [RW, 0, 0], [0, -Math.PI / 2, 0]);
  plane(2 * RW + 2 * OVER, 2 * RD + 2 * OVER, psx(A.floor, { rx: 2 * RW, ry: 2 * RD }), [0, 0, 0], [-Math.PI / 2, 0, 0], 8);
  plane(2 * RW + 2 * OVER, 2 * RD + 2 * OVER, psx(null, { tint: 0xfff4e4, unlit: 0.6 }), [0, H, 0], [Math.PI / 2, 0, 0], 8);
  const door = doorway(scene, { pos: [0, 0, RD], yaw: Math.PI, w: DW, h: DH, leaves: [{ front: A.doorBack, back: A.door }], hinge: 1, trim: 0xffd23a });
  // a pink stripe along the bottom of the walls, and the lamps
  for (const [w, pos, ry] of [[2 * RW, [0, 0.45, -RD + 0.02], 0], [2 * RD, [-RW + 0.02, 0.45, 0], Math.PI / 2], [2 * RD, [RW - 0.02, 0.45, 0], -Math.PI / 2]])
    plane(w, 0.9, psx(null, { tint: 0xffc4e0, unlit: 0.2, decal: true }), pos, [0, ry, 0], 1);
  for (const [x, z] of [[-2.5, -1], [2.5, 0.5], [0, 2.4], [-2.5, 2.2]]) {
    cyl(0.008, 0.008, 0.6, 3, tint(0x221a44), [x, H - 0.3, z]);
    cyl(0.12, 0.28, 0.24, 8, tint(0xffd23a, { unlit: 0.85 }), [x, H - 0.7, z]);
  }
  await m.breathe?.();

  // ---------- the mirror and the barber chair ----------
  plane(3.0, 2.0, psx(A.mirror, { unlit: 0.7 }), [CHAIR.x, 1.9, -RD + 0.03], null, 1);
  plane(0.9, 0.24, psx(A.signChair, { unlit: 0.5 }), [CHAIR.x, 3.1, -RD + 0.04], null, 1);
  const red = tint(0xc01030), chrome = tint(0xd8d8e8, { unlit: 0.4 });
  cyl(0.3, 0.34, 0.08, 10, chrome, [CHAIR.x, 0.04, CHAIR.z]);
  cyl(0.07, 0.07, 0.4, 6, chrome, [CHAIR.x, 0.27, CHAIR.z]);
  box(0.7, 0.14, 0.62, red, [CHAIR.x, CHAIR.seat - 0.07, CHAIR.z]);
  box(0.7, 0.95, 0.13, red, [CHAIR.x, CHAIR.seat + 0.45, CHAIR.z - 0.3]);
  for (const s of [-1, 1]) box(0.09, 0.07, 0.5, chrome, [CHAIR.x + s * 0.4, CHAIR.seat + 0.18, CHAIR.z - 0.02]);
  box(0.5, 0.05, 0.3, chrome, [CHAIR.x, 0.2, CHAIR.z + 0.55], [0.3, 0, 0]);

  // ---------- the stage: a platform, a curtain that opens for a show, a sign ----------
  const SW = STAGE.x1 - STAGE.x0, SD = STAGE.z1 - STAGE.z0, SX = (STAGE.x0 + STAGE.x1) / 2, SZ = (STAGE.z0 + STAGE.z1) / 2;
  box(SW, STAGE.h, SD, psx(A.stageTop, { rx: SW / 1.2, ry: SD / 1.2, unlit: 0.3 }), [SX, STAGE.h / 2, SZ]);
  plane(SW, 3.1, tint(0x2a2a6a, { unlit: 0.5 }), [SX, 1.85, -RD + 0.04], null, 1);   // (the backdrop behind the curtain)
  for (let i = 0; i < 9; i++) plane(0.12, 0.12, psx(A.star, { unlit: 1 }), [STAGE.x0 + 0.3 + (i * 0.37) % (SW - 0.4), 1.2 + (i * 0.53) % 1.6, -RD + 0.06], null, 1);
  // (each panel hangs from its outer edge, so scaling it in x opens it towards that side)
  const curtains = [-1, 1].map(s => mesh(new PlaneGeometry(SW / 2, 2.9, 2, 2).translate(-s * SW / 4, 0, 0),
    psx(A.curtain, { rx: 3, unlit: 0.3, side: DoubleSide }), [s < 0 ? STAGE.x0 : STAGE.x1, STAGE.h + 1.45, -RD + 0.1]));
  plane(1.7, 0.32, psx(A.signShow, { unlit: 0.5 }), [SX, STAGE.h + 3.1, -RD + 0.05], null, 1);
  // the rope that starts the show, by the stage's front left corner
  cyl(0.015, 0.015, 1.5, 4, tint(0xe8c89a), [STAGE.x0 - 0.25, 1.9, STAGE.z1 + 0.05]);
  const tassel = mesh(new SphereGeometry(0.07, 6, 5), tint(0xe83a50), [STAGE.x0 - 0.25, 1.13, STAGE.z1 + 0.05]);

  // ---------- Marbles' counter, and Marbles ----------
  box(1.5, 0.95, 0.9, psx(null, { tint: 0xffc4e0, unlit: 0.25 }), [-4.15, 0.475, -3.45]);
  box(1.5, 0.05, 0.95, tint(0xffd23a), [-4.15, 0.97, -3.45]);
  for (const [x, c] of [[-4.6, 0xd8d8e8], [-4.3, 0xff4fa3], [-4.0, 0x2a78e8], [-3.7, 0xe8202a]]) box(0.1, 0.22, 0.1, tint(c), [x, 1.1, -3.4]);   // bottles
  const marblesW = 0.95, marblesH = marblesW * MARBLES.H / MARBLES.W;
  const marbles = new Mesh(keep(new PlaneGeometry(marblesW, marblesH).translate(0, marblesH / 2, 0)), psx(A.marbles[0], { unlit: 0.35 }));
  marbles.position.set(MARBLES_AT.x, 0, MARBLES_AT.z); scene.add(marbles);
  // ---------- Sadie in the chair, and what she's wearing ----------
  const sadie = m.sadie(SADIE_W, { unlit: 0.3 });
  const home = new Vector3(CHAIR.x, CHAIR.seat, CHAIR.z + 0.05); sadie.position.copy(home); scene.add(sadie);
  const lookTex = tex(LW, LH, () => {}), lookG = lookTex.image.getContext('2d');
  const lookH = SADIE_W * LH / LW;
  const wear = new Mesh(keep(new PlaneGeometry(SADIE_W, lookH).translate(0, lookH / 2, 0.004)), psx(lookTex, { unlit: 0.3, decal: true }));
  sadie.add(wear);
  // (Sadie's tail's own dots: some taildos colour them in. Read off her picture once.)
  const mask = [];
  {
    const probe = document.createElement('canvas'); probe.width = 58; probe.height = 47;
    const pg = probe.getContext('2d', { willReadFrequently: true }); pg.drawImage(m.T.sadie.image, 0, 0);
    const d = pg.getImageData(0, 0, 58, 47).data;
    for (let y = 10; y < 31; y++) for (let x = 5; x < 14; x++) { const i = (y * 58 + x) * 4; if (d[i + 3] >= 200 && d[i] + d[i + 1] + d[i + 2] >= 200) mask.push([x, y]); }
  }
  const pick = { hair: 0, tail: 0, outfit: 0 };
  let sparkleAt = -1;
  const redraw = (t = 0) => { drawLook(lookG, pick, mask, t); lookTex.needsUpdate = true; };
  redraw();
  await m.breathe?.();

  // ---------- the wig heads, the ribbons, the clothes: each one is a use ----------
  const uses = [];
  const skin = tint(0xf0d0b0);
  const choose = (kind, i) => {
    if (show) { say('ONE SECOND, DARLING.', 'marbles'); return; }
    pick[kind] = i; redraw(clock);
    sounds().snip({ at: { x: home.x, z: home.z } });
    mood('grin', 0.8);
    if (Math.random() < 0.3) say(QUIPS[Math.floor(Math.random() * QUIPS.length)], 'marbles');
  };
  const labelFor = (kind, list, i) => `${kind}: ${list[i].name}`;
  // the wig shelf on the left wall: a head wearing each hairdo
  box(0.45, 0.06, 3.0, tint(0x9a5a2a), [-RW + 0.22, 1.35, -1.75]);
  plane(0.9, 0.24, psx(A.signWigs, { unlit: 0.5 }), [-RW + 0.05, 2.15, -1.75], [0, Math.PI / 2, 0], 1);
  HAIR.forEach((h, i) => {
    const z = -3.0 + i * 0.5, g = new Group(); g.position.set(-RW + 0.28, 1.38, z); scene.add(g);
    mesh(new SphereGeometry(0.11, 8, 6), skin, [0, 0.12, 0], null, g);
    const c = tint(parseInt(h.color.slice(1), 16));
    if (i === 1) mesh(new BoxGeometry(0.2, 0.1, 0.12), c, [0.02, 0.27, 0], null, g);
    else if (i === 2) mesh(new BoxGeometry(0.04, 0.14, 0.16), c, [0, 0.31, 0], null, g);
    else if (i === 3) mesh(new ConeGeometry(0.12, 0.3, 8), c, [0, 0.35, 0], null, g);
    else if (i === 4) for (const s of [-1, 1]) mesh(new SphereGeometry(0.06, 6, 5), c, [0, 0.15, s * 0.14], null, g);
    else if (i === 5) mesh(new SphereGeometry(0.17, 8, 6), c, [0, 0.2, 0], null, g);
    uses.push({ pos: new Vector3(-RW + 0.28, 1.55, z), reach: 2.4, label: labelFor('HAIR', HAIR, i), button: 'PICK', swatch: h.color, act: () => choose('hair', i) });
  });
  // the ribbon rack: a bar on the left wall, a tail hanging for each taildo
  cyl(0.02, 0.02, 3.0, 4, chrome, [-RW + 0.25, 1.9, 1.85], [Math.PI / 2, 0, 0]);
  plane(1.0, 0.24, psx(A.signTails, { unlit: 0.5 }), [-RW + 0.05, 2.35, 1.85], [0, Math.PI / 2, 0], 1);
  TAIL.forEach((t, i) => {
    const z = 0.55 + i * 0.5, c = tint(parseInt(t.color.slice(1), 16));
    mesh(new BoxGeometry(0.1, 0.55, 0.06), c, [-RW + 0.25, 1.6, z]);
    mesh(new SphereGeometry(0.09, 6, 5), c, [-RW + 0.25, 1.3, z]);
    uses.push({ pos: new Vector3(-RW + 0.28, 1.55, z), reach: 2.4, label: labelFor('TAIL', TAIL, i), button: 'PICK', swatch: t.color, act: () => choose('tail', i) });
  });
  // the clothes rail across the front right: a hanger for each outfit (the first, an empty one, takes it all off)
  for (const x of [RAIL.x0, RAIL.x1]) cyl(0.04, 0.04, 1.85, 6, chrome, [x, 0.92, RAIL.z]);
  cyl(0.025, 0.025, RAIL.x1 - RAIL.x0, 5, chrome, [(RAIL.x0 + RAIL.x1) / 2, 1.85, RAIL.z], [0, 0, Math.PI / 2]);
  for (const s of [-1, 1]) plane(1.2, 0.26, psx(A.signOutfits, { unlit: 0.5 }), [(RAIL.x0 + RAIL.x1) / 2, 2.25, RAIL.z + s * 0.03], [0, s < 0 ? Math.PI : 0, 0], 1);
  OUTFIT.forEach((o, i) => {
    const x = RAIL.x0 + 0.3 + i * 0.4, c = tint(parseInt(o.color.slice(1), 16), { side: DoubleSide });
    mesh(new SphereGeometry(0.04, 5, 4), chrome, [x, 1.78, RAIL.z]);
    if (i) mesh(new PlaneGeometry(0.28, 0.42), c, [x, 1.5, RAIL.z]);
    else mesh(new BoxGeometry(0.34, 0.02, 0.02), chrome, [x, 1.72, RAIL.z]);
    uses.push({ pos: new Vector3(x, 1.5, RAIL.z), reach: 2.4, label: labelFor('OUTFIT', OUTFIT, i), button: 'PICK', swatch: o.color, act: () => choose('outfit', i) });
  });
  // Marbles herself, and the rope
  const marblesUse = { pos: new Vector3(MARBLES_AT.x, 0.7, MARBLES_AT.z), reach: 2.6, label: 'ASK MARBLES TO PICK', button: 'ASK', act: () => marblesPick() };
  uses.push(marblesUse);
  const ropeUse = { pos: new Vector3(STAGE.x0 - 0.25, 1.4, STAGE.z1 + 0.05), reach: 2.6, label: 'PULL THE ROPE', button: 'PULL', act: () => startShow() };
  uses.push(ropeUse);
  await m.breathe?.();

  // ---------- speech bubble, props ----------
  const bubbleTex = tex(112, 14, () => {}), bg = bubbleTex.image.getContext('2d');
  const bubble = new Mesh(keep(new PlaneGeometry(1.5, 0.19)), psx(bubbleTex, { unlit: 1 }));
  bubble.visible = false; scene.add(bubble);
  const P = makeProps(m, A, scene);
  const faces = [sadie, marbles, bubble, ...P.faces];
  let said = '', bubbleOff = 0, bubbleWho = 'marbles';
  function say(text, who = 'marbles') {
    if (text === said && who === bubbleWho) return;
    said = text; bubbleWho = who;
    if (!text) { bubble.visible = false; return; }
    const bw = Math.min(112, text.length * 4 + 5), x0 = Math.round((112 - bw) / 2);   // (a box just wide enough for the words)
    bg.clearRect(0, 0, 112, 14); bg.fillStyle = '#1c1238'; bg.fillRect(x0, 0, bw, 14); bg.fillStyle = '#fff'; bg.fillRect(x0 + 1, 1, bw - 2, 12);
    words(bg, text, 56, 4, 1, '#1c1238', { align: 'center' }); bubbleTex.needsUpdate = true;
    bubble.visible = true; bubbleOff = text.length > 12 ? 3.2 : 2.4;   // (a line stays up a few seconds, unless a show keeps saying it)
  }

  // ---------- Marbles' face, and what she picks ----------
  let moodUntil = 0, wink = 0;
  function mood(name, secs) { moodUntil = clock + secs; marbles.material.uniforms.map.value = A.marbles[name === 'grin' ? 1 : name === 'wink' ? 2 : 0]; }
  function marblesPick() {
    if (show) { say('PATIENCE.', 'marbles'); return; }
    for (const k of ['hair', 'tail', 'outfit']) { const n = (k === 'hair' ? HAIR : k === 'tail' ? TAIL : OUTFIT).length; pick[k] = 1 + Math.floor(Math.random() * (n - 1)); }
    redraw(clock); sounds().snip({ at: { x: home.x, z: home.z } });
    say(QUIPS[Math.floor(Math.random() * QUIPS.length)], 'marbles'); mood('wink', 1.5);
  }

  // ---------- the shows ----------
  let madeSounds = null;
  const sounds = () => (madeSounds ||= makeSounds(soundsFor('room:' + card.id)));
  const S = new Vector3(SX - 0.2, STAGE.h, SZ);
  let show = null, showT = 0, clock = 0, tilt = 0, sadieOn = true;
  const fired = new Set();
  const sadiePos = new Vector3();
  const c = {
    S, P, sadie, marbles, puffsList: [],
    at(dx, dy, dz) { sadiePos.set(S.x + dx, S.y + dy, S.z + dz); },
    marblesAt(x, y, z) { marbles.position.set(x, y, z); },
    marblesScale(k) { marbles.scale.setScalar(k); },
    say, mood: n => mood(n, 0.5), nap: shut => sadie.userData.set(shut), tilt: v => { tilt = v; }, sadieShown: v => { sadieOn = v; },
    play: n => sounds()[n]({ at: { x: S.x, z: S.z } }),
    once(key, a, b) { const [cond, fn] = typeof a === 'function' ? [true, a] : [a, b]; if (cond && !fired.has(key)) { fired.add(key); fn(); } },
  };
  function startShow() {
    const out = OUTFIT[pick.outfit];
    if (show) return;
    if (!out.show) { say(SHOP_TALK[Math.floor(Math.random() * SHOP_TALK.length)], 'marbles'); mood('wink', 1.2); return; }
    show = { name: out.show, def: SHOWS[out.show] }; showT = 0; fired.clear(); c.puffsList = [];
    ropeUse.label = 'SHOW ON...'; sounds().mrrp({ at: { x: home.x, z: home.z } });
  }
  function endShow() {
    show = null; fired.clear(); c.puffsList = [];
    for (const o of P.all) o.visible = false;
    sadie.position.copy(home); sadie.visible = true; sadie.rotation.z = 0; sadie.userData.set(false); sadieOn = true; tilt = 0;
    marbles.position.set(MARBLES_AT.x, 0, MARBLES_AT.z); marbles.scale.setScalar(1);
    P.puff.material.uniforms.uFade.value = 0;
    ropeUse.label = 'PULL THE ROPE'; say('', 'marbles');
  }
  // the whole show: a hop up onto the stage, the show itself, a hop back down
  const HOP = 0.9;
  function runShow(dt) {
    showT += dt;
    const len = show.def.len;
    const k = showT < HOP ? showT / HOP : showT > HOP + len ? 1 - (showT - HOP - len) / HOP : 1;
    const open = Math.min(1, Math.max(0, k)); for (const cu of curtains) cu.scale.x = 1 - 0.8 * open;
    if (showT < HOP || showT > HOP + len) {
      const e = Math.min(1, Math.max(0, k)), ease = e * e * (3 - 2 * e);
      sadie.position.set(home.x + (S.x - home.x) * ease, home.y + (S.y - home.y) * ease + Math.sin(e * Math.PI) * 0.7, home.z + (S.z - home.z) * ease);
      sadie.visible = true;
      if (showT > HOP + len + HOP) endShow();
      return;
    }
    show.def.run(c, showT - HOP);
    sadie.position.copy(sadiePos); sadie.visible = sadieOn; sadie.rotation.z = tilt;
  }
  const open0 = () => { for (const cu of curtains) cu.scale.x = 1; };
  open0();

  // ---------- every frame ----------
  const ears = () => m.ears?.();
  const place = {
    name: 'room:' + card.id, card, scene, doors: { door }, faces, house, uses,
    light: { sun: 0.3, bulb: 0.7, lamp: [0, H - 0.8, 0] },
    spots: {
      door: { x: 0, z: RD - 1.2, yaw: 0, pitch: 0, y: 0 },
      chair: { x: CHAIR.x, z: 0.2, yaw: 0, pitch: -0.1, y: 0 },
      stage: { x: 2.5, z: 0.4, yaw: 0, pitch: 0, y: 0 },
      middle: { x: 0, z: 0.5, yaw: 0, pitch: 0, y: 0 },
    },
    floor(x, z) {
      const P_ = m.walker;
      if (Math.abs(x) > RW - P_ || Math.abs(z) > RD - P_) return null;
      if (x < -3.4 + P_ && z < -3.0 + P_) return null;                                  // Marbles' counter
      if (Math.hypot(x - MARBLES_AT.x, z - MARBLES_AT.z) < 0.35 + P_) return null;        // Marbles
      if (Math.hypot(x - CHAIR.x, z - CHAIR.z) < 0.55 + P_) return null;                  // the barber chair
      if (x > STAGE.x0 - 0.1 - P_ && z < STAGE.z1 + P_) return null;                      // the stage
      if (x < -RW + 0.45 + P_ && z > -3.3 && z < -0.2) return null;                       // the wig shelf
      if (Math.abs(z - RAIL.z) < 0.1 + P_ && x > RAIL.x0 - P_ && x < RAIL.x1 + P_) return null;   // the clothes rail
      return 0;
    },
    update(t, dt = 0) {
      clock = t;
      const e = ears(), here = e && e.place === place;
      // Marbles' face goes back, now and then she winks
      if (moodUntil && clock > moodUntil) { moodUntil = 0; marbles.material.uniforms.map.value = A.marbles[0]; }
      if (!moodUntil && !show && Math.floor(t / 4.5) !== wink) { wink = Math.floor(t / 4.5); mood('wink', 0.3); }
      // Sadie blinks in the chair (not while a show has her)
      if (!show) { sadie.userData.blink?.(dt); sadie.position.y = home.y; }
      // a line of speech stays up a few seconds
      if (bubble.visible && !show) { bubbleOff -= dt; if (bubbleOff <= 0) say('', bubbleWho); }
      else if (bubble.visible && show) bubbleOff = 1;
      // glitter on the tail: a new sparkle about once a second
      if (TAIL[pick.tail].sparkle && here && Math.floor(t * 1.1) !== sparkleAt) { sparkleAt = Math.floor(t * 1.1); redraw(t); }
      if (!m.paused()) { if (show) runShow(dt); }
      // the bubble sits over whoever's talking
      const who = bubbleWho === 'sadie' ? sadie : marbles;
      if (bubble.visible) bubble.position.set(who.position.x, who.position.y + (who === sadie ? lookH + 0.1 : marblesH + 0.2), who.position.z);
      // the rope sways a little when pulled
      tassel.position.x = STAGE.x0 - 0.25 + (show ? Math.sin(t * 8) * 0.02 : 0);
    },
  };

  // for the checks (tests/barbershop/browser.mjs)
  m.checks('__barbershop', {
    state: () => ({ pick: { ...pick }, show: show ? show.name : null, showT, heard: [...new Set(sounds().log)], played: sounds().played, sadieShown: sadie.visible }),
    choose: (kind, i) => choose(kind, i),
    show: name => { pick.outfit = OUTFIT.findIndex(o => o.show === name); redraw(clock); startShow(); },
    pickForMe: () => marblesPick(),
  });
  return place;
}

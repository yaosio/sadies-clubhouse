// Inside Lily's house. The living room looks like her real home (pale gray walls, white baseboards,
// beige tile, a floor vent): her big pink bed, a basket of rubber chickens, a couch, her bowls, her
// round windows, and her friends' pictures. Through the big doorway in the back wall, the game room:
// big and very tall, 90s arcade carpet, dark walls with stars, and its whole back wall one big game
// screen: Lily's Big Climb (climb.js), played with PLAY from anywhere in there.
//
// The toy: her rubber chicken. Hold it up (HOLD UP THE CHICKEN) and she gets under it, crouches,
// springs up and snatches it, prances a lap or two with it, and brings it back. Nothing is saved.
//
// The clubhouse calls buildRoom(m) with its building kit, and with the outside and this activity's plot
// on it (its card has a `lot`), so the house outside is built here too (house.js).
import { Scene, Color, Mesh, Vector3, PlaneGeometry, SphereGeometry, CircleGeometry, Shape, ShapeGeometry, Path, DoubleSide } from 'three';
import { drawArt } from './art.js';
import { buildHouse, WIN, TR } from './house.js';
import { lilyPoses, paint } from './lily-art.js';
import { LR, ARCH, GR, DW, DH, PLAY, BASKET, BED, ground, inGameRoom } from './plan.js';
import { makeLily, makeChicken } from './moves.js';
import { makeMusic } from './music.js';
import { makeClimb, W as CW, H as CH } from './climb.js';
import { drawClimb } from './climb-view.js';
import { soundsFor } from '../../shared/sound.js';
import { blank, tone, hz, finish } from '../../shared/retro.js';

const DOT = 0.016;   // one of Lily's dots, inside
// where her feet are in each kind of picture (the dot row her paws stand on)
const FEET = { front: 59, side: 46, back: 61, up: 63 };

export async function buildRoom(m) {
  const { psx, keep, kit, doorway, tex, card, words } = m;
  const A = drawArt(m);
  await m.breathe?.();
  // every picture of her, in each bow (a breath after each lot, so walking up to her door never hitches)
  const poses = { pink: {}, orange: {} };
  for (const [k, pix] of Object.entries(lilyPoses())) { for (const b of ['pink', 'orange']) poses[b][k] = tex(pix.w, pix.h, g => paint(g, pix, b)); await m.breathe?.(); }
  // (built again after being put away, the house outside is still there: the clubhouse hands it back)
  const house = m.house || (m.outside && m.lot ? buildHouse(m, A, poses) : null);
  const bow = house?.shared.bow || 'pink';
  const friends = [[A.picSadie, 'SADIE', -2.9, 0.84, 0.72], [A.picChooter, 'CHOOTER', -1.1, 0.6, 0.58], [A.picMarbles, 'MARBLES', 0.6, 0.58, 0.53], [A.picToots, 'TOOTS', 2.4, 0.6, 0.77]];
  const scene = new Scene(); scene.background = new Color(0x24164a);
  const { add, box, plane, cyl } = kit(scene);
  const tint = (c, o = {}) => psx(null, { tint: c, unlit: 0.3, ...o });
  const shape = (pts, holes = []) => { const s = new Shape(pts.map(([x, y]) => ({ x, y }))); for (const h of holes) s.holes.push(h); return keep(new ShapeGeometry(s, 24)); };
  const circle = (x, y, r) => { const p = new Path(); p.absarc(x, y, r, 0, Math.PI * 2, true); return p; };
  const wall = psx(A.wall, { rx: 1 / 1.6, ry: 1 / 1.6, unlit: 0.3 });

  // ---------- the living room ----------
  const O = 0.15;
  // the front wall: the door, and the two round windows (sky and the hydrant's red seen through them)
  add(new Mesh(shape([[-LR.w - O, 0], [-DW / 2, 0], [-DW / 2, DH], [DW / 2, DH], [DW / 2, 0], [LR.w + O, 0], [LR.w + O, LR.h], [-LR.w - O, LR.h]], WIN.map(w => circle(-w.x, w.y, w.r))), wall), [0, 0, LR.d], [0, Math.PI, 0]);
  for (const w of WIN) {
    plane(w.r * 2 + 0.24, w.r * 2 + 0.24, psx(A.ring, { unlit: 0.4 }), [w.x, w.y, LR.d - 0.04], [0, Math.PI, 0], 1);
    box(w.r * 2 + 0.3, 0.08, 0.3, tint(0xffffff), [w.x, w.y - w.r - 0.05, LR.d - 0.12]);
  }
  // the side walls
  for (const s of [-1, 1]) plane(2 * LR.d + 2 * O, LR.h, psx(A.wall, { rx: (2 * LR.d) / 1.6, ry: LR.h / 1.6, unlit: 0.3 }), [s * LR.w, LR.h / 2, 0], [0, -s * Math.PI / 2, 0]);
  // the back wall, round the big doorway
  const back = shape([[-LR.w - O, 0], [-ARCH.w / 2, 0], [-ARCH.w / 2, ARCH.h], [ARCH.w / 2, ARCH.h], [ARCH.w / 2, 0], [LR.w + O, 0], [LR.w + O, LR.h], [-LR.w - O, LR.h]]);
  add(new Mesh(back, wall), [0, 0, -LR.d]);
  // white baseboards all round (like hers)
  for (const [w, pos, ry] of [[LR.w - DW / 2, [-(LR.w + DW / 2) / 2, 0.08, LR.d - 0.02], Math.PI], [LR.w - DW / 2, [(LR.w + DW / 2) / 2, 0.08, LR.d - 0.02], Math.PI],
    [LR.w - ARCH.w / 2, [-(LR.w + ARCH.w / 2) / 2, 0.08, -LR.d + 0.02], 0], [LR.w - ARCH.w / 2, [(LR.w + ARCH.w / 2) / 2, 0.08, -LR.d + 0.02], 0],
    [2 * LR.d, [-LR.w + 0.02, 0.08, 0], Math.PI / 2], [2 * LR.d, [LR.w - 0.02, 0.08, 0], -Math.PI / 2]])
    plane(w, 0.16, psx(A.baseboard, { rx: w / 0.6, unlit: 0.35, decal: true }), pos, [0, ry, 0], 2);
  // the floor: beige tile, the ceiling, the vent
  plane(2 * LR.w + 2 * O, 2 * LR.d + O + 0.08, psx(A.tile, { rx: 2 * LR.w / 0.8, ry: 2 * LR.d / 0.8 }), [0, 0, (O - 0.08) / 2], [-Math.PI / 2, 0, 0], 8).renderOrder = -4;   // (to just through the doorway, where the carpet starts: they never overlap)
  plane(2 * LR.w + 2 * O, 2 * LR.d + 2 * O, tint(0xffffff, { unlit: 0.55 }), [0, LR.h, 0], [Math.PI / 2, 0, 0], 8);
  plane(0.7, 0.32, psx(A.vent, { onFloor: true }), [-3, 0.01, 4.1], [-Math.PI / 2, 0, 0], 1).renderOrder = -3;
  // the big doorway: a pink-topped white frame, GAME ROOM over it
  for (const s of [-1, 1]) box(0.16, ARCH.h, 0.34, psx(A.arch, { unlit: 0.35 }), [s * (ARCH.w / 2 + 0.08), ARCH.h / 2, -LR.d]);
  box(ARCH.w + 0.48, 0.16, 0.34, psx(A.arch, { unlit: 0.35 }), [0, ARCH.h + 0.08, -LR.d]);
  plane(1.6, 0.3, psx(A.archSign, { unlit: 0.6 }), [0, ARCH.h + 0.15, -LR.d + 0.19], null, 1);
  const door = doorway(scene, { pos: [0, 0, LR.d], yaw: Math.PI, w: DW, h: DH, leaves: [{ front: A.doorBack, back: A.door }], hinge: 1, trim: 0xff9a3a });
  await m.breathe?.();

  // her bed, round and pink, by the left wall
  cyl(BED.r, BED.r, 0.28, 14, psx(A.bed, { rx: 8, unlit: 0.4 }), [BED.x, 0.14, BED.z]);
  add(new Mesh(keep(new CircleGeometry(BED.r * 0.8, 14)), psx(A.bedTop, { unlit: 0.4 })), [BED.x, 0.2, BED.z], [-Math.PI / 2, 0, 0]);
  // a rug, the couch, a lamp
  plane(4.4, 4.4, psx(A.rug, { onFloor: true }), [0.5, 0.01, 0.3], [-Math.PI / 2, 0, 0], 4).renderOrder = -3;
  const couch = psx(A.couch, { rx: 1, ry: 3, unlit: 0.3 });
  box(0.9, 0.45, 3.2, couch, [-6.55, 0.225, 0]); box(0.25, 0.55, 3.2, couch, [-6.9, 0.62, 0]);
  for (const s of [-1, 1]) box(0.9, 0.65, 0.25, couch, [-6.55, 0.32, s * 1.6]);
  cyl(0.05, 0.05, 1.6, 5, tint(0x5a5a6a), [-6.4, 0.8, 2.3]); cyl(0.2, 0.32, 0.35, 8, tint(0xffd6ea, { unlit: 0.9 }), [-6.4, 1.7, 2.3]);
  // the basket of rubber chickens, and its sign
  cyl(BASKET.r, BASKET.r * 0.85, 0.55, 10, psx(A.basket, { rx: 3, unlit: 0.35 }), [BASKET.x, 0.275, BASKET.z]);
  const stick = (pic, w, h, x, y, z, r = 0) => { const s = new Mesh(keep(new PlaneGeometry(w, h)), psx(pic, { unlit: 0.45, side: DoubleSide })); s.position.set(x, y, z); s.rotation.set(0, r, 0); scene.add(s); return s; };
  for (const [dx, dz, a, rz] of [[-0.15, 0.05, 0.4, 0.6], [0.15, -0.1, -0.5, -0.4], [0, 0.15, 1.6, 1.2], [0.05, -0.2, 2.4, 0.2]]) stick(A.chicken, 0.6, 0.3, BASKET.x + dx, 0.6, BASKET.z + dz, a).rotation.z = rz;
  plane(0.9, 0.19, psx(A.basketSign, { unlit: 0.5 }), [BASKET.x, 0.35, BASKET.z + BASKET.r + 0.01], null, 1);
  // her bowls
  for (const [x, pic] of [[3.2, A.bowl], [3.9, A.bowl2]]) cyl(0.24, 0.18, 0.13, 10, psx(pic, { unlit: 0.4 }), [x, 0.065, -4.55]);
  // her friends' pictures on the right wall, and her own over the couch
  for (const [pic, name, z, w, h] of [...friends, [A.picLily, 'LILY', null, 0.9, 0.9 * 82 / 66]]) {
    const onLeft = z === null, x = onLeft ? -LR.w + 0.04 : LR.w - 0.04, zz = onLeft ? 0 : z, ry = onLeft ? Math.PI / 2 : -Math.PI / 2;
    plane(w, h, psx(pic, { unlit: 0.45, decal: true }), [x, 1.95, zz], [0, ry, 0], 1);
    const p = A.plate(name); plane(p.image.width / 80, 0.1, psx(p, { unlit: 0.5, decal: true }), [x, 1.95 - h / 2 - 0.12, zz], [0, ry, 0], 1);
  }

  // ---------- the game room ----------
  const dark = (w, h) => psx(A.starWall, { rx: w / 3, ry: h / 3, unlit: 0.35 });
  const GD = GR.z0 - GR.z1, GZ = (GR.z0 + GR.z1) / 2;
  // its front wall (the living room's back wall, from the other side), round the doorway, all the way up
  add(new Mesh(shape([[-GR.w - O, 0], [-ARCH.w / 2, 0], [-ARCH.w / 2, ARCH.h], [ARCH.w / 2, ARCH.h], [ARCH.w / 2, 0], [GR.w + O, 0], [GR.w + O, GR.h], [-GR.w - O, GR.h]]), psx(A.starWall, { rx: 1 / 3, ry: 1 / 3, unlit: 0.35 })), [0, 0, GR.z0 - 0.16], [0, Math.PI, 0]);
  for (const s of [-1, 1]) plane(GD + O - 0.14, GR.h, dark(GD, GR.h), [s * GR.w, GR.h / 2, GZ - (O + 0.14) / 2], [0, -s * Math.PI / 2, 0]);   // (stopping short of the living room: they'd poke through its back wall)
  plane(2 * GR.w + 2 * O, GD + O - 0.08, psx(A.arcadeCarpet, { rx: 2 * GR.w / 2.4, ry: GD / 2.4 }), [0, 0, GZ - (O + 0.08) / 2], [-Math.PI / 2, 0, 0], 8).renderOrder = -4;
  plane(2 * GR.w + 2 * O, GD + 2 * O, tint(0x1a1040, { unlit: 0.8 }), [0, GR.h, GZ], [Math.PI / 2, 0, 0], 8);
  // ---------- the game wall: the whole back wall is the game's screen ----------
  const SW = 2 * GR.w - 0.6, SH = SW * CH / CW, SY = 0.45 + SH / 2;
  plane(2 * GR.w, GR.h, tint(0x0c0618, { unlit: 0.8 }), [0, GR.h / 2, GR.z1 + 0.005]);
  let ctx2d = null;
  const screen = tex(CW, CH, g => { ctx2d = g; });
  plane(SW, SH, psx(screen, { unlit: 1 }), [0, SY, GR.z1 + 0.03]);
  for (const y of [0.15, GR.h - 0.3]) plane(2 * GR.w, 0.3, psx(A.tape, { rx: 2 * GR.w / 1.2, unlit: 0.6, decal: true }), [0, y, GR.z1 + 0.04], null, 2);
  for (const x of [-GR.w + 0.15, GR.w - 0.15]) plane(0.3, GR.h, psx(A.tape, { rx: 1, ry: GR.h / 1.2, unlit: 0.6, decal: true }), [x, GR.h / 2, GR.z1 + 0.04], null, 2);
  const game = makeClimb(1 + Math.floor(Math.random() * 99999));
  const sfx = soundsFor('room:' + card.id);
  const music = makeMusic(sfx);   // (its tune while you play: music.js)
  // where you'd stand to play: a circle on the carpet
  plane(2, 2, psx(A.spot, { onFloor: true }), [PLAY.x, 0.01, PLAY.z], [-Math.PI / 2, 0, 0], 1).renderOrder = -3;
  // string lights along the top of the side walls
  for (const s of [-1, 1]) plane(GD, 0.3, psx(A.lights, { rx: GD / 0.8, unlit: 1, decal: true }), [s * (GR.w - 0.04), GR.h - 1, GZ], [0, -s * Math.PI / 2, 0], 4);
  // two beanbags by the side walls, for watching
  for (const [x, c] of [[-3.9, 0xff6fb4], [3.9, 0x3af0ff]]) { const b = cyl(0.75, 0.9, 0.7, 10, tint(c, { unlit: 0.4 }), [x, 0.35, GR.z0 - 4]); b.scale.set(1, 1, 1); }

  // ---------- Lily ----------
  const lily = new Mesh(keep(new PlaneGeometry(1, 1).translate(0, 0.5, 0)), psx(poses[bow].frontA, { unlit: 0.4 }));
  scene.add(lily);
  const L = makeLily(0, 2.5);
  // her chicken: in your hand (held up), in her mouth, or on the floor where she dropped it
  const toy = new Mesh(keep(new PlaneGeometry(0.6, 0.3)), psx(A.chicken, { unlit: 0.5, side: DoubleSide })); scene.add(toy);
  const chicken = makeChicken();
  let shown = null;
  const show = (me, yaw) => {
    const [name, kind] = pick(me);
    const pic = poses[bow][name];
    if (pic !== shown) { lily.material.uniforms.map.value = pic; shown = pic; const im = pic.image; lily.scale.set(im.width * DOT, im.height * DOT, 1); lily.userData.feet = (im.height - FEET[kind]) * DOT; }
    lily.position.set(L.x, L.h - lily.userData.feet, L.z); lily.rotation.y = yaw;
  };
  const pick = (me) => {
    // which picture: the way she's heading, against the way you're looking at her
    const vx = L.x - me.x, vz = L.z - me.z, d = Math.hypot(vx, vz) || 1;
    const along = (L.hx * vx + L.hz * vz) / d, across = L.hx * (-vz / d) + L.hz * (vx / d);
    const step = Math.floor(L.walked / 0.28) % 4, wag = Math.floor(L.t * 4) % 2 ? 'A' : 'B';
    const C = L.chick ? 'Chick' : '';
    if (L.pose === 'up') return ['up', 'up'];
    if (L.pose === 'fly') return ['fly', 'front'];
    if (L.pose === 'crouch') return [across > 0 ? 'rightCrouch' : 'leftCrouch', 'side'];
    if (L.pose === 'front' || along < -0.75) return ['front' + C + wag, 'front'];
    if (along > 0.75) return ['back' + step, 'back'];
    return [(across > 0 ? 'right' : 'left') + C + step, 'side'];
  };

  // ---------- her game: PLAY from anywhere in the game room (the same button starts it again once it's over) ----------
  // Its keys: left, right, up, down (A D W S or the arrows), jump (space); on a phone, picture buttons.
  const keys = { ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down' };
  const input = { left: false, right: false, up: false, down: false, jump: false };
  let playing = false;
  const play = {
    view: { center: new Vector3(0, SY, GR.z1), normal: new Vector3(0, 0, 1), w: SW + 0.5, h: SH + 0.4 },
    pad: ['stick', 'jump'],
    hint: { keys: '<kbd>A D</kbd> MOVE &nbsp; <kbd>W S</kbd> CLIMB &nbsp; <kbd>SPACE</kbd> JUMP &nbsp; <kbd>ESC</kbd> STEP BACK', touch: 'GET HER CHICKEN!' },
    over: false,
    // (called stepping up, and again coming back from the pause menu: a game still going carries on)
    start() { sfx.wake(); playing = true; play.over = false; if (!['ready', 'play', 'won'].includes(game.state)) game.start(); },
    stop() { playing = false; for (const k in input) input[k] = false; },
    key(code, down, repeat) {
      if (code === 'Space') { if (down && !repeat) input.jump = true; return true; }
      const k = keys[code]; if (!k) return false;
      input[k] = down; return true;
    },
  };
  const playUse = { pos: new Vector3(0, 4, GR.z1), reach: 24, label: "PLAY LILY'S BIG CLIMB", play };
  // her chicken, in your hand: look down at her and hold it up (she jumps for it), or look ahead and throw it
  // (she chases it). Each is a spot just ahead of you, one low and one at eye height: the one you look at.
  const holdUse = { pos: new Vector3(), reach: 3, label: 'HOLD UP THE CHICKEN', button: 'HOLD UP', act: () => { if (chicken.where === 'you') L.want(); } };
  const throwUse = {
    pos: new Vector3(), reach: 4, label: 'THROW THE CHICKEN', button: 'THROW',
    act: () => {
      const e = look(); if (!e || chicken.where !== 'you') return;
      const cp = Math.cos(e.pitch), fx = -Math.sin(e.yaw) * cp, fz = -Math.cos(e.yaw) * cp, fy = Math.sin(e.pitch);
      chicken.toss(e.x + fx * 0.5, e.y - 0.3, e.z + fz * 0.5, fx, fy, fz);
      L.fetch();
    },
  };
  const uses = [];
  const look = () => { const e = m.ears?.(); return e && e.place === place ? e : null; };

  // ---------- every frame ----------
  const place = {
    name: 'room:' + card.id, card, scene, doors: { door }, faces: [], house, uses,
    light: { sun: 0.4, bulb: 0.7, lamp: [0, LR.h - 0.6, 0] },
    speed: 3.6,
    spots: {
      door: { x: 0, z: LR.d - 1.2, yaw: 0, pitch: 0, y: 0 },
      living: { x: 2.2, z: 4.0, yaw: 0.3, pitch: -0.12, y: 0 },
      pictures: { x: 4.4, z: 0, yaw: -Math.PI / 2, pitch: 0.12, y: 0 },
      game: { x: 0, z: GR.z0 - 1.5, yaw: 0, pitch: 0.42, y: 0 },
      play: { x: PLAY.x, z: PLAY.z, yaw: 0, pitch: 0.4, y: 0 },
    },
    floor: (x, z) => ground(x, z),
    busy: () => playing && ['ready', 'play', 'won'].includes(game.state),
    update(t, dt = 0) {
      const e = look();
      const me = e ? { x: e.x, z: e.z, yaw: e.yaw, fx: -Math.sin(e.yaw), fz: -Math.cos(e.yaw) } : { x: 0, z: LR.d - 1.2, yaw: 0, fx: 0, fz: -1 };
      // the game: it only moves while you're at it (stepped back or paused, it waits)
      if (playing && !m.paused()) {
        game.step(Math.min(dt, 0.05), input); input.jump = false;
        if (game.events.includes('win')) { music.stop(0.3); sfx.play('fanfare', fanfare, { bus: 'music' }); }
        if (game.state === 'done' || game.state === 'over') { overFor += dt; if (overFor > (game.state === 'done' ? 0.6 : 2)) { play.over = true; overFor = 0; } } else overFor = 0;
      }
      // its music: only while a game's going and you're at it
      if (playing && !m.paused() && (game.state === 'ready' || game.state === 'play')) music.play(); else music.stop();
      music.tick();
      // (the screen is redrawn every frame while a game's on; waiting, only 6 times a second, which is all its stars and
      // bobbing chicken need: drawing it and sending it to the graphics chip every frame cost a phone about every other frame)
      const tick = playing ? -1 : Math.floor(t * 6);
      if ((e || playing) && (playing || tick !== screenTick)) { drawClimb(ctx2d, game, bow, t, words); screen.needsUpdate = true; screenTick = tick; }
      // what you can use here: PLAY in the game room; in the living room, with the chicken in your hand,
      // HOLD UP (looking down at her) or THROW (looking ahead)
      uses.length = 0;
      if (e && inGameRoom(e.z)) uses.push(playUse);
      else if (e && chicken.where === 'you' && L.mode !== 'leap' && L.mode !== 'crouch' && L.mode !== 'aim') {
        holdUse.pos.set(e.x + me.fx * 1.2, e.y - 0.8, e.z + me.fz * 1.2); uses.push(holdUse);
        throwUse.pos.set(e.x + me.fx * 3, e.y, e.z + me.fz * 3); uses.push(throwUse);
      }
      // Lily: while you're playing, she's in the game
      lily.visible = !playing;
      if (playing) { toy.visible = false; return; }
      if (!e) return;
      chicken.step(Math.min(dt, 0.05));
      L.step(t, Math.min(dt, 0.05), me, chicken);
      show(me, e.yaw);
      // the chicken: pick it up again where she dropped it (once she's back with you)
      if (chicken.where === 'floor' && Math.hypot(me.x - chicken.x, me.z - chicken.z) < 1.3 && L.mode === 'bounce') chicken.where = 'you';
      // in your hand you only see it once you hold it up (high, over her head); thrown, it tumbles
      // through the air; dropped, it lies on the floor
      const up = chicken.where === 'you' && (L.mode === 'aim' || L.mode === 'crouch' || L.mode === 'leap');
      toy.visible = up || chicken.where === 'floor' || chicken.where === 'air';
      if (up) { toy.position.set(me.x + me.fx * 1.1, 1.95, me.z + me.fz * 1.1); toy.rotation.set(0, e.yaw, Math.sin(t * 9) * 0.15); }
      else if (chicken.where === 'air') { toy.position.set(chicken.x, chicken.y + 0.16, chicken.z); toy.rotation.set(0, e.yaw, chicken.spin); }
      else if (chicken.where === 'floor') { toy.position.set(chicken.x, 0.16, chicken.z); toy.rotation.set(0, e.yaw, 0); }
    },
  };
  let overFor = 0, screenTick = -2;
  // (put up as she is and the game as it stands, before anyone's in: seen from the doorway, or at the threshold, they're already there)
  drawClimb(ctx2d, game, bow, 0, words); screen.needsUpdate = true;
  { const me0 = { x: 0, z: LR.d - 1.2, yaw: 0, fx: 0, fz: -1 }; L.step(0, 0.016, me0, chicken); show(me0, 0); }

  // ---------- out of the windows: the real town, in pictures taken once as the house is built ----------
  // (as in Toots' house: m.snapshot of the whole outside, bar its sky and her own house, four pictures,
  // one each way, from the middle of where her house stands; hung all round 60 m off, drawn before
  // everything else, so the round windows show what's really out there. No cost each frame.)
  const views = { town: false };
  if (m.snapshot && m.outside && m.lot && house) {
    const { x, z, yaw } = m.lot, c = Math.cos(yaw), s = Math.sin(yaw), Y = 1.75, R = 60;
    const world = (lx, ly, lz) => [x + c * lx + s * lz, m.lot.y + ly, z - s * lx + c * lz];   // (the house's own terms, to the town's)
    const T60 = Math.tan(Math.PI / 3);   // (each picture 90 degrees across and 120 high)
    if (m.skyMat) add(new Mesh(keep(new SphereGeometry(120, 16, 12)), m.skyMat()), [0, 0, 0]).renderOrder = -5;   // (the sky behind them: the pictures leave it out)
    for (const [dx, dz] of [[0, 1], [1, 0], [0, -1], [-1, 0]]) {
      await m.breathe?.();
      const pic = m.snapshot(null, m.outside, { from: world(0, Y, -3), at: world(dx, Y, -3 + dz), fov: 120, w: 320, h: Math.round(320 * T60), without: [house.group] });
      const mt = psx(pic, { unlit: 1 }); mt.depthTest = false; mt.depthWrite = false;
      add(new Mesh(keep(new PlaneGeometry(2 * R, 2 * R * T60, 4, 4)), mt), [dx * R, Y, dz * R], [0, Math.atan2(-dx, -dz), 0]).renderOrder = -4.5;
    }
    views.town = true;
  }

  // for the checks (tests/lily-house/browser.mjs)
  m.checks('__lily', {
    state: () => ({ lily: { x: L.x, z: L.z, mode: L.mode, chick: L.chick }, chicken: chicken.where, thrown: chicken.thrown, music: { playing: music.playing, played: music.played() }, game: { state: game.state, score: game.score, lives: game.lives, g: game.lily.g, x: game.lily.x }, playing, uses: uses.map(u => u.label), heard: [...sfx.log], bow, views }),
    // the middle of her trampoline, out there (for standing on it)
    trampoline: () => { const l = m.lot; if (!l) return null; const c = Math.cos(l.yaw), s = Math.sin(l.yaw); return { x: l.x + TR.x * c + TR.z * s, z: l.z - TR.x * s + TR.z * c, y: l.y + TR.y, yaw: l.yaw }; },
    win: () => { const G = game; G.lily.g = 6; G.lily.x = 64; G.lily.y = 46; G.lily.air = false; G.lily.climb = null; },
  });
  return place;
}

// the win: a short bright fanfare (up the chord, a held top note that fades), and a low part under it
function fanfare() {
  const a = blank(3.2);
  for (const [n, at, len] of [[67, 0, 0.13], [72, 0.14, 0.13], [76, 0.28, 0.13], [79, 0.42, 0.32], [76, 0.78, 0.13], [79, 0.92, 0.5], [84, 1.5, 1.4]])
    tone(a, at, len, hz(n), hz(n), (t, k) => Math.min(1, t / 0.01) * Math.pow(1 - k, 0.7), { gain: 0.15, h2: 0.35 });
  for (const [n, at, len] of [[48, 0, 0.4], [55, 0.42, 0.45], [52, 0.92, 0.5], [48, 1.5, 1.4]])
    tone(a, at, len, hz(n), hz(n), (t, k) => Math.min(1, t / 0.02) * (1 - k), { gain: 0.12, tri: true });
  return finish(a);
}

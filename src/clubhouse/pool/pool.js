// The pool behind the clubhouse, where the bird bath and the nap bench used to be: a paved deck
// inside a low fence (a gate straight out from the patio), a pool you can't go in, a diving board,
// Sadie on a lounger, Marbles annoying her, Chooter running laps and diving (and going crazy when you
// arrive), and a beach ball you can kick. This file builds and draws it; what goes on is sim.js, where
// everything is is layout.js, the pictures are art.js and the sounds sounds.js
// (docs/clubhouse/outside/pool.md). All pictures: flat sprites that turn to face you, like the birds.
import { Mesh, Group, PlaneGeometry, SphereGeometry, Vector3, DoubleSide } from 'three';
import { psx, keep } from '../look.js';
import { kit } from '../build.js';
import { soundsFor } from '../../shared/sound.js';
import { mrrp } from '../../shared/retro.js';
import { DECK, POOL, COPING, RIM, WATER_Y, BOARD, SADIE, BALL, GATE, RECTS, inWater } from './layout.js';
import { drawPoolArt, CHOOTER, MARBLES } from './art.js';
import { makePoolSim } from './sim.js';
import { splash, boing, squirt, POOL_RATE } from './sounds.js';

const DROPS = 28, RIPPLES = 6;
const rand = (a, b) => a + Math.random() * (b - a);

export function buildPool(T, scene) {
  const A = drawPoolArt();
  const { box, plane, cyl, ball: sphere, cone } = kit(scene);
  const flat = [-Math.PI / 2, 0, 0];
  const iron = psx(null, { tint: 0x5e5c80 }), white = psx(null, { tint: 0xfff4ff }), pink = psx(null, { tint: 0xff7ab8 });
  const stone = psx(T.stone, { rx: 2, ry: 1, tint: 0xf4ecff });
  const mid = (a, b) => (a + b) / 2;

  // ---------- the deck, the water and the edge ----------
  plane(DECK.x1 - DECK.x0, DECK.z1 + 0.4 - DECK.z0, psx(A.deck, { rx: DECK.x1 - DECK.x0, ry: DECK.z1 + 0.4 - DECK.z0, onFloor: true }), [mid(DECK.x0, DECK.x1), 0, mid(DECK.z0, DECK.z1 + 0.4)], flat, 4).renderOrder = -1;
  const waterMat = psx(A.water[0], { rx: 5, ry: 3, onFloor: true, unlit: 0.8 });
  plane(POOL.x1 - POOL.x0, POOL.z1 - POOL.z0, waterMat, [mid(POOL.x0, POOL.x1), 0, mid(POOL.z0, POOL.z1)], flat, 4).renderOrder = -0.5;
  const cw = COPING.x1 - COPING.x0, cd = COPING.z1 - COPING.z0;
  box(cw, 0.1, RIM, stone, [0, 0.05, COPING.z0 + RIM / 2]); box(cw, 0.1, RIM, stone, [0, 0.05, COPING.z1 - RIM / 2]);
  box(RIM, 0.1, cd - 2 * RIM, stone, [COPING.x0 + RIM / 2, 0.05, mid(COPING.z0, COPING.z1)]); box(RIM, 0.1, cd - 2 * RIM, stone, [COPING.x1 - RIM / 2, 0.05, mid(COPING.z0, COPING.z1)]);
  // the ladder on the left (Chooter climbs out there)
  for (const dz of [-0.25, 0.25]) { cyl(0.025, 0.025, 0.7, 5, iron, [POOL.x0 - 0.1, 0.35, 22.7 + dz]); cyl(0.025, 0.025, 0.35, 5, iron, [POOL.x0 + 0.1, 0.18, 22.7 + dz]); box(0.24, 0.03, 0.03, iron, [POOL.x0, 0.7, 22.7 + dz]); }
  // the diving board: a stand and a springy plank out over the water
  const bz = mid(BOARD.base, BOARD.tip), bl = BOARD.base - BOARD.tip;
  box(0.8, BOARD.y - 0.05, 0.9, white, [BOARD.x, (BOARD.y - 0.05) / 2, 26.85]);
  box(0.55, 0.07, bl + 0.4, psx(null, { tint: 0x3ec8f0 }), [BOARD.x, BOARD.y, bz + 0.2]);
  box(0.55, 0.012, bl + 0.4, psx(A.stripe, { rx: 1, ry: 6, tint: 0xffffff }), [BOARD.x, BOARD.y + 0.04, bz + 0.2]);
  for (const dz of [0, 0.5]) { cyl(0.025, 0.025, 0.7, 5, iron, [BOARD.x - 0.4, 0.4, 27.45 + dz]); cyl(0.025, 0.025, 0.7, 5, iron, [BOARD.x + 0.4, 0.4, 27.45 + dz]); }

  // ---------- the fence, with a gate gap in the front ----------
  const fence = (len, x, z, yaw) => plane(len, 1, psx(T.fence, { rx: len, side: DoubleSide }), [x, 0.5, z], [0, yaw, 0], 1);
  fence(30 - DECK.z0, DECK.x0, mid(DECK.z0, 30), Math.PI / 2); fence(30 - DECK.z0, DECK.x1, mid(DECK.z0, 30), Math.PI / 2);
  fence(DECK.x1 - GATE, mid(GATE, DECK.x1), DECK.z0, 0); fence(DECK.x1 - GATE, -mid(GATE, DECK.x1), DECK.z0, 0);
  for (const s of [-1, 1]) { box(0.14, 1.3, 0.14, white, [s * GATE, 0.65, DECK.z0]); }
  // two pink flamingos at the gate (the owner's weren't asked: Claude's choice)
  for (const s of [-1, 1]) {
    const x = s * 1.9, z = 17;
    cyl(0.015, 0.015, 0.55, 4, iron, [x, 0.28, z]); cyl(0.015, 0.015, 0.55, 4, iron, [x + 0.07, 0.28, z]);
    sphere(0.12, pink, [x, 0.7, z], 1.2); cyl(0.025, 0.025, 0.5, 5, pink, [x - s * 0.1, 1.0, z], [0, 0, s * 0.3]);
    sphere(0.07, pink, [x - s * 0.17, 1.28, z]); box(0.12, 0.03, 0.04, psx(null, { tint: 0x222233 }), [x - s * 0.27, 1.26, z]);
  }
  // the sign (the rules aren't kept)
  box(0.08, 1.2, 0.08, iron, [2.4, 0.6, 17.2]); box(0.08, 1.2, 0.08, iron, [3.6, 0.6, 17.2]);
  plane(1.5, 0.75, psx(A.sign, { unlit: 0.4, side: DoubleSide }), [3.0, 1.05, 17.12], [0, Math.PI, 0], 1);
  // bunting along the back fence
  for (const s of [-1, 1]) cyl(0.04, 0.04, 2.4, 5, iron, [s * 7.8, 1.2, 29.8]);
  plane(15.6, 0.65, psx(A.bunting, { rx: 2, unlit: 0.5, side: DoubleSide }), [0, 2.1, 29.8], [0, 0, 0], 1);

  // ---------- Sadie's lounger, the table, a spare lounger, the toy box ----------
  const cushion = psx(A.stripe, { rx: 1, ry: 3 });
  const lounger = (x, z, soft) => {
    box(0.8, 0.1, 2.0, soft, [x, 0.42, z]);
    for (const dx of [-0.35, 0.35]) for (const dz of [-0.9, 0.9]) box(0.06, 0.38, 0.06, iron, [x + dx, 0.19, z + dz]);
    box(0.8, 0.1, 0.7, soft, [x, 0.7, z - 0.95], [0.9, 0, 0]);
  };
  lounger(SADIE.x, 21.3, cushion);
  lounger(6.6, 21.5, psx(A.towel, { rx: 1, ry: 3 }));
  cyl(0.04, 0.04, 2.3, 5, iron, [SADIE.x - 0.85, 1.15, 21.3]);
  cone(1.5, 0.5, 8, psx(A.stripe, { rx: 4, ry: 1, side: DoubleSide }), [SADIE.x - 0.35, 2.4, 21.3]);
  cyl(0.35, 0.35, 0.05, 8, white, [-6.25, 0.55, 23.2]); cyl(0.04, 0.04, 0.55, 5, iron, [-6.25, 0.27, 23.2]); cyl(0.2, 0.2, 0.04, 8, iron, [-6.25, 0.02, 23.2]);
  cyl(0.06, 0.05, 0.17, 6, psx(null, { tint: 0xb8f0ff }), [-6.2, 0.66, 23.2]); cyl(0.01, 0.01, 0.2, 4, psx(null, { tint: 0xff4f6a }), [-6.18, 0.74, 23.2], [0, 0, 0.2]);
  box(0.12, 0.05, 0.12, psx(null, { tint: 0xc8c8d8 }), [-6.38, 0.6, 23.4]);   // (the tuna)
  box(1.2, 0.5, 0.8, pink, [7.0, 0.25, 17.7]); box(1.24, 0.05, 0.84, white, [7.0, 0.52, 17.7]);
  cyl(0.2, 0.16, 0.3, 8, psx(null, { tint: 0x2a78e8 }), [6.7, 0.67, 17.7]); cyl(0.015, 0.015, 0.4, 4, psx(null, { tint: 0xffd23a }), [7.2, 0.72, 17.6], [0.3, 0, 0.5]);
  // a rubber duck, drifting about on the water
  const duck = new Group(); scene.add(duck);
  const yel = psx(null, { tint: 0xffd23a, unlit: 0.2 });
  for (const [g, pos, sy] of [[new SphereGeometry(0.2, 8, 6), [0, 0.1, 0], 0.8], [new SphereGeometry(0.12, 8, 6), [0.14, 0.3, 0], 1]]) { const m = new Mesh(keep(g), yel); m.position.set(...pos); m.scale.y = sy; duck.add(m); }
  const beak = new Mesh(keep(new PlaneGeometry(0.1, 0.05)), psx(null, { tint: 0xff8a1a, side: DoubleSide })); beak.position.set(0.27, 0.29, 0); duck.add(beak);
  const dk = { x: 1.5, z: 22, vx: 0.2, vz: 0.12 };

  // ---------- what moves: Sadie, Marbles, Chooter, the ball, water ----------
  const sprite = (w, h, map, o = {}) => { const m = new Mesh(keep(new PlaneGeometry(w, h).translate(0, h / 2, 0)), psx(map, { unlit: 0.4, ...o })); scene.add(m); return m; };
  const sadie = sprite(0.9, 0.73, T.nap, { unlit: 0.45 }); sadie.position.set(SADIE.x, SADIE.y, SADIE.z);
  const bang = sprite(0.18, 0.4, A.bang, { unlit: 0.8 }); bang.visible = false;
  const zs = [0, 1].map(i => { const z = sprite(0.4, 0.4, T.zzz, { unlit: 0.6 }); z.userData.phase = i / 2; return z; });
  const mw = 0.9, marbles = sprite(mw, mw * MARBLES.H / MARBLES.W, A.marbles.grin);
  const cw2 = 1.05, chooter = sprite(cw2, cw2 * CHOOTER.H / CHOOTER.W, A.chooter.run0);
  const beach = new Mesh(keep(new SphereGeometry(BALL.r, 10, 8)), psx(A.ball, { unlit: 0.35 })); scene.add(beach);
  const shade = (w, d) => { const m = new Mesh(keep(new PlaneGeometry(w, d)), psx(A.shadow, { onFloor: true, fade: 0.35 })); m.rotation.x = -Math.PI / 2; m.renderOrder = -0.4; m.position.y = 0.02; scene.add(m); return m; };
  const shadows = { chooter: shade(0.9, 0.4), marbles: shade(0.6, 0.3), ball: shade(0.5, 0.5) };
  const dropMat = psx(A.drop, { unlit: 1 }), dropGeo = keep(new PlaneGeometry(0.1, 0.1));
  const drops = Array.from({ length: DROPS }, () => { const m = new Mesh(dropGeo, dropMat); m.visible = false; m.userData = { live: false, delay: 0, vx: 0, vy: 0, vz: 0 }; scene.add(m); return m; });
  const ripples = Array.from({ length: RIPPLES }, () => { const m = new Mesh(keep(new PlaneGeometry(1, 1)), psx(A.ripple, { onFloor: true, unlit: 0.9 })); m.rotation.x = -Math.PI / 2; m.renderOrder = -0.45; m.position.y = WATER_Y; m.visible = false; m.userData = { age: 9, size: 1 }; scene.add(m); return m; });

  // ---------- sounds: only while you're outside, soft, and each one rare ----------
  const sound = soundsFor('outside');
  let heard = false;
  const play = (key, make, o) => { if (heard) sound.play(key, make, { rate: POOL_RATE, near: 5, far: 24, ...o }); };
  const pick = n => Math.floor(Math.random() * n);

  function ripple(x, z, size) { const r = ripples.find(q => q.userData.age >= 1.1) || ripples[0]; r.userData.age = 0; r.userData.size = size; r.position.x = x; r.position.z = z; r.visible = true; }
  // a drop goes from `from` to `to` over `secs` (after `delay`), or just up and out (no `to`)
  function drop(from, to, secs, delay = 0, spread = 0.15) {
    const d = drops.find(q => !q.userData.live); if (!d) return;
    const u = d.userData, g = 9.8;
    u.live = true; u.delay = delay; d.position.set(from[0] + rand(-spread, spread), from[1], from[2] + rand(-spread, spread)); d.visible = false;
    if (to) { u.vx = (to[0] + rand(-0.25, 0.25) - d.position.x) / secs; u.vz = (to[2] + rand(-0.25, 0.25) - d.position.z) / secs; u.vy = (to[1] - d.position.y + 0.5 * g * secs * secs) / secs; }
    else { u.vx = rand(-1.3, 1.3); u.vz = rand(-1.3, 1.3); u.vy = rand(2, 4); }
  }
  function out(type, a, b, c) {
    if (type === 'splash') {   // into the water: rings, a spray and a soft splash (a, b: where; c: how big, 0 to 1)
      ripple(a, b, 1 + c); if (c > 0.5) ripple(a + rand(-0.3, 0.3), b + rand(-0.3, 0.3), 1.4);
      for (let i = 0; i < 3 + Math.round(c * 6); i++) drop([a, WATER_Y, b], null);
      const v = pick(3); play(`splash${v}`, () => splash(v), { loud: 0.35 + 0.3 * c, gap: 5, at: { x: a, y: 0.3, z: b } });
    } else if (type === 'bounce') {   // the ball
      const v = pick(3); play(`boing${v}`, () => boing(0.9 + v * 0.12), { loud: 0.2 + 0.25 * c, gap: 1.2, at: { x: a, y: 0.3, z: b } });
    } else if (type === 'drops') {   // water thrown at Sadie
      const { kind, from, to } = a;
      if (kind === 'splash') { for (let i = 0; i < 7; i++) drop(from, to, 0.7, i * 0.03, 0.25); play('scoop', () => splash(1), { loud: 0.3, gap: 3, at: { x: from[0], y: 0.3, z: from[2] } }); }
      else if (kind === 'squirt') { for (let i = 0; i < 5; i++) drop(from, to, 0.5, i * 0.04, 0.03); play('squirt', squirt, { loud: 0.3, gap: 1.6, at: { x: from[0], y: 0.5, z: from[2] } }); }
      else { for (let i = 0; i < 16; i++) drop([from[0] + rand(-0.4, 0.4), from[1] + rand(0, 0.3), from[2] + rand(-0.3, 0.3)], [from[0], 0, from[2]], 0.5, i * 0.02, 0); play('tip', () => splash(2), { loud: 0.4, gap: 4, at: { x: from[0], y: 0.5, z: from[2] } }); }
    } else if (type === 'cross') {   // Sadie, got at, says so (now and then)
      if (Math.random() < 0.5) play('cross', () => mrrp(240, 330, 0.24), { bus: 'voices', loud: 0.5, gap: 8, at: { x: SADIE.x, y: 0.8, z: SADIE.z } });
    }
  }
  const sim = makePoolSim(out);

  // ---------- the kick ----------
  const kickAt = new Vector3(0, -100, 0);
  const uses = [{
    pos: kickAt, reach: 3.2, label: 'KICK THE BEACH BALL', button: 'KICK',
    act: ({ from }) => { if (sim.kick(from.x, from.z, from.yaw)) out('bounce', sim.ball.x, sim.ball.z, 0.6); },
  }];

  // ---------- each frame ----------
  let blink = 0, wait = 3, frame = 0;
  const across = (mesh, dx, dz) => dx * Math.cos(mesh.rotation.y) - dz * Math.sin(mesh.rotation.y);   // (which way across your view something's going: to its right, or its left)
  function update(t, dt, ears) {
    const here = ears.place?.name === 'outside';
    if (!here && !ears.outside) { sim.here = false; return; }   // (out of sight: nothing goes on, and you arrive afresh)
    dt = Math.min(dt, 0.1); heard = here;
    sim.step(dt, here ? { x: ears.x, z: ears.z } : null);
    const { ball, chooter: c, marbles: m, sadie: s } = sim;

    // the water shimmers (three pictures, slowly)
    const f = Math.floor(t / 0.8) % 3;
    if (f !== frame) { frame = f; waterMat.uniforms.map.value = A.water[f]; }

    // Chooter
    const swim = c.mode === 'swim', cu = chooter.material.uniforms;
    chooter.position.set(c.x, swim ? WATER_Y : c.y, c.z);
    cu.map.value = A.chooter[c.pose] || A.chooter.run0;
    const dx = c.pose === 'sit' && here ? ears.x - c.x : c.vx, dz = c.pose === 'sit' && here ? ears.z - c.z : c.vz;
    if (Math.hypot(dx, dz) > 0.2 && Math.abs(across(chooter, dx, dz)) > 0.1) cu.uRep.value.x = across(chooter, dx, dz) > 0 ? 1 : -1;
    // Marbles (facing what she's facing)
    const mu = marbles.material.uniforms;
    marbles.position.set(m.x, m.mode === 'go' || m.mode === 'carry' || m.mode === 'home' || m.mode === 'flee' ? Math.abs(Math.sin(m.hop)) * 0.06 : 0, m.z);
    mu.map.value = A.marbles[m.pose] || A.marbles.grin;
    const lx = m.look[0] - m.x, lz = m.look[1] - m.z;
    if (Math.abs(across(marbles, lx, lz)) > 0.1) mu.uRep.value.x = across(marbles, lx, lz) > 0 ? 1 : -1;
    // the ball
    beach.position.set(ball.x, ball.y, ball.z); beach.rotation.y = ball.spin;
    kickAt.set(ball.x, ball.held ? -100 : Math.max(0.5, ball.y), ball.z);
    // shadows on the ground
    for (const [sh, o, y, k] of [[shadows.chooter, c, swim ? -1 : c.y, 1], [shadows.marbles, m, 0, 1], [shadows.ball, ball, ball.y - BALL.r, 1]]) {
      sh.visible = y >= 0; sh.position.x = o.x; sh.position.z = o.z; const sc = Math.max(0.4, 1 - y * 0.3) * k; sh.scale.set(sc, sc, 1);
    }
    // Sadie: dozing, lounging (blinking now and then), or cross (shaking, with a "!")
    const su = sadie.material.uniforms;
    if (blink > 0) blink -= dt; else if ((wait -= dt) < 0) { blink = 0.15; wait = 2.5 + Math.random() * 3; }
    su.map.value = s.state === 'doze' || (blink > 0 && s.state === 'lounge') ? T.nap : T.sadie;
    sadie.position.x = SADIE.x + (s.state === 'cross' ? Math.sin(t * 38) * 0.025 : 0);
    bang.visible = s.state === 'cross'; bang.position.set(SADIE.x + 0.15, SADIE.y + 0.85 + Math.abs(Math.sin(t * 7)) * 0.05, SADIE.z);
    for (const z of zs) {
      const k = (t / 5 + z.userData.phase) % 1;
      z.visible = s.state === 'doze';
      z.position.set(SADIE.x + Math.sin(k * 6) * 0.15 + k * 0.3, SADIE.y + 0.6 + k * 0.9, SADIE.z);
      z.material.uniforms.uFade.value = Math.max(0, k * 1.4 - 0.4);
    }
    // the duck wanders about, slowly, bobbing
    dk.x += dk.vx * dt; dk.z += dk.vz * dt;
    if (dk.x < POOL.x0 + 0.7 || dk.x > POOL.x1 - 0.7) dk.vx = -dk.vx + rand(-0.03, 0.03);
    if (dk.z < POOL.z0 + 0.7 || dk.z > POOL.z1 - 0.7) dk.vz = -dk.vz + rand(-0.03, 0.03);
    duck.position.set(dk.x, WATER_Y + 0.02 + Math.sin(t * 1.6) * 0.02, dk.z); duck.rotation.y = Math.atan2(-dk.vz, dk.vx);
    // drops fly, rings spread
    for (const d of drops) {
      const u = d.userData; if (!u.live) continue;
      if (u.delay > 0) { u.delay -= dt; continue; }
      d.visible = true; u.vy -= 9.8 * dt;
      d.position.x += u.vx * dt; d.position.y += u.vy * dt; d.position.z += u.vz * dt;
      if (d.position.y <= (inWater(d.position.x, d.position.z) ? WATER_Y : 0.02)) { u.live = false; d.visible = false; }
    }
    for (const r of ripples) {
      const u = r.userData; if (u.age >= 1.1) { r.visible = false; continue; }
      u.age += dt; const k = u.age / 1.1;
      r.scale.set(0.3 + k * 1.3 * u.size, 0.3 + k * 1.3 * u.size, 1); r.material.uniforms.uFade.value = k;
    }
  }

  return {
    update, uses, rects: RECTS,
    faces: [sadie, bang, ...zs, marbles, chooter, ...drops],
    sim,
  };
}

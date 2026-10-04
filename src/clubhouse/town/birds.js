// The birds of the town square: a few little flat pictures that fly round the square, land on the
// benches, the bird bath and the paving for a while, and take off again. All pictures, all silent.
//
// And Sadie on the gatepost, who watches them. She's one flat picture, so she can't turn only her
// head: she faces whichever side the bird she's watching is on, and leans a little when it's high.
// (Anything hung on her, like the weather's umbrella, follows: `userData.flips` mirrors it with her,
// `userData.slides` only moves it to the side she's facing.)
import { Mesh, PlaneGeometry } from 'three';
import { psx, keep, tex } from '../look.js';
import { SQUARE } from './layout.js';

const COUNT = 5;                                  // (my choice, to keep it light: more only costs a picture each)
const TINTS = [0xffd23a, 0x6aa8ff, 0xff7a6a, 0xc8986a, 0xff8ec8];
const W = 0.46, H = 0.36;                         // a bird's size, metres
const rand = (a, b) => a + Math.random() * (b - a);
const pick = list => list[Math.floor(Math.random() * list.length)];

// a bird, side on, facing right: pale, so each takes its own colour; four pictures (wings up, level,
// down, and folded for sitting)
function birdPictures() {
  const draw = wing => tex(14, 11, g => {
    const px = (c, x, y, w = 1, h = 1) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
    px('#d8d0f0', 0, 5, 3, 2); px('#d8d0f0', 1, 4, 2, 1);            // tail
    px('#f4f0ff', 2, 4, 8, 4); px('#e8e0ff', 3, 3, 6, 1); px('#c9b6f2', 3, 8, 6, 1);   // body
    px('#f4f0ff', 9, 2, 4, 4); px('#1c1238', 11, 3);                  // head, eye
    px('#ffe070', 13, 4, 1, 1);                                       // beak
    px('#e8b070', 5, 9, 1, 2); px('#e8b070', 7, 9, 1, 2);             // legs
    if (wing === 'up') { px('#c9b6f2', 4, 0, 4, 4); px('#e8e0ff', 5, 1, 2, 2); }
    else if (wing === 'level') { px('#c9b6f2', 2, 3, 7, 2); }
    else if (wing === 'down') { px('#c9b6f2', 3, 7, 5, 3); }
    else { px('#c9b6f2', 3, 4, 6, 3); px('#9c86d6', 3, 6, 6, 1); }   // folded
  });
  return { up: draw('up'), level: draw('level'), down: draw('down'), folded: draw('folded') };
}
const FLAP = ['up', 'level', 'down', 'level'];

export function makeBirds(scene, perches, sadie) {
  const pics = birdPictures();
  const geo = keep(new PlaneGeometry(W, H).translate(0, H / 2, 0));
  const spot = () => { const a = rand(0, Math.PI * 2), r = rand(2.5, SQUARE.r - 1); return { x: SQUARE.x + Math.sin(a) * r, y: rand(2.2, 5.0), z: SQUARE.z - Math.cos(a) * r }; };
  const birds = Array.from({ length: COUNT }, (_, i) => {
    const mesh = new Mesh(geo, psx(pics.folded, { unlit: 0.5, tint: TINTS[i % TINTS.length] }));
    scene.add(mesh);
    const b = { mesh, phase: rand(0, 4), x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, state: 'perch', perch: null, wait: rand(1, 6), flights: 0, wp: null, hop: 0 };
    sit(b, pick(perches.filter(p => !p.taken)));
    // (the first couple start in the air, so there's something to see at once)
    if (i < 2) { leave(b); }
    return b;
  });

  function sit(b, p) { b.perch = p; p.taken = true; b.x = p.x; b.y = p.y; b.z = p.z; b.vx = b.vy = b.vz = 0; b.state = 'perch'; b.wait = rand(4, 12); }
  function leave(b) {
    if (b.perch) { b.perch.taken = false; b.perch = null; }
    b.state = 'fly'; b.flights = 2 + Math.floor(Math.random() * 3); b.wp = spot(); b.vy = 1.5;
  }
  function land(b) {
    const free = perches.filter(p => !p.taken);
    if (!free.length) { b.flights = 1; b.wp = spot(); return; }
    b.perch = pick(free); b.perch.taken = true; b.state = 'land'; b.wp = b.perch;
  }

  // ---------- Sadie watching ----------
  let focus = null, focusUntil = 0, face = 1, lean = 0;
  function watch(t, dt) {
    const flying = birds.filter(b => b.state !== 'perch');
    if (!focus || t > focusUntil || (focus.state === 'perch' && flying.length)) {
      const pool = flying.length ? flying : birds;
      focus = pick(pool); focusUntil = t + rand(2.5, 5.5);
    }
    const ry = sadie.rotation.y, dx = (focus.x - sadie.position.x) * Math.cos(ry) - (focus.z - sadie.position.z) * Math.sin(ry);
    if (dx > 0.4) face = 1; else if (dx < -0.4) face = -1;
    const up = Math.atan2(focus.y - (sadie.position.y + 0.5), Math.hypot(focus.x - sadie.position.x, focus.z - sadie.position.z));
    lean += (Math.max(-0.12, Math.min(0.2, up * 0.3)) * face - lean) * Math.min(1, dt * 5);
    sadie.rotation.z = lean;
    sadie.material.uniforms.uRep.value.x = face;
    for (const c of sadie.children) {
      if (!c.userData.flips && !c.userData.slides) continue;
      c.userData.x0 ??= Math.abs(c.position.x);
      c.position.x = c.userData.x0 * face;
      if (c.userData.flips) c.scale.x = face;
    }
  }

  function update(t, dt) {
    dt = Math.min(dt, 0.1);
    for (const b of birds) {
      if (b.state === 'perch') {
        b.wait -= dt;
        if (b.perch.y < 0.3 && b.wait > 0 && Math.random() < dt * 0.4) b.hop = 0.2;   // (a hop on the paving now and then)
        if (b.wait <= 0) leave(b);
      } else {
        const dx = b.wp.x - b.x, dy = b.wp.y - b.y, dz = b.wp.z - b.z, d = Math.hypot(dx, dy, dz) || 1;
        const landing = b.state === 'land', speed = landing ? Math.max(1.2, Math.min(4, d * 1.4)) : 3.6;
        const k = Math.min(1, dt * (landing ? 3 : 2));
        b.vx += (dx / d * speed - b.vx) * k; b.vy += (dy / d * speed - b.vy) * k; b.vz += (dz / d * speed - b.vz) * k;
        b.x += b.vx * dt; b.y += b.vy * dt; b.z += b.vz * dt;
        if (landing && d < 0.2) sit(b, b.perch);
        else if (!landing && d < 0.7) { if (--b.flights > 0) b.wp = spot(); else land(b); }
      }
      b.hop = Math.max(0, b.hop - dt * 0.8);
      const hop = b.hop > 0 ? Math.sin(Math.min(1, (0.2 - b.hop) / 0.2 * Math.PI)) * 0.12 : 0;
      b.mesh.position.set(b.x, b.y + hop, b.z);
      const m = b.mesh.material.uniforms;
      m.map.value = b.state === 'perch' ? pics.folded : pics[b.state === 'land' && b.vy < -0.3 ? 'up' : FLAP[Math.floor(t * 8 + b.phase) % 4]];
      // (it faces the way it's going, as you see it)
      const ry = b.mesh.rotation.y, across = b.vx * Math.cos(ry) - b.vz * Math.sin(ry);
      if (Math.abs(across) > 0.3) m.uRep.value.x = across > 0 ? 1 : -1;
    }
    watch(t, dt);
  }

  return { update, meshes: birds.map(b => b.mesh) };
}

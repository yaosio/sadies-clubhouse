// What Lily does inside, as plain numbers (no browser): she bounds over to you and bounces, up on her
// back legs now and then; hold up her rubber chicken and she springs for it, snatches it at the top of
// her jump, prances about the room with it, then brings it back and drops it at your feet. Throw it
// instead and she races after it, grabs it, and is so pleased she tears round the room with it (the
// zoomies) before she brings it back. makeChicken: the chicken itself, in your hand, flying, on the
// floor or in her mouth.
// Each frame says where she is, how high off the floor, which way she's heading, and what she's doing;
// the room picks her picture from that.
import { free, PLAY, LR, GR } from './plan.js';
const LR_Z = -LR.d;   // (the living room is in front of the doorway, the game room behind it)

const RUN = 3.4, TROT = 2.2, ZOOM = 5.2;
const GRAV = 9.8;   // the chicken falls like anything

// the chicken. where: 'you', 'air' (thrown: flying, bouncing, skidding to a stop), 'floor' or 'lily'
export function makeChicken() {
  const C = { where: 'you', x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, spin: 0, thrown: 0 };
  C.take = () => { C.where = 'lily'; };
  C.drop = (x, z) => { Object.assign(C, { where: 'floor', x, z, y: 0, vx: 0, vy: 0, vz: 0 }); };
  // thrown from (x, y, z) your hand, along (dx, dy, dz) where you're looking
  C.toss = (x, y, z, dx, dy, dz) => {
    const sp = 6.5;
    Object.assign(C, { where: 'air', x, y, z, vx: dx * sp, vy: dy * sp + 2.6, vz: dz * sp });
    C.thrown++;
  };
  C.step = dt => {
    if (C.where !== 'air') return;
    C.vy -= GRAV * dt; C.spin += dt * Math.hypot(C.vx, C.vz) * 2;
    // the walls: it bounces off them (back the way it came, a bit slower)
    const nx = C.x + C.vx * dt, nz = C.z + C.vz * dt;
    if (!free(nx, C.z, true)) C.vx *= -0.5; else C.x = nx;
    if (!free(C.x, nz, true)) C.vz *= -0.5; else C.z = nz;
    C.y += C.vy * dt;
    if (C.y <= 0) {   // the floor: a rubbery bounce, then it skids and stops
      C.y = 0;
      if (Math.abs(C.vy) > 1.2) { C.vy *= -0.4; C.vx *= 0.7; C.vz *= 0.7; }
      else { C.vy = 0; C.vx *= Math.max(0, 1 - dt * 6); C.vz *= Math.max(0, 1 - dt * 6); if (Math.hypot(C.vx, C.vz) < 0.15) C.where = 'floor'; }
    }
  };
  return C;
}

export function makeLily(x = 0, z = 0) {
  const L = { x, z, h: 0, hx: 0, hz: 1, mode: 'come', t: 0, walked: 0, chick: false, jump: 0, up: 0 };
  // a step towards (tx, tz), going round what's in the way: true once she's there
  const go = (tx, tz, speed, dt, near = 0.1) => {
    const dx = tx - L.x, dz = tz - L.z, d = Math.hypot(dx, dz);
    if (d <= near + 0.02) return true;
    const s = Math.min(d - near, speed * dt), ux = dx / d, uz = dz / d;
    L.hx = ux; L.hz = uz;
    for (const a of [0, 0.6, -0.6, 1.2, -1.2]) {
      const c = Math.cos(a), sn = Math.sin(a), vx = ux * c - uz * sn, vz = ux * sn + uz * c;
      if (free(L.x + vx * s, L.z + vz * s, true)) { L.x += vx * s; L.z += vz * s; L.walked += s; L.hx = vx; L.hz = vz; return false; }
    }
    return false;
  };
  // the same, but by way of the big doorway when it's in the other room (she'd stick on the wall)
  const toward = (tx, tz, speed, dt, near) => {
    const here = L.z < LR_Z, there = tz < LR_Z;
    if (here === there) return go(tx, tz, speed, dt, near);
    if (Math.abs(L.x) > 0.5) go(0, LR_Z + (here ? -1 : 1), speed, dt, 0.05);   // (in front of it, lined up...)
    else go(0, LR_Z + (here ? 1 : -1), speed, dt, 0.05);                       // (...then straight through)
    return false;
  };
  // the prance: a loop round the middle of whichever room she's in
  let loopA = 0, loopC = null, zoomTo = null, zoomUntil = 0;
  // a random spot in whichever room she's in (the living room, or the game room)
  const spotIn = z => z > LR_Z ? { x: (Math.random() * 2 - 1) * (LR.w - 1), z: (Math.random() * 2 - 1) * (LR.d - 1) } : { x: (Math.random() * 2 - 1) * (GR.w - 1), z: GR.z0 - 1 - Math.random() * (GR.z0 - GR.z1 - 2) };
  L.step = (t, dt, me, chicken) => {
    L.t += dt;
    const toMe = Math.hypot(me.x - L.x, me.z - L.z);
    L.h = 0; L.pose = 'walk';
    switch (L.mode) {
      case 'come':
        if (toward(me.x, me.z, RUN, dt, 1.3)) { L.mode = 'bounce'; L.t = 0; }
        else L.h = Math.abs(Math.sin(L.walked * 2.6)) * 0.12;   // a bouncy run
        break;
      case 'bounce': {
        // facing you, jump after jump; every fourth, up on her back legs for a bit instead
        L.hx = (me.x - L.x) / (toMe || 1); L.hz = (me.z - L.z) / (toMe || 1);
        if (toMe > 2.4) { L.mode = 'come'; break; }
        const k = L.t / 0.75, n = Math.floor(k), f = k - n;
        if (n % 5 === 4) { L.pose = 'up'; break; }
        L.h = Math.max(0, Math.sin(f * Math.PI)) * 0.55;
        L.pose = L.h > 0.2 ? 'fly' : 'front';
        break;
      }
      case 'aim':   // you've held up the chicken: she gets under it, crouches...
        if (go(me.x + me.fx * 1.1, me.z + me.fz * 1.1, RUN, dt, 0.25)) { L.mode = 'crouch'; L.t = 0; }
        break;
      case 'crouch':
        L.hx = (me.x - L.x) || 0.01; L.hz = me.z - L.z; L.pose = 'crouch';
        if (L.t > 0.35) { L.mode = 'leap'; L.t = 0; }
        break;
      case 'leap': {   // ...and springs! She snatches it at the top.
        const f = L.t / 0.9;
        L.h = Math.sin(Math.min(1, f) * Math.PI) * 1.35; L.pose = 'fly';
        if (f > 0.5 && !L.chick) { L.chick = true; chicken.take(); }
        if (f >= 1) { L.mode = 'prance'; L.t = 0; loopC = { x: me.x + me.fx * 3, z: me.z + me.fz * 3 }; if (!free(loopC.x, loopC.z, true)) loopC = { x: L.x, z: L.z }; loopA = Math.atan2(L.x - loopC.x, L.z - loopC.z); }
        break;
      }
      case 'prance': {   // a lap or two, very pleased with herself
        loopA += dt * 1.3;
        const r = 1.8, tx = loopC.x + Math.sin(loopA) * r, tz = loopC.z + Math.cos(loopA) * r;
        go(tx, tz, TROT * 1.4, dt, 0.05);
        L.h = Math.abs(Math.sin(L.walked * 3)) * 0.16;
        if (L.t > 4.5) { L.mode = 'bring'; L.t = 0; }
        break;
      }
      case 'chase': {   // after it! She grabs it once it's low enough (on the floor, or just bouncing)
        const there = toward(chicken.x, chicken.z, RUN * 1.15, dt, 0.35);
        L.h = Math.abs(Math.sin(L.walked * 2.6)) * 0.14;
        if (chicken.where === 'floor' && L.t > 6 && there) { chicken.take(); L.chick = true; }   // (never stuck)
        if ((there || Math.hypot(chicken.x - L.x, chicken.z - L.z) < 0.5) && chicken.y < 0.5 && chicken.where !== 'lily') { chicken.take(); L.chick = true; }
        if (L.chick) { L.mode = 'zoomies'; L.t = 0; L.laps = 0; zoomTo = null; }
        break;
      }
      case 'zoomies': {   // so pleased with herself: tearing round the room, darting this way and that
        if (!zoomTo || go(zoomTo.x, zoomTo.z, ZOOM, dt, 0.4) || L.t > zoomUntil) {
          // somewhere else across the room she's in, well away from where she is (a few tries)
          for (let i = 0; i < 8; i++) {
            const p = spotIn(L.z);
            if (free(p.x, p.z, true) && Math.hypot(p.x - L.x, p.z - L.z) > 2.5) { zoomTo = p; break; }
          }
          zoomUntil = L.t + 2.5; L.laps++;
        }
        L.h = Math.abs(Math.sin(L.walked * 2.2)) * 0.22;
        if (L.laps > 6 || L.t > 7) { L.mode = 'bring'; L.t = 0; }
        break;
      }
      case 'bring':
        if (toward(me.x, me.z, TROT * 1.3, dt, 1.0)) { L.chick = false; chicken.drop(L.x + (me.x - L.x) * 0.4, L.z + (me.z - L.z) * 0.4); L.mode = 'bounce'; L.t = 0; }
        break;
    }
    return L;
  };
  // you've thrown it: she's off after it
  L.fetch = () => { L.mode = 'chase'; L.t = 0; L.chick = false; };
  // you hold up the chicken
  L.want = () => { if (!L.chick && L.mode !== 'leap' && L.mode !== 'crouch') { L.mode = 'aim'; L.t = 0; } };
  return L;
}
export { PLAY };

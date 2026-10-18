// What Lily does inside, as plain numbers (no browser): she bounds over to you and bounces, up on her
// back legs now and then; hold up her rubber chicken and she springs for it, snatches it at the top of
// her jump, prances about the room with it, then brings it back and drops it at your feet.
// Each frame says where she is, how high off the floor, which way she's heading, and what she's doing;
// the room picks her picture from that.
import { free, PLAY } from './plan.js';

const RUN = 3.4, TROT = 2.2;

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
  // the prance: a loop round the middle of whichever room she's in
  let loopA = 0, loopC = null;
  L.step = (t, dt, me, chicken) => {
    L.t += dt;
    const toMe = Math.hypot(me.x - L.x, me.z - L.z);
    L.h = 0; L.pose = 'walk';
    switch (L.mode) {
      case 'come':
        if (go(me.x, me.z, RUN, dt, 1.3)) { L.mode = 'bounce'; L.t = 0; }
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
      case 'bring':
        if (go(me.x, me.z, TROT * 1.3, dt, 1.0)) { L.chick = false; chicken.drop(L.x + (me.x - L.x) * 0.4, L.z + (me.z - L.z) * 0.4); L.mode = 'bounce'; L.t = 0; }
        break;
    }
    return L;
  };
  // you hold up the chicken
  L.want = () => { if (!L.chick && L.mode !== 'leap' && L.mode !== 'crouch') { L.mode = 'aim'; L.t = 0; } };
  return L;
}
export { PLAY };

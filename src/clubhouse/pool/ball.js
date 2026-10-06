// The beach ball: a little bouncy, rolls to a stop on the deck, floats on the water and drifts to
// the nearest edge (so you can reach it from the deck, since you can't go in), and can never leave
// the fence (layout.js `keepOn`). Plain numbers, no drawing: sim.js moves it and pool.js draws it.
import { BALL, POOL, WATER_Y, keepOn, inWater } from './layout.js';

const G = 7;                      // gravity: floaty, it's a beach ball
const R = BALL.r;
const FLOAT_Y = WATER_Y + 0.13;   // how high its middle sits when it floats

export function makeBall() {
  return { x: BALL.start[0], y: R, z: BALL.start[1], vx: 0, vy: 0, vz: 0, held: false, spin: 0, wet: false };
}

// a kick from where you stand: it goes away from you, up and over
export function kick(b, fromX, fromZ, yaw = 0) {
  if (b.held) return false;
  let dx = b.x - fromX, dz = b.z - fromZ, d = Math.hypot(dx, dz);
  if (d < 0.05) { dx = -Math.sin(yaw); dz = -Math.cos(yaw); d = 1; }   // (right on top of it: the way you're looking)
  const sp = 5 + Math.random() * 1.5;
  b.vx = dx / d * sp; b.vz = dz / d * sp; b.vy = 3.6 + Math.random() * 1.2;
  if (b.y < FLOAT_Y + 0.05) b.y = FLOAT_Y + 0.05;
  return true;
}

// let go of it from (x, y, z), to land on (tx, ty, tz) `secs` later
export function throwTo(b, x, y, z, tx, ty, tz, secs) {
  b.held = false; b.x = x; b.y = y; b.z = z;
  b.vx = (tx - x) / secs; b.vz = (tz - z) / secs; b.vy = (ty - y + 0.5 * G * secs * secs) / secs;
}

// one step; `emit(type, x, z, strength)` says what happened: 'bounce' (a good one), 'splash' (into the water)
export function stepBall(b, dt, emit) {
  if (b.held) return;
  const wasWet = b.wet;
  b.vy -= G * dt;
  b.x += b.vx * dt; b.y += b.vy * dt; b.z += b.vz * dt;
  b.wet = inWater(b.x, b.z, -R * 0.4);
  const floor = b.wet ? FLOAT_Y : R;
  if (b.wet && !wasWet && b.vy < -1.2) emit('splash', b.x, b.z, Math.min(1, -b.vy / 6));
  if (b.y < floor) {
    b.y = floor;
    if (b.vy < 0) {
      const hit = -b.vy;
      b.vy = b.wet ? 0 : hit * 0.62;
      if (b.vy < 0.8) b.vy = 0;
      if (hit > 2.4 && !b.wet) emit('bounce', b.x, b.z, Math.min(1, hit / 6));
    }
  }
  const onFloor = b.y <= floor + 0.01;
  if (onFloor) {   // rolling: it slows on the deck, and much more in the water, where it drifts to the nearest edge
    const k = Math.exp(-(b.wet ? 2.4 : 1.2) * dt);
    b.vx *= k; b.vz *= k;
    if (b.wet && Math.hypot(b.vx, b.vz) < 0.9) {
      const to = [[b.x - POOL.x0, -1, 0], [POOL.x1 - b.x, 1, 0], [b.z - POOL.z0, 0, -1], [POOL.z1 - b.z, 0, 1]].sort((p, q) => p[0] - q[0])[0];
      if (to[0] > 0.05) { b.vx += to[1] * 0.9 * dt; b.vz += to[2] * 0.9 * dt; }
    }
  }
  // the fence and anything solid: bounce off it
  const n = keepOn(b, R, true);
  if (n) {
    const vn = b.vx * n.x + b.vz * n.z;
    if (vn < 0) { b.vx -= 1.6 * vn * n.x; b.vz -= 1.6 * vn * n.z; if (-vn > 2.4) emit('bounce', b.x, b.z, Math.min(1, -vn / 6)); }
  }
  b.spin += (b.vx + b.vz) * dt * 2;
}

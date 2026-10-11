// Fetch, as plain numbers: the tennis ball (thrown, bouncing, rolling, resting) and Toots (who follows
// you about, runs after the ball, brings it back and drops it at your feet). No browser, so the checks
// can throw the ball and wait for it to come back. room.js draws what this says.
//
// Toots walks on her three legs with a little hop at the front (the drawings do the hop); she goes up
// and down the stairs by their foot and head; if something's in her way for a moment she hops over it
// (she was a determined girl). Every speed and wait here is Claude's number: change them freely.
import { ground, ballGround, ceiling, onStairs, stairY, levelOf, FOOT, HEAD, RW, RD } from './plan.js';

export const BALL_R = 0.07;
const G = 9.8, SPEED = { follow: 2.4, chase: 3.4, bring: 2.6, come: 4.2 }, ME = 0.3;

export function makeBall(x = 2.0, z = 4.5) { return { x, y: BALL_R, z, vx: 0, vy: 0, vz: 0, rest: true, held: null }; }

// throw it from `from` (your eye) along `dir` (where you're looking)
export function throwBall(b, from, dir, power = 6.5) {
  Object.assign(b, { x: from.x + dir.x * 0.4, y: from.y + dir.y * 0.4 - 0.15, z: from.z + dir.z * 0.4, held: null, rest: false });
  b.vx = dir.x * power; b.vy = dir.y * power + 1.6; b.vz = dir.z * power;
  // (never thrown from inside a wall: from right up against one it starts just inside)
  b.x = Math.max(-RW + 0.1, Math.min(RW - 0.1, b.x)); b.z = Math.max(-RD + 0.1, Math.min(RD - 0.1, b.z));
}

// one step of the ball: gravity, walls, ceilings, landing, bouncing, rolling to a stop
export function stepBall(b, dt) {
  if (b.held || b.rest) return;
  b.vy -= G * dt;
  let nx = b.x + b.vx * dt, nz = b.z + b.vz * dt, ny = b.y + b.vy * dt;
  // into a wall or the side of something: bounce back off it, losing some speed
  if (ballGround(nx, nz, b.y - BALL_R, BALL_R) === null) {
    if (ballGround(nx, b.z, b.y - BALL_R, BALL_R) === null) { b.vx = -b.vx * 0.55; nx = b.x; }
    if (ballGround(b.x, nz, b.y - BALL_R, BALL_R) === null) { b.vz = -b.vz * 0.55; nz = b.z; }
    if (ballGround(nx, nz, b.y - BALL_R, BALL_R) === null) { nx = b.x; nz = b.z; }
  }
  const top = ceiling(nx, nz, b.y) - BALL_R;
  if (ny > top) { ny = top; b.vy = -Math.abs(b.vy) * 0.4; }
  const floor = ballGround(nx, nz, b.y - BALL_R, BALL_R) ?? ballGround(b.x, b.z, b.y - BALL_R, BALL_R) ?? 0;
  let down = false;
  if (ny <= floor + BALL_R) {
    ny = floor + BALL_R; down = true;
    if (b.vy < -1.2) { b.vy = -b.vy * 0.5; b.vx *= 0.8; b.vz *= 0.8; } else b.vy = 0;
  }
  b.x = nx; b.y = ny; b.z = nz;
  if (down && b.vy === 0) {
    // rolling: slowing down, and down the stairs if it's on them
    const k = Math.max(0, 1 - 2.2 * dt); b.vx *= k; b.vz *= k;
    const stairs = onStairs(b.x, b.z);
    if (stairs) b.vz += 2.5 * dt;
    if (!stairs && Math.hypot(b.vx, b.vz) < 0.12) { b.rest = true; b.vx = b.vz = 0; }
  }
}

// Toots inside. `you`: { x, y, z, yaw } (your feet). Hands back what to draw: where she is, which way
// she's going (`vx`, `vz`), her `mode`, how high she's hopping (`hop`), whether she has the ball.
export function makeToots() {
  const t = { x: 3.5, y: 0, z: 3.0, vx: 0, vz: 0, mode: 'idle', hop: 0, ball: false, wait: 0, stuck: 0, hopT: -1, hopFrom: null, hopTo: null, happy: 0, fetched: 0 };
  // the next place to head for, on the way to `to`: up or down the stairs if it's on the other floor
  const where = p => (onStairs(p.x, p.z) ? 's' : levelOf(p.y));
  const near = (a, b, d) => Math.hypot(a.x - b.x, a.z - b.z) < d;
  function next(to) {
    const a = where(t), b = where(to);
    if (a === b) return to;
    if (a === 's') return b === 1 ? HEAD : FOOT;
    if (b === 's') return a === 1 ? (near(t, HEAD, 0.4) ? to : HEAD) : (near(t, FOOT, 0.4) ? to : FOOT);
    // (at the foot or the head, on for the stairs: near enough is a step off them, so she never
    // turns back between the bottom step and the spot she was heading for)
    if (a === 0) return near(t, FOOT, 0.9) ? HEAD : FOOT;
    return near(t, HEAD, 0.9) ? FOOT : HEAD;
  }
  // walk towards `to` at `speed`, round what's in the way; stuck a moment, and she hops over it
  function walk(to, speed, dt, stopAt) {
    if (t.hopT >= 0) return false;
    const goal = next(to), dx = goal.x - t.x, dz = goal.z - t.z, d = Math.hypot(dx, dz);
    const final = goal === to;
    if (final && d < stopAt) { t.vx = t.vz = 0; t.stuck = 0; return true; }
    const step = Math.min(d, speed * dt), ux = dx / (d || 1), uz = dz / (d || 1);
    const tryAt = (x, z) => { const y = ground(x, z, t.y, ME); if (y === null) return false; t.x = x; t.z = z; t.y = y; return true; };
    const x0 = t.x, z0 = t.z;
    if (!tryAt(t.x + ux * step, t.z + uz * step) && !tryAt(t.x + ux * step, t.z) && !tryAt(t.x, t.z + uz * step)) { /* blocked */ }
    const moved = Math.hypot(t.x - x0, t.z - z0);
    t.vx = (t.x - x0) / (dt || 1); t.vz = (t.z - z0) / (dt || 1);
    t.stuck = moved < step * 0.3 ? t.stuck + dt : 0;
    if (t.stuck > 0.8) {   // hop over it, to a place a little way on that she can stand
      for (let k = 1.6; k <= 4; k += 0.4) {
        const x = t.x + ux * k, z = t.z + uz * k, y = ground(x, z, t.y, ME);
        if (y !== null && (k >= d || !near({ x, z }, t, 0.5))) { t.hopT = 0; t.hopFrom = { x: t.x, y: t.y, z: t.z }; t.hopTo = { x, y, z }; break; }
      }
      t.stuck = 0;
    }
    return false;
  }

  return {
    t,
    // she's been patted: a happy wiggle (and room.js might hear a roo)
    pat() { t.happy = 1.4; },
    // she's heard the front door: down the stairs and across to you as fast as she can go
    come() { Object.assign(t, { mode: 'come', ball: false, wait: 0 }); },
    update(dt, you, ball) {
      t.happy = Math.max(0, t.happy - dt);
      // a hop in progress: an arc from where she was to where she's going
      if (t.hopT >= 0) {
        t.hopT += dt / 0.55;
        const k = Math.min(1, t.hopT), a = t.hopFrom, b = t.hopTo;
        t.x = a.x + (b.x - a.x) * k; t.z = a.z + (b.z - a.z) * k; t.y = a.y + (b.y - a.y) * k;
        t.vx = (b.x - a.x) / 0.55; t.vz = (b.z - a.z) / 0.55;
        t.hop = Math.sin(k * Math.PI) * 0.7;
        if (k >= 1) { t.hopT = -1; t.hop = 0; }
        return t;
      }
      t.hop = 0;
      if (ball.held === 'you' && t.mode !== 'idle') t.mode = 'idle';
      // the ball's been thrown: after it!
      if (!ball.held && !ball.rest && t.mode === 'idle' && t.wait <= 0) t.mode = 'chase';
      if (t.mode === 'come') {
        if (walk(you, SPEED.come, dt, 1.3)) { t.mode = 'idle'; t.happy = 1.8; }
      } else if (t.mode === 'chase') {
        if (ball.held) { t.mode = 'idle'; return t; }
        walk(ball, SPEED.chase, dt, 0);
        const flat = Math.hypot(ball.x - t.x, ball.z - t.z), up = ball.y - BALL_R - t.y;
        // got it: off the floor, or up on something (she jumps for it)
        if (flat < 0.55 && up < 0.35 && Math.hypot(ball.vx, ball.vz) < 3) { ball.held = 'toots'; ball.rest = false; t.ball = true; t.mode = 'bring'; }
        else if (ball.rest && flat < 0.9 && up >= 0.35) { ball.held = 'toots'; t.ball = true; t.mode = 'bring'; t.hop = 0.6; }
      } else if (t.mode === 'bring') {
        // to just in front of you, and drop it at your feet
        const fx = -Math.sin(you.yaw), fz = -Math.cos(you.yaw);
        const spot = { x: you.x + fx * 1.0, y: you.y, z: you.z + fz * 1.0 };
        const okSpot = ground(spot.x, spot.z, you.y, ME) !== null ? spot : you;
        if (walk(okSpot, SPEED.bring, dt, 1.0) || (near(t, you, 1.3) && Math.abs(t.y - you.y) < 0.5)) {
          ball.held = null; ball.rest = true; t.ball = false; t.fetched++;
          ball.x = t.x + (you.x - t.x) * 0.45; ball.z = t.z + (you.z - t.z) * 0.45;
          const g = ballGround(ball.x, ball.z, t.y + 0.3) ?? t.y; ball.y = g + BALL_R;
          t.mode = 'idle'; t.wait = 0.6; t.happy = 1.8; t.vx = t.vz = 0;
          return Object.assign(t, { dropped: true });
        }
      } else {
        // idle: near you, wherever you go (up the stairs too), sitting and wagging when she's there
        t.wait = Math.max(0, t.wait - dt);
        if (!near(t, you, 2.2) || where(t) !== where(you)) walk(you, SPEED.follow, dt, 1.6);
        else { t.vx = t.vz = 0; }
      }
      t.dropped = false;
      return t;
    },
  };
}
export { stairY };

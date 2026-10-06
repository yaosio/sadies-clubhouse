// Marbles at the pool, trying to annoy Sadie in four different ways: splashing her from the edge of
// the water, throwing the beach ball at her, squirting her with a water pistol, and tipping a bucket
// of water over her. One at a time, never the same one twice running, with a rest between. Plain
// numbers, no drawing (sim.js moves her, pool.js draws her). The timings are Claude's numbers.
import { COPING, LAP, POOL, SADIE, inRect, keepOn } from './layout.js';
import { throwTo } from './ball.js';

const rand = (a, b) => a + Math.random() * (b - a);
const HOME = [5.8, 24.0];                  // where she sits between goes
const BUCKET_AT = [5.6, 17.9];             // the toy box, where the bucket is
const TOYS = ['splash', 'ball', 'squirt', 'bucket'];
const WALK = 2.0, RUN = 3.8;

export function makeMarbles() {
  return { x: HOME[0], z: HOME[1], hop: 0, mode: 'rest', pose: 'grin', timer: rand(4, 7), last: null, plan: null, path: [], phase: 0, carryFor: 0, look: [HOME[0], HOME[1] - 1], carrying: false };
}

// the shortest way from a to b that doesn't cross the water and its edge: straight if she can, or
// round the corners (the laps' corners: Chooter's route is clear of everything)
function clearLine(a, b) {
  for (let k = 0; k <= 1; k += 0.05) if (inRect(a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, [COPING.x0, COPING.x1, COPING.z0, COPING.z1], 0.3)) return false;
  return true;
}
export function pathTo(a, b) {
  const nodes = [a, b, LAP[0], LAP[1], LAP[2], LAP[4]], dist = nodes.map(() => Infinity), from = nodes.map(() => -1), done = nodes.map(() => false);
  dist[0] = 0;
  for (;;) {
    let u = -1; nodes.forEach((_, i) => { if (!done[i] && dist[i] < Infinity && (u < 0 || dist[i] < dist[u])) u = i; });
    if (u < 0 || u === 1) break;
    done[u] = true;
    nodes.forEach((q, v) => {
      const d = dist[u] + Math.hypot(q[0] - nodes[u][0], q[1] - nodes[u][1]);
      if (!done[v] && d < dist[v] && clearLine(nodes[u], q)) { dist[v] = d; from[v] = u; }
    });
  }
  if (from[1] < 0) return [b];   // (no way found: straight, and she slides along whatever's in the way)
  const path = []; for (let v = 1; v > 0; v = from[v]) path.unshift(nodes[v]);
  return path;
}

// she'll try the ball only when it's somewhere she can get at (not in the middle of the water)
const ballReachable = (ball, m) => !ball.held && (!ball.wet || [POOL.x0, POOL.x1].some(x => Math.abs(ball.x - x) < 1.2) || [POOL.z0, POOL.z1].some(z => Math.abs(ball.z - z) < 1.2)) && Math.hypot(ball.x - m.x, ball.z - m.z) > 0.1;

const stand = (x, z) => { const p = { x, z }; keepOn(p, 0.35); return [p.x, p.z]; };   // (a spot that's really on dry deck)

// where each go starts from, and what it does there
function plan(kind, ball) {
  switch (kind) {
    case 'splash': return { kind, at: stand(COPING.x0 - 0.5, SADIE.z), face: SADIE };
    case 'ball': return { kind, at: stand(ball.x, ball.z), face: SADIE, then: stand(-3.9, 18.2) };
    case 'squirt': return { kind, at: stand(-4.6, 18.4), face: SADIE };
    default: return { kind: 'bucket', at: stand(...BUCKET_AT), face: SADIE, then: stand(-5.5, 19.3) };
  }
}

// one step. ctx: ball, and emit('drops', { kind: 'splash' | 'squirt' | 'bucket', from, to }) for water thrown at Sadie
export function stepMarbles(m, dt, { ball, emit }) {
  const goTo = (to, speed) => {   // follow the path; true when she's there
    if (!m.path.length) m.path = pathTo([m.x, m.z], to);
    const [tx, tz] = m.path[0], dx = tx - m.x, dz = tz - m.z, d = Math.hypot(dx, dz);
    if (d < 0.15) { m.path.shift(); return !m.path.length; }
    m.x += dx / d * speed * dt; m.z += dz / d * speed * dt; keepOn(m, 0.35);
    m.hop += dt * speed * 4;
    m.look = [tx, tz];
    return false;
  };
  const face = at => { m.look = [at.x, at.z]; };   // (what she's facing: pool.js turns her picture that way)

  switch (m.mode) {
    case 'rest': {   // sitting by the pool, grinning, working out what to do next
      m.pose = 'grin'; m.timer -= dt; face(SADIE);
      if (m.timer <= 0) {
        let kind; do kind = TOYS[Math.floor(Math.random() * TOYS.length)]; while (kind === m.last || (kind === 'ball' && !ballReachable(ball, m)));
        m.last = kind; m.plan = plan(kind, ball); m.mode = 'go'; m.path = []; m.timer = 0;
      }
      break;
    }
    case 'go': {
      m.pose = 'walk'; m.timer += dt;
      if (m.plan.kind === 'ball') m.plan.at = stand(ball.x, ball.z);   // (it may roll about)
      if (m.timer > 25 || (m.plan.kind === 'ball' && !ballReachable(ball, m) && !m.carrying)) { m.mode = 'home'; m.path = []; break; }
      if (goTo(m.plan.at, WALK)) { m.mode = 'do'; m.phase = 0; m.timer = 0; face(SADIE); }
      break;
    }
    case 'do': {
      m.timer += dt; const p = m.plan; face(SADIE);
      if (p.kind === 'splash') {   // three scoops of water, paws up
        m.pose = m.timer % 1 < 0.5 ? 'up' : 'down';
        for (const at of [0.6, 1.5, 2.4]) if (m.phase === Math.round((at - 0.6) / 0.9) && m.timer > at) { m.phase++; emit('drops', { kind: 'splash', from: [POOL.x0 + 0.1, 0.3, SADIE.z + rand(-0.4, 0.4)], to: [SADIE.x + 0.3, 0.7, SADIE.z] }); }
        if (m.timer > 3.3) { m.mode = 'after'; m.timer = 0; }
      } else if (p.kind === 'squirt') {   // four squirts of the water pistol
        m.pose = 'squirt';
        if (m.phase < 4 && m.timer > 0.5 + m.phase * 0.45) { m.phase++; emit('drops', { kind: 'squirt', from: [m.x, 0.6, m.z], to: [SADIE.x + 0.2, 0.7, SADIE.z] }); }
        if (m.timer > 2.8) { m.mode = 'after'; m.timer = 0; }
      } else if (p.kind === 'ball') {
        if (!m.carrying) {   // pick it up (reaching into the water if she has to)
          m.pose = 'up'; if (m.timer > 0.5) { m.carrying = true; ball.held = true; m.phase = 0; m.timer = 0; m.carryFor = 0; m.path = []; m.mode = 'carry'; }
        }
      } else {   // the bucket
        m.pose = 'bucket';
        if (m.timer > 0.8) { m.mode = 'carry'; m.timer = 0; m.carryFor = 0; m.path = []; m.carrying = true; }
      }
      break;
    }
    case 'carry': {   // taking the ball (or the bucket) to where she'll let fly
      m.pose = m.plan.kind === 'ball' ? 'up' : 'bucket'; m.carryFor += dt;
      if (goTo(m.plan.then, WALK * 0.9)) {
        face(SADIE);
        if (m.plan.kind === 'ball') {   // a wind-up and a throw, at Sadie
          m.pose = 'throw'; m.timer += dt;
          if (m.timer > 0.4) { m.carrying = false; throwTo(ball, m.x, 1.3, m.z, SADIE.x + 0.1, SADIE.y + 0.3, SADIE.z, 0.9); m.mode = 'after'; m.timer = 0; }
        } else {          // the bucket tipped over her
          emit('drops', { kind: 'bucket', from: [SADIE.x - 0.2, 1.7, SADIE.z], to: [SADIE.x - 0.2, 0, SADIE.z] });
          m.carrying = false; m.mode = 'flee'; m.path = [];
        }
      }
      if (m.carrying && m.carryFor > 20) { m.carrying = false; ball.held = false; m.mode = 'home'; m.path = []; }   // (never holds on to it for good)
      break;
    }
    case 'after': {   // pleased with herself
      m.timer += dt; m.pose = m.plan.kind === 'ball' ? 'throw' : 'grin';
      if (m.timer > 1.4) { m.mode = 'home'; m.path = []; }
      break;
    }
    case 'flee': case 'home': {   // back to her spot: running, if she's just tipped the bucket
      m.pose = 'walk';
      if (goTo(HOME, m.mode === 'flee' ? RUN : WALK)) { m.mode = 'rest'; m.timer = rand(7, 13); }
      break;
    }
  }
  if (m.carrying && m.plan?.kind === 'ball') { ball.held = true; ball.x = m.x; ball.z = m.z; ball.y = 1.3; ball.vx = ball.vy = ball.vz = 0; }
}

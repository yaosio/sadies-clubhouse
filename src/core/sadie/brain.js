// Sadie's behavior: pick the nearest hay, walk or run to it, climb walls, wait underneath if she
// can't reach it yet, then pace (further each lap) when she gets impatient. Every so often she
// rushes back to her barn and drags it up to the top of the pile.
import { U, W } from '../../config.js';
import { world } from '../world.js';
import { emit } from '../events.js';
import { emote, spark } from '../effects.js';
import { groundAt, STEP_UP, surf, SURF_N, SURF_RES } from '../surface.js';
import { eatHay } from '../hay.js';
import { BARN_HALF, barnX, barnFloor, barnCover, freeBarn, haulBarn, releaseBarn, barnLag } from '../barn.js';

// ---------- climber ----------
export const REACH = 1.6 * U, WALK = 1.7 * U, CLIMB = 0.8 * U, WALL = 0.55 * U;
// running: starts when the hay is far away sideways, stops once she's close (the gap stops her flickering between the two)
const RUN_START = 6 * U, RUN_STOP = 2.5 * U, RUN_BOOST = 1.5;
export const sadie = { x: W / 2, y: 0, vy: 0, dir: 1, state: 'walk', phase: 0, target: null, cheer: 0 };
export function pickTarget() {
  sadie.pace = null; sadie.waitT = 0;
  let bestS = null, bc = Infinity;
  for (const s of world.hay) { if (s.eaten) continue;
    const c = Math.abs(s.x - sadie.x) + Math.abs(s.y - sadie.y) * 1.5; // nearest hay, up or down
    if (c < bc) { bc = c; bestS = s; } }
  sadie.target = bestS;
}
function munch(s) {
  eatHay(s); sadie.cheer = 1.1; emit('hayEaten', s);
  for (let k = 0; k < 5; k++) emote('\u2665', '#ff4f86', sadie.x + (Math.random() - 0.5) * U, sadie.y + 1.3 * U, (Math.random() - 0.5) * 40, 50 + Math.random() * 40);
  for (let k = 0; k < 26; k++) { const a = Math.random() * Math.PI * 2, v = 40 + Math.random() * 120;
    spark(s.x, s.y, Math.cos(a) * v, Math.sin(a) * v, 2 + Math.random() * 3, 1, k % 2 ? '#f2cf63' : '#c9a23a'); } // bits of straw
  pickTarget();
}
// ---------- trips home ----------
// Once her barn is left far below her or buried under the pile, she rushes back to it, grabs the
// rope and drags it up to the top of the pile behind her, shoving pieces out of the way.
export const HOME_GAP = 60;            // at least this many seconds between trips
export const LEFT_BEHIND = 6 * U;      // she goes back for it once she's this far above its floor...
export const BURIED = 1 * U;           // ...or once the pile is this deep over its roof
export const HITCH = BARN_HALF + 0.9 * U; // she walks this far ahead of the barn's middle while dragging it
const MIN_HAUL = 4 * U;                // she always drags it at least this far
const HAUL_WALK = 0.7;                 // walking speed while dragging, compared to normal
export const TRIP_MAX = 60;            // give up (leave it where it is) after this long
export function barnNeedsHer() { return sadie.y - barnFloor() >= LEFT_BEHIND || barnCover() >= BURIED; }
export function startTrip() {
  const c = sadie, bx = barnX();
  // head for the top of the pile (not counting whatever is heaped on the barn itself, which is
  // about to get shoved aside), dragging the barn at least a little way
  let peak = -1, px = bx;
  for (let i = 0; i < SURF_N; i++) if (surf[i] > peak && Math.abs(i * SURF_RES - bx) > BARN_HALF + 1.5 * U) { peak = surf[i]; px = i * SURF_RES; }
  let side = Math.sign(px - bx) || (c.x >= bx ? 1 : -1);
  let dest = Math.abs(px - bx) < MIN_HAUL ? bx + side * MIN_HAUL : px;
  if (dest < 0.5 * U || dest > W - 0.5 * U) { side = -side; dest = bx + side * MIN_HAUL; }
  c.trip = { phase: 'rush', side, dest: Math.min(W - 0.5 * U, Math.max(0.5 * U, dest)), time: 0 };
  c.pace = null; c.waitT = 0; c.target = null; c.heave = false;
  emote('!', '#ff4f86', c.x, c.y + 1.5 * U, 0, 40);
  emit('homeRush');
}
function endTrip(home) {
  const c = sadie;
  releaseBarn(); c.trip = null; c.heave = false; c.lastTrip = world.gameTime;
  if (home) {
    c.cheer = 1.1; emit('barnHome');
    for (let k = 0; k < 7; k++) emote('\u2665', '#ff4f86', c.x + (Math.random() - 0.5) * 1.5 * U, c.y + 1.3 * U, (Math.random() - 0.5) * 50, 50 + Math.random() * 40);
  }
  pickTarget();
}
function tripStep(dt) {
  const c = sadie, t = c.trip;
  t.time += dt;
  if (t.time > TRIP_MAX) { endTrip(false); return; }
  if (t.phase === 'rush') { // run to the barn and stand beside it, on the side she'll drag it toward
    const goal = Math.min(W - 0.5 * U, Math.max(0.5 * U, barnX() + t.side * HITCH));
    if (Math.abs(goal - c.x) < 0.3 * U) { t.phase = 'haul'; c.dir = t.side; freeBarn(); return; }
    walkToward(goal, Math.abs(goal - c.x), true, 1, dt);
    return;
  }
  const there = Math.abs(t.dest - c.x) < 0.3 * U, lag = barnLag();
  if (there && lag < 0.5 * U) { endTrip(true); return; }
  if (there || lag > 1.2 * U) { // dig in and pull until the barn catches up
    c.heave = true; c.dir = t.side; c.state = 'walk'; c.running = false; c.run = Math.max(0, (c.run || 0) - dt * 3);
    c.phase += dt * 2.5;
    return;
  }
  c.heave = false;
  walkToward(t.dest, Math.abs(t.dest - c.x), false, HAUL_WALK, dt);
}

export function updateSadie(dt) {
  const c = sadie;
  if (c.trip && c.trip.phase === 'haul') haulBarn(c.x - c.trip.side * HITCH, c.y); // the barn follows along behind her
  if (!c.trip && (!c.target || c.target.eaten)) pickTarget();
  const T = c.target;
  c.cheer = Math.max(0, c.cheer - dt);
  if (!c.trip) for (const s of world.hay) if (!s.eaten && Math.abs(s.x - c.x) < 0.6 * U && s.y <= c.y + REACH) munch(s);

  const ground = groundAt(c.x, c.y);
  // scared: pieces under her feet are lurching around (not while she's busy fetching her barn)
  c.scared = Math.max(0, (c.scared || 0) - dt);
  if (!c.trip) for (const p of world.pieces) {
    if (p.asleep || p.avgSpeed < 0.9 || p.maxX < c.x - 0.5 * U || p.minX > c.x + 0.5 * U) continue;
    if (p.maxY > c.y - 0.6 * U && p.maxY < c.y + 0.4 * U) { c.scared = 1; break; }
  }
  if (c.state === 'climb') {
    c.heave = false;
    const ahead = c.climbAhead ? groundAt(c.x + c.dir * 0.35 * U, c.y) : 0;
    const goal = Math.max(ground, ahead);
    c.y += CLIMB * dt; c.phase += dt * 1.5;
    if (c.y >= goal - 0.05 * U) {
      c.y = Math.max(c.y, ground); c.state = 'walk';
      if (c.climbAhead) c.x = Math.min(W - 0.3 * U, Math.max(0.3 * U, c.x + c.dir * 0.25 * U));
    }
    return;
  }
  // something solid right here that's taller than a step (a piece landed on it): scramble out, don't teleport
  if (ground - c.y > STEP_UP) { c.state = 'climb'; c.climbAhead = false; return; }
  if (c.y < ground) { c.y = Math.min(ground, c.y + 3 * U * dt); c.vy = 0; }
  else if (c.y > ground + 0.5) { c.vy -= 1400 * dt; c.y = Math.max(ground, c.y + c.vy * dt); if (c.y === ground) c.vy = 0; if (c.vy < -4 * U) c.scared = 1; }
  else { c.y = ground; c.vy = 0; }
  if (c.state !== 'walk') c.run = Math.max(0, (c.run || 0) - dt * 3);
  if (!c.trip && c.cheer <= 0 && world.gameTime - (c.lastTrip || 0) >= HOME_GAP && barnNeedsHer()) startTrip();
  if (c.trip) { tripStep(dt); return; }
  if (c.cheer > 0 || !T) { c.state = 'idle'; return; }

  // Under the hay but can't reach it: wait a moment, then pace back and forth,
  // a little further each lap, in case it's stuck in a hole or the gap is wide.
  let goal = T.x;
  if (c.pace) {
    goal = Math.min(W - 0.5 * U, Math.max(0.5 * U, T.x + c.pace.side * c.pace.dist));
    if (Math.abs(goal - c.x) < 0.3 * U) {
      c.pace.side = -c.pace.side; c.pace.dist = Math.min(12 * U, c.pace.dist + U);
      goal = Math.min(W - 0.5 * U, Math.max(0.5 * U, T.x + c.pace.side * c.pace.dist));
    }
  } else if (Math.abs(T.x - c.x) < 0.5 * U) {
    c.state = 'wait'; c.waitT = (c.waitT || 0) + dt;
    if (c.waitT > 1.5) c.pace = { side: Math.random() < 0.5 ? -1 : 1, dist: 1.5 * U };
    return;
  }
  walkToward(goal, Math.abs(T.x - c.x), !c.pace, 1, dt);
}

// One step toward x = goal: walk (or run, if allowed and the thing she's after is `far` away),
// slowing on slopes and switching to climbing at anything taller than a step.
function walkToward(goal, far, canRun, speedMul, dt) {
  const c = sadie;
  const dx = goal - c.x;
  c.dir = Math.sign(dx) || c.dir;
  if (!canRun) c.running = false;
  else if (far > RUN_START) c.running = true;
  else if (far < RUN_STOP) c.running = false;
  const ahead = groundAt(c.x + c.dir * 0.35 * U, c.y), rise = ahead - c.y;
  if (rise > WALL) { c.state = 'climb'; c.climbAhead = true; return; }
  c.run = Math.min(1, Math.max(0, (c.run || 0) + (c.running ? dt * 2.5 : -dt * 3))); // ease in and out of the run
  const sp = WALK * speedMul * (1 + c.run * RUN_BOOST) / (1 + Math.max(0, rise) / (0.35 * U) * 2.2);
  c.x = Math.min(W - 0.3 * U, Math.max(0.3 * U, c.x + c.dir * sp * dt));
  c.phase += sp * dt / (0.9 * U * (1 + c.run * 0.7)); // longer strides when running
  c.state = 'walk';
}

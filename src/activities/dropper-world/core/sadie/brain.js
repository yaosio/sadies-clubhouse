// Sadie: a cat who thinks she's a cow (see docs/CHARACTERS.md). What she does comes from how she
// feels, through the shared thinking in mind/think.js:
//   hunger   - her strongest feeling. She's extremely food motivated: going after hay always
//              matters to her, and she never walks past a bundle she can reach.
//   settled  - how at home she feels after her last trip to the barn (1 = just got it home); it
//              wears off over a minute. Once it's gone, a barn left far below her or buried
//              under the pile worries her (cows live in barns; she can't live in a buried one),
//              and she goes and drags it up.
//   impatient - builds while she waits or paces under hay she can't reach; goes away when she
//              eats, and slowly while she's getting somewhere. (The mole sees her fidgeting and
//              thinks she wants to be buried. She doesn't. It helps her anyway.)
//   scared   - pieces lurching under her feet, or falling (kept as `scared`, read by mood.js).
// Her activities: eat (walk, run and climb to the nearest hay; wait under it if it's out of
// reach, then pace, further each lap; if her hay is being carried off, she runs after it) and fetchBarn (rush to the barn, grab the rope, drag it up
// to the top of the pile).
import { U, W } from '../../config.js';
import { world } from '../world.js';
import { emit, on } from '../events.js';
import { emote, spark } from '../effects.js';
import { groundAt, STEP_UP, surf, SURF_N, SURF_RES } from '../surface.js';
import { eatHay } from '../hay.js';
import { BARN_HALF, barnX, barnFloor, barnCover, freeBarn, haulBarn, releaseBarn, barnLag } from '../barn.js';
import { drift, nudge } from '../mind/feelings.js';
import { offers, offersFrom } from '../mind/offers.js';
import { think, switchTo, done } from '../mind/think.js';
import { mindsFrom } from '../mind/thoughts.js';

// ---------- climber ----------
export const REACH = 1.6 * U, WALK = 1.7 * U, CLIMB = 0.8 * U, WALL = 0.55 * U;
// running: starts when the hay is far away sideways, stops once she's close (the gap stops her flickering between the two)
const RUN_START = 6 * U, RUN_STOP = 2.5 * U, RUN_BOOST = 1.5;
export const sadie = { x: W / 2, y: 0, vy: 0, dir: 1, state: 'walk', phase: 0, target: null, cheer: 0, doing: null, feel: freshFeelings() };
export function freshFeelings() { return { hunger: 0.5, settled: 1, impatient: 0 }; }

// ---------- feelings ----------
const HUNGER_RISE = 1 / 90;         // per second: hungry again about a minute and a half after a bundle
const HUNGER_EAT = 0.5;             // how much one bundle helps
const FIDGET = 1 / 12;              // per second waiting or pacing under hay she can't reach: fed up in 12 s
const CALM = 1 / 25;                // per second otherwise
export const HOME_GAP = 60;         // seconds for the feeling of being settled to wear off after a trip
export const LEFT_BEHIND = 6 * U;   // the barn worries her once she's this far above its floor...
export const BURIED = 1 * U;        // ...or once the pile is this deep over its roof
// How much the barn's whereabouts worry her: 1 or more means it needs her.
export function barnWorry() { return Math.max((sadie.y - barnFloor()) / LEFT_BEHIND, barnCover() / BURIED); }
export function barnNeedsHer() { return barnWorry() >= 1; }

// Sadie is a friend (Chooter comes to play near her). And when she's impatient, she's restless.
offersFrom(() => [{ kind: 'friend', thing: sadie, x: sadie.x, y: sadie.y },
  { kind: 'restless', thing: sadie, name: 'Sadie', x: sadie.x, y: sadie.y, how: sadie.feel.impatient }]);

// ---------- eat ----------
// Keeps going for the same bundle until it's gone, then picks the nearest one, up or down.
export function pickTarget() {
  sadie.pace = null; sadie.waitT = 0;
  let best = null, bc = Infinity;
  for (const o of offers('food')) {
    const c = Math.abs(o.x - sadie.x) + Math.abs(o.y - sadie.y) * 1.5;
    if (c < bc) { bc = c; best = o.thing; }
  }
  sadie.target = best;
}
function munch(s) {
  eatHay(s); sadie.cheer = 1.1; nudge(sadie.feel, 'hunger', -HUNGER_EAT); nudge(sadie.feel, 'impatient', -1); emit('hayEaten', s);
  for (let k = 0; k < 5; k++) emote('♥', '#ff4f86', sadie.x + (Math.random() - 0.5) * U, sadie.y + 1.3 * U, (Math.random() - 0.5) * 40, 50 + Math.random() * 40);
  for (let k = 0; k < 26; k++) { const a = Math.random() * Math.PI * 2, v = 40 + Math.random() * 120;
    spark(s.x, s.y, Math.cos(a) * v, Math.sin(a) * v, 2 + Math.random() * 3, 1, k % 2 ? '#f2cf63' : '#c9a23a'); } // bits of straw
  pickTarget();
}
const eat = {
  want: c => 1 + c.feel.hunger, // food always matters to her
  start: () => pickTarget(),
  step(c, dt) {
    if (!c.target || c.target.eaten) pickTarget();
    const T = c.target;
    if (!T) { c.state = 'idle'; return 'there'; }
    if (T.carried) { c.pace = null; c.waitT = 0; } // her food is getting away: no waiting around
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
      return 'there';
    }
    walkToward(goal, T.carried ? Infinity : Math.abs(T.x - c.x), !c.pace, 1, dt); // run after food on the move
    return 'moving';
  },
};
// Somebody took the hay she was after: hey!
on('hayStolen', h => { if (h === sadie.target) emote('!', '#e8394f', sadie.x, sadie.y + 1.5 * U, 0, 40); });

// ---------- fetch the barn ----------
// She rushes back to it, grabs the rope and drags it up to the top of the pile behind her,
// shoving pieces out of the way.
export const HITCH = BARN_HALF + 0.9 * U; // she walks this far ahead of the barn's middle while dragging it
const MIN_HAUL = 4 * U;                // she always drags it at least this far
const HAUL_WALK = 0.7;                 // walking speed while dragging, compared to normal
export const TRIP_MAX = 60;            // give up (leave it where it is) after this long
function startTrip() {
  const c = sadie, bx = barnX();
  // head for the top of the pile (not counting whatever is heaped on the barn itself, which is
  // about to get shoved aside), dragging the barn at least a little way
  let peak = -1, px = bx;
  for (let i = 0; i < SURF_N; i++) if (surf[i] > peak && Math.abs(i * SURF_RES - bx) > BARN_HALF + 1.5 * U) { peak = surf[i]; px = i * SURF_RES; }
  let side = Math.sign(px - bx) || (c.x >= bx ? 1 : -1);
  let dest = Math.abs(px - bx) < MIN_HAUL ? bx + side * MIN_HAUL : px;
  if (dest < 0.5 * U || dest > W - 0.5 * U) { side = -side; dest = bx + side * MIN_HAUL; }
  c.trip = { phase: 'rush', side, dest: Math.min(W - 0.5 * U, Math.max(0.5 * U, dest)), time: 0, buried: barnCover() >= BURIED };
  c.pace = null; c.waitT = 0; c.target = null; c.heave = false;
  emote('!', '#ff4f86', c.x, c.y + 1.5 * U, 0, 40);
  emit('homeRush');
}
function endTrip(home) {
  const c = sadie;
  releaseBarn(); c.trip = null; c.heave = false; c.feel.settled = 1;
  if (home) {
    c.cheer = 1.1; emit('barnHome');
    for (let k = 0; k < 7; k++) emote('♥', '#ff4f86', c.x + (Math.random() - 0.5) * 1.5 * U, c.y + 1.3 * U, (Math.random() - 0.5) * 50, 50 + Math.random() * 40);
  }
  pickTarget();
  done(c);
}
const fetchBarn = {
  // once she's settled feeling has worn off, a barn left behind or buried beats even hay
  want: c => c.feel.settled <= 0 && barnNeedsHer() ? 3 : 0,
  busy: c => !!c.trip,
  start: startTrip,
  stop: c => { if (c.trip) { releaseBarn(); c.trip = null; c.heave = false; } },
  step(c, dt) {
    const t = c.trip;
    t.time += dt;
    if (t.time > TRIP_MAX) { endTrip(false); return 'there'; }
    if (t.phase === 'rush') { // run to the barn and stand beside it, on the side she'll drag it toward
      const goal = Math.min(W - 0.5 * U, Math.max(0.5 * U, barnX() + t.side * HITCH));
      if (Math.abs(goal - c.x) < 0.3 * U) { t.phase = 'haul'; c.dir = t.side; freeBarn(); return 'there'; }
      walkToward(goal, Math.abs(goal - c.x), true, 1, dt);
      return 'moving';
    }
    const there = Math.abs(t.dest - c.x) < 0.3 * U, lag = barnLag();
    if (there && lag < 0.5 * U) { endTrip(true); return 'there'; }
    if (there || lag > 1.2 * U) { // dig in and pull until the barn catches up
      c.heave = true; c.dir = t.side; c.state = 'walk'; c.running = false; c.run = Math.max(0, (c.run || 0) - dt * 3);
      c.phase += dt * 2.5;
      return 'there';
    }
    c.heave = false;
    walkToward(t.dest, Math.abs(t.dest - c.x), false, HAUL_WALK, dt);
    return 'moving';
  },
};

export const SADIE_DOES = { eat, fetchBarn };

// ---------- what she's thinking (the bubble you get by tapping her) ----------
const clamp01 = v => v < 0 ? 0 : v > 1 ? 1 : v;
function sadieThinks() {
  const c = sadie, T = c.target;
  let doing, why;
  if (c.trip) {
    doing = c.trip.phase === 'rush' ? "I'm rushing back to my barn!" : "I'm dragging my barn up the pile.";
    why = c.trip.buried ? "It's getting buried, and a cow can't live in a buried barn." : "I've climbed so far above it. A cow's barn should be close by.";
  } else if (c.scared > 0) { doing = 'Eek!'; why = 'The pile is wobbling under my paws.'; }
  else if (c.cheer > 0) { doing = "I'm so happy!"; why = 'I just got what I wanted.'; }
  else if (c.doing !== 'eat' || !T) { doing = "I'm looking around for hay."; why = "I'm a cow, after all."; }
  else if (T.carried) { doing = "I'm chasing my hay!"; why = 'Somebody took it. My food getting away is NOT okay.'; }
  else if (c.pace) { doing = "I'm pacing back and forth."; why = "The hay is just out of reach. I'm looking for a way up."; }
  else if (c.state === 'wait') { doing = "I'm waiting under the hay."; why = "It's just out of reach. If only the pile were a bit taller..."; }
  else if (c.state === 'climb') { doing = "I'm climbing up."; why = "There's hay up there!"; }
  else { doing = c.running ? "I'm running for the hay!" : "I'm heading for the hay."; why = c.feel.hunger > 0.7 ? "I'm SO hungry." : "I love hay. I'm a cow."; }
  return { doing, why, feelings: [
    { label: "I'm hungry", value: c.feel.hunger },
    { label: 'I feel at home', value: c.feel.settled },
    { label: "I'm worried about my barn", value: clamp01(barnWorry()) },
    { label: "I'm impatient", value: c.feel.impatient },
  ] };
}
mindsFrom(() => [{ who: sadie, name: 'Sadie', x: sadie.x, y: sadie.y, h: 1.3 * U, think: sadieThinks }]);
// Start an activity right now (the dev sheet's buttons).
export function sadieDo(name) { if (sadie.doing !== name) switchTo(sadie, SADIE_DOES, name); }

// ---------- each tick ----------
export function updateSadie(dt) {
  const c = sadie;
  const stuck = !c.trip && c.doing === 'eat' && (c.pace || c.state === 'wait');
  drift(c.feel, { hunger: HUNGER_RISE, settled: -1 / HOME_GAP, impatient: stuck ? FIDGET : -CALM }, dt);
  if (c.trip && c.trip.phase === 'haul') haulBarn(c.x - c.trip.side * HITCH, c.y); // the barn follows along behind her
  c.cheer = Math.max(0, c.cheer - dt);
  // she never walks past hay she can reach (unless she's busy with her barn)
  if (!c.trip) for (const o of offers('food')) if (Math.abs(o.x - c.x) < 0.6 * U && o.y <= c.y + REACH) munch(o.thing);

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
  if (c.cheer > 0 && !c.trip) { c.state = 'idle'; return; } // a happy moment after a bite or getting home
  think(c, SADIE_DOES, dt);
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

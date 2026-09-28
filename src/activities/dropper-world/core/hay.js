// Hay: Sadie's snacks (she thought she was a cow). Nobody puts it out for her: the mole, rummaging
// for its next piece, now and then pulls up a bundle of hay instead ("Hay?! Down there?!") and
// flings it away in disgust (mole.js). The bundle is a real thing: it flies, bounces and tumbles
// over the pile (without shoving any pieces) until it settles. Then whatever it is that keeps the
// mole up in the sky gets hold of it too (it's not the hat), and it floats up a little way and
// hangs there, out of Sadie's reach. After that it rides the pile up if covered, and back down
// (never below where it floated to) if the pile falls away.
//
// There are HAY_OUT bundles about at most: once Sadie eats one, the mole turns up another soon
// after. It aims along a trail that runs back and forth across the board, so she grazes her way
// around; the bounces scatter them a bit, so now and then one lands right where she can get it.
import { U, W } from '../config.js';
import { world } from './world.js';
import { surfAt, groundAt } from './surface.js';
import { offersFrom } from './mind/offers.js';

export const HAY_OUT = 3;                         // bundles out at once (counting one in the mole's paws)
export const STEP_MIN = 10 * U, STEP_MAX = 18 * U; // sideways gap the mole aims for from the previous bundle
// how far above the pile a bundle floats up to once it settles: out of reach, so Sadie needs some help
export const RISE_MIN = 1.5 * U, RISE_MAX = 4.5 * U;
export const SIT = 0.7 * U;                       // how high a floating bundle sits above the pile
export const HAY_R = 0.4 * U;                     // half a bundle's height: what it bounces on
export const GAP = 3;                             // seconds after Sadie eats one before the mole can turn up another
const G = 1400, BOUNCE = 0.3, LIFT = 1.5 * U;     // gravity; speed kept per bounce (floppy); how fast it floats up
const SETTLE = 0.4, FLY_MAX = 8;                  // lying still this long, it starts to float (or after flying this long anyway)
const EDGE = 1.5 * U;                             // keep away from the walls
export const trail = { x: W / 2, dir: 1, wait: 0 }; // where the mole last aimed, which way the trail is heading, and the gap after a meal

// Where the next bundle should go: a little further along the trail.
function nextSpot() {
  let x = trail.x + trail.dir * (STEP_MIN + Math.random() * (STEP_MAX - STEP_MIN));
  if (x < EDGE || x > W - EDGE) { // hit a wall: turn around and head back
    trail.dir = -trail.dir;
    x = trail.x + trail.dir * (STEP_MIN + Math.random() * (STEP_MAX - STEP_MIN));
    x = Math.min(W - EDGE, Math.max(EDGE, x));
  }
  return trail.x = x;
}

export const makeBundle = (x, y, y0 = y) => ({ x, y, y0, eaten: false, pop: 0, up: 0, down: 0, st: null, vx: 0, vy: 0, rot: 0, spin: 0, rest: 0, t: 0 });
// How many more bundles are wanted out there (and it's been long enough since the last meal).
export const hayWanted = () => trail.wait > 0 ? 0 : HAY_OUT - world.hay.filter(h => !h.eaten).length;

// The mole flings one from (fx, fy): it comes down around the next spot on the trail.
export function throwHay(fx, fy) {
  const tx = nextSpot(), ty = surfAt(tx) + HAY_R;
  const T = Math.min(1.4, Math.max(0.7, 0.55 + Math.hypot(tx - fx, ty - fy) / (30 * U))); // flight time
  const h = makeBundle(fx, fy);
  Object.assign(h, { st: 'fly', aim: tx, vx: (tx - fx) / T, vy: (ty - fy) / T + 0.5 * G * T, spin: (Math.sign(tx - fx) || 1) * -9 });
  world.hay.push(h);
  return h;
}

// Every bundle that's landed says "I'm food" (one still flying about isn't anywhere yet).
// Hay someone is carrying off is still food; it's just on the move.
offersFrom(() => world.hay.filter(h => !h.eaten && h.st !== 'fly').map(h => ({ kind: 'food', thing: h, x: h.x, y: h.y, moving: !!h.carried })));

// Someone picks a bundle up (it goes wherever they put it until it's put down again)...
export function pickUpHay(h) { h.carried = true; h.up = h.down = 0; h.st = null; h.rot = 0; }
// ...and puts it down: it drops onto the pile right below.
export function putDownHay(h) { h.carried = false; h.y = h.y0 = surfAt(h.x) + SIT; }

// A fresh board: no hay yet. The mole turns up the first few straight away.
export function resetHay(startX) {
  world.hay = []; world.hayEaten = 0;
  trail.x = startX; trail.dir = Math.random() < 0.5 ? -1 : 1; trail.wait = 0;
}

export function eatHay(h) {
  h.eaten = true; h.carried = false; h.pop = 1; world.hayEaten++;
  trail.wait = GAP;
}

// Flying: bounces off the pile and the walls like the ball does, only floppier, tumbling as it goes.
function fly(h, dt) {
  h.t += dt;
  const nx = h.x + h.vx * dt, side = Math.sign(h.vx);
  if (side && groundAt(nx + side * HAY_R, h.y - HAY_R) > h.y) { h.vx = -h.vx * 0.4; h.spin = -h.spin * 0.5; }
  else h.x = nx;
  if (h.x < HAY_R) { h.x = HAY_R; h.vx = Math.abs(h.vx) * 0.5; }
  if (h.x > W - HAY_R) { h.x = W - HAY_R; h.vx = -Math.abs(h.vx) * 0.5; }
  h.vy -= G * dt; h.y += h.vy * dt;
  const g = groundAt(h.x, h.y - HAY_R) + HAY_R;
  let onGround = false;
  if (h.y <= g) {
    h.y = g; // (if something landed on it, it pops out on top)
    if (h.vy < -120) { h.vy = -h.vy * BOUNCE; h.vx *= 0.65; h.spin = -h.vx / HAY_R * 0.6; }
    else {
      onGround = true; h.vy = 0;
      const slope = (groundAt(h.x - 0.3 * U, h.y - HAY_R) - groundAt(h.x + 0.3 * U, h.y - HAY_R)) / (0.6 * U);
      h.vx = (h.vx + Math.max(-1, Math.min(1, slope)) * 300 * dt) * Math.max(0, 1 - 5 * dt);
    }
  }
  if (onGround) { // tumbles to a stop lying flat
    const flat = Math.round(h.rot / Math.PI) * Math.PI;
    h.spin = 0; h.rot += (flat - h.rot) * Math.min(1, dt * 8) + h.vx * dt / HAY_R * 0.3;
  } else h.rot += h.spin * dt;
  h.rest = onGround && Math.abs(h.vx) < 0.4 * U ? h.rest + dt : 0;
  if (h.rest > SETTLE || h.t > FLY_MAX) { // it's stopped: the float gets hold of it
    h.st = 'lift'; h.vx = h.vy = 0;
    h.y0 = Math.max(g, surfAt(h.x) + HAY_R) - HAY_R + SIT + RISE_MIN + Math.random() * (RISE_MAX - RISE_MIN);
  }
}

export function updateHay(dt) {
  for (const h of world.hay) {
    if (h.eaten) { h.pop -= dt * 2.5; continue; } // short munch animation, then it's gone
    if (h.carried) continue;
    if (h.st === 'fly') { fly(h, dt); continue; }
    // Hay rides the pile: if pieces cover it, it floats up to sit on top, and if the pile
    // later drops away it sinks back down with it, but never below where it floated to.
    // The short delays stop it reacting to a piece just passing through or wobbling.
    const want = Math.max(h.y0, surfAt(h.x) + SIT);
    if (h.st === 'lift') { // floating gently up off the pile, turning level
      h.rot -= h.rot * Math.min(1, dt * 3);
      const d = want - h.y;
      h.y += Math.min(d, Math.max(0.3 * U, Math.min(LIFT, d * 2)) * dt);
      if (d <= 1) { h.y = Math.max(h.y, want); h.st = null; h.rot = 0; }
      continue;
    }
    h.up = want > h.y + 1 ? h.up + dt : 0;
    h.down = want < h.y - 1 ? h.down + dt : 0;
    if (h.up > 0.5) h.y = Math.min(want, h.y + 4 * U * dt);
    else if (h.down > 0.5) h.y = Math.max(want, h.y - 3 * U * dt);
  }
  world.hay = world.hay.filter(h => !h.eaten || h.pop > 0);
  trail.wait = Math.max(0, trail.wait - dt);
}

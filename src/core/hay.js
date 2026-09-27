// Hay: Sadie's snacks (she thought she was a cow). A short trail of bundles is always out.
// When she eats one, a new one appears further along the trail, which runs back and forth
// across the board, so she grazes her way around without a long wait for the next bite.
// Bundles appear a little above the pile where they land, so they keep up as the tower grows.
// They ride the pile up if covered, and back down (never below where they appeared) if the
// pile falls away.
import { U, W } from '../config.js';
import { world } from './world.js';
import { surfAt } from './surface.js';

export const HAY_OUT = 3;                         // bundles out at once
export const STEP_MIN = 10 * U, STEP_MAX = 18 * U; // sideways gap from the previous bundle
// how far above the pile a new bundle appears: always out of reach, so Sadie needs some help
export const RISE_MIN = 1.5 * U, RISE_MAX = 4.5 * U;
export const SIT = 0.7 * U;                       // how high a bundle sits above the pile
const EDGE = 1.5 * U;                             // keep away from the walls
export const trail = { x: W / 2, dir: 1 }; // where the last bundle was placed, and which way the trail is heading

function placeNext() {
  let x = trail.x + trail.dir * (STEP_MIN + Math.random() * (STEP_MAX - STEP_MIN));
  if (x < EDGE || x > W - EDGE) { // hit a wall: turn around and head back
    trail.dir = -trail.dir;
    x = trail.x + trail.dir * (STEP_MIN + Math.random() * (STEP_MAX - STEP_MIN));
    x = Math.min(W - EDGE, Math.max(EDGE, x));
  }
  trail.x = x;
  const y = surfAt(x) + SIT + RISE_MIN + Math.random() * (RISE_MAX - RISE_MIN);
  world.hay.push({ x, y, y0: y, eaten: false, pop: 0, up: 0, down: 0 });
}

export function resetHay(startX) {
  world.hay = []; world.hayEaten = 0;
  trail.x = startX; trail.dir = Math.random() < 0.5 ? -1 : 1;
  for (let i = 0; i < HAY_OUT; i++) placeNext();
}

export function eatHay(h) {
  h.eaten = true; h.pop = 1; world.hayEaten++;
  placeNext();
}

export function updateHay(dt) {
  for (const h of world.hay) {
    if (h.eaten) { h.pop -= dt * 2.5; continue; } // short munch animation, then it's gone
    // Hay rides the pile: if pieces cover it, it floats up to sit on top, and if the pile
    // later drops away it sinks back down with it, but never below where it appeared.
    // The short delays stop it reacting to a piece just passing through or wobbling.
    const want = Math.max(h.y0, surfAt(h.x) + SIT);
    h.up = want > h.y + 1 ? h.up + dt : 0;
    h.down = want < h.y - 1 ? h.down + dt : 0;
    if (h.up > 0.5) h.y = Math.min(want, h.y + 4 * U * dt);
    else if (h.down > 0.5) h.y = Math.max(want, h.y - 3 * U * dt);
  }
  world.hay = world.hay.filter(h => !h.eaten || h.pop > 0);
}

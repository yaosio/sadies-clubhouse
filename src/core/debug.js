// Debug helpers, for us, not for players (they live in the dev sheet): rain lots of pieces at
// once, run the game faster, and make Sadie and Chooter do things right now instead of waiting.
// Nothing here uses random numbers unless a button was pressed, so the seeded tests don't move.
import { U, W, tuning } from '../config.js';
import { world } from './world.js';
import { SHAPES } from './physics/pieceTypes.js';
import { makePiece } from './physics/body.js';
import { localTop, groundAt, highestPoint } from './surface.js';
import { sadie, pickTarget, startTrip } from './sadie/brain.js';
import { releaseBarn } from './barn.js';
import { chooter, meetChooter } from './friends/chooter.js';

export const SPEEDS = [1, 2, 4, 8];
const RAIN_EVERY = 0.08;     // seconds between raining pieces (about 12 a second)
const PILE_EVERY = 0.6;      // a tall pile needs each piece to mostly settle before the next
const FAST_PILE = 8;         // speed while building a tall pile
const PILE_PIECES = 110;     // enough for a mound about 16 blocks tall
// rain: x spots still to drop on; speed: chosen game speed; boost: building a pile at FAST_PILE
export const debug = { rain: [], rainT: 0, rainEvery: RAIN_EVERY, speed: 1, boost: false, boostT: 0 };

// How many simulation steps to run per normal step.
export const gameSpeed = () => debug.boost ? Math.max(debug.speed, FAST_PILE) : debug.speed;

// Queue up n pieces to rain down between x0 and x1 (world px), a few at a time.
export function rainPieces(n, x0 = U, x1 = W - U, every = RAIN_EVERY) {
  for (let k = 0; k < n; k++) debug.rain.push(x0 + Math.random() * (x1 - x0));
  debug.rainEvery = every;
}
// A tall mound where the dropper is: pieces one after another on the same spot, at high speed.
export function buildPile(x) {
  rainPieces(PILE_PIECES, Math.max(U, x - U), Math.min(W - U, x + U), PILE_EVERY);
  debug.boost = true; debug.boostT = 0;
}
export function stopRain() { debug.rain.length = 0; debug.boost = false; }

// Drop the next queued piece a few blocks above the pile, unless something is still falling
// right there (then wait a moment rather than drop it into another piece).
function rainOne() {
  const types = Object.keys(SHAPES), type = types[Math.floor(Math.random() * types.length)];
  const x = Math.min(W - 2.2 * U, Math.max(2.2 * U, debug.rain[debug.rain.length - 1]));
  const y = localTop(x - 2.5 * U, x + 2.5 * U) + 4 * U;
  for (const p of world.pieces) if (p.maxX > x - 2.5 * U && p.minX < x + 2.5 * U && p.maxY > y - 2.5 * U && p.minY < y + 2.5 * U) return;
  debug.rain.pop();
  world.pieces.push(makePiece(type, U * tuning.set.size, x, y, Math.floor(Math.random() * 4) * Math.PI / 2));
}

export function updateDebug(dt) {
  if (debug.rain.length) {
    debug.rainT -= dt;
    if (debug.rainT <= 0) { debug.rainT = debug.rainEvery; rainOne(); }
  } else if (debug.boost) { // the pile is done: let it settle, then back to normal speed
    debug.boostT += dt;
    if (debug.boostT > 4) debug.boost = false;
  }
}

// ---------- Sadie ----------
// Put her on the highest point of the pile (she stops any trip home first).
export function sadieToTop() {
  if (sadie.trip) { releaseBarn(); sadie.trip = null; sadie.heave = false; }
  sadie.x = Math.min(W - 0.5 * U, Math.max(0.5 * U, highestPoint()));
  sadie.y = groundAt(sadie.x, 1e9); sadie.vy = 0; sadie.state = 'walk'; sadie.scared = 0;
  pickTarget();
}
// Go and fetch her barn now, even if it doesn't need it yet.
export function fetchBarnNow() { if (!sadie.trip) startTrip(); }

// ---------- Chooter ----------
export function meetChooterNow() { if (!chooter.met) meetChooter(); }
// Next time he's free, he gets the zoomies (coming out of the barn first if he's home).
export function zoomiesNow() { if (!chooter.met) return; chooter.zoomT = 0; if (chooter.place === 'home') chooter.homeT = 0; }
export function goHomeNow() { if (chooter.met && chooter.place === 'out') chooter.outT = 0; }
export function comeOutNow() { if (chooter.met && chooter.place === 'home') chooter.homeT = 0; }

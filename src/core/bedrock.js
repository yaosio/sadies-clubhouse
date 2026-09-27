// Bedrock: fossils buried deep enough melt under the weight of the whole tower above them and fuse
// into solid candy rock. They stop being pieces at all and become part of the floor (a heightmap,
// `rock` in core/surface.js), which the camera can't look below. That's what lets the tower grow
// forever: however tall it gets, only the top part of it is still pieces.
//
// The rock's top follows the shape of what melted into it, smoothed so it's never steeper than 45°
// (a gentle floor for anything that ever falls that far). Smoothing only ever lowers it, so it
// never pokes up into anything above it.
//
// Nothing random happens here, so the seeded tests stay the same until something melts.
import { U } from '../config.js';
import { world } from './world.js';
import { surf, rock, rockAt, rockInfo, SURF_N, SURF_RES } from './surface.js';
import { spark } from './effects.js';

export const MELT_DEPTH = 12 * U;       // how far under the pile's surface a fossil must be (everywhere across it)
const CHECK_EVERY = 0.5;                // seconds between checks
const SLOPE = SURF_RES;                 // the rock rises at most this much per sample: 45°
const CLEAR = 0.5 * U;                  // nothing that can still move may be this close under a melting piece
const MAX_FLECKS = 300;                 // bits of color left in the rock by what melted

// melted: how many pieces melted in all; lastMelt: game time of the last melt (the mole notices);
// flecks: [x, y, color] specks of what melted, for drawing
export const bedrock = { melted: 0, lastMelt: -1e9, flecks: [] };
let checkT = 0;

export function resetBedrock() {
  rock.fill(0); rockInfo.low = rockInfo.high = 0;
  bedrock.melted = 0; bedrock.lastMelt = -1e9; bedrock.flecks = [];
}
// After loading a save: put the rock back.
export function setBedrock(heights, melted, flecks) {
  resetBedrock();
  if (heights && heights.length === SURF_N) for (let i = 0; i < SURF_N; i++) rock[i] = Math.max(0, +heights[i] || 0);
  bedrock.melted = melted || 0;
  bedrock.flecks = Array.isArray(flecks) ? flecks.slice(-MAX_FLECKS) : [];
  rockLimits();
}
function rockLimits() {
  let lo = Infinity, hi = 0;
  for (let i = 0; i < SURF_N; i++) { if (rock[i] < lo) lo = rock[i]; if (rock[i] > hi) hi = rock[i]; }
  rockInfo.low = lo; rockInfo.high = hi;
}

// lowest point of the pile's surface across this piece
function coverAbove(p) {
  const i0 = Math.max(0, Math.floor(p.minX / SURF_RES)), i1 = Math.min(SURF_N - 1, Math.ceil(p.maxX / SURF_RES));
  let low = Infinity;
  for (let i = i0; i <= i1; i++) if (surf[i] < low) low = surf[i];
  return low;
}
// raise `top` to this piece's upper outline, column by column
function traceTop(p, top) {
  const b = p.T.bnd, m = b.length, X = p.x, Y = p.y;
  for (let q = 0; q < m; q++) {
    const a = b[q], c = b[q + 1 === m ? 0 : q + 1];
    let x0 = X[a], y0 = Y[a], x1 = X[c], y1 = Y[c];
    if (x0 > x1) { let t = x0; x0 = x1; x1 = t; t = y0; y0 = y1; y1 = t; }
    const i0 = Math.max(0, Math.ceil(x0 / SURF_RES)), i1 = Math.min(SURF_N - 1, Math.floor(x1 / SURF_RES));
    for (let i = i0; i <= i1; i++) {
      const t = x1 > x0 ? (i * SURF_RES - x0) / (x1 - x0) : 0, y = y0 + (y1 - y0) * t;
      if (y > top[i]) top[i] = y;
    }
  }
}
const top = new Float64Array(SURF_N);

export function updateBedrock(dt) {
  checkT += dt;
  if (checkT < CHECK_EVERY) return;
  checkT = 0;
  // everything that could still move (and the barn): nothing melts over them
  const live = world.pieces.filter(p => !p.fossil);
  const melt = [];
  for (const p of world.pieces) {
    if (!p.fossil || coverAbove(p) - p.maxY < MELT_DEPTH) continue;
    let blocked = false;
    for (const q of live) if (q.maxX > p.minX - CLEAR && q.minX < p.maxX + CLEAR && q.minY < p.maxY + CLEAR) { blocked = true; break; }
    if (!blocked) melt.push(p);
  }
  if (!melt.length) return;
  top.set(rock);
  for (const p of melt) traceTop(p, top);
  // pieces pressed against a wall reach it, even if their outline stops a hair short
  top[0] = Math.max(top[0], top[1]); top[SURF_N - 1] = Math.max(top[SURF_N - 1], top[SURF_N - 2]);
  // no steeper than 45°: the highest floor under `top` that's never steeper than that
  for (let i = 1; i < SURF_N; i++) if (top[i] > top[i - 1] + SLOPE) top[i] = top[i - 1] + SLOPE;
  for (let i = SURF_N - 2; i >= 0; i--) if (top[i] > top[i + 1] + SLOPE) top[i] = top[i + 1] + SLOPE;
  for (let i = 0; i < SURF_N; i++) if (top[i] > rock[i]) rock[i] = top[i];
  rockLimits();
  // gone into the rock: what melted, and any fossil now completely under it
  const gone = new Set(melt);
  for (const p of world.pieces) {
    if (!p.fossil || gone.has(p) || p.minY > rockInfo.high) continue;
    let under = true;
    for (const i of p.T.bnd) if (p.y[i] > rockAt(p.x[i]) + 0.05 * U) { under = false; break; }
    if (under) gone.add(p);
  }
  for (const p of gone) {
    for (const m of p.T.shine) { // a fleck of its color stays in the rock, and it glimmers as it fuses
      const x = p.x[m], y = Math.min(p.y[m], rockAt(x) - 0.2 * U);
      bedrock.flecks.push([Math.round(x), Math.round(y), p.color]);
    }
    const cx = (p.minX + p.maxX) / 2;
    spark(cx, rockAt(cx) + 0.1 * U, 0, 30, 3, 0.9, '#fff3c4');
  }
  if (bedrock.flecks.length > MAX_FLECKS) bedrock.flecks.splice(0, bedrock.flecks.length - MAX_FLECKS);
  world.pieces = world.pieces.filter(p => !gone.has(p));
  world.fossils -= gone.size;
  bedrock.melted += gone.size; bedrock.lastMelt = world.gameTime;
}

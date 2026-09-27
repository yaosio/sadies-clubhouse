// Reading the shape of the pile: a heightmap (for the minimap, hay and dropper) and exact
// solid spans in a vertical slice (so Sadie can tell a floor from an overhang above her head).
// Also the top of the bedrock (core/bedrock.js melts the deepest pieces into it): the real floor.
import { U, W } from '../config.js';
import { world } from './world.js';

// ---------- surface (top outline of the pile) ----------
export const SURF_RES = U / 4, SURF_N = Math.ceil(W / SURF_RES) + 1;
export const surf = new Float64Array(SURF_N);
// ---------- bedrock (the floor: 0 everywhere until pieces start melting into it) ----------
export const rock = new Float64Array(SURF_N);
export const rockInfo = { low: 0, high: 0 }; // its lowest and highest points (bedrock.js keeps these up to date)
export function rockAt(x) {
  const f = Math.min(SURF_N - 1.001, Math.max(0, x / SURF_RES)), i = Math.floor(f), t = f - i;
  return rock[i] * (1 - t) + rock[i + 1] * t;
}
// highest point of the bedrock between x0 and x1
export function rockTop(x0, x1) {
  if (rockInfo.high === 0) return 0;
  const i0 = Math.max(0, Math.floor(x0 / SURF_RES)), i1 = Math.min(SURF_N - 1, Math.ceil(x1 / SURF_RES));
  let h = 0; for (let i = i0; i <= i1; i++) if (rock[i] > h) h = rock[i];
  return h;
}

export function computeSurface() {
  surf.set(rock);
  for (const p of world.pieces) {
    if (!isGround(p)) continue; // pieces still moving (falling, bouncing) don't count as ground yet
    const b = p.T.bnd, m = b.length, X = p.x, Y = p.y;
    for (let q = 0; q < m; q++) {
      const a = b[q], c = b[q + 1 === m ? 0 : q + 1];
      let x0 = X[a], y0 = Y[a], x1 = X[c], y1 = Y[c];
      if (x0 > x1) { let t = x0; x0 = x1; x1 = t; t = y0; y0 = y1; y1 = t; }
      const i0 = Math.max(0, Math.ceil(x0 / SURF_RES)), i1 = Math.min(SURF_N - 1, Math.floor(x1 / SURF_RES));
      for (let i = i0; i <= i1; i++) {
        const t = x1 > x0 ? (i * SURF_RES - x0) / (x1 - x0) : 0, y = y0 + (y1 - y0) * t;
        if (y > surf[i]) surf[i] = y;
      }
    }
  }
}
export function surfAt(x) {
  const f = Math.min(SURF_N - 1.001, Math.max(0, x / SURF_RES)), i = Math.floor(f), t = f - i;
  return surf[i] * (1 - t) + surf[i + 1] * t;
}

// What's solid in a vertical slice at x: merged [bottom, top] spans of settled pieces plus the ground.
// Lets the climber tell a floor it can step onto from an overhang it should walk under.
export const STEP_UP = 0.5 * U;
// Ground = settled or just jiggling. Uses a smoothed speed so a ball pausing at the top of a bounce doesn't count.
export function isGround(p) { return p.asleep || (p.age > 0.4 && p.avgSpeed < 0.6); }
export function column(x) {
  const iv = [[-1e9, rockInfo.high === 0 ? 0 : rockAt(x)]];
  for (const p of world.pieces) {
    if (x < p.minX || x > p.maxX || !isGround(p)) continue;
    const b = p.T.bnd, m = b.length, X = p.x, Y = p.y, ys = [];
    for (let q = 0; q < m; q++) {
      const i = b[q], j = b[q + 1 === m ? 0 : q + 1];
      if ((X[i] <= x) !== (X[j] <= x)) ys.push(Y[i] + (Y[j] - Y[i]) * (x - X[i]) / (X[j] - X[i]));
    }
    ys.sort((u, v) => u - v);
    for (let k = 0; k + 1 < ys.length; k += 2) iv.push([ys[k], ys[k + 1]]);
  }
  iv.sort((u, v) => u[0] - v[0]);
  const out = [iv[0].slice()];
  for (let k = 1; k < iv.length; k++) {
    const last = out[out.length - 1];
    if (iv[k][0] <= last[1] + 0.25 * U) last[1] = Math.max(last[1], iv[k][1]); else out.push(iv[k].slice());
  }
  return out;
}
// highest surface the climber (feet at y) is standing on or pressed against; things above its head don't count
export function groundAt(x, y) {
  let g = 0;
  for (const [bot, top] of column(x)) if (bot <= y + STEP_UP && top > g) g = top;
  return g;
}

export function localTop(x0, x1) {
  let t = 0;
  for (const p of world.pieces) {
    if (p.maxX < x0 || p.minX > x1 || p.maxY <= t) continue;
    const b = p.T.bnd;
    for (let q = 0; q < b.length; q++) { const i = b[q]; if (p.x[i] >= x0 && p.x[i] <= x1 && p.y[i] > t) t = p.y[i]; }
  }
  return t;
}
export function highestPoint() {
  let best = -1, bx = W / 2;
  for (const p of world.pieces) { if (p.maxY <= best) continue; const b = p.T.bnd;
    for (let q = 0; q < b.length; q++) { const i = b[q]; if (p.y[i] > best) { best = p.y[i]; bx = p.x[i]; } } }
  return bx;
}

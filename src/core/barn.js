// Sadie's barn: her home (and, one day, her friends' too). It's a solid building that sits in the
// pile like a piece: pieces land on it, pile up around it and bury it, and Sadie can stand on its
// roof. It never tips or gets knocked around. The solver treats it as fixed, and only this module
// moves it: either dragged along behind Sadie (she hauls it up to the top of the pile, shoving
// pieces out of the way), or dropping onto whatever is under it when she lets go.
import { U, W } from '../config.js';
import { world } from './world.js';
import { surf, SURF_N, SURF_RES } from './surface.js';
import { wake } from './physics/solver.js';
import { aabb } from './physics/body.js';

export const BARN_HALF = 2 * U;       // half its width
export const BARN_SPEED = 2.5 * U;    // how fast it moves when dragged, per second
const FALL_G = 1400, FALL_MAX = 10 * U;
// Its outline in blocks, bottom center at 0,0: walls, then a barn-style roof with a bend in it.
export const OUTLINE = [[-2, 0], [2, 0], [2, 2.4], [1.45, 3.35], [0, 3.9], [-1.45, 3.35], [-2, 2.4]];

export const barn = { piece: null, hauling: false, gx: 0, gy: 0, ty: 0, vy: 0 };

function makeBarn(cx) {
  const rx = [], ry = [];
  for (let k = 0; k < OUTLINE.length; k++) { // points every half block or so along the outline
    const [ax, ay] = OUTLINE[k], [bx, by] = OUTLINE[(k + 1) % OUTLINE.length];
    const segs = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / 0.5));
    for (let s = 0; s < segs; s++) { rx.push((ax + (bx - ax) * s / segs) * U); ry.push((ay + (by - ay) * s / segs) * U); }
  }
  const n = rx.length;
  const T = { type: 'barn', cs: U, n, rx: Float64Array.from(rx), ry: Float64Array.from(ry), bnd: Int32Array.from(rx, (_, i) => i),
    clusters: [], gIdx: new Int32Array(0), gqx: new Float64Array(0), gqy: new Float64Array(0), shine: [], shineScale: 1 };
  const p = { id: 0, type: 'barn', T, n, color: '#c8463d', mat: { kMul: 1, bendMul: 1, invMass: 0, bounce: 0, drag: 1, grip: 1.2 },
    x: new Float64Array(n), y: new Float64Array(n), px: new Float64Array(n), py: new Float64Array(n),
    minX: 0, maxX: 0, minY: 0, maxY: 0, speed: 0, rest: 0, still: 0, asleep: true, fixed: true, kvx: 0, kvy: 0,
    cnx: 0, cny: 0, cc: 0, v0x: 0, v0y: 0, age: 99, avgSpeed: 0 };
  for (let i = 0; i < n; i++) { p.x[i] = p.px[i] = cx + rx[i]; p.y[i] = p.py[i] = ry[i]; }
  aabb(p);
  return p;
}

// A fresh barn standing on the ground (call after clearing world.pieces).
export function resetBarn(x) {
  barn.piece = makeBarn(x); barn.hauling = false; barn.vy = 0;
  world.pieces.push(barn.piece);
}

export const barnX = () => (barn.piece.minX + barn.piece.maxX) / 2;
export const barnFloor = () => barn.piece.minY;

// How deep it's buried: the lowest point of the pile's surface across its width, measured from the
// top of its roof. Below zero means some of the roof still shows.
export function barnCover() {
  const p = barn.piece;
  const i0 = Math.max(0, Math.ceil(p.minX / SURF_RES)), i1 = Math.min(SURF_N - 1, Math.floor(p.maxX / SURF_RES));
  let low = Infinity;
  for (let i = i0; i <= i1; i++) if (surf[i] < low) low = surf[i];
  return low - p.maxY;
}

// Sadie is about to drag it out: wake everything piled on top so it can be shoved aside.
export function freeBarn() {
  const B = barn.piece;
  for (const p of world.pieces) {
    if (p === B || p.maxX < B.minX - U || p.minX > B.maxX + U || p.maxY < B.minY) continue;
    p.fossil = false; wake(p); p.rest = 0;
  }
}
// Drag it toward this spot (its bottom middle). It rides over anything under its floor rather
// than being pulled down into the pile, so dragging it downhill it slides down the slope.
export function haulBarn(gx, gy) {
  if (!barn.hauling) barn.ty = barn.piece.minY;
  barn.hauling = true;
  barn.gx = Math.min(W - BARN_HALF, Math.max(BARN_HALF, gx));
  barn.gy = gy;
}
export function releaseBarn() { barn.hauling = false; barn.vy = 0; }
// how far the barn still is from where it's being dragged to
export function barnLag() { return barn.hauling ? Math.hypot(barn.gx - barnX(), barn.ty - barn.piece.minY) : 0; }

// Highest point of anything under the barn's floor (or the ground).
function support(B) {
  const x0 = B.minX, x1 = B.maxX, lim = B.minY + 0.3 * U;
  let s = 0;
  for (const q of world.pieces) {
    if (q === B || q.maxX < x0 || q.minX > x1 || q.minY > lim) continue;
    const b = q.T.bnd;
    for (let k = 0; k < b.length; k++) { const i = b[k], y = q.y[i]; if (y > s && y <= lim && q.x[i] >= x0 && q.x[i] <= x1) s = y; }
  }
  return s;
}

// Sets the barn's speed for the next physics step.
export function updateBarn(dt) {
  const B = barn.piece; if (!B) return;
  if (barn.hauling) {
    barn.ty = Math.max(barn.gy, support(B));
    const dx = barn.gx - barnX(), dy = barn.ty - B.minY, d = Math.hypot(dx, dy);
    const v = Math.min(BARN_SPEED, d / dt);
    B.kvx = d > 1e-6 ? dx / d * v : 0; B.kvy = d > 1e-6 ? dy / d * v : 0;
    return;
  }
  // let go: drop onto whatever is under it, landing without a bounce
  B.kvx = 0;
  const s = support(B);
  if (B.minY > s + 0.5) { barn.vy = Math.max(-FALL_MAX, barn.vy - FALL_G * dt); B.kvy = Math.max(barn.vy, (s - B.minY) / dt); }
  else { barn.vy = 0; B.kvy = 0; }
}

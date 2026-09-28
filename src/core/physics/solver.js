// The soft-body solver: Verlet integration, per-block shape matching, piece-vs-piece collisions,
// walls and floor, whole-body bounce, and sleeping. Pure math: no drawing, no DOM.
import { U, W, SUBSTEPS, ITERS } from '../../config.js';
import { aabb } from './body.js';

function shapeMatch(P, idx, qx, qy, k) {
  const m = idx.length, X = P.x, Y = P.y;
  let cx = 0, cy = 0;
  for (let i = 0; i < m; i++) { cx += X[idx[i]]; cy += Y[idx[i]]; }
  cx /= m; cy /= m;
  let a = 0, b = 0;
  for (let i = 0; i < m; i++) { const dx = X[idx[i]] - cx, dy = Y[idx[i]] - cy; a += qx[i] * dy - qy[i] * dx; b += qx[i] * dx + qy[i] * dy; }
  const r = Math.hypot(a, b); if (r < 1e-9) return;
  const c = b / r, s = a / r;
  for (let i = 0; i < m; i++) {
    const j = idx[i];
    const gx = cx + c * qx[i] - s * qy[i], gy = cy + s * qx[i] + c * qy[i];
    X[j] += (gx - X[j]) * k; Y[j] += (gy - Y[j]) * k;
  }
}

// Push boundary points of A out of polygon B. With stick > 0, points hovering just
// outside B's surface (and moving slowly relative to it) get pulled onto it.
const STICK_DIST = U * 0.18;
function collide(A, B, mu, wA, wB, stick) {
  const bnd = A.T.bnd, poly = B.T.bnd, m = poly.length;
  const AX = A.x, AY = A.y, BX = B.x, BY = B.y;
  const e = stick > 0 ? STICK_DIST : 0;
  for (let q = 0; q < bnd.length; q++) {
    const i = bnd[q], X = AX[i], Y = AY[i];
    if (X < B.minX - e || X > B.maxX + e || Y < B.minY - e || Y > B.maxY + e) continue;
    let inside = false;
    for (let k = 0, j = m - 1; k < m; j = k++) {
      const yi = BY[poly[k]], yj = BY[poly[j]];
      if ((yi > Y) !== (yj > Y)) {
        const xi = BX[poly[k]], xj = BX[poly[j]];
        if (X < (xj - xi) * (Y - yi) / (yj - yi) + xi) inside = !inside;
      }
    }
    if (!inside && e === 0) continue;
    let best = Infinity, be = 0, bt = 0, bcx = 0, bcy = 0;
    for (let k = 0; k < m; k++) {
      const a = poly[k], b = poly[k + 1 === m ? 0 : k + 1];
      const ax = BX[a], ay = BY[a], ex = BX[b] - ax, ey = BY[b] - ay, l2 = ex * ex + ey * ey;
      let t = l2 > 0 ? ((X - ax) * ex + (Y - ay) * ey) / l2 : 0; t = t < 0 ? 0 : t > 1 ? 1 : t;
      const cx = ax + ex * t, cy = ay + ey * t, d = (cx - X) * (cx - X) + (cy - Y) * (cy - Y);
      if (d < best) { best = d; be = k; bt = t; bcx = cx; bcy = cy; }
    }
    const ea = poly[be], eb = poly[be + 1 === m ? 0 : be + 1];
    const t = bt, u = 1 - t;
    const vax = AX[i] - A.px[i], vay = AY[i] - A.py[i];
    const vbx = (BX[ea] - B.px[ea]) * u + (BX[eb] - B.px[eb]) * t;
    const vby = (BY[ea] - B.py[ea]) * u + (BY[eb] - B.py[eb]) * t;
    let pull = 1, fr = mu;
    if (!inside) {
      if (best > e * e) continue;
      const rvx = vax - vbx, rvy = vay - vby;
      if (rvx * rvx + rvy * rvy > 0.25) continue; // moving fast: no glue, let it bounce
      pull = stick * 0.35; fr = Math.min(1, mu + stick * 0.5);
    }
    const dx = (bcx - X) * pull, dy = (bcy - Y) * pull;
    const lam = 1 / (wA + wB * (u * u + t * t));
    const la = lam * wA, lb = lam * wB;
    AX[i] += dx * la; AY[i] += dy * la;
    BX[ea] -= dx * lb * u; BY[ea] -= dy * lb * u;
    BX[eb] -= dx * lb * t; BY[eb] -= dy * lb * t;
    const len = Math.sqrt(best); if (len < 1e-6) continue;
    const nx = (bcx - X) / len, ny = (bcy - Y) / len, tx = -ny, ty = nx;
    if (inside && la > 0 && A.mat.bounce > 0) { A.cnx += nx; A.cny += ny; A.cc++; }
    if (inside && lb > 0 && B.mat.bounce > 0) { B.cnx -= nx; B.cny -= ny; B.cc++; }
    if (fr <= 0) continue;
    const f = ((vax - vbx) * tx + (vay - vby) * ty) * fr;
    const fa = f * la, fb = f * lb;
    A.px[i] += tx * fa; A.py[i] += ty * fa;
    B.px[ea] -= tx * fb * u; B.py[ea] -= ty * fb * u;
    B.px[eb] -= tx * fb * t; B.py[eb] -= ty * fb * t;
  }
}

// The floor is the bedrock (a heightmap, `floor`, one height every `res` px; see core/bedrock.js),
// or flat ground at 0 without one. Points just under it are pushed straight up. A point further
// under it than STEP, or where the bedrock is steeper than 45°, has run into the side of a step in
// it: it's pushed out sideways to the nearest open side (within SIDE), like off a wall, instead of
// being lifted up on top of the step (which would fling the whole piece into the air).
const STEP = U * 0.25, SIDE = U * 1.5;
const floorAt = (floor, res, x) => { const f = Math.min(floor.length - 1.001, Math.max(0, x / res)), k = Math.floor(f), t = f - k; return floor[k] * (1 - t) + floor[k + 1] * t; };
// how far to go from x in direction d (+1/-1) to reach a spot where the floor is below y (Infinity if not within SIDE)
function sideOut(floor, res, x, y, d) {
  let prev = x;
  for (let s = res / 2; s <= SIDE; s += res / 2) {
    const q = x + d * s;
    if (q < 0 || q > W) return Infinity;
    if (floorAt(floor, res, q) <= y) {
      let a = prev, b = q; // refine: a is inside the step, b is out
      for (let k = 0; k < 6; k++) { const m = (a + b) / 2; if (floorAt(floor, res, m) <= y) b = m; else a = m; }
      return Math.abs(b - x);
    }
    prev = q;
  }
  return Infinity;
}
function bounds(p, mu, floor, res) {
  const n = p.n, X = p.x, Y = p.y, PX = p.px, PY = p.py, gf = 1 - Math.min(1, mu * 1.1), wf = 1 - mu * 0.5, e = p.mat.bounce > 0;
  for (let i = 0; i < n; i++) {
    const g = floor ? floorAt(floor, res, X[i]) : 0;
    if (floor && Y[i] < g && (g - Y[i] > STEP || Math.abs(floorAt(floor, res, X[i] + res / 2) - floorAt(floor, res, X[i] - res / 2)) > res)) {
      const l = sideOut(floor, res, X[i], Y[i], -1), r = sideOut(floor, res, X[i], Y[i], 1);
      if (l < Infinity || r < Infinity) {
        const d = l <= r ? -1 : 1;
        X[i] += d * Math.min(l, r); PX[i] = X[i]; PY[i] = Y[i] - (Y[i] - PY[i]) * wf;
        if (e) { p.cnx += d; p.cc++; }
        continue;
      }
    }
    if (Y[i] < g) { Y[i] = g; PX[i] = X[i] - (X[i] - PX[i]) * gf; if (e) { p.cny += 1; p.cc++; } }
    if (X[i] < 0) { X[i] = 0; PY[i] = Y[i] - (Y[i] - PY[i]) * wf; if (e) { p.cnx += 1; p.cc++; } }
    else if (X[i] > W) { X[i] = W; PY[i] = Y[i] - (Y[i] - PY[i]) * wf; if (e) { p.cnx -= 1; p.cc++; } }
  }
}

// Sleeping: pieces that have been still for a while stop simulating and act as
// solid ground until something moving bumps into them. Keeps big towers fast.
// A piece is still below SLEEP_SPEED; below DRIFT_SPEED it's only trembling or creeping, which
// counts as half as still (it isn't going anywhere, and nobody watches a piece shiver for long).
// In a pile-up (more than CROWD pieces awake) still pieces nod off sooner: after
// SLEEP_TIME * CROWD / awake seconds, but never under SLEEP_MIN. The cost of a step goes up with
// every piece awake, so this keeps a big topple from bogging the game down, and it doesn't show:
// they were barely moving anyway.
const SLEEP_SPEED = 0.07, DRIFT_SPEED = 0.12, SLEEP_TIME = 1.2, WAKE_SPEED = 0.2, CROWD = 16, SLEEP_MIN = 0.3;
export const PSTATS = { pairs: 0, touching: 0 }; // profiling counters, reset by the game each frame
export function wake(p) { if (p.asleep && !p.fossil && !p.fixed) { p.asleep = false; p.still = 0; } } // fossils never wake (core/fossil.js)

// Fixed pieces (Sadie's barn, core/barn.js) never wake, tip or get pushed. They count as asleep,
// so they're solid to everything, but they can be moved on purpose: kvx/kvy is a speed in px per
// second, applied a little each substep so whatever it bumps gets shoved smoothly out of the way.
function moveFixed(p, h) {
  const dx = (p.kvx || 0) * h, dy = (p.kvy || 0) * h, X = p.x, Y = p.y, PX = p.px, PY = p.py;
  for (let i = 0; i < p.n; i++) { PX[i] = X[i]; PY[i] = Y[i]; X[i] += dx; Y[i] += dy; }
  if (dx || dy) aabb(p);
}

// Finding pairs that might touch. Sleepers don't move during a step, so they go into a grid
// once per step; awake pieces go into a second grid each time round (they move). Each awake piece
// only looks in the cells around it, in both. The pairs are then sorted into the same order as a
// plain "every piece against every piece" loop, so the results are exactly the same as checking
// everything, just without the wasted work (in a pile-up, 50 awake pieces are about 1,200 pairs
// to check but only a hundred or so are anywhere near each other).
const CELL = U * 2;
const grid = new Map(), awakeGrid = new Map();
let stamp = new Int32Array(0), stampId = 0, pairBuf = new Float64Array(1024), awakeIdx = new Int32Array(0);
const cellKey = (cx, cy) => cy * 4096 + cx;
function buildSleeperGrid(pieces) {
  for (const list of grid.values()) list.length = 0;
  for (let b = 0; b < pieces.length; b++) {
    const B = pieces[b]; if (!B.asleep) continue;
    const m = B.fixed ? 0.25 * U : 0; // a fixed piece can move a little during the step
    const x0 = Math.floor((B.minX - m) / CELL), x1 = Math.floor((B.maxX + m) / CELL), y0 = Math.floor((B.minY - m) / CELL), y1 = Math.floor((B.maxY + m) / CELL);
    for (let cy = y0; cy <= y1; cy++) for (let cx = x0; cx <= x1; cx++) {
      const k = cellKey(cx, cy); let list = grid.get(k);
      if (!list) { list = []; grid.set(k, list); }
      list.push(b);
    }
  }
}
function addPair(n, key) {
  if (n === pairBuf.length) { const nb = new Float64Array(n * 2); nb.set(pairBuf); pairBuf = nb; }
  pairBuf[n] = key;
  return n + 1;
}
// Returns how many candidate pairs are in pairBuf (each stored as a * N + b with a < b, sorted).
function findPairs(pieces, nAwake, ce) {
  const N = pieces.length; let n = 0;
  for (const list of awakeGrid.values()) list.length = 0;
  for (let i = 0; i < nAwake; i++) {
    const a = awakeIdx[i], A = pieces[a];
    const x0 = Math.floor(A.minX / CELL), x1 = Math.floor(A.maxX / CELL), y0 = Math.floor(A.minY / CELL), y1 = Math.floor(A.maxY / CELL);
    for (let cy = y0; cy <= y1; cy++) for (let cx = x0; cx <= x1; cx++) {
      const k = cellKey(cx, cy); let list = awakeGrid.get(k);
      if (!list) { list = []; awakeGrid.set(k, list); }
      list.push(a);
    }
  }
  for (let i = 0; i < nAwake; i++) {
    const a = awakeIdx[i], A = pieces[a];
    stampId++;
    const x0 = Math.floor((A.minX - ce) / CELL), x1 = Math.floor((A.maxX + ce) / CELL);
    const y0 = Math.floor((A.minY - ce) / CELL), y1 = Math.floor((A.maxY + ce) / CELL);
    for (let cy = y0; cy <= y1; cy++) for (let cx = x0; cx <= x1; cx++) {
      const k = cellKey(cx, cy);
      const list = grid.get(k);
      if (list) for (let q = 0; q < list.length; q++) {
        const b = list[q]; if (stamp[b] === stampId) continue;
        stamp[b] = stampId; PSTATS.pairs++;
        n = addPair(n, a < b ? a * N + b : b * N + a);
      }
      const near = awakeGrid.get(k); // other awake pieces: each pair once, from its lower-numbered piece
      if (near) for (let q = 0; q < near.length; q++) {
        const b = near[q]; if (b <= a || stamp[b] === stampId) continue;
        stamp[b] = stampId; PSTATS.pairs++;
        n = addPair(n, a * N + b);
      }
    }
  }
  pairBuf.subarray(0, n).sort();
  return n;
}
// floor/res: the bedrock heightmap (leave out for flat ground at 0)
export function physicsStep(pieces, P, dt, floor = null, res = 1) {
  const h = dt / SUBSTEPS, gh = P.g * h * h, maxV = U * 0.4, maxV2 = maxV * maxV;
  const N = pieces.length;
  // wake sleepers touched by moving neighbours (a fixed piece being moved counts as moving)
  for (let a = 0; a < N; a++) {
    const A = pieces[a]; if (A.fixed ? !(A.kvx || A.kvy) : A.asleep || A.speed < WAKE_SPEED) continue;
    const m = U * 0.3;
    for (let b = 0; b < N; b++) {
      const B = pieces[b]; if (!B.asleep || B.fossil) continue;
      if (A.maxX + m < B.minX || B.maxX + m < A.minX || A.maxY + m < B.minY || B.maxY + m < A.minY) continue;
      wake(B);
    }
  }
  // sleepers stay put for the whole step: grid them once
  if (stamp.length < N) stamp = new Int32Array(N * 2);
  if (awakeIdx.length < N) awakeIdx = new Int32Array(N * 2);
  let nAwake = 0;
  for (let a = 0; a < N; a++) if (!pieces[a].asleep) awakeIdx[nAwake++] = a;
  buildSleeperGrid(pieces);
  for (let s = 0; s < SUBSTEPS; s++) {
    for (let a = 0; a < N; a++) {
      const p = pieces[a];
      if (p.fixed) { moveFixed(p, h); continue; }
      if (p.asleep) continue;
      const n = p.n, X = p.x, Y = p.y, PX = p.px, PY = p.py, damp = 1 - (1 - P.damp) * p.mat.drag;
      for (let i = 0; i < n; i++) {
        let vx = (X[i] - PX[i]) * damp, vy = (Y[i] - PY[i]) * damp;
        const sp = vx * vx + vy * vy;
        if (sp > maxV2) { const f = maxV / Math.sqrt(sp); vx *= f; vy *= f; }
        PX[i] = X[i]; PY[i] = Y[i];
        X[i] += vx; Y[i] += vy + gh;
      }
      if (p.mat.bounce > 0) {
        let sx = 0, sy = 0; for (let i = 0; i < n; i++) { sx += X[i] - PX[i]; sy += Y[i] - PY[i]; }
        p.v0x = sx / n; p.v0y = sy / n; p.cnx = p.cny = p.cc = 0;
      }
    }
    const ce = P.stick > 0 ? STICK_DIST : 0;
    for (let it = 0; it < ITERS; it++) {
      for (let a = 0; a < N; a++) {
        const p = pieces[a]; if (p.asleep) continue;
        const cl = p.T.clusters, k = Math.min(0.95, P.k * p.mat.kMul), kb = Math.min(0.9, P.kb * p.mat.bendMul);
        for (let c = 0; c < cl.length; c++) shapeMatch(p, cl[c].idx, cl[c].qx, cl[c].qy, k);
        if (kb > 0) shapeMatch(p, p.T.gIdx, p.T.gqx, p.T.gqy, kb);
        aabb(p);
      }
      const nPairs = findPairs(pieces, nAwake, ce);
      for (let k = 0; k < nPairs; k++) {
        const key = pairBuf[k], a = Math.floor(key / N), b = key - a * N;
        const A = pieces[a], B = pieces[b];
        if (A.maxX + ce < B.minX || B.maxX + ce < A.minX || A.maxY + ce < B.minY || B.maxY + ce < A.minY) continue;
        PSTATS.touching++;
        const wa = A.asleep ? 0 : A.mat.invMass, wb = B.asleep ? 0 : B.mat.invMass;
        const last = it === ITERS - 1, mu = last ? Math.min(1, P.mu * Math.sqrt(A.mat.grip * B.mat.grip)) : 0, st = last ? P.stick : 0;
        collide(A, B, mu, wa, wb, st); collide(B, A, mu, wb, wa, st);
      }
      for (let a = 0; a < N; a++) if (!pieces[a].asleep) bounds(pieces[a], it === ITERS - 1 ? Math.min(1, P.mu * Math.sqrt(pieces[a].mat.grip)) : 0, floor, res);
    }
    // bouncy pieces: if they hit something this substep, send the whole body back out
    for (let a = 0; a < N; a++) {
      const p = pieces[a]; if (p.asleep || p.mat.bounce <= 0 || p.cc === 0) continue;
      const ln = Math.hypot(p.cnx, p.cny); if (ln < 1e-6) continue;
      const nx = p.cnx / ln, ny = p.cny / ln, vin = p.v0x * nx + p.v0y * ny;
      if (vin > -0.4) continue;
      let sx = 0, sy = 0; for (let i = 0; i < p.n; i++) { sx += p.x[i] - p.px[i]; sy += p.y[i] - p.py[i]; }
      const cur = (sx * nx + sy * ny) / p.n, want = -p.mat.bounce * vin;
      if (want <= cur) continue;
      const d = want - cur;
      for (let i = 0; i < p.n; i++) { p.px[i] -= nx * d; p.py[i] -= ny * d; }
      p.v0x = p.v0y = 0;
    }
  }
  const sleepAfter = nAwake > CROWD ? Math.max(SLEEP_MIN, SLEEP_TIME * CROWD / nAwake) : SLEEP_TIME;
  for (let a = 0; a < N; a++) {
    const p = pieces[a]; if (p.asleep) { p.speed = 0; continue; }
    const b = p.T.bnd; let sum = 0;
    for (let q = 0; q < b.length; q++) { const i = b[q]; sum += Math.abs(p.x[i] - p.px[i]) + Math.abs(p.y[i] - p.py[i]); }
    p.speed = sum / b.length;
    aabb(p);
    p.still = p.speed < SLEEP_SPEED ? p.still + dt : p.speed < DRIFT_SPEED ? p.still + dt / 2 : 0;
    if (p.still > sleepAfter) {
      p.asleep = true;
      for (let i = 0; i < p.n; i++) { p.px[i] = p.x[i]; p.py[i] = p.y[i]; }
    }
  }
}

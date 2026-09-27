// Rest shapes for pieces. Each block of a piece is a small lattice of points; the ball is rings.
// Templates are built once per (type, size) and shared by every piece of that kind.
import { SUB } from '../../config.js';
import { SHAPES } from './pieceTypes.js';

function buildBall(type, cs) {
  const R = 0.9 * cs, rx = [0], ry = [0];
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; rx.push(Math.cos(a) * R * 0.5); ry.push(Math.sin(a) * R * 0.5); }
  for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; rx.push(Math.cos(a) * R); ry.push(Math.sin(a) * R); }
  const n = rx.length, bnd = []; for (let i = 0; i < 16; i++) bnd.push(9 + i);
  const clusters = [];
  for (let sct = 0; sct < 8; sct++) {
    const idx = [0, 1 + sct, 1 + (sct + 1) % 8, 9 + 2 * sct, 9 + (2 * sct + 1) % 16, 9 + (2 * sct + 2) % 16];
    let cx = 0, cy = 0; for (const i of idx) { cx += rx[i]; cy += ry[i]; } cx /= idx.length; cy /= idx.length;
    clusters.push({ idx: Int32Array.from(idx), qx: Float64Array.from(idx.map(i => rx[i] - cx)), qy: Float64Array.from(idx.map(i => ry[i] - cy)), mid: 0 });
  }
  const gIdx = new Int32Array(n); for (let i = 0; i < n; i++) gIdx[i] = i;
  return { type, cs, n, rx: Float64Array.from(rx), ry: Float64Array.from(ry), bnd: Int32Array.from(bnd), clusters, gIdx,
    gqx: Float64Array.from(rx), gqy: Float64Array.from(ry), shine: [0], shineScale: 2.2 };
}

const TEMPLATES = new Map();
export function getTemplate(type, cs) {
  const key = type + '|' + cs.toFixed(2);
  if (TEMPLATES.has(key)) return TEMPLATES.get(key);
  if (type === 'ball') { const B = buildBall(type, cs); TEMPLATES.set(key, B); return B; }
  const cells = SHAPES[type];
  const idxMap = new Map(); const rx = [], ry = [];
  const pid = (gx, gy) => {
    const k = gx + ',' + gy; let i = idxMap.get(k);
    if (i === undefined) { i = rx.length; idxMap.set(k, i); rx.push(gx * cs / SUB); ry.push(gy * cs / SUB); }
    return i;
  };
  const clusterIdx = [];
  for (const [cx, cy] of cells) {
    const idx = [];
    for (let j = 0; j <= SUB; j++) for (let i = 0; i <= SUB; i++) idx.push(pid(cx * SUB + i, cy * SUB + j));
    clusterIdx.push(idx);
  }
  // boundary loop (counter-clockwise, y up)
  const subSet = new Set();
  for (const [cx, cy] of cells) for (let j = 0; j < SUB; j++) for (let i = 0; i < SUB; i++) subSet.add((cx*SUB+i) + ',' + (cy*SUB+j));
  const has = (x, y) => subSet.has(x + ',' + y);
  const next = new Map(); let first = null;
  for (const s of subSet) {
    const [x, y] = s.split(',').map(Number);
    const cand = [[x,y,x+1,y,x,y-1],[x+1,y,x+1,y+1,x+1,y],[x+1,y+1,x,y+1,x,y+1],[x,y+1,x,y,x-1,y]];
    for (const [sx, sy, ex, ey, nx, ny] of cand) {
      if (!has(nx, ny)) { next.set(sx + ',' + sy, ex + ',' + ey); if (first === null) first = sx + ',' + sy; }
    }
  }
  const bnd = []; let cur = first, guard = 0;
  do { const [gx, gy] = cur.split(',').map(Number); bnd.push(pid(gx, gy)); cur = next.get(cur); guard++; }
  while (cur !== first && guard < 2000);
  // center the rest shape
  const n = rx.length; let mx = 0, my = 0;
  for (let i = 0; i < n; i++) { mx += rx[i]; my += ry[i]; }
  mx /= n; my /= n;
  for (let i = 0; i < n; i++) { rx[i] -= mx; ry[i] -= my; }
  const clusters = clusterIdx.map(idx => {
    let cx = 0, cy = 0; for (const i of idx) { cx += rx[i]; cy += ry[i]; } cx /= idx.length; cy /= idx.length;
    return { idx: Int32Array.from(idx), qx: Float64Array.from(idx.map(i => rx[i] - cx)), qy: Float64Array.from(idx.map(i => ry[i] - cy)), mid: idx[(idx.length - 1) >> 1] };
  });
  const gIdx = new Int32Array(n); for (let i = 0; i < n; i++) gIdx[i] = i;
  const T = { type, cs, n, rx: Float64Array.from(rx), ry: Float64Array.from(ry), bnd: Int32Array.from(bnd), clusters, gIdx, gqx: Float64Array.from(rx), gqy: Float64Array.from(ry),
    shine: clusters.map(c => c.mid), shineScale: 1, speckle: type === 'boulder', holes: type === 'O', streak: type === 'I', dust: type === 'J' };
  TEMPLATES.set(key, T);
  return T;
}

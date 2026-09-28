// A live piece: its points (current and previous positions) plus bookkeeping the solver uses.
import { getTemplate } from './templates.js';
import { COLORS, matOf } from './pieceTypes.js';

let nextPieceId = 1;
// Fields other parts of the game fill in later. Every piece (and the barn, core/barn.js) starts
// with all of them, in the same order, so the browser sees one kind of object and keeps the
// physics code fast; a field added to only some pieces makes every piece slower to work with.
export const LATER = { age: 0, avgSpeed: undefined, fossil: false, kickT: undefined, hearSpeed: 0, spr: null, surfGen: 0 };
export function makePiece(type, cs, cx, cy, ang) {
  const T = getTemplate(type, cs), n = T.n;
  const p = { id: nextPieceId++, type, T, n, color: COLORS[type], mat: matOf(type),
    x: new Float64Array(n), y: new Float64Array(n), px: new Float64Array(n), py: new Float64Array(n),
    minX: 0, maxX: 0, minY: 0, maxY: 0, speed: 99, rest: 0, still: 0, asleep: false, fixed: false, kvx: 0, kvy: 0,
    cnx: 0, cny: 0, cc: 0, v0x: 0, v0y: 0, ...LATER };
  const c = Math.cos(ang), s = Math.sin(ang);
  for (let i = 0; i < n; i++) {
    p.x[i] = p.px[i] = cx + c * T.rx[i] - s * T.ry[i];
    p.y[i] = p.py[i] = cy + s * T.rx[i] + c * T.ry[i];
  }
  aabb(p);
  return p;
}

export function aabb(p) {
  const b = p.T.bnd; let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (let q = 0; q < b.length; q++) { const i = b[q], x = p.x[i], y = p.y[i];
    if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  p.minX = x0; p.maxX = x1; p.minY = y0; p.maxY = y1;
}

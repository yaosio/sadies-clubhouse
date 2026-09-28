// The 90s pixel look, built into the drawing: flat colors, and dot patterns (every other pixel,
// every fourth...) wherever one color fades into another. The dots are real big pixels, lined up
// with the screen, so they stay the same size whatever the camera does. No effect runs over the
// whole screen; each thing is drawn this way.
import { ctx, vp } from './view.js';

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const cache = new Map();
// A see-through pattern of `color`: `amount` of its pixels filled (1/4, 1/2 or 3/4), the rest clear.
export function dots(color, amount = 0.5) {
  const key = color + amount + '|' + vp.P;
  let pat = cache.get(key);
  if (!pat) {
    const c = document.createElement('canvas'); c.width = c.height = 4;
    const g = c.getContext('2d'); g.fillStyle = color;
    for (let i = 0; i < 16; i++) if (BAYER[i] < amount * 16) g.fillRect(i & 3, i >> 2, 1, 1);
    pat = ctx.createPattern(c, 'repeat'); pat.setTransform(new DOMMatrix([vp.P, 0, 0, vp.P, 0, 0]));
    cache.set(key, pat);
  }
  return pat;
}
// A screen position rounded to the big-pixel grid, so edges of bands are crisp.
export const snap = v => Math.round(v / vp.P) * vp.P;
// Fills x0..x1 from top to bottom with colors fading in dotted bands: each pair of neighbors gets
// solid, 1/4, 1/2 and 3/4 of the next color. tops[i] is where colors[i] starts (screen y, rising).
export function bands(x0, x1, tops, colors, bottom) {
  const w = x1 - x0;
  for (let i = 0; i < colors.length; i++) {
    const y0 = tops[i], y1 = i + 1 < colors.length ? tops[i + 1] : bottom;
    if (y1 <= y0) continue;
    const next = colors[i + 1];
    for (let q = 0; q < 4; q++) {
      const a = snap(y0 + (y1 - y0) * q / 4), b = snap(y0 + (y1 - y0) * (q + 1) / 4);
      if (b <= a || b < 0 || a > vp.vh) continue;
      ctx.fillStyle = colors[i]; ctx.fillRect(x0, a, w, b - a);
      if (q && next) { ctx.fillStyle = dots(next, q / 4); ctx.fillRect(x0, a, w, b - a); }
    }
  }
}

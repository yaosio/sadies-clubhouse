// Drawing a jelly piece as one gummy shape: smooth outline through its boundary points, a darker
// rim, a bright rim light along the bottom right, a dark outline in its own
// color, a white shine per block, and little decorations for some materials (sponge holes, ice
// streak, sugar dust, stone speckles). Lit from the top left, like everything else.
// A sleeping piece doesn't move, so it's drawn once into its own little picture and that's stamped
// every frame after (drawPiece): with a big tower, most pieces are asleep.
import { ctx, cam, vp, sxf, syf } from './view.js';
import { shade } from './color.js';
import { dots } from './pixels.js';

let sxBuf = new Float64Array(64), syBuf = new Float64Array(64);
function smoothPath(g, n) {
  g.beginPath();
  let mx = (sxBuf[n - 1] + sxBuf[0]) / 2, my = (syBuf[n - 1] + syBuf[0]) / 2;
  g.moveTo(mx, my);
  for (let i = 0; i < n; i++) {
    const j = i + 1 === n ? 0 : i + 1;
    g.quadraticCurveTo(sxBuf[i], syBuf[i], (sxBuf[i] + sxBuf[j]) / 2, (syBuf[i] + syBuf[j]) / 2);
  }
  g.closePath();
}
export function drawJelly(T, X, Y, color, alpha, g = ctx) {
  const b = T.bnd, n = b.length;
  if (sxBuf.length < n) { sxBuf = new Float64Array(n * 2); syBuf = new Float64Array(n * 2); }
  for (let q = 0; q < n; q++) { sxBuf[q] = sxf(X[b[q]]); syBuf[q] = syf(Y[b[q]]); }
  g.globalAlpha = alpha;
  const cs = T.cs * cam.z, P = vp.P, sc = T.shineScale;
  smoothPath(g, n);
  g.fillStyle = color; g.fill();
  g.save(); g.clip();
  g.lineWidth = cs * 0.7; g.strokeStyle = dots(shade(color, -0.2), 0.5); g.stroke(); // darker rim, dotted into
  g.lineWidth = cs * 0.4; g.strokeStyle = shade(color, -0.2); g.stroke();            // the lighter middle
  // rim light: the outline nudged up-left, so its bottom-right edges fall just inside the shape
  g.translate(-1.5 * P, -1.5 * P); g.lineWidth = P * 1.2; g.strokeStyle = shade(color, 0.55); g.stroke();
  g.restore();
  smoothPath(g, n);
  g.lineWidth = 2 * P; g.strokeStyle = shade(color, -0.6); g.stroke();
  // white gummy shine per block, with a pixel of sparkle beside it
  g.fillStyle = '#ffffff';
  for (const m of T.shine) {
    const sx = sxf(X[m]) - cs * 0.22 * sc, sy = syf(Y[m]) - cs * 0.22 * sc;
    g.beginPath(); g.ellipse(sx, sy, Math.max(P, cs * 0.12 * sc), Math.max(P * 0.7, cs * 0.06 * sc), -0.6, 0, Math.PI * 2); g.fill();
    g.fillRect(sx + cs * 0.17 * sc, sy - cs * 0.06 * sc, P, P);
  }
  if (T.holes) { // sponge
    g.fillStyle = 'rgba(160,110,0,0.28)';
    for (const m of T.shine) { const sx = sxf(X[m]), sy = syf(Y[m]);
      g.beginPath(); g.arc(sx + cs * 0.14, sy + cs * 0.1, cs * 0.09, 0, Math.PI * 2); g.arc(sx - cs * 0.16, sy + cs * 0.22, cs * 0.06, 0, Math.PI * 2); g.fill(); }
  }
  if (T.streak) { // ice: a long glassy streak along the bar
    const a = T.shine[0], z = T.shine[T.shine.length - 1];
    g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = cs * 0.1; g.lineCap = 'round';
    g.beginPath(); g.moveTo(sxf(X[a]) - cs * 0.15, syf(Y[a]) - cs * 0.25); g.lineTo(sxf(X[z]) - cs * 0.15, syf(Y[z]) - cs * 0.25); g.stroke();
  }
  if (T.dust) { // marshmallow: powdered sugar
    g.fillStyle = 'rgba(255,255,255,0.6)';
    for (const m of T.shine) { const sx = sxf(X[m]), sy = syf(Y[m]);
      g.beginPath(); g.arc(sx + cs * 0.15, sy + cs * 0.15, cs * 0.035, 0, Math.PI * 2); g.arc(sx - cs * 0.05, sy + cs * 0.25, cs * 0.03, 0, Math.PI * 2); g.arc(sx + cs * 0.25, sy - cs * 0.05, cs * 0.03, 0, Math.PI * 2); g.fill(); }
  }
  if (T.speckle) {
    g.fillStyle = 'rgba(58,38,88,0.35)';
    for (const m of T.shine) {
      const sx = sxf(X[m]), sy = syf(Y[m]);
      g.beginPath(); g.arc(sx + cs * 0.18, sy + cs * 0.12, cs * 0.06, 0, Math.PI * 2); g.arc(sx - cs * 0.08, sy + cs * 0.24, cs * 0.04, 0, Math.PI * 2); g.fill();
    }
  }
  g.globalAlpha = 1;
}

const PAD = 3; // big pixels of room around a piece for its outline and shine
export function drawPiece(p) {
  if (!p.asleep) { p.spr = null; drawJelly(p.T, p.x, p.y, p.color, 1); return; }
  let s = p.spr;
  if (!s || s.P !== vp.P || Math.abs(cam.z / s.z - 1) > 0.02) s = p.spr = bake(p);
  const k = cam.z / s.z;
  ctx.drawImage(s.c, sxf(p.minX) + s.ox * k, syf(p.maxY) + s.oy * k, s.c.width * vp.P * k, s.c.height * vp.P * k);
}
function bake(p) {
  const P = vp.P, pad = PAD * P;
  // its top-left corner on screen, on the big-pixel grid so its dots line up with everything else
  const x0 = Math.floor((sxf(p.minX) - pad) / P) * P, y0 = Math.floor((syf(p.maxY) - pad) / P) * P;
  const c = p.spr ? p.spr.c : document.createElement('canvas');
  c.width = Math.ceil(((p.maxX - p.minX) * cam.z + 2 * pad) / P) + 1;
  c.height = Math.ceil(((p.maxY - p.minY) * cam.z + 2 * pad) / P) + 1;
  const g = c.getContext('2d');
  g.setTransform(vp.k, 0, 0, vp.k, -x0 * vp.k, -y0 * vp.k);
  drawJelly(p.T, p.x, p.y, p.color, 1, g);
  return { c, P, z: cam.z, ox: x0 - sxf(p.minX), oy: y0 - syf(p.maxY) };
}

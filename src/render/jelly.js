// Drawing a jelly piece as one gummy shape: smooth outline through its boundary points, a darker
// rim, a bright rim light along the bottom right, a dark outline in its own
// color, a white shine per block, and little decorations for some materials (sponge holes, ice
// streak, sugar dust, stone speckles). Lit from the top left, like everything else.
import { ctx, cam, vp, sxf, syf } from './view.js';
import { shade } from './color.js';
import { dots } from './pixels.js';

let sxBuf = new Float64Array(64), syBuf = new Float64Array(64);
function smoothPath(n) {
  ctx.beginPath();
  let mx = (sxBuf[n - 1] + sxBuf[0]) / 2, my = (syBuf[n - 1] + syBuf[0]) / 2;
  ctx.moveTo(mx, my);
  for (let i = 0; i < n; i++) {
    const j = i + 1 === n ? 0 : i + 1;
    ctx.quadraticCurveTo(sxBuf[i], syBuf[i], (sxBuf[i] + sxBuf[j]) / 2, (syBuf[i] + syBuf[j]) / 2);
  }
  ctx.closePath();
}
export function drawJelly(T, X, Y, color, alpha, time) {
  const b = T.bnd, n = b.length;
  if (sxBuf.length < n) { sxBuf = new Float64Array(n * 2); syBuf = new Float64Array(n * 2); }
  for (let q = 0; q < n; q++) { sxBuf[q] = sxf(X[b[q]]); syBuf[q] = syf(Y[b[q]]); }
  ctx.globalAlpha = alpha;
  const cs = T.cs * cam.z, P = vp.P, sc = T.shineScale;
  smoothPath(n);
  ctx.fillStyle = color; ctx.fill();
  ctx.save(); ctx.clip();
  ctx.lineWidth = cs * 0.7; ctx.strokeStyle = dots(shade(color, -0.2), 0.5); ctx.stroke(); // darker rim, dotted into
  ctx.lineWidth = cs * 0.4; ctx.strokeStyle = shade(color, -0.2); ctx.stroke();            // the lighter middle
  // rim light: the outline nudged up-left, so its bottom-right edges fall just inside the shape
  ctx.translate(-1.5 * P, -1.5 * P); ctx.lineWidth = P * 1.2; ctx.strokeStyle = shade(color, 0.55); ctx.stroke();
  ctx.restore();
  smoothPath(n);
  ctx.lineWidth = 2 * P; ctx.strokeStyle = shade(color, -0.6); ctx.stroke();
  // white gummy shine per block, with a pixel of sparkle beside it
  ctx.fillStyle = '#ffffff';
  for (const m of T.shine) {
    const sx = sxf(X[m]) - cs * 0.22 * sc, sy = syf(Y[m]) - cs * 0.22 * sc;
    ctx.beginPath(); ctx.ellipse(sx, sy, Math.max(P, cs * 0.12 * sc), Math.max(P * 0.7, cs * 0.06 * sc), -0.6, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(sx + cs * 0.17 * sc, sy - cs * 0.06 * sc, P, P);
  }
  if (T.holes) { // sponge
    ctx.fillStyle = 'rgba(160,110,0,0.28)';
    for (const m of T.shine) { const sx = sxf(X[m]), sy = syf(Y[m]);
      ctx.beginPath(); ctx.arc(sx + cs * 0.14, sy + cs * 0.1, cs * 0.09, 0, Math.PI * 2); ctx.arc(sx - cs * 0.16, sy + cs * 0.22, cs * 0.06, 0, Math.PI * 2); ctx.fill(); }
  }
  if (T.streak) { // ice: a long glassy streak along the bar
    const a = T.shine[0], z = T.shine[T.shine.length - 1];
    ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = cs * 0.1; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(sxf(X[a]) - cs * 0.15, syf(Y[a]) - cs * 0.25); ctx.lineTo(sxf(X[z]) - cs * 0.15, syf(Y[z]) - cs * 0.25); ctx.stroke();
  }
  if (T.dust) { // marshmallow: powdered sugar
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    for (const m of T.shine) { const sx = sxf(X[m]), sy = syf(Y[m]);
      ctx.beginPath(); ctx.arc(sx + cs * 0.15, sy + cs * 0.15, cs * 0.035, 0, Math.PI * 2); ctx.arc(sx - cs * 0.05, sy + cs * 0.25, cs * 0.03, 0, Math.PI * 2); ctx.arc(sx + cs * 0.25, sy - cs * 0.05, cs * 0.03, 0, Math.PI * 2); ctx.fill(); }
  }
  if (T.speckle) {
    ctx.fillStyle = 'rgba(58,38,88,0.35)';
    for (const m of T.shine) {
      const sx = sxf(X[m]), sy = syf(Y[m]);
      ctx.beginPath(); ctx.arc(sx + cs * 0.18, sy + cs * 0.12, cs * 0.06, 0, Math.PI * 2); ctx.arc(sx - cs * 0.08, sy + cs * 0.24, cs * 0.04, 0, Math.PI * 2); ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}

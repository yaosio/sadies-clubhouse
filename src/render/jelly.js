// Drawing a jelly piece: smooth outline through its boundary points, a shine per block, and
// little decorations for some materials (sponge holes, ice streak, sugar dust, stone speckles).
import { ctx, cam, sxf, syf } from './view.js';
import { shade } from './color.js';

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
  smoothPath(n);
  ctx.fillStyle = color; ctx.fill();
  ctx.lineWidth = Math.max(1.5, 0.09 * T.cs * cam.z); ctx.strokeStyle = shade(color, -0.32); ctx.stroke();
  // gummy shine per block
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  const cs = T.cs * cam.z;
  const sc = T.shineScale;
  for (const m of T.shine) {
    const sx = sxf(X[m]) - cs * 0.2 * sc, sy = syf(Y[m]) - cs * 0.2 * sc;
    ctx.beginPath(); ctx.ellipse(sx, sy, cs * 0.13 * sc, cs * 0.08 * sc, -0.6, 0, Math.PI * 2); ctx.fill();
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

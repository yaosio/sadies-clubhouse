// Drawing the toys: a fuzzy yellow-green tennis ball with a white seam.
import { toy, TOY_R } from '../core/toys.js';
import { ctx, cam, vp, sxf, syf } from './view.js';

// A ball of radius r centered at (x, y) in whatever units ctx is using right now.
export function drawBall(x, y, r, spin) {
  ctx.save();
  ctx.translate(x, y); ctx.rotate(spin);
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = '#d7ef4a'; ctx.fill();
  ctx.save(); ctx.clip();
  ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.arc(-r * 0.3, -r * 0.3, r * 0.45, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#fffbe8'; ctx.lineWidth = r * 0.16;
  ctx.beginPath(); ctx.arc(-r * 1.25, 0, r * 0.95, -0.9, 0.9); ctx.stroke();
  ctx.beginPath(); ctx.arc(r * 1.25, 0, r * 0.95, Math.PI - 0.9, Math.PI + 0.9); ctx.stroke();
  ctx.restore();
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.strokeStyle = '#3a2658'; ctx.lineWidth = r * 0.12; ctx.stroke();
  ctx.restore();
}

export function drawToy() {
  if (toy.state === 'none' || toy.state === 'held') return;
  const X = sxf(toy.x), Y = syf(toy.y), r = Math.max(4, TOY_R * cam.z);
  if (Y < -40 || Y > vp.vh + 40 || X < -40 || X > vp.vw + 40) return;
  if (toy.state === 'poof') { ctx.globalAlpha = Math.max(0, toy.pop); drawBall(X, Y, r * (1 + (1 - toy.pop) * 0.6), toy.spin); ctx.globalAlpha = 1; return; }
  drawBall(X, Y, r, toy.spin);
}

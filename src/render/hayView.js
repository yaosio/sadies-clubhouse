// Sadie's hay: a little round-ended bale. Tumbling through the air when the mole has just flung
// it, then glowing and floating, with a faint shimmer under it: whatever holds the mole up in the
// sky holds the hay up too (it's not the hat).
import { U } from '../config.js';
import { world } from '../core/world.js';
import { sadie } from '../core/sadie/brain.js';
import { ctx, cam, vp, sxf, syf } from './view.js';

// A little round-ended hay bale, s = one block in screen pixels. Straw lines, a twine band,
// and tufts poking out of each end.
const HAY = { fill: '#f2cf63', dark: '#c9a23a', line: '#a9822a', twine: '#b5523b' };
export function drawBale(X, Y, s) {
  const w = 0.62 * s, h = 0.4 * s;
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  // tufts at the ends
  ctx.strokeStyle = HAY.dark; ctx.lineWidth = Math.max(1, 0.05 * s);
  ctx.beginPath();
  for (const side of [-1, 1]) for (let k = -2; k <= 2; k++) {
    const y = Y + k * h * 0.32; ctx.moveTo(X + side * w * 0.95, y); ctx.lineTo(X + side * (w + 0.13 * s), y + k * 0.04 * s + 0.03 * s * side);
  }
  ctx.stroke();
  // the bale
  ctx.beginPath(); ctx.roundRect(X - w, Y - h, 2 * w, 2 * h, h * 0.55);
  ctx.fillStyle = HAY.fill; ctx.fill();
  ctx.lineWidth = Math.max(1.5, 0.06 * s); ctx.strokeStyle = HAY.line; ctx.stroke();
  // straw lines
  ctx.strokeStyle = HAY.dark; ctx.lineWidth = Math.max(1, 0.035 * s); ctx.beginPath();
  for (let k = -1; k <= 1; k++) { const y = Y + k * h * 0.5; ctx.moveTo(X - w * 0.8, y + 0.02 * s); ctx.lineTo(X - w * 0.3, y - 0.02 * s); ctx.moveTo(X + w * 0.3, y + 0.03 * s); ctx.lineTo(X + w * 0.8, y); }
  ctx.stroke();
  // twine band
  ctx.strokeStyle = HAY.twine; ctx.lineWidth = Math.max(1.5, 0.07 * s);
  ctx.beginPath(); ctx.moveTo(X - 0.08 * s, Y - h); ctx.lineTo(X - 0.08 * s, Y + h); ctx.moveTo(X + 0.1 * s, Y - h); ctx.lineTo(X + 0.1 * s, Y + h); ctx.stroke();
}
// The mystery float: a few specks twinkling just under something that's floating (X, Y: the
// middle of its bottom edge on screen).
export function drawShimmer(X, Y, S, time, seed = 0, strength = 1) {
  for (let k = 0; k < 3; k++) {
    const ph = time * 0.0017 + k * 2.1 + seed, drift = (ph * 0.35 + k / 3) % 1;
    const a = strength * Math.max(0, Math.sin(drift * Math.PI)) * (0.45 + 0.3 * Math.sin(ph * 3.1));
    if (a <= 0.02) continue;
    const x = X + Math.sin(ph * 1.3 + k) * 0.45 * S, y = Y + (0.12 + drift * 0.45) * S, r = Math.max(1, 0.06 * S * (1 - drift * 0.5));
    ctx.fillStyle = `rgba(236,226,255,${a})`;
    ctx.beginPath(); ctx.moveTo(x, y - 2 * r); ctx.lineTo(x + r * 0.6, y); ctx.lineTo(x, y + 2 * r); ctx.lineTo(x - r * 0.6, y); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x - 2 * r, y); ctx.lineTo(x, y + r * 0.6); ctx.lineTo(x + 2 * r, y); ctx.lineTo(x, y - r * 0.6); ctx.closePath(); ctx.fill();
  }
}

export function drawHay(time) {
  const S = U * cam.z;
  for (const s of world.hay) {
    const flying = s.st === 'fly', floatK = flying ? 0 : s.st === 'lift' ? 0.6 : 1;
    const X = sxf(s.x), Y = syf(s.y + (s.eaten || flying ? 0 : Math.sin(time * 0.003 + s.x) * 0.08 * U * floatK));
    if (Y < -40 || Y > vp.vh + 40 || X < -40 || X > vp.vw + 40) continue;
    if (s.eaten) { // munched: puffs up and fades away
      ctx.globalAlpha = Math.max(0, s.pop); drawBale(X, Y, S * (1 + (1 - s.pop) * 0.5)); ctx.globalAlpha = 1;
      continue;
    }
    if (s === sadie.target) {
      const k = (time * 0.0012) % 1;
      ctx.strokeStyle = `rgba(255,79,134,${1 - k})`; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(X, Y, 0.5 * S * (1.2 + k * 0.9), 0, Math.PI * 2); ctx.stroke();
    }
    if (!flying && !s.carried) drawShimmer(X, Y + 0.4 * S, S, time, s.x * 0.01, floatK);
    ctx.save(); ctx.translate(X, Y); ctx.rotate(-(s.rot || 0));
    if (!flying) { // the glow of the float
      ctx.save(); ctx.globalAlpha = floatK; ctx.shadowColor = 'rgba(255,220,120,0.9)'; ctx.shadowBlur = 14;
      ctx.fillStyle = HAY.fill; ctx.beginPath(); ctx.roundRect(-0.62 * S, -0.4 * S, 1.24 * S, 0.8 * S, 0.22 * S); ctx.fill(); ctx.restore();
    }
    drawBale(0, 0, S);
    ctx.restore();
  }
}

// Draws one frame of the world, back to front: sky, ruler, walls, ground, hay, drop lane, barn,
// pieces, Sadie's rope, Sadie's friends, Sadie, toys, the held piece, the dropper, particles.
import { U, W } from '../config.js';
import { world } from '../core/world.js';
import { COLORS } from '../core/physics/pieceTypes.js';
import { drp, heldOffsets } from '../core/dropper.js';
import { sadie } from '../core/sadie/brain.js';
import { ctx, cam, vp, sxf, syf, toWorld } from './view.js';
import { drawJelly } from './jelly.js';
import { drawDropper } from './dropperView.js';
import { drawSadie, drawEmotes } from './sadieView.js';
import { drawBarn, drawRope } from './barnView.js';
import { drawChooter } from './chooterView.js';
import { drawToy } from './toyView.js';

const SKY = [[0, '#ffe3ec'], [12, '#bfe7ff'], [35, '#7f8fe0'], [60, '#3a2f7a'], [95, '#120e33']];
const farStars = Array.from({ length: 160 }, () => ({ x: -W + Math.random() * W * 3, y: (40 + Math.random() * 140) * U, r: 0.6 + Math.random() * 1.2, tw: Math.random() * 6 }));
// A little round-ended hay bale, s = one block in screen pixels. Straw lines, a twine band,
// and tufts poking out of each end.
const HAY = { fill: '#f2cf63', dark: '#c9a23a', line: '#a9822a', twine: '#b5523b' };
function drawBale(X, Y, s) {
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
const heldX = new Float64Array(128), heldY = new Float64Array(128);

export function draw(time) {
  ctx.setTransform(vp.dpr, 0, 0, vp.dpr, 0, 0);
  // sky: color changes with altitude
  const g = ctx.createLinearGradient(0, syf(0), 0, syf(SKY[SKY.length - 1][0] * U));
  const top = SKY[SKY.length - 1][0];
  for (const [h, c] of SKY) g.addColorStop(h / top, c);
  ctx.fillStyle = g; ctx.fillRect(0, 0, vp.vw, vp.vh);

  // far stars high up
  for (const s of farStars) {
    const a = Math.min(1, (s.y / U - 40) / 30); if (a <= 0) continue;
    const X = sxf(s.x), Y = syf(s.y); if (Y < -5 || Y > vp.vh + 5 || X < -5 || X > vp.vw + 5) continue;
    ctx.globalAlpha = a * (0.6 + 0.4 * Math.sin(time * 0.002 + s.tw));
    ctx.fillStyle = '#fff'; ctx.fillRect(X, Y, s.r, s.r);
  }
  ctx.globalAlpha = 1;

  // height ruler
  const yTop = toWorld(0, 0).y, yBot = toWorld(0, vp.vh).y;
  ctx.font = `700 ${Math.max(11, Math.min(15, 13 * cam.z))}px "Baloo 2", ui-rounded, system-ui, sans-serif`;
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  for (let hb = Math.max(5, Math.ceil(yBot / U / 5) * 5); hb * U <= yTop; hb += 5) {
    const Y = syf(hb * U);
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1; ctx.setLineDash([4, 6]);
    ctx.beginPath(); ctx.moveTo(sxf(0), Y); ctx.lineTo(sxf(W), Y); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = hb > 40 ? 'rgba(255,255,255,0.8)' : 'rgba(42,24,64,0.55)';
    ctx.fillText(hb, Math.max(8, sxf(0) - 0.9 * U * cam.z), Y);
  }

  // walls
  const wallTop = Math.max(0, yTop) + U;
  ctx.fillStyle = 'rgba(58,36,92,0.55)';
  ctx.fillRect(sxf(-0.35 * U), syf(wallTop), 0.35 * U * cam.z, syf(-U) - syf(wallTop));
  ctx.fillRect(sxf(W), syf(wallTop), 0.35 * U * cam.z, syf(-U) - syf(wallTop));

  // ground
  const gy = syf(0);
  if (gy < vp.vh) {
    ctx.fillStyle = '#c7855a'; ctx.fillRect(0, gy, vp.vw, vp.vh - gy);
    ctx.fillStyle = '#a8663f'; ctx.fillRect(0, gy, vp.vw, Math.max(3, 0.18 * U * cam.z));
    ctx.fillStyle = 'rgba(255,240,220,0.35)';
    for (let i = -6; i < 30; i++) { const X = sxf(i * U * 1.3 + 7); ctx.beginPath(); ctx.arc(X, gy + (0.6 + (i % 3) * 0.35) * U * cam.z, 0.09 * U * cam.z, 0, Math.PI * 2); ctx.fill(); }
  }

  // hay
  for (const s of world.hay) {
    const X = sxf(s.x), Y = syf(s.y + (s.eaten ? 0 : Math.sin(time * 0.003 + s.x) * 0.08 * U));
    const S = U * cam.z;
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
    ctx.save(); ctx.shadowColor = 'rgba(255,220,120,0.9)'; ctx.shadowBlur = 14;
    ctx.fillStyle = HAY.fill; ctx.beginPath(); ctx.roundRect(X - 0.62 * S, Y - 0.4 * S, 1.24 * S, 0.8 * S, 0.22 * S); ctx.fill(); ctx.restore();
    drawBale(X, Y, S);
  }

  // drop lane under the held piece
  let heldReady = false;
  if (world.held) {
    const T = world.held.T, c = Math.cos(world.held.ang), s = Math.sin(world.held.ang);
    for (let i = 0; i < T.n; i++) { heldX[i] = drp.x + c * T.rx[i] - s * T.ry[i]; heldY[i] = drp.y + s * T.rx[i] + c * T.ry[i]; }
    const o = heldOffsets(world.held, world.held.ang);
    const bottom = drp.y + o.y0, laneH = Math.min(5 * U, Math.max(0, bottom)) * cam.z;
    const lx0 = sxf(drp.x + o.x0), lx1 = sxf(drp.x + o.x1), ly = syf(bottom);
    if (laneH > 1) {
      const lane = ctx.createLinearGradient(0, ly, 0, ly + laneH);
      lane.addColorStop(0, 'rgba(255,255,255,0.32)'); lane.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = lane; ctx.fillRect(lx0, ly, lx1 - lx0, laneH);
    }
    heldReady = true;
  }

  drawBarn(time);
  // pieces
  for (const p of world.pieces) {
    // only pieces on screen (with a little margin for the outline); the barn draws itself
    if (p.fixed || syf(p.maxY) > vp.vh + 10 || syf(p.minY) < -10 || sxf(p.maxX) < -10 || sxf(p.minX) > vp.vw + 10) continue;
    drawJelly(p.T, p.x, p.y, p.color, 1, time);
  }
  drawRope();
  drawChooter(time);
  drawSadie(time);
  drawToy();
  drawEmotes();
  if (heldReady) drawJelly(world.held.T, heldX, heldY, COLORS[world.held.type], world.supply < 1 ? 0.35 : 0.82 + 0.12 * Math.sin(time * 0.006), time);
  drawDropper(time);

  // particles
  for (const q of world.particles) {
    ctx.globalAlpha = Math.max(0, q.life);
    ctx.fillStyle = q.c; ctx.beginPath(); ctx.arc(sxf(q.x), syf(q.y), q.r * cam.z, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// Draws one frame of the world, back to front: sky, ruler, walls, ground, hay, drop lane, barn,
// pieces, the bedrock, Sadie's rope, Sadie's friends, Sadie, toys, the held piece, the mole, particles.
import { U, W } from '../config.js';
import { world } from '../core/world.js';
import { COLORS } from '../core/physics/pieceTypes.js';
import { drp, heldOffsets } from '../core/dropper.js';
import { rock, rockInfo, SURF_N, SURF_RES } from '../core/surface.js';
import { bedrock } from '../core/bedrock.js';
import { ctx, cam, vp, sxf, syf, toWorld } from './view.js';
import { drawJelly } from './jelly.js';
import { drawMole } from './moleView.js';
import { drawSadie, drawEmotes } from './sadieView.js';
import { drawBarn, drawRope } from './barnView.js';
import { drawChooter, drawChooterPeek } from './chooterView.js';
import { drawToy } from './toyView.js';
import { drawHay } from './hayView.js';

const SKY = [[0, '#ffe3ec'], [12, '#bfe7ff'], [35, '#7f8fe0'], [60, '#3a2f7a'], [95, '#120e33']];
const farStars = Array.from({ length: 160 }, () => ({ x: -W + Math.random() * W * 3, y: (40 + Math.random() * 140) * U, r: 0.6 + Math.random() * 1.2, tw: Math.random() * 6 }));
const heldX = new Float64Array(128), heldY = new Float64Array(128);

// The bedrock: marbled candy rock, flecked with the colors of the pieces that melted into it, with
// a glossy top edge. Drawn over the pieces so anything half sunk into it looks fused in.
const ROCK = { light: '#c98aa8', mid: '#9a5f86', deep: '#5a3558', rim: '#f3cfe0', edge: '#4a2a4a' };
function drawBedrock() {
  if (rockInfo.high === 0) return;
  const yTopS = syf(rockInfo.high), yBotS = syf(0);
  if (yTopS > vp.vh || yBotS < 0) return; // none of it on screen
  const z = cam.z, step = z * SURF_RES < 3 ? 2 : 1;
  ctx.beginPath(); ctx.moveTo(sxf(0), yBotS);
  for (let i = 0; i < SURF_N; i += step) ctx.lineTo(sxf(i * SURF_RES), syf(rock[i]));
  ctx.lineTo(sxf((SURF_N - 1) * SURF_RES), syf(rock[SURF_N - 1])); ctx.lineTo(sxf(W), yBotS); ctx.closePath();
  const g = ctx.createLinearGradient(0, yTopS, 0, yTopS + 14 * U * z);
  g.addColorStop(0, ROCK.light); g.addColorStop(0.35, ROCK.mid); g.addColorStop(1, ROCK.deep);
  ctx.fillStyle = g; ctx.fill();
  ctx.save(); ctx.clip();
  // swirls of melted candy, following the shape of the top
  ctx.lineWidth = Math.max(1, 0.14 * U * z); ctx.lineCap = 'round';
  for (let k = 1; k <= 4; k++) {
    ctx.strokeStyle = k % 2 ? 'rgba(255,220,235,0.16)' : 'rgba(60,20,60,0.14)';
    ctx.beginPath();
    for (let i = 0; i < SURF_N; i += 4) { const X = sxf(i * SURF_RES), Y = syf(rock[i] - k * 1.3 * U + Math.sin(i * 0.21 + k * 1.7) * 0.35 * U); if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); }
    ctx.stroke();
  }
  // flecks of what melted in
  const r = Math.max(1.5, 0.16 * U * z);
  ctx.globalAlpha = 0.6;
  for (const [x, y, c] of bedrock.flecks) {
    const X = sxf(x), Y = syf(y); if (Y < -r || Y > vp.vh + r || X < -r || X > vp.vw + r) continue;
    ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(X, Y, r * 1.4, r, 0.4, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1; ctx.restore();
  // glossy top edge
  ctx.beginPath();
  for (let i = 0; i < SURF_N; i += step) { const X = sxf(i * SURF_RES), Y = syf(rock[i]); if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); }
  ctx.strokeStyle = ROCK.edge; ctx.lineWidth = Math.max(2, 0.12 * U * z); ctx.stroke();
  ctx.translate(0, Math.max(1.5, 0.08 * U * z));
  ctx.strokeStyle = ROCK.rim; ctx.lineWidth = Math.max(1, 0.06 * U * z); ctx.stroke();
  ctx.setTransform(vp.dpr, 0, 0, vp.dpr, 0, 0);
}

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

  drawHay(time);

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
  drawBedrock();
  drawRope();
  drawChooter(time);
  drawChooterPeek(time);
  drawSadie(time);
  drawToy();
  drawEmotes();
  if (heldReady) drawJelly(world.held.T, heldX, heldY, COLORS[world.held.type], world.supply < 1 ? 0.35 : 0.82 + 0.12 * Math.sin(time * 0.006), time);
  drawMole(time);

  // particles
  for (const q of world.particles) {
    ctx.globalAlpha = Math.max(0, q.life);
    ctx.fillStyle = q.c; ctx.beginPath(); ctx.arc(sxf(q.x), syf(q.y), q.r * cam.z, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

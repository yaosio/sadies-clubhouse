// Draws one frame of the world, back to front: sky (sun, clouds, hills), ruler, walls, ground, hay, barn,
// pieces, the bedrock, Sadie's rope, Sadie's friends, Sadie, toys, the held piece, the mole, particles.
import { U, W } from '../config.js';
import { world } from '../core/world.js';
import { COLORS } from '../core/physics/pieceTypes.js';
import { drp } from '../core/dropper.js';
import { rock, rockInfo, SURF_N, SURF_RES } from '../core/surface.js';
import { bedrock } from '../core/bedrock.js';
import { ctx, cam, vp, sxf, syf, toWorld, crisp, present } from './view.js';
import { drawJelly, drawPiece, startFrame, mayRedraw } from './jelly.js';
import { drawMole } from './moleView.js';
import { drawSadie, drawEmotes } from './sadieView.js';
import { drawBarn, drawRope } from './barnView.js';
import { drawChooter, drawChooterPeek } from './chooterView.js';
import { drawToy } from './toyView.js';
import { drawHay } from './hayView.js';
import { dots, bands, snap } from './pixels.js';

// Sky by height: pink at the horizon, cyan, then deep blue, then night up high, fading in dotted bands.
const SKY = [[0, '#ff9ed8'], [3, '#9ee8ff'], [10, '#3ec8f0'], [24, '#2a6ae0'], [45, '#2a2a9a'], [70, '#16104a'], [95, '#0a0628']];
const farStars = Array.from({ length: 160 }, () => ({ x: -W + Math.random() * W * 3, y: (40 + Math.random() * 140) * U, r: 0.6 + Math.random() * 1.2, tw: Math.random() * 6 }));
// Far things move slower than the board as the camera moves (f: 0 = fixed on screen, 1 = with the board).
const pxf = (x, f) => (x - cam.x * f) * cam.z + vp.vw / 2;
const pyf = (y, f) => vp.vh / 2 - (y - cam.y * f) * cam.z;
// Lumpy clouds, spread up the sky, drifting.
const CLOUDS = Array.from({ length: 26 }, (_, i) => ({ x: ((i * 37) % 48) * U * 1.6 - 12 * U, y: (4 + i * 1.7 + (i * 7 % 5)) * U, s: 0.8 + (i * 13 % 7) / 10, v: 3 + (i * 11 % 5) }));
const PUFFS = [[-1.2, 0, 0.55], [-0.5, 0.25, 0.75], [0.35, 0.35, 0.85], [1.1, 0.05, 0.6], [0.2, -0.1, 0.6]];
// Each cloud is drawn once into its own little picture (redrawn only when the zoom changes) and
// stamped on the pixel grid after that: a cloud never changes shape. Stretched while zooming.
function drawCloud(c, X, Y, r) {
  const P = vp.P;
  let s = c.spr;
  if (!s || s.P !== P || (Math.abs(r / s.r - 1) > 0.02 && mayRedraw())) s = c.spr = bakeCloud(s, r);
  const k = r / s.r; // stretched while zooming, like the pieces
  ctx.drawImage(s.c, snap(X - (s.r * 3 + P) * k), snap(Y - (s.r * 3 + P) * k), s.c.width * P * k, s.c.height * P * k);
}
function bakeCloud(s, r) {
  const P = vp.P, k = vp.k, c = s ? s.c : document.createElement('canvas');
  c.width = Math.ceil(6 * r * k) + 3; c.height = Math.ceil(3.3 * r * k) + 3;
  const g = c.getContext('2d'), X = 3 * r + P, Y = 3 * r + P; // its middle, inside the little picture
  g.setTransform(k, 0, 0, k, 0, 0);
  const puffs = (grow, dy) => { g.beginPath(); for (const [dx, dy0, pr] of PUFFS) { g.moveTo(X + dx * r + pr * r + grow, Y - dy0 * r + dy); g.arc(X + dx * r, Y - dy0 * r + dy, pr * r + grow, 0, Math.PI * 2); } };
  g.beginPath(); g.rect(X - 3 * r, Y - 3 * r, 6 * r, 3 * r + 0.3 * r); g.clip(); // flat bottoms
  puffs(P, 0); g.fillStyle = '#9ab8f0'; g.fill();       // soft blue edge
  puffs(0, 0); g.fillStyle = '#d8ecff'; g.fill();       // shaded underside
  puffs(-P, -0.25 * r); g.fillStyle = '#ffffff'; g.fill();
  return { c, P, r };
}
// The chunky sun with rays, far away: up in the corner of the sky, setting as the camera climbs.
function drawSun(time) {
  const r = 1.4 * U * cam.z, X = Math.max(vp.vw * 0.2, 2 * r) - (cam.x - W / 2) * cam.z * 0.05, Y = Math.max(vp.vh * 0.2, 2.2 * r) + cam.y * cam.z * 0.75; // sets before the sky turns to night
  if (Y > vp.vh + 3 * r || Y < -3 * r) return;
  ctx.save(); ctx.translate(X, Y); ctx.rotate(time * 0.00005);
  ctx.strokeStyle = '#ffe44a'; ctx.lineWidth = vp.P;
  for (let k = 0; k < 16; k++) { const a = k * Math.PI / 8, l = k % 2 ? 1.5 : 1.9; ctx.beginPath(); ctx.moveTo(Math.cos(a) * r * 1.15, Math.sin(a) * r * 1.15); ctx.lineTo(Math.cos(a) * r * l, Math.sin(a) * r * l); ctx.stroke(); }
  ctx.restore();
  ctx.fillStyle = dots('#ffe44a', 0.5); ctx.beginPath(); ctx.arc(X, Y, r * 1.3, 0, Math.PI * 2); ctx.fill(); // a dotted glow
  const ring = (c, rr, dx, amount) => { ctx.fillStyle = amount ? dots(c, amount) : c; ctx.beginPath(); ctx.arc(X + dx * r, Y + dx * r, rr * r, 0, Math.PI * 2); ctx.fill(); };
  ring('#ff9a1e', 1, 0); ring('#ffd23a', 0.9, -0.05, 0.5); ring('#ffd23a', 0.78, -0.08);
  ring('#fff6b0', 0.55, -0.18, 0.5); ring('#fff6b0', 0.4, -0.25); ring('#ffffff', 0.2, -0.35);
}
// Rolling hills behind the board: a far teal row and a nearer green one, filled down to the bottom.
// f: how much they move sideways with the camera (they stay on the horizon going up and down).
function drawHills(f, base, amp, seed, light, mid, dark) {
  const y0 = pyf(base, 0.97); if (y0 - amp * 2 * cam.z > vp.vh) return;
  const step = 2 * vp.P, top = y0 - amp * cam.z;
  ctx.beginPath(); ctx.moveTo(0, vp.vh);
  for (let X = 0; X <= vp.vw + step; X += step) {
    const x = (X - vp.vw / 2) / cam.z + cam.x * f;
    ctx.lineTo(X, y0 - amp * cam.z * (0.55 + 0.3 * Math.sin(x / (4.3 * U) + seed) + 0.15 * Math.sin(x / (1.7 * U) + seed * 2)));
  }
  ctx.lineTo(vp.vw, vp.vh); ctx.closePath();
  ctx.save(); ctx.clip();
  bands(0, vp.vw, [top, top + amp * cam.z * 0.8, y0 + amp * cam.z * 0.6], [light, mid, dark], vp.vh);
  ctx.restore();
  ctx.strokeStyle = dark; ctx.lineWidth = vp.P; ctx.stroke();
}
// The ground: a bright grass strip with tufts over brown dirt, speckled with pebbles and candy sprinkles.
const SPRINKLES = ['#ff5ab4', '#ffe030', '#4ae0ff', '#b07aff', '#ffffff', '#ff8c3a'];
function drawGround() {
  const gy = syf(0); if (gy >= vp.vh) return;
  const z = cam.z, P = vp.P;
  bands(0, vp.vw, [gy, gy + 1.2 * U * z, gy + 3 * U * z], ['#b0602a', '#8a4820', '#6a3414'], vp.vh);
  const x0 = Math.floor(toWorld(0, 0).x / (0.37 * U)), x1 = Math.ceil(toWorld(vp.vw, 0).x / (0.37 * U));
  for (let i = x0; i <= x1; i++) { // pebbles and sprinkles at fixed spots in the dirt
    const h = (i * 2654435761) >>> 0, x = i * 0.37 * U, y = -((h % 1000) / 1000) * 5.5 * U - 0.5 * U;
    const X = sxf(x), Y = syf(y); if (Y > vp.vh) continue;
    if (h % 3 === 0) { ctx.fillStyle = SPRINKLES[(h >>> 8) % SPRINKLES.length]; ctx.fillRect(X, Y, P, P); }
    else if (h % 3 === 1) { ctx.fillStyle = '#d89a6a'; ctx.fillRect(X, Y, 2 * P, P); ctx.fillStyle = '#4a200a'; ctx.fillRect(X, Y + P, 2 * P, P); }
  }
  const gh = Math.max(2 * P, 0.35 * U * z);
  bands(0, vp.vw, [gy - gh * 0.4, gy + gh * 0.2, gy + gh * 0.7], ['#9aff5a', '#4ad83a', '#1e9a2e'], gy + gh);
  ctx.fillStyle = '#0c5a1a'; ctx.fillRect(0, gy + gh, vp.vw, P);
  ctx.fillStyle = '#c8ff8a';
  for (let i = x0; i <= x1; i++) { const h = (i * 40503) & 7; if (h < 3) ctx.fillRect(sxf(i * 0.37 * U), gy - gh * 0.4 - P * (1 + (h & 1)), P, P * (1 + (h & 1))); }
}

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
  ctx.save(); ctx.clip();
  bands(Math.max(0, sxf(0)), Math.min(vp.vw, sxf(W)), [yTopS, yTopS + 5 * U * z, yTopS + 14 * U * z], [ROCK.light, ROCK.mid, ROCK.deep], Math.min(vp.vh, yBotS));
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
  ctx.setTransform(vp.k, 0, 0, vp.k, 0, 0);
}

export function draw(time) {
  startFrame();
  ctx.imageSmoothingEnabled = false; // stamped pictures (sleeping pieces, clouds) keep hard pixel edges
  ctx.setTransform(vp.k, 0, 0, vp.k, 0, 0);
  // sky: color changes with altitude
  const skyTops = [], skyCols = [];
  for (let i = SKY.length - 1; i >= 0; i--) { skyTops.push(syf(SKY[i][0] * U)); skyCols.push(SKY[i][1]); }
  ctx.fillStyle = SKY[SKY.length - 1][1]; ctx.fillRect(0, 0, vp.vw, Math.max(0, skyTops[0]));
  bands(0, vp.vw, skyTops, skyCols, vp.vh);

  // far stars high up
  for (const s of farStars) {
    const a = Math.min(1, (s.y / U - 40) / 30); if (a <= 0) continue;
    const X = sxf(s.x), Y = syf(s.y); if (Y < -5 || Y > vp.vh + 5 || X < -5 || X > vp.vw + 5) continue;
    ctx.globalAlpha = a * (0.6 + 0.4 * Math.sin(time * 0.002 + s.tw));
    ctx.fillStyle = '#fff'; ctx.fillRect(X, Y, vp.P, vp.P);
  }
  ctx.globalAlpha = 1;
  drawSun(time);
  for (const c of CLOUDS) {
    const span = W * 2.2, x = ((c.x + time * 0.001 * c.v) % span + span) % span - W * 0.6;
    const X = pxf(x, 0.6), Y = pyf(c.y, 0.6), r = 0.9 * U * c.s * cam.z;
    if (Y < -2 * r || Y > vp.vh + r || X < -3 * r || X > vp.vw + 3 * r) continue;
    drawCloud(c, X, Y, r);
  }
  drawHills(0.5, 1.4 * U, 2.6 * U, 1.3, '#8af0c0', '#4ac8a0', '#2a9a8a');
  drawHills(0.8, 0.3 * U, 1.5 * U, 4.1, '#7af060', '#3ec84a', '#1e8a3a');

  // height ruler: dashed lines on the pixels, the numbers sharp on top
  const yTop = toWorld(0, 0).y, yBot = toWorld(0, vp.vh).y, rulerX = Math.max(8, sxf(0) - 0.9 * U * cam.z);
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = vp.P; ctx.setLineDash([2 * vp.P, 3 * vp.P]);
  const marks = [];
  for (let hb = Math.max(5, Math.ceil(yBot / U / 5) * 5); hb * U <= yTop; hb += 5) {
    const Y = syf(hb * U); marks.push([hb, Y]);
    ctx.beginPath(); ctx.moveTo(sxf(0), Y); ctx.lineTo(sxf(W), Y); ctx.stroke();
  }
  ctx.setLineDash([]);
  crisp(c => {
    c.font = `${Math.round(Math.max(10, Math.min(13, 11 * cam.z)))}px Silkscreen, ui-monospace, monospace`; // the blocky 90s font
    c.textAlign = 'left'; c.textBaseline = 'middle';
    for (const [hb, Y] of marks) { c.fillStyle = hb > 20 ? 'rgba(255,255,255,0.85)' : 'rgba(42,24,64,0.6)'; c.fillText(hb, rulerX, Y); }
  });

  // walls
  const wallTop = Math.max(0, yTop) + U;
  ctx.fillStyle = 'rgba(58,36,92,0.55)';
  ctx.fillRect(sxf(-0.35 * U), syf(wallTop), 0.35 * U * cam.z, syf(-U) - syf(wallTop));
  ctx.fillRect(sxf(W), syf(wallTop), 0.35 * U * cam.z, syf(-U) - syf(wallTop));

  drawGround();

  drawHay(time);

  // where the mole's piece is (drawn solid, in its hands, after the characters)
  let heldReady = false;
  if (world.held) {
    const T = world.held.T, c = Math.cos(world.held.ang), s = Math.sin(world.held.ang);
    for (let i = 0; i < T.n; i++) { heldX[i] = drp.x + c * T.rx[i] - s * T.ry[i]; heldY[i] = drp.y + s * T.rx[i] + c * T.ry[i]; }
    heldReady = true;
  }

  drawBarn(time);
  // pieces
  for (const p of world.pieces) {
    // only pieces on screen (with a little margin for the outline); the barn draws itself
    if (p.fixed || syf(p.maxY) > vp.vh + 10 || syf(p.minY) < -10 || sxf(p.maxX) < -10 || sxf(p.minX) > vp.vw + 10) continue;
    drawPiece(p);
  }
  drawBedrock();
  drawRope();
  drawChooter(time);
  drawChooterPeek(time);
  drawSadie(time);
  drawToy();
  drawEmotes();
  if (heldReady) drawJelly(world.held.T, heldX, heldY, COLORS[world.held.type], 1);
  drawMole(time);

  // particles
  for (const q of world.particles) {
    ctx.globalAlpha = Math.max(0, q.life);
    ctx.fillStyle = q.c; ctx.beginPath(); ctx.arc(sxf(q.x), syf(q.y), q.r * cam.z, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
  present();
}

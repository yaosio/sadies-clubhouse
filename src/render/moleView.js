// The mole: a round velvety mole in a propeller beanie, hanging onto the piece it's about to drop
// with its big pink digging hands. Squints (moles barely see), droops when tired, snoozes when
// worn out, and stares aghast at any hay it digs up. A faint shimmer under whatever it carries:
// something keeps it up there, and it's not the hat. Shows an edge marker when it's off screen.
import { U } from '../config.js';
import { world } from '../core/world.js';
import { drp, heldOffsets, NO_PIECE } from '../core/dropper.js';
import { mole } from '../core/mole.js';
import { ctx, cam, vp, sxf, syf } from './view.js';
import { drawBale, drawShimmer } from './hayView.js';

const FUR = '#6b5a66', FUR_DARK = '#4a3c48', BELLY = '#8a7885', PINK = '#ff9db5', PINK_DARK = '#e0708f', INK = '#2a1840';
let propAng = 0, lastT = 0;

export function drawMole(time) {
  const z = cam.z, S = U * z, tired = mole.feel.tired, nap = mole.napping;
  const o = world.held ? heldOffsets(world.held, world.held.ang) : NO_PIECE;
  const topY = drp.y + o.y1;
  const bob = Math.sin(time * (nap ? 0.0015 : 0.003)) * (0.06 + 0.06 * tired) * S;
  const bx = sxf(drp.x), by = syf(topY + 0.85 * U) + bob + tired * 0.08 * S;
  const dt = Math.min(0.1, (time - lastT) / 1000); lastT = time;
  propAng += dt * (nap ? 4 : 22 - 12 * tired);
  const onScreen = bx > -S * 2 && bx < vp.vw + S * 2 && by > -S * 2 && by < vp.vh + S * 2;
  if (!onScreen) { drawMoleMarker(bx, by); return; }
  const k = drp.claw, pieceTop = syf(topY), hay = drp.hay !== null;
  const half = Math.max(0.5 * S, (o.x1 - o.x0) / 2 * z);
  drawShimmer(bx, syf(drp.y + o.y0), S, time, 7);
  // hay it just dug up, held out at arm's length and shaking (ew)
  if (hay) drawBale(bx + Math.sin(time * 0.06) * 0.05 * S, syf(drp.y + 0.4 * U), S);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';

  // arms down to the piece, and the hands gripping its top corners (they fling open when it lets go)
  for (const sd of [-1, 1]) {
    const hx = bx + sd * (Math.min(half * 0.6, 0.95 * S) + k * 0.5 * S), hy = pieceTop + 0.05 * S - k * 0.25 * S;
    ctx.strokeStyle = FUR_DARK; ctx.lineWidth = Math.max(3, 0.24 * S);
    ctx.beginPath(); ctx.moveTo(bx + sd * 0.5 * S, by + 0.1 * S); ctx.quadraticCurveTo(bx + sd * 0.75 * S, by + 0.35 * S, hx, hy - 0.2 * S); ctx.stroke();
    ctx.save(); ctx.translate(hx, hy); ctx.rotate(sd * (0.35 + k * 0.9));
    ctx.fillStyle = PINK; ctx.strokeStyle = PINK_DARK; ctx.lineWidth = Math.max(1, 0.04 * S);
    ctx.beginPath(); ctx.ellipse(0, -0.05 * S, 0.24 * S, 0.19 * S, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#f4ecef'; ctx.lineWidth = Math.max(1, 0.05 * S); // claws
    for (let c = -2; c <= 2; c++) { const a = Math.PI / 2 + c * 0.32; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 0.15 * S, 0.05 * S + Math.sin(a) * 0.08 * S); ctx.lineTo(Math.cos(a) * 0.2 * S, 0.12 * S + Math.sin(a) * 0.12 * S); ctx.stroke(); }
    ctx.restore();
  }

  // propeller beanie
  const capY = by - 0.5 * S;
  ctx.strokeStyle = INK; ctx.lineWidth = Math.max(1.5, 0.06 * S);
  ctx.beginPath(); ctx.moveTo(bx, capY - 0.22 * S); ctx.lineTo(bx, capY - 0.42 * S); ctx.stroke();
  const spin = Math.cos(propAng);
  ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.ellipse(bx, capY - 0.44 * S, Math.max(1.5, 0.5 * S * Math.abs(spin)), 0.07 * S, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#e8394f'; ctx.beginPath(); ctx.ellipse(bx + spin * 0.25 * S, capY - 0.44 * S, Math.max(1, 0.2 * S * Math.abs(spin)), 0.06 * S, 0, 0, Math.PI * 2); ctx.fill();

  // body: a soft round loaf of velvet
  ctx.fillStyle = FUR; ctx.strokeStyle = FUR_DARK; ctx.lineWidth = Math.max(1.5, 0.05 * S);
  ctx.beginPath(); ctx.ellipse(bx, by, 0.72 * S, 0.55 * S, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = BELLY; ctx.beginPath(); ctx.ellipse(bx, by + 0.18 * S, 0.42 * S, 0.3 * S, 0, 0, Math.PI * 2); ctx.fill();
  // beanie on top
  ctx.fillStyle = '#e8394f'; ctx.beginPath(); ctx.ellipse(bx, capY + 0.02 * S, 0.4 * S, 0.24 * S, 0, Math.PI, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#3b8fe0'; ctx.beginPath(); ctx.ellipse(bx, capY + 0.02 * S, 0.4 * S, 0.24 * S, 0, Math.PI * 1.35, Math.PI * 1.65); ctx.lineTo(bx, capY + 0.02 * S); ctx.fill();
  ctx.fillStyle = '#ffd23f'; ctx.fillRect(bx - 0.42 * S, capY - 0.01 * S, 0.84 * S, 0.07 * S);

  // face: squinty eyes (closed when napping, droopy when tired), rosy cheeks, a big pink nose
  const ey = by - 0.12 * S;
  ctx.strokeStyle = INK; ctx.lineWidth = Math.max(1.5, 0.055 * S);
  for (const sd of [-1, 1]) {
    const ex = bx + sd * 0.24 * S;
    ctx.beginPath();
    if (nap) ctx.arc(ex, ey - 0.02 * S, 0.07 * S, 0.15 * Math.PI, 0.85 * Math.PI); // asleep: little u's
    else if (hay) { ctx.moveTo(ex + 0.07 * S, ey); ctx.arc(ex, ey, 0.07 * S, 0, Math.PI * 2); } // aghast: eyes wide open for once
    else { ctx.moveTo(ex - sd * 0.08 * S, ey); ctx.lineTo(ex + sd * 0.08 * S, ey + tired * 0.08 * S); } // squint; the outer ends droop when tired
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(255,120,150,0.35)';
  for (const sd of [-1, 1]) { ctx.beginPath(); ctx.ellipse(bx + sd * 0.4 * S, by + 0.02 * S, 0.1 * S, 0.06 * S, 0, 0, Math.PI * 2); ctx.fill(); }
  ctx.fillStyle = PINK; ctx.strokeStyle = PINK_DARK; ctx.lineWidth = Math.max(1, 0.04 * S);
  ctx.beginPath(); ctx.ellipse(bx, by + 0.02 * S, 0.16 * S, 0.12 * S, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.arc(bx - 0.05 * S, by - 0.02 * S, 0.035 * S, 0, Math.PI * 2); ctx.fill();
  if (hay) { // a wobbly "ew" mouth
    ctx.strokeStyle = INK; ctx.lineWidth = Math.max(1, 0.04 * S); ctx.beginPath(); ctx.moveTo(bx - 0.12 * S, by + 0.2 * S);
    for (let q = 1; q <= 4; q++) ctx.lineTo(bx - 0.12 * S + q * 0.06 * S, by + (q % 2 ? 0.16 : 0.2) * S);
    ctx.stroke();
  } else if (!nap) { ctx.strokeStyle = INK; ctx.lineWidth = Math.max(1, 0.04 * S); ctx.beginPath(); ctx.arc(bx, by + 0.14 * S, 0.07 * S, 0.2 * Math.PI, 0.8 * Math.PI); ctx.stroke(); }
}
function drawMoleMarker(bx, by) {
  const m = 26, x = Math.min(vp.vw - m, Math.max(m, bx)), y = Math.min(vp.vh - 110, Math.max(160, by));
  const a = Math.atan2(by - y, bx - x);
  ctx.save(); ctx.translate(x, y);
  ctx.fillStyle = FUR; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(0, 0, 14, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = PINK; ctx.beginPath(); ctx.ellipse(0, 2, 5, 4, 0, 0, Math.PI * 2); ctx.fill();
  ctx.rotate(a); ctx.fillStyle = FUR;
  ctx.beginPath(); ctx.moveTo(24, 0); ctx.lineTo(15, -6); ctx.lineTo(15, 6); ctx.closePath(); ctx.fill();
  ctx.restore();
}

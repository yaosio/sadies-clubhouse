// The dropper drone: claws, propeller, supply lights. Shows an edge marker when it's off screen.
import { U } from '../config.js';
import { world } from '../core/world.js';
import { drp, heldOffsets, NO_PIECE, SUPPLY_MAX } from '../core/dropper.js';
import { ctx, cam, vp, sxf, syf } from './view.js';

export function drawDropper(time) {
  const z = cam.z, S = U * z, ink = '#3a2658';
  const o = world.held ? heldOffsets(world.held, world.held.ang) : NO_PIECE;
  const topY = drp.y + o.y1;
  const bx = sxf(drp.x), by = syf(topY + 0.62 * U);
  const onScreen = bx > -S * 2 && bx < vp.vw + S * 2 && by > -S * 2 && by < vp.vh + S * 2;
  if (!onScreen) { drawDropperMarker(bx, by); return; }
  const k = drp.claw, pieceTop = syf(topY);
  const half = Math.max(0.5 * S, (o.x1 - o.x0) / 2 * z);
  // claws
  ctx.strokeStyle = ink; ctx.lineWidth = Math.max(2, 0.1 * S); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (const sd of [-1, 1]) {
    const hx = bx + sd * (Math.min(half * 0.55, 0.9 * S) + k * 0.45 * S), hy = pieceTop + 0.12 * S - k * 0.2 * S;
    ctx.beginPath();
    ctx.moveTo(bx + sd * 0.35 * S, by + 0.2 * S);
    ctx.lineTo(hx, pieceTop - 0.2 * S);
    ctx.lineTo(hx - sd * (0.14 - k * 0.2) * S, hy);
    ctx.stroke();
  }
  // propeller
  const spin = Math.cos(time * 0.035);
  ctx.beginPath(); ctx.moveTo(bx, by - 0.3 * S); ctx.lineTo(bx, by - 0.52 * S); ctx.stroke();
  ctx.fillStyle = ink; ctx.beginPath(); ctx.ellipse(bx, by - 0.55 * S, Math.max(2, 0.55 * S * Math.abs(spin)), 0.06 * S, 0, 0, Math.PI * 2); ctx.fill();
  // body
  ctx.fillStyle = ink; ctx.beginPath(); ctx.roundRect(bx - 0.75 * S, by - 0.3 * S, 1.5 * S, 0.6 * S, 0.24 * S); ctx.fill();
  ctx.fillStyle = '#ff4f86'; ctx.fillRect(bx - 0.75 * S, by + 0.02 * S, 1.5 * S, 0.1 * S);
  // supply lights
  for (let i = 0; i < SUPPLY_MAX; i++) {
    const f = Math.min(1, Math.max(0, world.supply - i));
    ctx.fillStyle = f >= 1 ? '#8dffc0' : `rgba(141,255,192,${0.15 + f * 0.4})`;
    ctx.beginPath(); ctx.arc(bx + (i - (SUPPLY_MAX - 1) / 2) * 0.24 * S, by - 0.13 * S, 0.065 * S, 0, Math.PI * 2); ctx.fill();
  }
}
function drawDropperMarker(bx, by) {
  const m = 26, x = Math.min(vp.vw - m, Math.max(m, bx)), y = Math.min(vp.vh - 110, Math.max(160, by));
  const a = Math.atan2(by - y, bx - x);
  ctx.save(); ctx.translate(x, y);
  ctx.fillStyle = '#3a2658'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(0, 0, 14, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#8dffc0'; ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI * 2); ctx.fill();
  ctx.rotate(a); ctx.fillStyle = '#3a2658';
  ctx.beginPath(); ctx.moveTo(24, 0); ctx.lineTo(15, -6); ctx.lineTo(15, 6); ctx.closePath(); ctx.fill();
  ctx.restore();
}

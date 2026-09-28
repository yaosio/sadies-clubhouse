// Sadie's barn, and the rope she drags it with. A red barn with a gray roofline (her colors),
// cat ears on the roof, a cat-face hayloft window with whiskers, a cat flap in the big door, a
// gray tail curling round the side, and her name over the door.
import { U } from '../config.js';
import { barn, OUTLINE, BARN_HALF } from '../core/barn.js';
import { sadie } from '../core/sadie/brain.js';
import { ctx, cam, vp, sxf, syf } from './view.js';
import { drawChooterInWindow } from './chooterView.js';

const C = { red: '#c8463d', door: '#a8373a', plank: 'rgba(80,16,30,0.22)', trim: '#fff6ea', roof: '#8f8a9b', white: '#fffaf3',
  pink: '#f4a7b6', ink: '#3a2658', glow: '#ffd98a', hay: '#f2cf63', hayDark: '#c9a23a', rope: '#b5523b', flap: '#6b3040' };

function poly(pts) { ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); }

export function drawBarn(time) {
  const p = barn.piece; if (!p) return;
  const S = U * cam.z, ox = sxf((p.minX + p.maxX) / 2), oy = syf(p.minY);
  if (ox + 3.2 * S < 0 || ox - 3.2 * S > vp.vw || oy < -10 || oy - 4.6 * S > vp.vh) return;
  ctx.save();
  ctx.translate(ox, oy); ctx.scale(S, -S); // from here on: blocks, y up, bottom middle of the barn at 0,0
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const L = Math.max(1.5, 0.06 * S) / S; // outline width

  // tail curling up the right side (behind the wall)
  const tail = () => { ctx.beginPath(); ctx.moveTo(1.8, 0.5); ctx.quadraticCurveTo(3.0, 0.7, 2.6, 1.9); ctx.quadraticCurveTo(2.45, 2.25, 2.2, 2.15); };
  tail(); ctx.strokeStyle = C.ink; ctx.lineWidth = 0.3 + 2 * L; ctx.stroke();
  tail(); ctx.strokeStyle = C.roof; ctx.lineWidth = 0.3; ctx.stroke();

  // cat ears on the roof: white on the left, gray on the right, like hers
  for (const sd of [-1, 1]) {
    const ear = [[sd * 1.12, 3.45], [sd * 0.92, 4.4], [sd * 0.3, 3.8]];
    poly(ear); ctx.fillStyle = sd < 0 ? C.white : C.roof; ctx.fill(); ctx.strokeStyle = C.ink; ctx.lineWidth = L; ctx.stroke();
    poly([[sd * 1.0, 3.55], [sd * 0.9, 4.18], [sd * 0.5, 3.78]]); ctx.fillStyle = sd < 0 ? C.pink : '#d9a2b4'; ctx.fill();
  }

  // walls
  poly(OUTLINE); ctx.fillStyle = C.red; ctx.fill();
  ctx.save(); poly(OUTLINE); ctx.clip();
  ctx.strokeStyle = C.plank; ctx.lineWidth = 0.035; ctx.beginPath();
  for (let x = -1.8; x < 2; x += 0.4) { ctx.moveTo(x, 0); ctx.lineTo(x, 4); }
  ctx.stroke();
  ctx.restore();
  // white trim: corner boards and the hayloft floor line
  ctx.strokeStyle = C.trim; ctx.lineWidth = 0.12;
  ctx.beginPath(); ctx.moveTo(-1.93, 0.05); ctx.lineTo(-1.93, 2.35); ctx.moveTo(1.93, 0.05); ctx.lineTo(1.93, 2.35);
  ctx.moveTo(-1.93, 2.35); ctx.lineTo(1.93, 2.35); ctx.stroke();
  poly(OUTLINE); ctx.strokeStyle = C.ink; ctx.lineWidth = L; ctx.stroke();
  // gray roofline over the top
  const roof = () => { ctx.beginPath(); ctx.moveTo(-2.18, 2.28); ctx.lineTo(-1.52, 3.4); ctx.lineTo(0, 3.98); ctx.lineTo(1.52, 3.4); ctx.lineTo(2.18, 2.28); };
  roof(); ctx.strokeStyle = C.ink; ctx.lineWidth = 0.26 + 2 * L; ctx.stroke();
  roof(); ctx.strokeStyle = C.roof; ctx.lineWidth = 0.26; ctx.stroke();

  // side windows, lit up
  for (const sd of [-1, 1]) {
    const x = sd * 1.35;
    ctx.fillStyle = C.glow; ctx.fillRect(x - 0.28, 0.85, 0.56, 0.56);
    ctx.strokeStyle = C.trim; ctx.lineWidth = 0.08; ctx.strokeRect(x - 0.28, 0.85, 0.56, 0.56);
    ctx.beginPath(); ctx.moveTo(x, 0.85); ctx.lineTo(x, 1.41); ctx.moveTo(x - 0.28, 1.13); ctx.lineTo(x + 0.28, 1.13); ctx.stroke();
  }

  // big door with the white X, and a cat flap at the bottom
  ctx.fillStyle = C.door; ctx.fillRect(-0.75, 0, 1.5, 1.6);
  ctx.strokeStyle = C.trim; ctx.lineWidth = 0.1;
  ctx.strokeRect(-0.75, 0.05, 1.5, 1.55);
  ctx.beginPath(); ctx.moveTo(0, 0.05); ctx.lineTo(0, 1.6);
  for (const sd of [-1, 1]) { ctx.moveTo(sd * 0.72, 0.08); ctx.lineTo(sd * 0.03, 1.57); ctx.moveTo(sd * 0.03, 0.08); ctx.lineTo(sd * 0.72, 1.57); }
  ctx.stroke();
  ctx.beginPath(); ctx.roundRect(-0.24, 0.02, 0.48, 0.44, [0.2, 0.2, 0.03, 0.03]); ctx.fillStyle = C.flap; ctx.fill();
  ctx.strokeStyle = C.ink; ctx.lineWidth = L * 0.8; ctx.stroke();
  ctx.fillStyle = C.pink; // paw print on the flap
  ctx.beginPath(); ctx.ellipse(0, 0.18, 0.08, 0.06, 0, 0, Math.PI * 2); ctx.fill();
  for (const [x, y] of [[-0.09, 0.29], [-0.03, 0.32], [0.03, 0.32], [0.09, 0.29]]) { ctx.beginPath(); ctx.arc(x, y, 0.025, 0, Math.PI * 2); ctx.fill(); }

  // name board over the door
  ctx.fillStyle = C.trim; ctx.beginPath(); ctx.roundRect(-0.72, 1.72, 1.44, 0.42, 0.08); ctx.fill();
  ctx.strokeStyle = C.ink; ctx.lineWidth = L * 0.8; ctx.stroke();
  ctx.save(); ctx.scale(1, -1);
  ctx.fillStyle = C.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = '800 0.3px "Baloo 2", ui-rounded, system-ui, sans-serif'; ctx.fillText('SADIE', 0, -1.92);
  ctx.restore();

  // hayloft window shaped like a cat's head, lit up, with hay poking out and whiskers either side
  const head = () => {
    ctx.beginPath(); ctx.arc(0, 2.92, 0.36, -0.95, Math.PI + 0.95, true);
    ctx.lineTo(-0.3, 3.4); ctx.lineTo(-0.12, 3.22); ctx.lineTo(0.12, 3.22); ctx.lineTo(0.3, 3.4); ctx.closePath();
  };
  head(); ctx.fillStyle = C.glow; ctx.fill();
  ctx.save(); head(); ctx.clip();
  drawChooterInWindow(time); // a friend at home pokes his head up over the hay
  ctx.fillStyle = C.hay; ctx.fillRect(-0.4, 2.5, 0.8, 0.2);
  ctx.strokeStyle = C.hayDark; ctx.lineWidth = 0.035; ctx.beginPath();
  for (let k = -3; k <= 3; k++) { ctx.moveTo(k * 0.1, 2.56); ctx.lineTo(k * 0.12 + 0.03, 2.74); }
  ctx.stroke();
  ctx.restore();
  head(); ctx.strokeStyle = C.trim; ctx.lineWidth = 0.09; ctx.stroke();
  ctx.strokeStyle = C.trim; ctx.lineWidth = 0.04; ctx.beginPath();
  for (const sd of [-1, 1]) for (let k = -1; k <= 1; k++) { ctx.moveTo(sd * 0.45, 2.85 + k * 0.06); ctx.lineTo(sd * 0.85, 2.85 + k * 0.14); }
  ctx.stroke();
  ctx.restore();
}

// The rope from Sadie's mouth to a ring on the barn wall while she drags it: sagging when it's
// slack, pulled tight while she heaves.
export function drawRope() {
  const t = sadie.trip, p = barn.piece;
  if (!t || t.phase !== 'haul' || !p) return;
  const bx = (p.minX + p.maxX) / 2, sd = Math.sign(sadie.x - bx) || 1;
  const x0 = sxf(sadie.x + sadie.dir * 0.55 * U), y0 = syf(sadie.y + 0.6 * U);
  const x1 = sxf(bx + sd * BARN_HALF), y1 = syf(p.minY + 1.5 * U);
  const sag = (sadie.heave ? 0.05 : 0.45) * U * cam.z;
  const draw = () => { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.quadraticCurveTo((x0 + x1) / 2, Math.max(y0, y1) + sag, x0, y0); };
  const w = Math.max(2, 0.09 * U * cam.z);
  ctx.lineCap = 'round';
  draw(); ctx.strokeStyle = C.ink; ctx.lineWidth = w + 2; ctx.stroke();
  draw(); ctx.strokeStyle = C.rope; ctx.lineWidth = w; ctx.stroke();
  ctx.fillStyle = '#e0b43c'; ctx.strokeStyle = C.ink; ctx.lineWidth = 1.5; // the ring
  ctx.beginPath(); ctx.arc(x1, y1, Math.max(3, 0.12 * U * cam.z), 0, Math.PI * 2); ctx.fill(); ctx.stroke();
}

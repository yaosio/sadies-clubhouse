// The map strip: outline of the whole pile, hay, Sadie's barn, Sadie, the dropper, and the current view.
// Tap or drag on it to send the dropper there and look at that spot.
import { U, W } from '../config.js';
import { world } from '../core/world.js';
import { surf, SURF_N, SURF_RES } from '../core/surface.js';
import { drp, sendHeldTo } from '../core/dropper.js';
import { sadie } from '../core/sadie/brain.js';
import { barn } from '../core/barn.js';
import { cam, vp, clampCam, setFollow } from '../render/view.js';

const miniEl = document.getElementById('mini'), mcv = document.getElementById('miniCv'), mctx = mcv.getContext('2d');
export function drawMini(time) {
  const r = mcv.getBoundingClientRect(); const w = r.width, h = r.height;
  if (mcv.width !== Math.round(w * vp.dpr)) { mcv.width = Math.round(w * vp.dpr); mcv.height = Math.round(h * vp.dpr); }
  mctx.setTransform(vp.dpr, 0, 0, vp.dpr, 0, 0); mctx.clearRect(0, 0, w, h);
  const pad = 6, iw = w - pad * 2, ih = h - pad * 2;
  let maxH = 8 * U; for (let i = 0; i < SURF_N; i++) if (surf[i] + 2 * U > maxH) maxH = surf[i] + 2 * U;
  for (const s of world.hay) if (s.y + U > maxH) maxH = s.y + U;
  const mx = x => pad + x / W * iw, my = y => pad + ih - y / maxH * ih;
  const ink = getComputedStyle(document.documentElement).getPropertyValue('--ink').trim() || '#2a1840';
  mctx.fillStyle = ink; mctx.globalAlpha = 0.28;
  mctx.beginPath(); mctx.moveTo(mx(0), my(0));
  for (let i = 0; i < SURF_N; i += 2) mctx.lineTo(mx(i * SURF_RES), my(surf[i]));
  mctx.lineTo(mx(W), my(0)); mctx.closePath(); mctx.fill();
  mctx.globalAlpha = 1;
  for (const s of world.hay) {
    if (s.eaten) continue;
    mctx.beginPath(); mctx.arc(mx(s.x), my(s.y), 2.8, 0, Math.PI * 2);
    mctx.fillStyle = s === sadie.target ? '#ff4f86' : '#e0b43c'; mctx.fill();
  }
  if (barn.piece) { // a little red house
    const B = barn.piece, x0 = mx(B.minX), x1 = mx(B.maxX), y0 = my(B.minY), yw = my(B.minY + 2.4 * U), yt = my(B.maxY);
    mctx.fillStyle = '#c8463d'; mctx.strokeStyle = ink; mctx.lineWidth = 1;
    mctx.beginPath(); mctx.moveTo(x0, y0); mctx.lineTo(x1, y0); mctx.lineTo(x1, yw); mctx.lineTo((x0 + x1) / 2, Math.min(yt, yw - 3)); mctx.lineTo(x0, yw); mctx.closePath();
    mctx.fill(); mctx.stroke();
  }
  const half = vp.vw / 2 / cam.z;
  mctx.strokeStyle = ink; mctx.globalAlpha = 0.6; mctx.lineWidth = 1.5;
  mctx.strokeRect(mx(cam.x - half), pad - 2, (2 * half) / W * iw, ih + 4);
  mctx.globalAlpha = 1;
  mctx.fillStyle = '#fff1d0'; mctx.strokeStyle = ink; mctx.lineWidth = 1.5;
  mctx.beginPath(); mctx.arc(mx(sadie.x), my(sadie.y) - 3, 3.5, 0, Math.PI * 2); mctx.fill(); mctx.stroke();
  { const x = mx(drp.x); mctx.fillStyle = '#3a2658';
    mctx.beginPath(); mctx.moveTo(x - 5, pad - 1); mctx.lineTo(x + 5, pad - 1); mctx.lineTo(x, pad + 6); mctx.closePath(); mctx.fill(); }
}
function miniToX(e) { const r = mcv.getBoundingClientRect(); return Math.min(1, Math.max(0, (e.clientX - r.left - 6) / (r.width - 12))) * W; }
let miniDown = false;
function miniGo(e) { const x = miniToX(e); sendHeldTo(x); setFollow(false); cam.x = x; clampCam(); }
miniEl.addEventListener('pointerdown', e => { miniDown = true; miniEl.setPointerCapture(e.pointerId); miniGo(e); });
miniEl.addEventListener('pointermove', e => { if (miniDown) miniGo(e); });
['pointerup', 'pointercancel'].forEach(ev => miniEl.addEventListener(ev, () => { miniDown = false; }));

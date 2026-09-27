// The map strip: outline of the pile down to the lowest point of the bedrock (with the bedrock at the
// bottom), hay, Sadie's barn, her friends, Sadie, the mole, and the current view.
// Tap or drag on it to look at that spot.
import { U, W } from '../config.js';
import { world } from '../core/world.js';
import { surf, rock, rockInfo, SURF_N, SURF_RES } from '../core/surface.js';
import { drp } from '../core/dropper.js';
import { sadie } from '../core/sadie/brain.js';
import { barn } from '../core/barn.js';
import { chooterMapSpot } from '../render/chooterView.js';
import { cam, vp, clampCam, setFollow } from '../render/view.js';

const miniEl = document.getElementById('mini'), mcv = document.getElementById('miniCv'), mctx = mcv.getContext('2d');
export function drawMini(time) {
  const r = mcv.getBoundingClientRect(); const w = r.width, h = r.height;
  if (mcv.width !== Math.round(w * vp.dpr)) { mcv.width = Math.round(w * vp.dpr); mcv.height = Math.round(h * vp.dpr); }
  mctx.setTransform(vp.dpr, 0, 0, vp.dpr, 0, 0); mctx.clearRect(0, 0, w, h);
  const pad = 6, iw = w - pad * 2, ih = h - pad * 2;
  const base = Math.max(0, rockInfo.low - U);
  let maxH = base + 8 * U; for (let i = 0; i < SURF_N; i++) if (surf[i] + 2 * U > maxH) maxH = surf[i] + 2 * U;
  for (const s of world.hay) if (s.y + U > maxH) maxH = s.y + U;
  const mx = x => pad + x / W * iw, my = y => pad + ih - Math.max(0, y - base) / (maxH - base) * ih;
  const ink = getComputedStyle(document.documentElement).getPropertyValue('--ink').trim() || '#2a1840';
  const outline = (h, color, alpha) => {
    mctx.fillStyle = color; mctx.globalAlpha = alpha;
    mctx.beginPath(); mctx.moveTo(mx(0), my(base));
    for (let i = 0; i < SURF_N; i += 2) mctx.lineTo(mx(i * SURF_RES), my(h[i]));
    mctx.lineTo(mx(W), my(base)); mctx.closePath(); mctx.fill();
  };
  outline(surf, ink, 0.28);
  if (rockInfo.high > 0) outline(rock, '#9a5f86', 0.8);
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
  const ch = chooterMapSpot(); // Chooter: a black dot (none while he's inside the barn)
  if (ch && !ch.home) { mctx.fillStyle = '#2d2733'; mctx.strokeStyle = '#fff'; mctx.lineWidth = 1; mctx.beginPath(); mctx.arc(mx(ch.x), my(ch.y) - 3, 3.2, 0, Math.PI * 2); mctx.fill(); mctx.stroke(); }
  mctx.fillStyle = '#fff1d0'; mctx.strokeStyle = ink; mctx.lineWidth = 1.5;
  mctx.beginPath(); mctx.arc(mx(sadie.x), my(sadie.y) - 3, 3.5, 0, Math.PI * 2); mctx.fill(); mctx.stroke();
  { const x = mx(drp.x); mctx.fillStyle = '#6b5560'; // the mole
    mctx.beginPath(); mctx.moveTo(x - 5, pad - 1); mctx.lineTo(x + 5, pad - 1); mctx.lineTo(x, pad + 6); mctx.closePath(); mctx.fill(); }
}
function miniToX(e) { const r = mcv.getBoundingClientRect(); return Math.min(1, Math.max(0, (e.clientX - r.left - 6) / (r.width - 12))) * W; }
let miniDown = false;
function miniGo(e) { const x = miniToX(e); setFollow(false); cam.x = x; clampCam(); }
miniEl.addEventListener('pointerdown', e => { miniDown = true; miniEl.setPointerCapture(e.pointerId); miniGo(e); });
miniEl.addEventListener('pointermove', e => { if (miniDown) miniGo(e); });
['pointerup', 'pointercancel'].forEach(ev => miniEl.addEventListener(ev, () => { miniDown = false; }));

// Touch and mouse on the game board: drag the dropper, tap it to rotate, tap elsewhere to send it
// there, drag to look around, pinch or scroll to zoom. Tapping a character opens their thought
// bubble; while it's open, a tap anywhere else just closes it.
import { U } from '../config.js';
import { world } from '../core/world.js';
import { drp, heldOffsets, NO_PIECE, clampHeld, touchPiece, rotateHeld, sendHeldTo } from '../core/dropper.js';
import { cv, cam, toWorld, clampCam, setFollow } from '../render/view.js';
import { isAiming, throwAt } from '../ui/toybox.js';
import { mindAt, showThoughts, hideThoughts, thoughtsFor } from '../ui/thoughts.js';

const pointers = new Map();
let mode = null, dragOff = 0, pinch = null, pieceTap = null, panTap = null;
function hitHeld(w) {
  const o = world.held ? heldOffsets(world.held, world.held.tAng) : NO_PIECE, m = U * 0.9;
  return w.x > drp.x + o.x0 - m && w.x < drp.x + o.x1 + m && w.y > drp.y + o.y0 - m && w.y < drp.y + o.y1 + 1.4 * U;
}
function localXY(e) { const r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
cv.addEventListener('pointerdown', e => {
  cv.setPointerCapture(e.pointerId);
  const p = localXY(e); pointers.set(e.pointerId, { x: p.x, y: p.y });
  if (pointers.size === 1) {
    const w = toWorld(p.x, p.y);
    if (hitHeld(w) && !isAiming()) { mode = 'piece'; world.holdingDropper = true; dragOff = drp.tX - w.x; pieceTap = { x: p.x, y: p.y, t: performance.now(), moved: false }; }
    else { mode = 'pan'; cv.classList.add('dragging'); panTap = { x: p.x, y: p.y, t: performance.now(), moved: false }; }
  } else if (pointers.size === 2) {
    const [a, b] = [...pointers.values()];
    pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 };
    mode = 'pinch'; world.holdingDropper = false; pieceTap = null; panTap = null; setFollow(false);
  }
});
cv.addEventListener('pointermove', e => {
  const prev = pointers.get(e.pointerId); if (!prev) return;
  const p = localXY(e);
  if (mode === 'piece') {
    const w = toWorld(p.x, p.y);
    if (pieceTap && Math.hypot(p.x - pieceTap.x, p.y - pieceTap.y) > 8) pieceTap.moved = true;
    if (!pieceTap || pieceTap.moved) { drp.tX = w.x + dragOff; clampHeld(); touchPiece(); }
  } else if (mode === 'pan') {
    if (panTap && Math.hypot(p.x - panTap.x, p.y - panTap.y) > 8) panTap.moved = true;
    if (panTap && !panTap.moved) return;
    const dx = p.x - prev.x, dy = p.y - prev.y;
    if (dx || dy) { cam.x -= dx / cam.z; cam.y += dy / cam.z; setFollow(false); clampCam(); }
  } else if (mode === 'pinch') {
    prev.x = p.x; prev.y = p.y;
    const [a, b] = [...pointers.values()];
    const d = Math.hypot(a.x - b.x, a.y - b.y), mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    const before = toWorld(pinch.mx, pinch.my);
    cam.z *= d / Math.max(1, pinch.d); clampCam();
    const after = toWorld(mx, my);
    cam.x += before.x - after.x; cam.y += before.y - after.y; clampCam();
    pinch = { d, mx, my };
    return;
  }
  prev.x = p.x; prev.y = p.y;
});
function endPointer(e) {
  if (!pointers.has(e.pointerId)) return;
  pointers.delete(e.pointerId);
  if (mode === 'piece' && pieceTap && !pieceTap.moved && performance.now() - pieceTap.t < 350) rotateHeld(-1);
  if (mode === 'pan' && panTap && !panTap.moved && performance.now() - panTap.t < 350 && pointers.size === 0) {
    const w = toWorld(panTap.x, panTap.y), who = isAiming() ? null : mindAt(w);
    if (isAiming()) throwAt(w.x, w.y); // a toy picked from the toy box gets thrown there
    else if (who) { if (who === thoughtsFor()) hideThoughts(); else showThoughts(who); }
    else if (thoughtsFor()) hideThoughts();
    else sendHeldTo(w.x);
  }
  if (pointers.size === 1 && mode === 'pinch') { mode = 'pan'; }
  if (pointers.size === 0) { mode = null; pieceTap = null; world.holdingDropper = false; cv.classList.remove('dragging'); }
}
cv.addEventListener('pointerup', endPointer);
cv.addEventListener('pointercancel', endPointer);
cv.addEventListener('wheel', e => {
  e.preventDefault();
  const p = localXY(e), before = toWorld(p.x, p.y);
  cam.z *= Math.exp(-e.deltaY * 0.0015); clampCam();
  const after = toWorld(p.x, p.y);
  cam.x += before.x - after.x; cam.y += before.y - after.y; clampCam();
  setFollow(false);
}, { passive: false });

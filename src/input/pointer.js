// Touch and mouse on the game board: drag to look around, pinch or scroll to zoom, tap a character
// (Sadie, Chooter, the mole) for their thought bubble; a tap anywhere else closes it. The mole
// decides where pieces go, so there's nothing to steer.
import { cv, cam, camState, toWorld, clampCam, setFollow } from '../render/view.js';
import { isAiming, throwAt } from '../ui/toybox.js';
import { mindAt, showThoughts, hideThoughts, thoughtsFor } from '../ui/thoughts.js';

const pointers = new Map();
let mode = null, pinch = null, panTap = null;
function localXY(e) { const r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
cv.addEventListener('pointerdown', e => {
  cv.setPointerCapture(e.pointerId);
  const p = localXY(e); pointers.set(e.pointerId, { x: p.x, y: p.y });
  camState.held = true;
  if (pointers.size === 1) { mode = 'pan'; cv.classList.add('dragging'); panTap = { x: p.x, y: p.y, t: performance.now(), moved: false }; }
  else if (pointers.size === 2) {
    const [a, b] = [...pointers.values()];
    pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 };
    mode = 'pinch'; panTap = null; setFollow(false);
  }
});
cv.addEventListener('pointermove', e => {
  const prev = pointers.get(e.pointerId); if (!prev) return;
  const p = localXY(e);
  if (mode === 'pan') {
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
  if (mode === 'pan' && panTap && !panTap.moved && performance.now() - panTap.t < 350 && pointers.size === 0) {
    const w = toWorld(panTap.x, panTap.y), who = isAiming() ? null : mindAt(w);
    if (isAiming()) throwAt(w.x, w.y); // a toy picked from the toy box gets thrown there
    else if (who) { if (who === thoughtsFor()) hideThoughts(); else showThoughts(who); }
    else hideThoughts();
  }
  if (pointers.size === 1 && mode === 'pinch') { mode = 'pan'; }
  if (pointers.size === 0) { mode = null; cv.classList.remove('dragging'); camState.held = false; }
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

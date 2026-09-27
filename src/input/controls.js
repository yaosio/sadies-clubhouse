// On-screen buttons (move, rotate, drop, follow Sadie) and keyboard shortcuts.
import { U } from '../config.js';
import { moveHeld, rotateHeld, dropHeld } from '../core/dropper.js';
import { cam, vp, clampCam, setFollow } from '../render/view.js';
import { isSheetOpen, closeSheet } from '../ui/devPanel.js';
import { prof, setPerf } from '../ui/perf.js';

function holdRepeat(btn, fn) {
  let t1 = null, t2 = null;
  const stop = () => { clearTimeout(t1); clearInterval(t2); btn.classList.remove('held'); };
  btn.addEventListener('pointerdown', e => { e.preventDefault(); fn(); btn.classList.add('held'); t1 = setTimeout(() => { t2 = setInterval(fn, 70); }, 240); });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => btn.addEventListener(ev, stop));
  btn.addEventListener('click', e => { if (e.detail === 0) fn(); }); // keyboard activation
}
holdRepeat(document.getElementById('leftBtn'), () => moveHeld(-U / 2));
holdRepeat(document.getElementById('rightBtn'), () => moveHeld(U / 2));
document.getElementById('ccwBtn').addEventListener('click', () => rotateHeld(1));
document.getElementById('cwBtn').addEventListener('click', () => rotateHeld(-1));
document.getElementById('dropBtn').addEventListener('click', () => dropHeld(false));
document.getElementById('topBtn').addEventListener('click', () => setFollow(true));

window.addEventListener('keydown', e => {
  if (isSheetOpen() && e.key !== 'Escape') return;
  const k = e.key;
  if (k === 'ArrowLeft' || k === 'a' || k === 'A') moveHeld(-U / 2);
  else if (k === 'ArrowRight' || k === 'd' || k === 'D') moveHeld(U / 2);
  else if ((k === 'ArrowUp' || k === 'w' || k === 'W' || k === 'x' || k === 'X') && !e.repeat) rotateHeld(-1);
  else if ((k === 'z' || k === 'Z' || k === 'q' || k === 'Q') && !e.repeat) rotateHeld(1);
  else if ((k === ' ' || k === 'ArrowDown' || k === 's' || k === 'S') && !e.repeat) dropHeld(false);
  else if (k === 't' || k === 'T' || k === 'Home') setFollow(true);
  else if (k === 'p' || k === 'P') setPerf(!prof.on);
  else if (k === 'PageUp') { cam.y += vp.vh * 0.4 / cam.z; setFollow(false); clampCam(); }
  else if (k === 'PageDown') { cam.y -= vp.vh * 0.4 / cam.z; setFollow(false); clampCam(); }
  else if (k === '+' || k === '=') { cam.z *= 1.15; setFollow(false); clampCam(); }
  else if (k === '-' || k === '_') { cam.z /= 1.15; setFollow(false); clampCam(); }
  else if (k === 'Escape') closeSheet();
  else return;
  e.preventDefault();
});

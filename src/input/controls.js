// The Follow Sadie button and keyboard shortcuts. (On screen, the dropper is moved by tapping the
// board: see pointer.js.)
import { U } from '../config.js';
import { moveHeld, rotateHeld, dropHeld } from '../core/dropper.js';
import { cam, vp, clampCam, setFollow } from '../render/view.js';
import { isSheetOpen, closeSheet } from '../ui/devPanel.js';
import { prof, setPerf } from '../ui/perf.js';

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

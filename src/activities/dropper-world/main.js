// Starting point: load the UI pieces, size the canvas, pick up the saved game (or start a board),
// keep saving it, run the loop.
import { U } from './config.js';
import { world } from './core/world.js';
import { resetGame } from './core/game.js';
import { loadGame, saveGame } from './core/save.js';
import { surfAt, groundAt } from './core/surface.js';
import { sadie } from './core/sadie/brain.js';
import { chooter, peekSpot } from './core/friends/chooter.js';
import { toy } from './core/toys.js';
import { mole } from './core/mole.js';
import { drp } from './core/dropper.js';
import { cv, cam, vp, camState, resize, setFollow, sxf, syf } from './render/view.js';
import { watching } from './ui/dashboard.js';
import { on } from './core/events.js';
import { applySettings } from './ui/devPanel.js';
import './ui/dashboard.js';
import './ui/toybox.js';
import './ui/help.js';
import './ui/perf.js';
import './input/pointer.js';
import './input/controls.js';
import { frame } from './loop.js';
import { draw } from './render/scene.js';

on('reset', () => setFollow(true));
// the board's size, whatever the frame around it does; drawn again at once, so it never flashes black
new ResizeObserver(() => { if (resize()) draw(performance.now()); }).observe(document.getElementById('board'));

// the top strip leaves room for the clubhouse's ESC BACK key (it sits over the strip's left end)
const back = document.getElementById('clubBack'), top = document.querySelector('.top');
if (back) new ResizeObserver(() => document.getElementById('app').style.setProperty('--back-w',
  Math.max(0, Math.ceil(back.getBoundingClientRect().right - top.getBoundingClientRect().left)) + 'px')).observe(back);

resize();
cam.z = camState.fitZ;
applySettings();
if (!loadGame()) resetGame();
cam.y = (vp.vh / 2 - 120) / cam.z;
cam.x = sadie.x; cam.y = Math.max(cam.y, sadie.y); // start looking at Sadie, wherever she was left
requestAnimationFrame(frame);

// Save once a minute, and whenever the page is hidden or closed (switching apps on a phone
// counts, and is often the last chance). Those are the saves that matter; the timed one only
// covers a crash. A full board's save (about 200 KB) costs a slow phone a frame or two, so not
// more often than this.
setInterval(saveGame, 60000);
document.addEventListener('visibilitychange', () => { if (document.hidden) saveGame(); });
window.addEventListener('pagehide', saveGame);

// For automated testing in a browser.
// sx/sy: where on the page (for tapping), the board being inside the frame.
const px = x => cv.getBoundingClientRect().left + sxf(x), py = y => cv.getBoundingClientRect().top + syf(y);
window.__jellyDebug = () => ({ time: world.gameTime, cx: sadie.x / U, cy: sadie.y / U, ground: groundAt(sadie.x, sadie.y) / U, state: sadie.state, mood: sadie.mood,
  tx: sadie.target ? sadie.target.x / U : null, ty: sadie.target ? sadie.target.y / U : null, follow: camState.follow, camx: cam.x / U,
  sx: px(sadie.x), sy: py(sadie.y + 0.6 * U), supply: world.supply, pieces: world.pieces.length, hay: world.hayEaten, hayOut: world.hay.filter(h => !h.eaten).map(h => h.st || 'float'), moleHay: drp.hay !== null, trip: sadie.trip ? sadie.trip.phase : null, doing: sadie.doing, feel: sadie.feel,
  mole: { x: drp.x / U, y: drp.y / U, sx: px(drp.x), sy: py(drp.y + 1.2 * U), doing: mole.doing, who: mole.whoName, tired: mole.feel.tired, napping: mole.napping, strain: mole.strain },
  chooter: chooter.met ? { x: chooter.x / U, y: chooter.y / U, place: chooter.place, doing: chooter.doing, feel: chooter.feel, mood: chooter.mood } : null, toy: toy.state,
  peek: chooter.met ? null : { heard: chooter.heard, out: chooter.peek, x: peekSpot().x / U, y: peekSpot().y / U, sx: px(peekSpot().x), sy: py(peekSpot().y) },
  watching: watching() === sadie ? 'Sadie' : watching() === chooter ? 'Chooter' : watching() === mole ? 'Mole' : null,
  dash: ['dashName', 'dashMood', 'dashDoing', 'feelLabel', 'dashWhy'].map(id => document.getElementById(id).textContent).join('\n') });
// Point the camera somewhere (in blocks; z = zoom compared to normal), for screenshots.
window.__jellyFollow = () => setFollow(true);
window.__jellyLook = (x, y, z = 1) => { setFollow(false); cam.x = x * U; cam.y = y * U; cam.z = camState.fitZ * z; };

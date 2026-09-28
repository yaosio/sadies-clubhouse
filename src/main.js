// Starting point: load the UI pieces, size the canvas, pick up the saved game (or start a board),
// keep saving it, run the loop.
import { U } from './config.js';
import { world } from './core/world.js';
import { resetGame } from './core/game.js';
import { loadGame, saveGame } from './core/save.js';
import { surfAt, groundAt } from './core/surface.js';
import { sadie } from './core/sadie/brain.js';
import { chooter } from './core/friends/chooter.js';
import { toy } from './core/toys.js';
import { mole } from './core/mole.js';
import { drp } from './core/dropper.js';
import { cam, vp, camState, resize, setFollow, sxf, syf } from './render/view.js';
import { on } from './core/events.js';
import { applySettings } from './ui/devPanel.js';
import './ui/hud.js';
import './ui/toybox.js';
import './ui/perf.js';
import './input/pointer.js';
import './input/controls.js';
import { frame } from './loop.js';

on('reset', () => setFollow(true));
window.addEventListener('resize', resize);

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
window.__jellyDebug = () => ({ cx: sadie.x / U, cy: sadie.y / U, ground: groundAt(sadie.x, sadie.y) / U, state: sadie.state, mood: sadie.mood,
  tx: sadie.target ? sadie.target.x / U : null, ty: sadie.target ? sadie.target.y / U : null, follow: camState.follow, camx: cam.x / U,
  sx: sxf(sadie.x), sy: syf(sadie.y + 0.6 * U), supply: world.supply, pieces: world.pieces.length, hay: world.hayEaten, trip: sadie.trip ? sadie.trip.phase : null, doing: sadie.doing, feel: sadie.feel,
  mole: { x: drp.x / U, y: drp.y / U, sx: sxf(drp.x), sy: syf(drp.y + 1.2 * U), doing: mole.doing, who: mole.whoName, tired: mole.feel.tired, napping: mole.napping, strain: mole.strain },
  chooter: chooter.met ? { x: chooter.x / U, y: chooter.y / U, place: chooter.place, doing: chooter.doing, feel: chooter.feel, mood: chooter.mood } : null, toy: toy.state });
// Point the camera somewhere (in blocks; z = zoom compared to normal), for screenshots.
window.__jellyLook = (x, y, z = 1) => { setFollow(false); cam.x = x * U; cam.y = y * U; cam.z = camState.fitZ * z; };

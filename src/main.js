// Starting point: load the UI pieces, size the canvas, start a board, run the loop.
import { U } from './config.js';
import { world } from './core/world.js';
import { resetGame } from './core/game.js';
import { surfAt, groundAt } from './core/surface.js';
import { sadie } from './core/sadie/brain.js';
import { cam, vp, camState, resize, setFollow } from './render/view.js';
import { on } from './core/events.js';
import { applySettings } from './ui/devPanel.js';
import './ui/hud.js';
import './ui/perf.js';
import './input/pointer.js';
import './input/controls.js';
import { frame } from './loop.js';

on('reset', () => setFollow(true));
window.addEventListener('resize', resize);

resize();
cam.z = camState.fitZ;
applySettings();
resetGame();
cam.y = (vp.vh / 2 - 120) / cam.z;
requestAnimationFrame(frame);

// For automated testing in a browser.
window.__jellyDebug = () => ({ cx: sadie.x / U, cy: sadie.y / U, ground: groundAt(sadie.x, sadie.y) / U, state: sadie.state, mood: sadie.mood,
  tx: sadie.target ? sadie.target.x / U : null, ty: sadie.target ? sadie.target.y / U : null, follow: camState.follow, camx: cam.x / U,
  supply: world.supply, pieces: world.pieces.length, stars: world.stars.filter(s => s.got).length });

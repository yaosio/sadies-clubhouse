// Saving and loading the game: the whole board (every piece exactly as it's squished), Sadie, her
// barn, the hay, the dropper and Chooter. Saved in the browser (platform/storage.js), so each
// device and browser keeps its own game. main.js decides when to save.
//
// Two ways to clear it: clearTower() starts a fresh board but Sadie keeps her friends and bests;
// startOver() forgets everything, as if the game had never been played here.
//
// If a save can't be read (from an older version of the game, or damaged), the game just starts
// fresh rather than breaking. Bump SAVE_VERSION when the format changes in a way old saves can't
// be loaded into.
import { U, W } from '../config.js';
import { store } from '../platform/storage.js';
import { world } from './world.js';
import { emit } from './events.js';
import { SHAPES } from './physics/pieceTypes.js';
import { makePiece, aabb } from './physics/body.js';
import { getTemplate } from './physics/templates.js';
import { computeSurface } from './surface.js';
import { trail } from './hay.js';
import { drp, clampHeld } from './dropper.js';
import { barn, resetBarn } from './barn.js';
import { sadie, freshFeelings } from './sadie/brain.js';
import { chooter } from './friends/chooter.js';
import { toy } from './toys.js';
import { resetGame } from './game.js';

export const SAVE_KEY = 'sadies-dropper-world.save'; // a name no other game on the same site will use
export const SAVE_VERSION = 1;
// everything else the game keeps in the browser that "Start over" forgets (dev settings stay)
const PROGRESS_KEYS = ['jellystack.best', 'jellystack.climbBest', 'sadie.chooter.met', 'sadie.chooter.movedIn'];

const r2 = v => Math.round(v * 100) / 100; // positions to 1/100 px: plenty, and keeps the save small
const pick = (o, keys) => { const out = {}; for (const k of keys) if (o[k] !== undefined) out[k] = o[k]; return out; };
const SADIE_KEYS = ['x', 'y', 'vy', 'dir', 'state', 'phase', 'climbAhead', 'run', 'running', 'feel'];
const CHOOTER_KEYS = ['place', 'doing', 'x', 'y', 'vx', 'vy', 'air', 'dir', 'phase', 'feel', 'windUp', 'outFor', 'restFor', 'zoomLen',
  'actT', 'spotT', 'spot', 'doorT', 'doorIn', 'doorX', 'hopT', 'pant'];

// ---------- the save itself: plain data, turned into text by storage ----------
export function snapshot() {
  const pieces = world.pieces.map(p => {
    if (p === barn.piece) return { barn: 1, x: r2((p.minX + p.maxX) / 2), y: r2(p.minY) };
    const s = { t: p.type, cs: p.T.cs, x: Array.from(p.x, r2), y: Array.from(p.y, r2), rest: r2(p.rest), age: r2(p.age || 0), avg: r2(p.avgSpeed || 0) };
    if (p.asleep) s.asleep = 1; else { s.vx = Array.from(p.x, (v, i) => r2(v - p.px[i])); s.vy = Array.from(p.y, (v, i) => r2(v - p.py[i])); s.still = r2(p.still); }
    if (p.fossil) s.fossil = 1;
    return s;
  });
  return {
    v: SAVE_VERSION,
    world: pick(world, ['hayEaten', 'supply', 'gameTime', 'lastInteract', 'spawnTimer', 'bag', 'nextType']),
    held: world.held && { type: world.held.type, cs: world.held.cs, ang: world.held.tAng },
    drp: { x: r2(drp.x), tX: r2(drp.tX), y: r2(drp.y) },
    pieces,
    hay: world.hay.filter(h => !h.eaten).map(h => h.carried ? { x: r2(h.x), y: r2(h.y0), y0: r2(h.y0) } : { x: r2(h.x), y: r2(h.y), y0: r2(h.y0) }), // snatched hay goes back to its spot
    trail: { x: trail.x, dir: trail.dir },
    sadie: pick(sadie, SADIE_KEYS),
    chooter: chooter.met ? pick(chooter, CHOOTER_KEYS) : null,
  };
}

// Put a saved game back on the board. Throws if the save doesn't make sense (loadGame catches it).
export function restore(s) {
  if (!s || s.v !== SAVE_VERSION || !Array.isArray(s.pieces)) throw new Error('not a save this version can read');
  resetGame();
  world.pieces = [];
  for (const q of s.pieces) {
    if (q.barn) { // the barn is rebuilt from its shape; only where it stands is saved
      resetBarn(q.x); const B = barn.piece;
      for (let i = 0; i < B.n; i++) { B.y[i] += q.y; B.py[i] = B.y[i]; }
      aabb(B); continue;
    }
    if (!(q.t in SHAPES)) throw new Error('unknown piece ' + q.t);
    const p = makePiece(q.t, q.cs, 0, 0, 0);
    if (q.x.length !== p.n || q.y.length !== p.n) throw new Error('piece shape changed');
    for (let i = 0; i < p.n; i++) {
      p.x[i] = q.x[i]; p.y[i] = q.y[i];
      p.px[i] = q.x[i] - (q.vx ? q.vx[i] : 0); p.py[i] = q.y[i] - (q.vy ? q.vy[i] : 0);
    }
    let sp = 0; if (q.vx) for (let i = 0; i < p.n; i++) sp += Math.abs(q.vx[i]) + Math.abs(q.vy[i]);
    Object.assign(p, { asleep: !!q.asleep, fossil: !!q.fossil, rest: q.rest || 0, age: q.age || 0, avgSpeed: q.avg || 0, still: q.still || 0, speed: sp / p.n });
    aabb(p); world.pieces.push(p);
  }
  if (!barn.piece || !world.pieces.includes(barn.piece)) resetBarn(W / 2 - 4.5 * U);
  Object.assign(world, s.world);
  world.fossils = world.pieces.filter(p => p.fossil).length;
  world.particles = []; world.emotes = [];
  world.held = s.held && s.held.type in SHAPES ? { type: s.held.type, cs: s.held.cs, T: getTemplate(s.held.type, s.held.cs), ang: s.held.ang, tAng: s.held.ang } : null;
  if (!(world.nextType in SHAPES)) world.nextType = 'O';
  world.bag = (world.bag || []).filter(t => t in SHAPES);
  Object.assign(drp, s.drp); clampHeld();
  computeSurface();
  world.hay = s.hay.map(h => ({ x: h.x, y: h.y, y0: h.y0, eaten: false, pop: 0, up: 0, down: 0 }));
  Object.assign(trail, s.trail);
  // Sadie picks up where she was, but any trip home, pacing or hay she was after starts over
  Object.assign(sadie, { feel: freshFeelings() }, s.sadie, { trip: null, heave: false, pace: null, waitT: 0, target: null, cheer: 0, scared: 0, doing: null });
  sadie.feel = Object.assign(freshFeelings(), sadie.feel);
  barn.hauling = false;
  if (s.chooter && chooter.met) {
    Object.assign(chooter, s.chooter);
    // halfway through a door or a dig: finish it; fetching a ball: the ball isn't saved
    if (chooter.place === 'door' || chooter.place === 'dig') { if (chooter.doorIn) chooter.place = 'home'; else chooter.place = 'out'; }
    if (chooter.doing === 'fetch' || chooter.doing === 'tease') chooter.doing = null; // the ball and any snatched hay aren't saved as held
    if (chooter.place === 'home') chooter.doing = 'home';
    chooter.carrying = false; chooter.loot = chooter.hay = null; chooter.ballDone = undefined;
    chooter.feel = Object.assign({ energy: 0, tired: 0, missing: 0, ignored: 0 }, chooter.feel);
  }
  toy.state = 'none';
  emit('nextChanged', world.nextType);
}

// ---------- the browser ----------
export function saveGame() { store.set(SAVE_KEY, snapshot()); }
// Returns true if a saved game was put back on the board.
export function loadGame() {
  const s = store.get(SAVE_KEY, null);
  if (!s) return false;
  try { restore(s); return true; }
  catch (e) { resetGame(); return false; }
}
// A fresh board. Sadie keeps her friends and her bests.
export function clearTower() { resetGame(); saveGame(); }
// Forget everything: the board, bests, friends. (The dev sheet's physics settings stay.)
export function startOver() {
  for (const k of [SAVE_KEY, ...PROGRESS_KEYS]) store.remove(k);
  world.best = 0; world.climbBest = 0; chooter.met = false; chooter.movedIn = false;
  resetGame();
}

// One simulation tick, in order, plus starting a fresh board. This is the only place that
// decides what runs when.
import { U, W, tuning } from '../config.js';
import { store } from '../platform/storage.js';
import { world } from './world.js';
import { emit } from './events.js';
import { physicsStep } from './physics/solver.js';
import { surf, computeSurface, groundAt, rock, rockInfo, SURF_RES } from './surface.js';
import { resetHay, updateHay } from './hay.js';
import { drp, SUPPLY_MAX, drawFromBag, spawn, updateDropper } from './dropper.js';
import { sadie, updateSadie, freshFeelings } from './sadie/brain.js';
import { updateMood } from './sadie/mood.js';
import { updateEffects } from './effects.js';
import { updateFossils } from './fossil.js';
import { resetBarn, updateBarn } from './barn.js';
import { resetChooter, updateChooter } from './friends/chooter.js';
import { toy, updateToy } from './toys.js';
import { updateDebug, stopRain } from './debug.js';
import { resetMole, updateMole } from './mole.js';
import { resetBedrock, updateBedrock } from './bedrock.js';

export const timing = { physMs: 0 }; // read by the performance overlay

export function resetGame() {
  world.pieces = []; world.held = null; world.bag = []; world.nextType = drawFromBag();
  drp.x = drp.tX = W / 2; drp.y = 3 * U; drp.claw = 0; world.spawnTimer = 0; world.particles = [];
  world.topAll = world.topSettled = 0; world.fossils = 0; world.supply = SUPPLY_MAX; resetBedrock(); surf.fill(0);
  resetBarn(W / 2 - 4.5 * U);
  Object.assign(sadie, { x: W / 2, y: 0, vy: 0, dir: 1, state: 'walk', phase: 0, target: null, cheer: 0, pace: null, waitT: 0, scared: 0, mood: 'neutral', run: 0, running: false,
    trip: null, heave: false, doing: null, feel: freshFeelings() });
  world.emotes = [];
  resetHay(sadie.x);
  resetChooter(); resetMole(); toy.state = 'none'; stopRain();
  spawn();
  emit('reset');
}

export function update(dt) {
  const now = typeof performance !== 'undefined' ? () => performance.now() : () => Date.now();
  const tp = now();
  physicsStep(world.pieces, tuning.P, dt, rockInfo.high > 0 ? rock : null, SURF_RES);
  timing.physMs += now() - tp;
  world.topAll = 0; world.topSettled = 0;
  for (const p of world.pieces) {
    p.rest = p.asleep || p.speed < 0.12 ? p.rest + dt : 0;
    p.age = (p.age || 0) + dt;
    p.avgSpeed = p.avgSpeed === undefined ? p.speed : p.avgSpeed + (p.speed - p.avgSpeed) * Math.min(1, dt * 6);
    if (p.maxY > world.topAll) world.topAll = p.maxY;
    if (p.rest > 0.5 && p.maxY > world.topSettled) world.topSettled = p.maxY;
  }
  if (world.topSettled / U > world.best + 0.05) { world.best = world.topSettled / U; store.set('jellystack.best', +world.best.toFixed(2)); }

  computeSurface();
  updateHay(dt);
  updateFossils(dt);
  updateBedrock(dt);
  updateSadie(dt);
  updateBarn(dt);
  updateChooter(dt);
  updateToy(dt);
  updateMood(dt);
  const standing = sadie.state !== 'climb' && Math.abs(sadie.y - groundAt(sadie.x, sadie.y)) < 0.1 * U;
  if (standing && sadie.y / U > world.climbBest + 0.05) { world.climbBest = sadie.y / U; store.set('jellystack.climbBest', +world.climbBest.toFixed(2)); }
  world.gameTime += dt;
  updateEffects(dt);
  updateMole(dt);
  updateDropper(dt);
  updateDebug(dt);
}

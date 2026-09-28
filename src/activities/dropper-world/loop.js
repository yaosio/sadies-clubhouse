// The main loop: the simulation runs in fixed 1/60 s steps (catching up at most 3 steps after a
// slow frame), then the camera moves and everything is drawn once. The dev sheet's speed setting
// runs that many steps for each one.
//
// Catching up only goes so far: once this frame's steps have taken BUDGET ms, or SHARE of a
// typical frame if that's more, the time still owed is dropped and the game runs a little slower
// instead, like an old console with too much on screen. Catching up in full during a big pile-up
// on a slow phone makes each frame slower than the one before, and the game stutters instead. (The
// share is so that where drawing is what makes frames slow, the physics still keeps up mostly.)
import { update, timing } from './core/game.js';
import { PSTATS } from './core/physics/solver.js';
import { updateCamera } from './render/view.js';
import { draw } from './render/scene.js';
import { drawThoughts } from './ui/thoughts.js';
import { recordFrame } from './ui/perf.js';
import { gameSpeed } from './core/debug.js';
import { feelStrain } from './core/mole.js';

const STEP = 1 / 60, BUDGET = 12, SHARE = 0.4; let acc = 0, lastT = performance.now(), typical = 16.7;
export function frame(t) {
  const frameGap = t - lastT;
  const dt = Math.min(0.1, frameGap / 1000); lastT = t; acc += dt;
  typical += (Math.min(100, frameGap) - typical) * 0.05;
  const t0 = performance.now(), budget = Math.max(BUDGET, SHARE * typical);
  timing.physMs = 0; PSTATS.pairs = 0; PSTATS.touching = 0;
  let steps = 0;
  const speed = gameSpeed(), maxSteps = speed > 1 ? 1 : 3; // sped up: no catching up, so a slow phone just runs a bit slower
  while (acc >= STEP && steps < maxSteps) {
    if (steps > 0) { const spent = performance.now() - t0; if (spent + spent / steps > budget) break; } // another step would go over
    for (let k = 0; k < speed; k++) update(STEP); acc -= STEP; steps++;
  }
  if (acc >= STEP) acc = 0; // couldn't catch up: let that time go
  const t1 = performance.now();
  // how much of the time the simulation is taking: too much and the mole gets tired (sped up in the dev sheet doesn't count)
  if (speed === 1 && frameGap > 0) feelStrain((t1 - t0) / frameGap, dt);
  updateCamera(STEP * steps);
  draw(t); drawThoughts();
  const t2 = performance.now();
  recordFrame(t, frameGap, t0, t1, t2, steps);
  requestAnimationFrame(frame);
}

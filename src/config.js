// World size and physics tuning. Tuning is ours to set (the dev panel), never the player's.
import { store } from './platform/storage.js';

export const U = 30;              // one block, in world pixels
export const COLS = 48;
export const W = COLS * U;        // board width
export const SUB = 2;             // lattice subdivisions per block
export const SUBSTEPS = 4;
export const ITERS = 2;

export const DEFAULTS = { stiffness: 0.6, bendy: 0.6, jiggle: 0.6, gravity: 1, friction: 0.6, stick: 0, size: 1 };
export function physParams(set) {
  return {
    k: 0.03 + 0.62 * set.stiffness * set.stiffness,
    kb: (1 - set.bendy) * 0.12,
    stick: set.stick,
    damp: 0.985 + set.jiggle * 0.0145,
    g: -1400 * set.gravity,
    mu: set.friction * 0.5,
  };
}

// Live tuning: `set` holds the dev panel values, `P` the solver numbers derived from them.
const saved = store.get('jellystack.settings3', {});
export const tuning = { set: Object.assign({}, DEFAULTS, saved), P: null };
tuning.P = physParams(tuning.set);
export function applyTuning() {
  tuning.P = physParams(tuning.set);
  store.set('jellystack.settings3', tuning.set);
}

// The paint shop's sounds, by name: the shop's (shop.js) and Sadie's (sadie.js); synth.js is what
// they're made with. Played on the clubhouse's sound system (src/shared/sound.js), which keeps its
// rules: never the same sound twice within its gap, Sadie's on the VOICES volume.
import { RATE } from './synth.js';
import * as shop from './shop.js';
import * as sadie from './sadie.js';

export const ALL = { ...shop, ...sadie };
const VOICES = new Set(Object.keys(sadie));
// (a stamp or a dip again so soon is let through, but never closer than this: no buzz from mashing)
const GAP = { pup: 0.15, plip: 0.15, tok: 0.15 };

// `h`: a handle on the sound system; each sound becomes h[name](o), o: `dist` (how far off it is)
export function makeSounds(h, volume = 0.45) {
  for (const [k, make] of Object.entries(ALL)) h[k] = (o = {}) => h.play(k, make, { loud: volume, rate: RATE, hold: 4, gap: GAP[k] ?? 0.3, bus: VOICES.has(k) ? 'voices' : 'sounds', ...o });
  return h;
}

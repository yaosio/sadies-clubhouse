// The paint shop's sounds, by name: the shop's (shop.js), Sadie's (sadie.js) and Chooter's (chooter.js: a recording), made with the
// toolbox's kit (src/shared/retro.js). Played on the clubhouse's sound system (src/shared/sound.js), which keeps its
// rules: never the same sound twice within its gap, Sadie's and Chooter's on the VOICES volume.
import { RATE } from '../../../shared/retro.js';
import { wrap } from '../../../shared/sound.js';
import * as shop from './shop.js';
import * as sadie from './sadie.js';
import * as chooter from './chooter.js';

export const ALL = { ...shop, ...sadie, ...chooter };
const VOICES = new Set([...Object.keys(sadie), ...Object.keys(chooter)]);
// (a stamp or a dip again so soon is let through, but never closer than this: no buzz from mashing)
const GAP = { pup: 0.15, plip: 0.15, tok: 0.15, woo: 1.2, woo2: 1.2 };

// `h`: a handle on the sound system; each sound becomes h[name](o), o: `at` (where it is: it fades
// the further off you are)
export function makeSounds(h, volume = 0.45) {
  const more = {};
  for (const [k, make] of Object.entries(ALL)) more[k] = (o = {}) => h.play(k, make, { loud: volume, rate: RATE, hold: 4, gap: GAP[k] ?? 0.3, bus: VOICES.has(k) ? 'voices' : 'sounds', ...o });
  return wrap(h, more);
}

// The barbershop's sounds, by name: Sadie's voice (sadie.js), the shop's small ones (shop.js) and
// the ball gown's music box (waltz.js), made with the toolbox's kit (src/shared/retro.js). Played on
// the clubhouse's sound system (src/shared/sound.js), which keeps its rules: never the same sound
// twice within its gap, Sadie's on the VOICES volume. Each plays once, when something happens.
import { RATE } from '../../../shared/retro.js';
import { wrap } from '../../../shared/sound.js';
import * as sadie from './sadie.js';
import * as shop from './shop.js';
import { waltz } from './waltz.js';

export const ALL = { ...sadie, ...shop, waltz };
const VOICES = new Set(['song', 'aha', 'mrrp']);
// (picking again so soon is let through, but never closer than this: no snipping buzz from mashing)
const GAP = { snip: 0.25 };

// `h`: a handle on the sound system; each sound becomes h[name](o), o: `at` (where it is: it fades
// the further off you are)
export function makeSounds(h, volume = 0.45) {
  const more = {};
  for (const [k, make] of Object.entries(ALL)) {
    more[k] = (o = {}) => h.play(k, make, { loud: volume, rate: RATE, hold: 4, gap: GAP[k] ?? 0.5, bus: VOICES.has(k) ? 'voices' : 'sounds', ...o });
  }
  return wrap(h, more);
}

// Clyde's house's sounds (made by the other files here, as plain numbers), by name.
// Each group has a file of its own: the machine's (machine.js), Sadie's (sadie.js), Clyde's (clyde.js)
// the chime when the treat lands (chime.js) and the weather machine's jingles (weather.js); synth.js is what they're made with. The same sound
// can't play twice within a tenth of a second (mashing a key never makes a buzz).
import { RATE } from './synth.js';
import { chime } from './chime.js';
import * as machine from './machine.js';
import * as sadie from './sadie.js';
import * as clyde from './clyde.js';
import * as weather from './weather.js';

// every sound, by name
export const ALL = { chime, ...machine, ...sadie, ...clyde, ...weather };

// `h`: a handle on the clubhouse's sound system (src/shared/sound.js), which plays them with its
// rules. 11 kHz samples, each held 4 times over at 44.1 kHz (no smoothing: it keeps its crunch).
// Sadie's and Clyde's are voices (the pause menu's VOICES volume); the rest are sounds.
const VOICES = new Set([...Object.keys(sadie), ...Object.keys(clyde)]);
export function makeSounds(h, volume = 0.45) {
  for (const [k, make] of Object.entries(ALL)) h[k] = () => h.play(k, make, { loud: volume, rate: RATE, hold: 4, gap: 0.1, bus: VOICES.has(k) ? 'voices' : 'sounds' });
  return h;
}

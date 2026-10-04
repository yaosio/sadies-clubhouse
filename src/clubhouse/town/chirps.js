// The town square's bird chirps: soft, short and rare. Each is one or two little notes (a rising
// peep, a falling "tew", a quick two-note "tee-tuu"), a different pitch for each bird, so no two
// sound alike and nothing ever ticks along in a steady beat. Plain numbers (8-bit, 11 kHz), played
// through the sound system (`docs/clubhouse/sound/system.md`).
// How often is decided by `chirpWhen` below, from the owner's rule (`docs/clubhouse/RULEBOOK.md`
// section 4): soft chirping is fine, but never loud or constant.
import { RATE, blank, tone, dry } from '../../shared/retro.js';

// the three shapes: [start Hz, end Hz, seconds, wobble] for each note, and when it starts
const SHAPES = [
  [[0, 2300, 3000, 0.1]],                                  // a rising peep
  [[0, 3100, 2200, 0.13]],                                 // a falling "tew"
  [[0, 2500, 3100, 0.07], [0.13, 3300, 2600, 0.09]],       // "tee-tuu"
];
export const VARIETY = SHAPES.length;

// bird `bird` (0 to 4) sings shape `shape` a little higher or lower than the others
export function chirp(bird, shape) {
  const pitch = 0.88 + bird * 0.07;
  const notes = SHAPES[shape % VARIETY];
  const a = blank(0.4);
  const env = (t, k) => Math.sin(Math.PI * Math.min(1, k * 1.15)) * (0.75 + 0.25 * Math.sin(Math.PI * 2 * 9 * t));
  for (const [at, f0, f1, len] of notes) tone(a, at, len, f0 * pitch, f1 * pitch, env, { gain: 0.2 });
  return dry(a, 0.05);
}
export const CHIRP_RATE = RATE;

// Whether a bird chirps now (it has just taken off or landed): at most one chirp every `MIN_GAP`
// seconds from all the birds together, and then only some of the time, so it's now and then, with
// real quiet between. Never the same shape twice running. Returns the shape, or -1 for not now.
export const MIN_GAP = 14, CHANCE = 0.3;
export function chirpWhen(state, now, roll = Math.random()) {
  if (now - state.last < MIN_GAP || roll > CHANCE) return -1;
  state.last = now;
  state.shape = (state.shape + 1 + Math.floor(roll / CHANCE * (VARIETY - 1))) % VARIETY;
  return state.shape;
}

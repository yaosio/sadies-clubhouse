// Clyde's Weather Machine's sounds: one short, soft jingle when the weather changes, and nothing at
// all while it rains or snows (no hiss, no patter, no dripping: those go on and on). The lever's
// clunk is the machine's own (machine.js). Plain numbers, no browser: 8-bit, 11 kHz.
import { blank, pluck, tone, finish } from './synth.js';
import { hz } from '../../../shared/retro.js';

// a few soft music-box notes, one after another
function notes(list, gap, len = 1.3, gain = 0.2, rate = 4.5) {
  const a = blank(len);
  list.forEach((n, i) => tone(a, i * gap, len - i * gap, hz(n), hz(n), pluck(rate), { gain, tri: true }));
  return finish(a, 0.25);
}
// rain coming: three low notes going down
export const rainIn = () => notes([67, 64, 60], 0.18);
// snow coming: three high notes, like a little bell
export const snowIn = () => notes([84, 88, 91], 0.14, 1.3, 0.14, 5);
// a second sun: going up, bright
export const sunIn = () => notes([60, 64, 67, 72], 0.1);
// raining cats: a little tune that sounds like it's asking
export const catsIn = () => notes([72, 76, 74, 79], 0.12, 1.3, 0.17);
// clearing up: two notes, settling
export const clearIn = () => notes([72, 67], 0.16, 1.1, 0.18);

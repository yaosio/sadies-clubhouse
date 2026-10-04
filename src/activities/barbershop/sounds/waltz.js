// The ball gown's music box: eight little bars in three-time, then it stops (about eight seconds, once
// per dance). Each note is a soft ring, gently left to die away, with a low note under each bar.
import { blank, ring, dry } from '../../../shared/retro.js';

const MELODY = [659, 784, 784, 698, 659, 659, 587, 659, 698, 659, 587, 523, 587, 659, 523, 494, 523, 587, 659, 587, 523, 523, 0, 0];
const BASS = [262, 220, 175, 196, 262, 196, 175, 131];
const BEAT = 0.333;
export function waltz() {
  const a = blank(MELODY.length * BEAT + 1.2);
  const note = (f, at, amp) => { ring(a, f, 4.2, amp, at); ring(a, f * 2, 9, amp * 0.25, at); };
  MELODY.forEach((f, i) => f && note(f * 1.5, i * BEAT, 0.07));
  BASS.forEach((f, k) => note(f, k * 3 * BEAT, 0.06));
  return dry(a, 0.3);
}

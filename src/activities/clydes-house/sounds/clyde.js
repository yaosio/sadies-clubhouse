// Clyde's own sounds: a chirpy "hello?" (two little rising beeps) when you step up the first time, and
// a sparkle when Clyde has the big idea. Once each, when they happen; Clyde doesn't beep while talking.
import { blank, pluck, swell, tone, dry } from '../../../shared/retro.js';

export function hello() {
  const a = blank(0.26);
  tone(a, 0, 0.08, 600, 900, swell, { h2: 0.2, gain: 0.2 });
  tone(a, 0.11, 0.12, 700, 1050, swell, { h2: 0.2, gain: 0.2 });
  return dry(a);
}
export function idea() {
  const a = blank(0.7);
  [523, 659, 784].forEach((f, i) => tone(a, i * 0.09, 0.5, f, f, pluck(7), { gain: 0.16 }));
  return dry(a, 0.1);
}

// Sadie's sounds in Clyde's house: a "mrrp?" when the treat wakes her, and one small "mew" when Clyde
// tries to hand it to her instead. Short and soft; no purring, no crunching (those go on).
import { blank, tone, finish } from './synth.js';

// waking up: a little rolled chirp, going up
export const mrrp = () => finish(tone(blank(0.36), 0, 0.33, 420, 640,
  (t, k) => Math.sin(Math.PI * Math.min(1, k * 1.3)) * (0.6 + 0.4 * Math.sin(Math.PI * 2 * 28 * t)), { h2: 0.3, gain: 0.26 }));
// not impressed: mew (up a little, then down)
export const mew = () => finish(tone(blank(0.45), 0, 0.42, k => (k < 0.3 ? 560 + 700 * k : 770 - 330 * (k - 0.3)),
  0, (t, k) => Math.sin(Math.PI * k) ** 0.7, { h2: 0.35, wob: 0.02, wobHz: 6, gain: 0.22 }));

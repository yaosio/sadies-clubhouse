// Sadie's sounds in Clyde's house: a "mrrp?" when the treat wakes her, and one small "mew" when Clyde
// tries to hand it to her instead. Short and soft; no purring, no crunching (those go on).
import { mrrp as chirp, blank, tone, dry } from '../../../shared/retro.js';

// waking up: a little rolled chirp, going up
export const mrrp = () => chirp(420, 640, 0.26);
// not impressed: mew (up a little, then down)
export const mew = () => dry(tone(blank(0.45), 0, 0.42, k => (k < 0.3 ? 560 + 700 * k : 770 - 330 * (k - 0.3)),
  0, (t, k) => Math.sin(Math.PI * k) ** 0.7, { h2: 0.35, wob: 0.02, wobHz: 6, gain: 0.22 }));

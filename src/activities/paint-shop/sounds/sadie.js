// Sadie's sound in the paint shop: one small "mrrp" as she comes in through her cat flap (and no
// more: no purring, no meowing as she goes).
import { blank, tone, finish } from './synth.js';

export const mrrp = () => finish(tone(blank(0.36), 0, 0.33, 430, 650,
  (t, k) => Math.sin(Math.PI * Math.min(1, k * 1.3)) * (0.6 + 0.4 * Math.sin(Math.PI * 2 * 28 * t)), { h2: 0.3, gain: 0.24 }));

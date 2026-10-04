// Sadie's voice at Marbles': the meow song (eight soft meows to a little tune, about four seconds, once
// per Pop Star show) and an "a-ha" chirp. Each meow slides up and then down, never harsh.
import { blank, tone, dry, mrrp as chirp } from '../../../shared/retro.js';

// one meow into `a`: from `at`, `len` long, around `f` Hz
function meow(a, at, len, f, gain = 0.22) {
  tone(a, at, len, k => f * (k < 0.35 ? 0.8 + k : 1.15 - 0.4 * (k - 0.35) / 0.65), 0, (t, k) => Math.sin(Math.PI * Math.min(1, k * 1.15)) ** 0.8,
    { h2: 0.45, wob: 0.015, wobHz: 6, gain });
}
const TUNE = [523, 659, 784, 659, 698, 587, 523, 392].map(f => f * 0.9);
const GAPS = [0.52, 0.52, 0.7, 0.52, 0.52, 0.52, 0.52, 1];
const LENS = [0.35, 0.35, 0.5, 0.35, 0.35, 0.35, 0.35, 0.8];
export function song() {
  const a = blank(GAPS.reduce((s, g) => s + g, 0) + 0.3);
  let at = 0;
  TUNE.forEach((f, i) => { meow(a, at, LENS[i], f); at += GAPS[i]; });
  return dry(a, 0.1);
}
// the detective's "a-ha": two quick high chirps
export function aha() {
  const a = blank(0.5);
  meow(a, 0, 0.18, 700, 0.2); meow(a, 0.2, 0.16, 950, 0.17);
  return dry(a);
}
// "mrrp" when Sadie hops onto the stage
export const mrrp = () => chirp(420, 640, 0.24);

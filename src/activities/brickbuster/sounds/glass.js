// Brickbuster '96's glass: the cracks (worse each time), the big stock shatter when it breaks, and
// the dull tink of glass that can't crack any more.
import { RATE, TAU, rng, crunch as finish, ping } from '../../../shared/retro.js';

// A crack in the glass. level 1, 2 or 3 (the third: the big one).
export function crack(level, seed = level * 77) {
  const r = rng(seed), len = [0.55, 0.8, 1.6][level - 1] ?? 0.8, n = Math.round(len * RATE);
  const a = new Float32Array(n + Math.round(0.3 * RATE));
  const loud = [0.75, 0.9, 1.0][level - 1] ?? 0.9;
  // the hit: a sharp snap of noise
  for (let i = 0; i < 60; i++) a[i] += (r() * 2 - 1) * loud * (1 - i / 60);
  // the thump behind it (a low knock, bigger each time)
  for (let i = 0; i < 0.18 * RATE; i++) { const t = i / RATE; a[i] += Math.sin(TAU * (95 - 120 * t) * t) * Math.exp(-t * 22) * 0.25 * level; }
  // the crackle: bursts of clicks running along the glass, thinning out
  const spread = [0.35, 0.5, 1.1][level - 1] ?? 0.5;
  for (let i = 0; i < spread * RATE; i++) {
    const t = i / RATE, k = Math.exp(-t / (spread * 0.35));
    if (r() < 0.07 * k + 0.004) {
      const w = 2 + Math.floor(r() * 10), amp = (0.35 + r() * 0.5) * k * loud, sign = r() < 0.5 ? -1 : 1;
      for (let j = 0; j < w && i + j < n; j++) a[i + j] += sign * amp * (1 - j / w) * (r() < 0.3 ? -1 : 1);
    }
    a[i] += (r() * 2 - 1) * 0.12 * k * loud;   // a hiss of splintering
  }
  // the tinkle: little high pings of glass, a shower of them for the big one
  const pings = [3, 6, 16][level - 1] ?? 6;
  for (let p = 0; p < pings; p++) ping(a, Math.floor((0.02 + r() * (len - 0.2)) * RATE), 1700 + r() * 3300, 18 + r() * 30, 0.12 + r() * 0.16, n);
  if (level >= 3) {   // and a long crunchy crash, like a pane coming down (it doesn't, yet)
    for (let i = Math.floor(0.08 * RATE); i < n; i++) { const t = i / RATE; a[i] += (r() * 2 - 1) * 0.3 * Math.exp(-(t - 0.08) * 3.2) * (0.6 + 0.4 * Math.sin(t * 60)); }
  }
  return finish(a, 0.32);
}

// The glass breaking: the big cheesy stock shatter. A huge snap and a boom, a long crash that comes
// in two waves, and a shower of glass tinkling down for a couple of seconds.
export function shatter(seed = 1996) {
  const r = rng(seed), len = 2.6, n = Math.round(len * RATE), a = new Float32Array(n + Math.round(0.4 * RATE));
  for (let i = 0; i < 90; i++) a[i] += (r() * 2 - 1) * (1 - i / 90) * 1.2;
  for (let i = 0; i < 0.35 * RATE; i++) { const t = i / RATE; a[i] += Math.sin(TAU * (70 - 60 * t) * t) * Math.exp(-t * 9) * 0.8; }
  for (let i = 0; i < n; i++) {
    const t = i / RATE, wave = Math.exp(-t * 2.4) + (t > 0.38 ? 0.7 * Math.exp(-(t - 0.38) * 3.5) : 0);
    a[i] += (r() * 2 - 1) * 0.42 * wave * (0.7 + 0.3 * Math.sin(t * 47));
    if (r() < 0.05 * wave) { const w = 2 + Math.floor(r() * 8), amp = 0.5 * wave, sg = r() < 0.5 ? -1 : 1; for (let j = 0; j < w && i + j < n; j++) a[i + j] += sg * amp * (1 - j / w); }
  }
  for (let p = 0; p < 48; p++) ping(a, Math.floor((0.05 + Math.pow(r(), 0.7) * (len - 0.35)) * RATE), 1500 + r() * 3700, 16 + r() * 30, 0.1 + r() * 0.18, n);
  return finish(a, 0.35, 0.11);
}

// Tapping glass that can't crack any more: a dull tink.
export function tink() {
  const n = Math.round(0.12 * RATE), a = new Float32Array(n);
  for (let i = 0; i < n; i++) { const t = i / RATE; a[i] = (Math.sin(TAU * 1250 * t) * 0.3 + Math.sin(TAU * 2990 * t) * 0.12) * Math.exp(-t * 35); }
  return finish(a, 0);
}

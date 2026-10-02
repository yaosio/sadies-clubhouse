// The yarn ball hitting Sadie's QUIET!! poster: a squeaky little wheee going up, then a sad droop
// down that's cut off dead, like a speaker being switched off mid-sound. The ball never makes
// another sound after it.
import { RATE, TAU } from '../../../shared/retro.js';
import { crunch as finish } from './crunch.js';

export function mute() {
  const n = Math.round(0.62 * RATE), a = new Float32Array(n + Math.round(0.15 * RATE));
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / RATE;
    const f = t < 0.14 ? 700 + 1100 * (t / 0.14) : 1800 * Math.pow(0.25, (t - 0.14) / 0.48) * (1 + 0.04 * Math.sin(TAU * 11 * t));
    ph += f / RATE;
    a[i] = (ph % 1 < 0.35 ? 0.4 : -0.4) * (t < 0.02 ? t / 0.02 : 1);
  }
  a[n - 1] = 0; a[n] = 0.6; a[n + 1] = -0.6;   // the click of it going off
  return finish(a, 0);
}

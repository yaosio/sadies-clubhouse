// What the paint shop's sounds are made with: a tone that slides, and a soft hush, on the toolbox's
// kit (src/shared/retro.js). Plain numbers, no browser: 8-bit, 11 kHz, like every sound on the 1996 CD.
import { RATE, TAU, blank, finish as gentle } from '../../../shared/retro.js';
export { RATE, blank };

// how loud a sound is over time: a plucked one dies away (6 ms to come in, so no click); a swell
// comes up and goes down again
export const pluck = rate => t => Math.exp(-t * rate) * Math.min(1, t / 0.006);
export const swell = (t, k) => Math.sin(Math.PI * k);

// a tone from `at` seconds for `len`, its pitch sliding from f0 to f1; o: gain, tri (softer-edged),
// h2 (a bit of the octave, for a voice)
export function tone(a, at, len, f0, f1, env, o = {}) {
  const n = Math.round(len * RATE), s0 = Math.round(at * RATE), gain = o.gain ?? 0.3;
  let ph = 0;
  for (let i = 0; i < n && s0 + i < a.length; i++) {
    const t = i / RATE, k = i / n;
    ph += TAU * f0 * Math.pow(f1 / f0, k) / RATE;
    let w = Math.sin(ph);
    if (o.tri) w = Math.asin(w) * 2 / Math.PI;
    if (o.h2) w += o.h2 * Math.sin(2 * ph);
    a[s0 + i] += w * env(t, k) * gain;
  }
  return a;
}
// a hush of air: noise smoothed right down, so it's more whoosh than hiss
export function hush(a, at, len, env, gain = 0.3, smooth = 0.05, seed = 7) {
  const n = Math.round(len * RATE), s0 = Math.round(at * RATE);
  let s = seed, y = 0;
  for (let i = 0; i < n && s0 + i < a.length; i++) {
    s = (s * 16807) % 2147483647;
    y += ((s / 2147483647) * 2 - 1 - y) * smooth;
    a[s0 + i] += y * env(i / RATE, i / n) * gain * 3;
  }
  return a;
}
// every sound ends the same way: rounded off, faded to nothing over its last bit, 8 bits (no echo)
export const finish = (a, fade = 0.04) => gentle(a, 0, 0, fade);
